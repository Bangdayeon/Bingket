-- ============================================================
-- 임의 푸시 주입 차단
--
-- 20260408000001 이 notifications 의 INSERT 정책을 `auth.uid() is not null` 로 열어뒀다.
-- 타인에게 알림을 넣어야 하는 기능(친구 요청·팀 초대 등)을 클라이언트에서 직접
-- INSERT 로 처리했기 때문인데, 그 대가로 **인증된 아무 유저나 임의의 type/message 행을
-- 아무에게나 넣을 수 있고** notify-generic 웹훅이 그걸 그대로 푸시한다.
--
-- 해법: 클라이언트가 직접 넣던 알림을 전부 SECURITY DEFINER 트리거로 옮기고
-- 정책을 `auth.uid() = user_id` 로 좁힌다. RPC 가 아니라 트리거인 이유는
-- **구버전 앱을 깨뜨리지 않기 위해서다.** 구버전 앱은 새 RPC 를 모르지만,
-- 원본 테이블(friend_requests / team_members / ...)에 쓰는 것은 똑같으므로
-- 트리거는 그대로 발화한다. 구버전의 중복 INSERT 는 RLS 위반으로 실패하지만
-- 호출부가 throw 하지 않고 로그만 남기므로 화면은 정상 동작한다.
--
-- notify_on_comment / notify_on_like (20260828000001) 와 같은 패턴이다.
-- 메시지 문구와 target_id 는 클라이언트 구현을 글자 그대로 옮겼다.
-- ============================================================


