-- ============================================================
-- 팀 빙고
--
-- 기존 1:1 대결(battles / battle_requests)을 대체한다.
-- 세 모드가 하나의 테이블을 공유한다.
--   shared : 판 1개를 전원이 같이 채운다
--   copied : 같은 내용을 각자 복사해서 채운다
--   own    : 각자 다른 내용을 채운다 (구 대결)
--
-- 설계 근거는 docs/team-bingo-design.md 참고.
-- ============================================================


-- ============================================================
-- 0. 기존 대결 시스템 제거
--    출시 전이라 데이터 이관 없이 드롭한다.
-- ============================================================
drop trigger if exists trg_freeze_completed_battle          on public.battles;
drop trigger if exists trg_check_and_initialize_battle      on public.battles;
drop trigger if exists trg_check_battle_request_constraints on public.battle_requests;
drop trigger if exists trg_check_battle_request_receiver_board on public.battle_requests;

drop function if exists public.freeze_completed_battle();
drop function if exists public.check_and_initialize_battle();
drop function if exists public.check_battle_request_constraints();
drop function if exists public.check_battle_request_receiver_board();

drop table if exists public.battles;
drop table if exists public.battle_requests;


-- ============================================================
-- 1. team_bingos  (팀 빙고)
-- ============================================================
create table public.team_bingos (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.users (id) on delete cascade,
  title         text not null,
  mode          text not null check (mode in ('shared', 'copied', 'own')),
  start_date    date not null,
  end_date      date not null,
  bet_text      text,
  status        text not null default 'waiting' check (status in ('waiting', 'in_progress', 'completed')),
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),

  constraint team_bingos_period check (end_date >= start_date),
  -- 내기는 '다른 목표로' 모드에만 존재한다
  constraint team_bingos_bet_only_own check (mode = 'own' or bet_text is null)
);

comment on table public.team_bingos is '팀 빙고 (shared: 한 판 공유 | copied: 같은 내용 복사 | own: 각자 다른 내용)';
comment on column public.team_bingos.status is 'waiting: 시작일 전 | in_progress: 진행 중 | completed: 종료 확정';
comment on column public.team_bingos.bet_text is '내기 내용. own 모드에서만 사용';


-- ============================================================
-- 2. team_members  (팀 구성원 / 초대장)
--
-- 수락하기 전(invited)에는 팀원이 아니다. 순위·진행률 계산에서 제외된다.
-- 탈퇴(left) 후에도 행을 남겨 이미 채운 칸의 completed_by를 해석할 수 있게 한다.
-- ============================================================
create table public.team_members (
  id              uuid primary key default gen_random_uuid(),
  team_id         uuid not null references public.team_bingos (id) on delete cascade,
  user_id         uuid not null references public.users (id) on delete cascade,
  -- shared: 공유 판. copied/own: 본인 판. 수락 전에는 null
  board_id        uuid references public.bingo_boards (id) on delete set null,
  status          text not null default 'invited' check (status in ('invited', 'joined', 'left')),

  -- 종료 시 동결되는 결과값
  achieved_count  int,
  total_count     int,
  bingo_count     int,
  final_rank      int,

  invited_at      timestamptz not null default now(),
  joined_at       timestamptz,
  left_at         timestamptz,

  unique (team_id, user_id)
);

comment on table public.team_members is '팀 빙고 구성원. invited는 아직 팀원이 아니다';
comment on column public.team_members.board_id is 'shared는 공유 판, copied/own은 본인 판. 수락 전 null';
comment on column public.team_members.final_rank is '종료 시 동결된 순위. 동률이면 같은 값';


-- ============================================================
-- 2-1. team_retrospectives  (멤버별 회고)
--
-- bingo_boards.retrospective는 판당 1개라 같이 채우기에서 6명이 나눠 쓸 수 없다.
-- 회고는 "나에게 이 기간이 어땠나"라는 1인칭 기록이므로 사람 단위로 저장한다.
-- ============================================================
create table public.team_retrospectives (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references public.team_bingos (id) on delete cascade,
  user_id     uuid not null references public.users (id) on delete cascade,
  content     text not null check (char_length(content) <= 500),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (team_id, user_id)
);

