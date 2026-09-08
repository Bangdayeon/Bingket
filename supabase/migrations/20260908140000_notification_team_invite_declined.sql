-- 함께하기 초대를 거절했을 때 방장에게 알린다.
--
-- 제약을 통째로 교체하는 기존 방식(20260813000002_team_bingo.sql)을 따르되,
-- 기존 값을 빠짐없이 옮겨 적는다. 과거에 이 방식으로 'badge'가 한 번 유실된 적이 있다.
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
