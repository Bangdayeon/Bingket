-- ============================================================
-- 타인 뱃지 조회 RPC
--
-- user_badges 의 RLS 는 "본인만"(20240014000000) 이라 남의 뱃지는 한 줄도 안 나온다.
-- 정책을 푸는 대신 security definer RPC 로 열어 준다 — 계정 공개범위 판정을 서버
-- 한 곳에서 끝내고, 클라이언트가 보내는 값에 판정을 맡기지 않기 위해서다.
-- (타인 빙고를 get_user_feed / get_board_detail 로 여는 것과 같은 방식)
--
-- 판정은 계정 축만 본다. 뱃지에는 빙고의 visibility 같은 항목별 축이 없다.
--   본인            → 전부
--   private         → 없음 (친구여도 안 열린다. can_view_board 와 같은 규칙)
--   friends         → 친구일 때만
--   public          → 전부
-- 차단 관계면 어느 쪽이든 없음.
--
-- 볼 수 없는 경우 빈 결과를 돌려준다. 예외를 던지면 "뱃지가 없는 사람"과
-- "잠긴 사람"을 클라이언트가 예외 처리로 구분해야 해서, 잠금 표시는
-- get_user_profile 의 account_visibility / is_friend 로 판단하게 둔다.
-- ============================================================
create or replace function public.get_user_badges(p_user_id uuid)
returns table (
  badge_id  uuid,
  name      text,
  icon_url  text,
  earned_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_viewer  uuid := auth.uid();
  v_account text;
begin
  if v_viewer is null then
    return;
  end if;

  select u.account_visibility into v_account
  from public.users u
  where u.id = p_user_id
    and u.deleted_at is null;

  if v_account is null then
    return;
  end if;

  if p_user_id <> v_viewer then
    if public.is_blocked_between(v_viewer, p_user_id) then
      return;
    end if;

    if v_account = 'private' then
      return;
    end if;

    if v_account = 'friends' and not public.is_friend_with(p_user_id, v_viewer) then
      return;
    end if;

    if v_account not in ('friends', 'public') then
      return;
    end if;
  end if;

  return query
  select
    ub.badge_id,
    b.name,
    b.icon_url,
    ub.earned_at
  from public.user_badges ub
  join public.badges b on b.id = ub.badge_id
  where ub.user_id = p_user_id
  order by ub.earned_at asc;
end;
$$;

comment on function public.get_user_badges is
  'user_badges RLS(본인만)를 우회해 계정 공개범위에 따라 타인 뱃지를 돌려준다. 볼 수 없으면 빈 결과.';