comment on table public.team_retrospectives is '팀 빙고 멤버별 회고 (사람당 1개)';


-- ============================================================
-- 3. bingo_cells 확장
-- ============================================================
alter table public.bingo_cells
  add column if not exists completed_by    uuid references public.users (id) on delete set null,
  add column if not exists memo_updated_by uuid references public.users (id) on delete set null;

comment on column public.bingo_cells.completed_by    is '이 칸을 체크한 사람. 팀 빙고에서만 의미가 있다';
comment on column public.bingo_cells.memo_updated_by is '메모를 마지막으로 수정한 사람';


-- ============================================================
-- 4. 헬퍼 함수
--    RLS 정책에서 team_members를 직접 참조하면 재귀가 발생하므로
--    security definer 함수로 감싼다.
-- ============================================================
create or replace function public.team_owner_id(p_team_id uuid)
returns uuid language sql stable security definer set search_path = '' as $$
  select owner_id from public.team_bingos where id = p_team_id;
$$;

create or replace function public.is_team_member(p_team_id uuid, p_user_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.team_members
    where team_id = p_team_id
      and user_id = p_user_id
      and status in ('invited', 'joined')
  );
$$;

-- 이 빙고판이 속한 팀 (없으면 null)
create or replace function public.team_of_board(p_board_id uuid)
returns public.team_bingos language sql stable security definer set search_path = '' as $$
  select t.*
  from public.team_bingos t
  join public.team_members tm on tm.team_id = t.id
  where tm.board_id = p_board_id
    and tm.status = 'joined'
  limit 1;
$$;

-- 이 빙고판을 볼 수 있는 팀 멤버인지.
-- 팀 현황 화면에서 서로의 판을 보여줘야 하므로 같은 팀이면 모두 조회할 수 있다.
-- 초대 수락 전에도 어떤 빙고인지 봐야 하므로 invited도 포함한다.
create or replace function public.can_access_team_board(p_board_id uuid, p_user_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.team_members me
    join public.team_members other on other.team_id = me.team_id
    where me.user_id = p_user_id
      and me.status in ('invited', 'joined')
      and other.board_id = p_board_id
  );
$$;

-- 이 빙고판에 쓸 수 있는 팀 멤버인지.
-- 조회와 달리 shared 모드의 공유 판에만 허용한다.
-- copied/own은 각자 자기 판만 건드릴 수 있어야 하므로 소유자 정책에 맡긴다.
create or replace function public.can_write_team_board(p_board_id uuid, p_user_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.team_members me
    join public.team_bingos t on t.id = me.team_id
    where me.user_id = p_user_id
      and me.status = 'joined'
      and me.board_id = p_board_id
      and t.mode = 'shared'
  );
$$;


-- ============================================================
-- 5. 빙고판 개수 제한 부활
--
-- 기존 트리거는 존재하지 않는 status='active'를 세고 있어 한 번도 발동하지 않았다.
-- 'progress'로 고치면서, 팀 참여도 1칸으로 계산하도록 확장한다.
-- (shared 모드 팀원은 판을 소유하지 않지만 매일 신경 쓰는 목표인 건 같다)
-- ============================================================
create or replace function public.count_active_bingo_slots(
  p_user_id uuid,
  p_exclude_board uuid default null
)
returns int language sql stable security definer set search_path = '' as $$
  select
    -- 팀에 속하지 않은 개인 빙고
    (
      select count(*)
      from public.bingo_boards b
      where b.user_id = p_user_id
        and b.status = 'progress'
        and b.deleted_at is null
        and (p_exclude_board is null or b.id <> p_exclude_board)
        and not exists (
          select 1 from public.team_members tm
          where tm.board_id = b.id
            and tm.status = 'joined'
        )
    )
    +
    -- 참여 중인 팀 (종료된 팀은 세지 않는다)
    (
      select count(*)
      from public.team_members tm
      join public.team_bingos t on t.id = tm.team_id
      where tm.user_id = p_user_id
        and tm.status = 'joined'
        and t.status <> 'completed'
    );
