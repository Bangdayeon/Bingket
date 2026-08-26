-- ============================================================
-- 빙고 공개범위 + 프로필 피드
-- ============================================================
-- 공개 판정은 두 축의 조합이며, 항상 "더 엄격한 쪽"이 적용된다.
--   1) 계정 축: users.is_private   (비공개면 친구만 프로필 피드 열람)
--   2) 빙고 축: bingo_boards.visibility (private | friends | public)
--
-- 라운지 게시글에 첨부된 빙고판은 이 규칙과 무관하게 항상 공개다.
-- (20260530000001_public_post_bingo_select.sql 정책을 그대로 유지)
--
-- 이 마이그레이션은 컬럼과 조회 함수만 추가한다.
-- 기존 RLS 정책을 조이는 작업은 구버전 앱이 정리된 뒤 별도 마이그레이션에서 수행한다.
-- ============================================================


-- ============================================================
-- 1. bingo_boards.visibility
-- ============================================================
alter table public.bingo_boards
  add column if not exists visibility text not null default 'friends'
  check (visibility in ('private', 'friends', 'public'));

comment on column public.bingo_boards.visibility is
  '프로필 피드 노출 범위. private=본인만, friends=친구까지, public=누구나.
   계정 공개설정(users.is_private)과 조합 시 더 엄격한 쪽이 적용된다.';

create index if not exists idx_bingo_boards_user_visibility
  on public.bingo_boards (user_id, visibility)
  where deleted_at is null;


-- ============================================================
-- 2. users.is_private 의미 재정의
-- ============================================================
-- 기존 의미: 검색 차단 + users 행 자체를 숨김
-- 새 의미  : 프로필 피드만 잠금. 검색 노출과 프로필 헤더는 값과 무관하게 항상 공개
--
-- 기존 유저(is_private = false)는 공개 계정으로 그대로 둔다. 기본값 변경은 신규 가입자에게만 적용된다.
alter table public.users alter column is_private set default true;

comment on column public.users.is_private is
  '계정 비공개. true면 친구만 프로필 피드를 볼 수 있다.
   검색 노출과 프로필 헤더(이름/아바타/한줄다짐)는 값과 무관하게 항상 공개.';

-- 비공개 계정이야말로 친구 요청을 받아야 한다. 기존 트리거는 새 모델과 정반대다.
drop trigger if exists trg_check_receiver_not_private on public.friend_requests;
drop function if exists check_receiver_not_private();


-- ============================================================
-- 3. 관계 판정 헬퍼
-- ============================================================
create or replace function public.is_friend_with(p_a uuid, p_b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.friends
    where user_id = p_a and friend_id = p_b
  );
$$;

comment on function public.is_friend_with is 'friends는 양방향 저장이므로 한 방향만 확인하면 된다';


create or replace function public.is_blocked_between(p_a uuid, p_b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = p_a and blocked_id = p_b)
       or (blocker_id = p_b and blocked_id = p_a)
  );
$$;

comment on function public.is_blocked_between is '어느 쪽이 차단했든 서로의 콘텐츠를 볼 수 없다';


