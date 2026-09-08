-- 함께하기 초대를 거절했을 때 방장에게 알린다.
--
-- 20260830000001 이 notifications 의 INSERT 정책을 `auth.uid() = user_id` 로 좁혔다.
-- 그래서 이 알림도 클라이언트에서 넣을 수 없다 (받는 사람이 방장, 즉 타인이다).
-- 다른 팀 알림과 같은 방식으로 SECURITY DEFINER 트리거에 둔다.

-- ============================================================
-- 1. 타입 허용
--
-- 제약을 통째로 교체하는 기존 방식(20260813000002)을 따르되 기존 값을 빠짐없이
-- 옮겨 적는다. 과거에 이 방식으로 'badge' 가 한 번 유실된 적이 있다.
-- ============================================================
alter table public.notifications drop constraint if exists notifications_type_check;

alter table public.notifications add constraint notifications_type_check check (
  type in (
    'bingo_reminder',
    'bingo_dday',
    'comment',
    'reply',
    'like',
    'popular',
    'friend_request',
    'badge',
    'team_invite',
    'team_invite_declined',
    'team_joined',
    'team_finished',
    'team_cell_checked'
  )
);

-- ============================================================
-- 2. 거절 알림 트리거
--
-- 거절은 team_members 행을 지우는 것이다 ('declined' 상태가 없다).
-- 그래서 AFTER DELETE 로 잡는다.
--
-- 방장도 초대를 취소할 수 있으므로(RLS "본인 또는 방장만 삭제"), 지운 사람이
-- 초대받은 본인일 때만 보낸다. 그러지 않으면 방장이 초대를 취소했을 때
-- 방장 자신에게 "거절했어요" 가 간다.
-- ============================================================
create or replace function public.notify_on_team_invite_declined()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_owner_id uuid;
  v_name     text;
begin
  -- 이미 합류한 멤버가 나간 경우는 거절이 아니다
  if old.status <> 'invited' then return old; end if;
  -- 초대받은 본인이 지운 경우만
  if auth.uid() is distinct from old.user_id then return old; end if;

  select owner_id into v_owner_id from public.team_bingos where id = old.team_id;
  if v_owner_id is null or v_owner_id = old.user_id then return old; end if;

  select display_name into v_name from public.users where id = old.user_id;
  v_name := coalesce(v_name, '누군가');

  insert into public.notifications (user_id, type, message, target_id, target_type)
  values (
    v_owner_id,
    'team_invite_declined',
    v_name || '님이 빙고 함께하기를 거절했어요',
    old.team_id,
    null
  );

  return old;
end;
$$;

drop trigger if exists trg_notify_team_invite_declined on public.team_members;
create trigger trg_notify_team_invite_declined
  after delete on public.team_members
  for each row execute function public.notify_on_team_invite_declined();

-- ============================================================
-- 3. 초대 문구를 시안에 맞춘다
--
-- 20260830000001 이 이 문구의 주인이 됐으므로 여기서 바꾼다.
-- 클라이언트에서 고쳐봐야 아무 효과가 없다.
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
    v_owner_name || '님이 빙고를 함께하고 싶어해요',
    new.team_id,
    null
  );

  return new;
end;
$$;