$$;

create or replace function public.check_bingo_board_limit()
returns trigger language plpgsql as $$
begin
  if public.count_active_bingo_slots(new.user_id) >= 3 then
    raise exception '진행 중인 빙고는 최대 3개까지 추가할 수 있습니다.';
  end if;
  return new;
end;
$$;


-- ============================================================
-- 5-1. 빙고 생성 원자화
--
-- 기존 createBingo는 board를 넣고 cells를 넣은 뒤, 실패하면 board를 지워 롤백했다.
-- 그런데 bingo_boards에는 DELETE 정책이 없어(의도적) 그 롤백이 조용히 실패했고,
-- 고아 판이 남았다. 개수 제한이 살아난 지금은 그 고아가 칸을 영구히 차지한다.
-- 함수 하나로 묶어 트랜잭션이 보장되게 한다.
--
-- security invoker: RLS와 개수 제한 트리거가 그대로 적용되어야 한다.
-- ============================================================
create or replace function public.create_bingo_with_cells(
  p_title        text,
  p_grid         text,
  p_theme        text,
  p_max_edits    int,
  p_start_date   date,
  p_target_date  date,
  p_cells        text[]
)
returns uuid language plpgsql security invoker as $$
declare
  v_board_id  uuid;
  v_uid       uuid := auth.uid();
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다.';
  end if;

  insert into public.bingo_boards
    (user_id, title, grid, theme, max_edits, start_date, target_date, status)
  values
    (v_uid, p_title, p_grid, p_theme, p_max_edits, p_start_date, p_target_date, 'progress')
  returning id into v_board_id;

  insert into public.bingo_cells (board_id, position, content, edit_count)
  select v_board_id, t.ordinality - 1, t.value, 0
  from unnest(p_cells) with ordinality as t(value, ordinality);

  return v_board_id;
end;
$$;


-- max_edits 의미 통일: 앱은 0을 '수정 불가', -1/9999를 '무제한'으로 쓴다.
-- 최초 스키마 주석은 0을 무제한이라고 적어 두어 정반대였다.
comment on column public.bingo_boards.max_edits is
  '빙고 칸 수정 가능 횟수(판 전체 합산). 0이면 수정 불가, -1 또는 9999면 무제한';


-- ============================================================
-- 6. 팀 제약: 친구 관계, 인원 상한, 판 소유
-- ============================================================
create or replace function public.check_team_member_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_owner_id  uuid;
  v_count     int;
begin
  v_owner_id := public.team_owner_id(new.team_id);

  -- 방장 본인 행이 아니면 친구여야 한다 (구 battle_requests 규칙 이식)
  if new.user_id <> v_owner_id then
    if not exists (
      select 1 from public.friends
      where user_id = v_owner_id
        and friend_id = new.user_id
    ) then
      raise exception '친구에게만 팀 빙고를 초대할 수 있습니다.';
    end if;
  end if;

  -- 방장 포함 최대 6명. 거절/탈퇴한 자리는 다시 채울 수 있다.
  select count(*) into v_count
  from public.team_members
  where team_id = new.team_id
    and status in ('invited', 'joined');

  if v_count >= 6 then
    raise exception '팀 빙고는 방장을 포함해 최대 6명까지 참여할 수 있습니다.';
  end if;

  return new;
end;
$$;

create trigger trg_check_team_member_insert
  before insert on public.team_members
  for each row execute function public.check_team_member_insert();