-- ============================================================
-- 1. 친구 요청  (features/friend/lib/friend.ts 의 INSERT 를 대체)
-- ============================================================
create or replace function public.notify_on_friend_request()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_sender_name text;
begin
  -- friend_requests_no_self_request 제약이 이미 막지만 방어적으로 한 번 더
  if new.sender_id = new.receiver_id then return new; end if;

  select display_name into v_sender_name from public.users where id = new.sender_id;
  v_sender_name := coalesce(v_sender_name, '누군가');

  insert into public.notifications (user_id, type, message, target_id, target_type)
  values (
    new.receiver_id,
    'friend_request',
    v_sender_name || '님이 친구 요청을 보냈어요',
    new.id,
    null
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_friend_request on public.friend_requests;
create trigger trg_notify_friend_request
  after insert on public.friend_requests
  for each row execute function public.notify_on_friend_request();

-- ============================================================
-- 2. 팀 초대  (team.ts createTeam 의 notify 를 대체)
-- ============================================================
create or replace function public.notify_on_team_invite()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_owner_id   uuid;
  v_owner_name text;
begin
  if new.status <> 'invited' then return new; end if;

  select owner_id into v_owner_id from public.team_bingos where id = new.team_id;
  if v_owner_id is null or v_owner_id = new.user_id then return new; end if;

  select display_name into v_owner_name from public.users where id = v_owner_id;
  v_owner_name := coalesce(v_owner_name, '누군가');

  insert into public.notifications (user_id, type, message, target_id, target_type)
  values (
    new.user_id,
    'team_invite',
    v_owner_name || '님이 팀 빙고에 초대했어요',
    new.team_id,
    null
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_team_invite on public.team_members;
create trigger trg_notify_team_invite
  after insert on public.team_members
  for each row execute function public.notify_on_team_invite();

-- ============================================================
-- 3. 팀 합류  (team.ts acceptTeamInvite 의 notify 를 대체)
-- ============================================================
create or replace function public.notify_on_team_joined()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_owner_id    uuid;
  v_member_name text;
begin
  if new.status <> 'joined' or old.status = 'joined' then return new; end if;

  select owner_id into v_owner_id from public.team_bingos where id = new.team_id;
  if v_owner_id is null or v_owner_id = new.user_id then return new; end if;

  select display_name into v_member_name from public.users where id = new.user_id;
  v_member_name := coalesce(v_member_name, '누군가');

  insert into public.notifications (user_id, type, message, target_id, target_type)
  values (
    v_owner_id,
    'team_joined',
    v_member_name || '님이 팀에 합류했어요',
    new.team_id,
    null
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_team_joined on public.team_members;
create trigger trg_notify_team_joined
  after update of status on public.team_members
  for each row execute function public.notify_on_team_joined();

-- ============================================================
-- 4. 팀 종료  (team.ts finalizeTeam 의 notify 를 대체)
--
-- 클라이언트는 결과 목록 전원(마감을 트리거한 본인 포함)에게 보냈다. 그대로 맞춘다.
-- ============================================================
create or replace function public.notify_on_team_finished()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status <> 'completed' or old.status = 'completed' then return new; end if;

  insert into public.notifications (user_id, type, message, target_id, target_type)
  select m.user_id, 'team_finished', '팀 빙고가 끝났어요. 결과를 확인해 보세요', new.id, null
  from public.team_members m
  where m.team_id = new.id and m.status = 'joined';

  return new;
end;
$$;

drop trigger if exists trg_notify_team_finished on public.team_bingos;
create trigger trg_notify_team_finished
  after update of status on public.team_bingos
  for each row execute function public.notify_on_team_finished();

-- ============================================================
-- 5. 팀원 칸 체크  (team.ts notifyTeamCellChecked 를 대체)
--
-- 행위자를 board_id 로는 특정할 수 없다. shared 모드는 여러 멤버가 한 판을 채우므로
-- board_id → team_members 가 1:N 이다. 팀 빙고의 BEFORE UPDATE 트리거
-- (20260813000002 의 enforce_team_cell_rules)가 체크 시점에 completed_by 를 이미
-- 채워주므로 그 값을 쓰고, 없으면 auth.uid() 로 폴백한다.
-- ============================================================
create or replace function public.notify_on_team_cell_checked()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_actor_id uuid := coalesce(new.completed_by, auth.uid());
  v_team_id  uuid;
  v_name     text;
  v_trimmed  text;
begin
  if new.is_checked is not true or old.is_checked is true then return new; end if;
  if v_actor_id is null then return new; end if;

  -- board_id 에 유니크 제약이 없어 이론상 여러 행이 잡힐 수 있다.
  -- 그때 어느 팀이 뽑히는지가 실행마다 달라지지 않도록 순서를 못 박는다.
  select team_id into v_team_id
  from public.team_members
  where board_id = new.board_id and user_id = v_actor_id and status = 'joined'
  order by joined_at nulls last, team_id
  limit 1;

  if v_team_id is null then return new; end if;

  select display_name into v_name from public.users where id = v_actor_id;
  v_name := coalesce(v_name, '누군가');

  -- 클라이언트와 동일하게 12자에서 자르고 말줄임표를 붙인다
  v_trimmed := case
    when char_length(new.content) > 12 then substr(new.content, 1, 12) || '…'
    else new.content
  end;

  insert into public.notifications (user_id, type, message, target_id, target_type)
  select m.user_id,
         'team_cell_checked',
         v_name || '님이 ''' || v_trimmed || '''을(를) 달성했어요',
         v_team_id,
         null
  from public.team_members m
  where m.team_id = v_team_id and m.status = 'joined' and m.user_id <> v_actor_id;

  return new;
end;
$$;

drop trigger if exists trg_notify_team_cell_checked on public.bingo_cells;
create trigger trg_notify_team_cell_checked
  after update of is_checked on public.bingo_cells
  for each row execute function public.notify_on_team_cell_checked();

-- ============================================================
-- 6. INSERT 정책 조이기
--
-- 남는 경로는 "본인이 본인에게" 뿐이다. lib/badge-checker.ts 가 자기 뱃지 알림을
-- 이렇게 넣는다. 자기 기기로만 가는 스팸이라 실질적 위험이 없다.
-- 타인에게 가는 알림은 전부 위 트리거 + notify_on_comment / notify_on_like 가 만든다.
-- ============================================================
drop policy if exists "notifications: 인증된 사용자 삽입" on public.notifications;
drop policy if exists "notifications: 본인 알림만 삽입" on public.notifications;
create policy "notifications: 본인 알림만 삽입" on public.notifications
  for insert with check (auth.uid() = user_id);