-- ============================================================
-- 4. 빙고판 열람 판정 — 모든 조회 함수가 이 한 곳을 거친다
-- ============================================================
create or replace function public.can_view_board(p_viewer uuid, p_board_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_owner_id       uuid;
  v_visibility     text;
  v_owner_private  boolean;
begin
  select b.user_id, b.visibility, u.is_private
    into v_owner_id, v_visibility, v_owner_private
  from public.bingo_boards b
  join public.users u on u.id = b.user_id
  where b.id = p_board_id
    and b.deleted_at is null
    and u.deleted_at is null;

  if v_owner_id is null then
    return false;
  end if;

  -- 본인 빙고는 공개범위와 무관하게 항상 열람 가능
  if v_owner_id = p_viewer then
    return true;
  end if;

  if p_viewer is null then
    return false;
  end if;

  if public.is_blocked_between(p_viewer, v_owner_id) then
    return false;
  end if;

  -- 더 엄격한 쪽이 이긴다
  return case v_visibility
    when 'private' then false
    when 'friends' then public.is_friend_with(v_owner_id, p_viewer)
    when 'public'  then public.is_friend_with(v_owner_id, p_viewer) or not v_owner_private
    else false
  end;
end;
$$;


-- ============================================================
-- 5. 프로필 조회
-- ============================================================
create or replace function public.get_user_profile(p_user_id uuid)
returns table (
  id                   uuid,
  username             text,
  display_name         text,
  avatar_url           text,
  bio                  text,
  is_private           boolean,
  is_me                boolean,
  is_friend            boolean,
  has_pending_request  boolean,
  friend_count         bigint,
  feed_count           bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_viewer uuid := auth.uid();
begin
  if v_viewer is null then
    return;
  end if;

  if public.is_blocked_between(v_viewer, p_user_id) then
    return;
  end if;

  return query
  select
    u.id,
    u.username,
    u.display_name,
    u.avatar_url,
    u.bio,
    u.is_private,
    (u.id = v_viewer) as is_me,
    public.is_friend_with(u.id, v_viewer) as is_friend,
    exists (
      select 1 from public.friend_requests fr
      where fr.status = 'pending'
        and ((fr.sender_id = v_viewer and fr.receiver_id = u.id)
          or (fr.sender_id = u.id and fr.receiver_id = v_viewer))
    ) as has_pending_request,
    (select count(*) from public.friends f where f.user_id = u.id) as friend_count,
    -- 게시글 수는 본인에게만 노출한다. 익명 게시글이 역산되는 것을 막기 위함
    case when u.id = v_viewer
      then (select count(*) from public.posts p
            where p.user_id = u.id and p.is_deleted = false)
      else null
    end as feed_count
  from public.users u
  where u.id = p_user_id
    and u.deleted_at is null;
end;
$$;


-- ============================================================
-- 6. 프로필 피드 (2열 그리드용 목록)
-- ============================================================
create or replace function public.get_user_feed(p_user_id uuid)
returns table (
  id             uuid,
  title          text,
  grid           text,
  theme          text,
  status         text,
  visibility     text,
  cells          jsonb,
  created_at     timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_viewer uuid := auth.uid();
begin
  if v_viewer is null then
    return;
  end if;

  return query
  select
    b.id,
    b.title,
    b.grid,
    b.theme,
    b.status,
    -- 공개범위는 본인에게만 의미가 있다 (피드에서 배지로 표시)
    case when b.user_id = v_viewer then b.visibility else null end as visibility,
    coalesce(
      (
        select jsonb_agg(
                 jsonb_build_object(
                   'position',   c.position,
                   'content',    c.content,
                   'is_checked', c.is_checked
                 )
                 order by c.position
               )
        from public.bingo_cells c
        where c.board_id = b.id
      ),
      '[]'::jsonb
    ) as cells,
    b.created_at
  from public.bingo_boards b
  where b.user_id = p_user_id
    and b.deleted_at is null
    and public.can_view_board(v_viewer, b.id)
  order by b.created_at desc;
end;
$$;

comment on function public.get_user_feed is
  'memo / retrospective 는 반환하지 않는다. 타인에게 노출되지 않도록 쿼리 자체에서 제외한다';


-- ============================================================
-- 7. 빙고판 상세 (타인 빙고 열람 전용)
-- ============================================================
create or replace function public.get_board_detail(p_board_id uuid)
returns table (
  id           uuid,
  user_id      uuid,
  title        text,
  grid         text,
  theme        text,
  status       text,
  cells        jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_viewer uuid := auth.uid();
begin
  if v_viewer is null or not public.can_view_board(v_viewer, p_board_id) then
    return;
  end if;

  return query
  select
    b.id,
    b.user_id,
    b.title,
    b.grid,
    b.theme,
    b.status,
    coalesce(
      (
        select jsonb_agg(
                 jsonb_build_object(
                   'position',   c.position,
                   'content',    c.content,
                   'is_checked', c.is_checked
                 )
                 order by c.position
               )
        from public.bingo_cells c
        where c.board_id = b.id
      ),
      '[]'::jsonb
    ) as cells
  from public.bingo_boards b
  where b.id = p_board_id;
end;
$$;


-- ============================================================
-- 8. 대결 빙고판 (배치) — 공개범위와 무관하게 대결 참여자에게만
-- ============================================================
-- 대결 화면은 상대 빙고판을 항상 봐야 하므로 visibility 규칙을 적용하지 않는다.
-- 대신 "그 보드가 걸린 대결/요청에 내가 참여자인가"로 판정한다.
-- soft-delete된 보드도 반환한다 — 종료된 대결의 기록이 유지되어야 하기 때문.
create or replace function public.get_battle_boards(p_board_ids uuid[])
returns table (
  id            uuid,
  user_id       uuid,
  title         text,
  grid          text,
  theme         text,
  status        text,
  target_date   date,
  display_name  text,
  avatar_url    text,
  cells         jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_viewer uuid := auth.uid();
begin
  if v_viewer is null or p_board_ids is null then
    return;
  end if;

  return query
  select
    b.id,
    b.user_id,
    b.title,
    b.grid,
    b.theme,
    b.status,
    b.target_date,
    u.display_name,
    u.avatar_url,
    coalesce(
      (
        select jsonb_agg(
                 jsonb_build_object(
                   'position',   c.position,
                   'content',    c.content,
                   'is_checked', c.is_checked
                 )
                 order by c.position
               )
        from public.bingo_cells c
        where c.board_id = b.id
      ),
      '[]'::jsonb
    ) as cells
  from public.bingo_boards b
  join public.users u on u.id = b.user_id
  where b.id = any(p_board_ids)
    and (
      b.user_id = v_viewer
      or exists (
        select 1 from public.battles bt
        where (bt.board1_id = b.id or bt.board2_id = b.id)
          and (bt.user1_id = v_viewer or bt.user2_id = v_viewer)
      )
      or exists (
        select 1 from public.battle_requests br
        where (br.sender_board_id = b.id or br.receiver_board_id = b.id)
          and (br.sender_id = v_viewer or br.receiver_id = v_viewer)
      )
    );
end;
$$;

comment on function public.get_battle_boards is
  'memo / retrospective 는 반환하지 않는다. 대결 상대에게도 노출되지 않아야 한다';


-- ============================================================
-- 9. 실행 권한
-- ============================================================
grant execute on function public.get_user_profile(uuid)      to authenticated;
grant execute on function public.get_user_feed(uuid)         to authenticated;
grant execute on function public.get_board_detail(uuid)      to authenticated;
grant execute on function public.get_battle_boards(uuid[])   to authenticated;

-- 헬퍼는 다른 함수 내부에서만 쓰인다. 클라이언트 직접 호출은 막는다.
revoke execute on function public.can_view_board(uuid, uuid)     from public, anon, authenticated;
revoke execute on function public.is_friend_with(uuid, uuid)     from public, anon, authenticated;
revoke execute on function public.is_blocked_between(uuid, uuid) from public, anon, authenticated;