create or replace function public.check_team_member_join()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_team  public.team_bingos;
begin
  if new.status <> 'joined' or old.status is not distinct from 'joined' then
    return new;
  end if;

  select * into v_team from public.team_bingos where id = new.team_id;

  -- 기간이 끝난 팀에는 합류할 수 없다 (초대장은 기간 종료까지만 유효)
  if v_team.status = 'completed'
     or (now() at time zone 'Asia/Seoul')::date > v_team.end_date then
    raise exception '이미 종료된 팀 빙고입니다.';
  end if;

  -- 판 없이 합류할 수 없다 (copied/own은 판 생성이 곧 수락)
  if new.board_id is null then
    raise exception '참여할 빙고판이 필요합니다.';
  end if;

  -- shared는 방장 판을 그대로 쓰고, copied/own은 본인 소유여야 한다
  if v_team.mode = 'shared' then
    if not exists (
      select 1 from public.team_members
      where team_id = new.team_id
        and user_id = v_team.owner_id
        and board_id = new.board_id
    ) then
      raise exception '같이 채우기 빙고는 방장의 빙고판을 사용해야 합니다.';
    end if;
  else
    if not exists (
      select 1 from public.bingo_boards
      where id = new.board_id
        and user_id = new.user_id
        and status = 'progress'
        and deleted_at is null
    ) then
      raise exception '본인 소유의 진행 중인 빙고판만 사용할 수 있습니다.';
    end if;

    -- 개인 빙고 3칸 제한. 방금 만든 판은 제외하고 센다.
    if public.count_active_bingo_slots(new.user_id, new.board_id) >= 3 then
      raise exception '진행 중인 빙고는 최대 3개까지 추가할 수 있습니다.';
    end if;
  end if;

  new.joined_at := coalesce(new.joined_at, now());
  return new;
end;
$$;

create trigger trg_check_team_member_join
  before update on public.team_members
  for each row execute function public.check_team_member_join();


-- ============================================================
-- 7. 방장 이탈 시 이양
--    남은 멤버 중 아이디순 첫 번째에게 넘긴다.
-- ============================================================
create or replace function public.transfer_team_owner()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_team  public.team_bingos;
  v_next  uuid;
begin
  if new.status <> 'left' or old.status = 'left' then
    return new;
  end if;

  select * into v_team from public.team_bingos where id = new.team_id;

  if v_team.owner_id <> new.user_id then
    return new;
  end if;

  select tm.user_id into v_next
  from public.team_members tm
  join public.users u on u.id = tm.user_id
  where tm.team_id = new.team_id
    and tm.status = 'joined'
    and tm.user_id <> new.user_id
  order by u.username asc
  limit 1;

  -- 남은 사람이 없으면 방장 자리를 그대로 둔다 (팀은 유지된다)
  if v_next is null then
    return new;
  end if;

  update public.team_bingos
    set owner_id = v_next
    where id = new.team_id;

  -- 공유 판의 소유권도 함께 넘긴다
  if v_team.mode = 'shared' and new.board_id is not null then
    update public.bingo_boards
      set user_id = v_next
      where id = new.board_id;
  end if;

  return new;
end;
$$;

create trigger trg_transfer_team_owner
  after update on public.team_members
  for each row execute function public.transfer_team_owner();


-- ============================================================
-- 8. 팀 빙고 셀 규칙
--
-- 개인 빙고는 자기 기록이라 클라이언트 신뢰로 충분하지만,
-- 팀 빙고는 순위가 걸려 있어 서버에서 강제한다.
-- ============================================================
create or replace function public.enforce_team_cell_rules()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_team       public.team_bingos;
  v_max_edits  int;
  v_used       int;
  v_today      date := (now() at time zone 'Asia/Seoul')::date;
  v_uid        uuid := auth.uid();
