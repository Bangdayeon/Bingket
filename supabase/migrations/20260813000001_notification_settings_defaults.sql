-- ============================================================
-- 알림 설정 기본값 정상화
--
-- 기존 문제:
--  1) bingo_deadline / community_popular / community_like 의 DEFAULT 가 false 였다.
--     알림 설정 화면에서 토글을 한 번만 건드려도 6개 값이 통째로 upsert 되므로
--     이 3종은 사용자가 켠 적이 없어도 false 로 고정 저장됐다.
--  2) 신규 유저에게 notification_settings 행을 만들어 주는 곳이 아예 없었다.
--     notify-bingo-deadline 은 행이 없으면 스킵하므로 마감 알림이 전 유저 비활성이었다.
-- ============================================================

-- ── 1. 컬럼 DEFAULT 를 모두 true 로 ───────────────────────────
-- features/mypage/lib/notification-settings.ts 의 DEFAULT_NOTIFICATION_SETTINGS 와 동일하게 유지할 것
alter table public.notification_settings alter column bingo_deadline    set default true;
alter table public.notification_settings alter column community_popular set default true;
alter table public.notification_settings alter column community_like    set default true;

-- ── 2. 신규 유저 설정 행 자동 생성 ────────────────────────────
-- auth 트리거(handle_new_auth_user)와 클라이언트의 users upsert(app/_layout.tsx) 양쪽을
-- 모두 커버하기 위해 public.users INSERT 시점에 건다.
create or replace function public.create_default_notification_settings()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notification_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_create_default_notification_settings on public.users;
create trigger trg_create_default_notification_settings
  after insert on public.users
  for each row execute function public.create_default_notification_settings();

-- ── 3. 기존 유저 백필 ─────────────────────────────────────────
-- 행이 아예 없는 유저에게만 기본값 행을 만든다.
-- 이미 행이 있는 유저는 본인이 설정한 값이므로 건드리지 않는다.
insert into public.notification_settings (user_id)
select u.id
from public.users u
left join public.notification_settings s on s.user_id = u.id
where s.user_id is null;