begin
  v_team := public.team_of_board(new.board_id);

  -- 개인 빙고는 기존 동작 그대로
  if v_team.id is null then
    return new;
  end if;

  select max_edits into v_max_edits
    from public.bingo_boards where id = new.board_id;

  -- ---- 칸 내용 수정 ----
  if new.content is distinct from old.content then
    if old.is_checked then
      raise exception '이미 완료한 칸의 내용은 수정할 수 없습니다.';
    end if;

    if v_team.mode = 'shared' and v_uid <> v_team.owner_id then
      raise exception '같이 채우기 빙고의 내용은 방장만 수정할 수 있습니다.';
    end if;

    -- max_edits는 판 전체 합산 예산이다 (클라이언트와 동일한 의미)
    if v_max_edits not in (-1, 9999) then
      select coalesce(sum(edit_count), 0) into v_used
        from public.bingo_cells
        where board_id = new.board_id
          and id <> new.id;

      if v_used + new.edit_count > v_max_edits then
        raise exception '수정 가능 횟수를 모두 사용했습니다.';
      end if;
    end if;
  end if;

  -- ---- 체크 ----
  if new.is_checked and not old.is_checked then
    if v_today < v_team.start_date then
      raise exception '아직 시작하지 않은 팀 빙고입니다.';
    end if;
    if v_team.status = 'completed' then
      raise exception '이미 종료된 팀 빙고입니다.';
    end if;
    new.completed_by := coalesce(new.completed_by, v_uid);
  end if;

  -- ---- 체크 해제: 채운 본인만 ----
  if old.is_checked and not new.is_checked then
    if old.completed_by is not null and old.completed_by <> v_uid then
      raise exception '다른 사람이 채운 칸은 해제할 수 없습니다.';
    end if;
    new.completed_by := null;
  end if;

  -- ---- 완료 날짜는 진행 기간 안에서만 ----
  if new.checked_at is not null then
    if (new.checked_at at time zone 'Asia/Seoul')::date < v_team.start_date
       or (new.checked_at at time zone 'Asia/Seoul')::date > v_team.end_date then
      raise exception '팀 빙고는 진행 기간 안의 날짜만 선택할 수 있습니다.';
    end if;
  end if;

  -- ---- 메모는 전원 편집 가능, 마지막 수정자를 남긴다 ----
  if new.memo is distinct from old.memo then
    new.memo_updated_by := v_uid;
  end if;

  return new;
end;
$$;

create trigger trg_enforce_team_cell_rules
  before update on public.bingo_cells
  for each row execute function public.enforce_team_cell_rules();


-- ============================================================
-- 9. 종료 결과 동결
--    종료 처리는 앱에서 지연 확정하고, 결과가 나중에 바뀌지 않도록 여기서 막는다.
-- ============================================================
create or replace function public.freeze_completed_team_bingo()
returns trigger language plpgsql as $$
begin
  -- 이미 종료된 팀: 결과 컬럼 변경을 조용히 무시한다.
  -- 여러 참가자가 동시에 확정을 시도할 때 진 쪽에 에러가 뜨지 않게 하기 위함.
  if old.status = 'completed' then
    new.status       := old.status;
    new.completed_at := old.completed_at;
    new.start_date   := old.start_date;
    new.end_date     := old.end_date;
    new.mode         := old.mode;
    return new;
  end if;

  if new.status = 'completed' then
    -- KST 기준 end_date 다음날 00:00 이후에만 종료를 허용한다 (기기 시계 조작 방어)
    if now() < ((new.end_date + 1)::timestamp at time zone 'Asia/Seoul') then
      raise exception '팀 빙고 기간이 아직 끝나지 않았습니다.';
    end if;
    new.completed_at := coalesce(new.completed_at, now());
  end if;

  return new;
end;
$$;

create trigger trg_freeze_completed_team_bingo
  before update on public.team_bingos
  for each row execute function public.freeze_completed_team_bingo();


create or replace function public.freeze_team_member_result()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_status text;
begin
  select status into v_status from public.team_bingos where id = new.team_id;

  if v_status = 'completed' and old.final_rank is not null then
    new.achieved_count := old.achieved_count;
    new.total_count    := old.total_count;
    new.bingo_count    := old.bingo_count;
    new.final_rank     := old.final_rank;
  end if;

  return new;
end;
$$;

create trigger trg_freeze_team_member_result
  before update on public.team_members
  for each row execute function public.freeze_team_member_result();


-- ============================================================
-- 10. RLS
-- ============================================================
alter table public.team_bingos          enable row level security;
alter table public.team_members         enable row level security;
alter table public.team_retrospectives  enable row level security;

-- team_bingos
create policy "team_bingos: 멤버만 조회" on public.team_bingos
  for select using (
    auth.uid() = owner_id
    or public.is_team_member(id, auth.uid())
  );

create policy "team_bingos: 방장만 생성" on public.team_bingos
  for insert with check (auth.uid() = owner_id);

-- 종료 확정은 아무 멤버나 할 수 있어야 한다 (지연 확정)
create policy "team_bingos: 멤버만 수정" on public.team_bingos
  for update
  using (
    auth.uid() = owner_id
    or public.is_team_member(id, auth.uid())
  )
  with check (
    auth.uid() = owner_id
    or public.is_team_member(id, auth.uid())
  );

create policy "team_bingos: 방장만 삭제" on public.team_bingos
  for delete using (auth.uid() = owner_id);

-- team_members
create policy "team_members: 같은 팀만 조회" on public.team_members
  for select using (
    auth.uid() = user_id
    or auth.uid() = public.team_owner_id(team_id)
    or public.is_team_member(team_id, auth.uid())
  );

create policy "team_members: 방장만 초대" on public.team_members
  for insert with check (
    auth.uid() = public.team_owner_id(team_id)
  );

-- 본인은 수락/거절/탈퇴, 방장은 초대 취소 및 결과 확정
create policy "team_members: 본인 또는 방장만 수정" on public.team_members
  for update
  using (
    auth.uid() = user_id
    or auth.uid() = public.team_owner_id(team_id)
    or public.is_team_member(team_id, auth.uid())
  )
  with check (
    auth.uid() = user_id
    or auth.uid() = public.team_owner_id(team_id)
    or public.is_team_member(team_id, auth.uid())
  );

create policy "team_members: 본인 또는 방장만 삭제" on public.team_members
  for delete using (
    auth.uid() = user_id
    or auth.uid() = public.team_owner_id(team_id)
  );


-- team_retrospectives: 같은 팀이면 읽고, 쓰는 건 본인 것만
create policy "team_retrospectives: 같은 팀만 조회" on public.team_retrospectives
  for select using (public.is_team_member(team_id, auth.uid()));

create policy "team_retrospectives: 본인만 작성" on public.team_retrospectives
  for insert with check (
    auth.uid() = user_id and public.is_team_member(team_id, auth.uid())
  );

create policy "team_retrospectives: 본인만 수정" on public.team_retrospectives
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "team_retrospectives: 본인만 삭제" on public.team_retrospectives
  for delete using (auth.uid() = user_id);


-- 공유 판을 팀 멤버가 볼 수 있어야 한다 (소유자는 방장 1명뿐이므로)
create policy "bingo_boards: 팀 멤버 조회" on public.bingo_boards
  for select using (
    public.can_access_team_board(id, auth.uid())
  );

-- 공유 판의 칸을 팀 멤버가 읽고 채울 수 있어야 한다
create policy "bingo_cells: 팀 멤버 조회" on public.bingo_cells
  for select using (
    public.can_access_team_board(board_id, auth.uid())
  );

create policy "bingo_cells: 공유 판 팀 멤버 수정" on public.bingo_cells
  for update
  using (public.can_write_team_board(board_id, auth.uid()))
  with check (public.can_write_team_board(board_id, auth.uid()));


-- ============================================================
-- 11. 알림
-- ============================================================
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type in (
  'bingo_reminder', 'bingo_dday',
  'comment', 'reply', 'like', 'popular',
  'friend_request',
  'badge',
  'team_invite', 'team_joined', 'team_finished', 'team_cell_checked'
));

alter table public.notification_settings
  add column if not exists team_activity boolean not null default true;

comment on column public.notification_settings.team_activity is '팀 빙고 활동 알림 (칸 체크, 합류 등)';


-- ============================================================
-- 12. 인덱스
-- ============================================================
create index idx_team_bingos_owner_id    on public.team_bingos (owner_id);
create index idx_team_bingos_status      on public.team_bingos (status);
create index idx_team_bingos_end_date    on public.team_bingos (end_date);

create index idx_team_members_team_id    on public.team_members (team_id);
create index idx_team_members_user_id    on public.team_members (user_id);
create index idx_team_members_board_id   on public.team_members (board_id);
create index idx_team_members_status     on public.team_members (status);

create index idx_bingo_cells_completed_by on public.bingo_cells (completed_by);

create index idx_team_retrospectives_team_id on public.team_retrospectives (team_id);
