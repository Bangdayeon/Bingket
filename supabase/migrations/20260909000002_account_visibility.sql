-- 계정 공개 범위를 2단계(boolean)에서 3단계로 넓힌다.
--
-- 지금까지 `users.is_private` 하나가 두 가지를 겸했다:
--   false → 누구나 프로필/빙고 열람 + 검색됨
--   true  → 친구만 열람 + 검색 안 됨
-- 시안은 이걸 셋으로 나눈다.
--   public   : 내가 작성한 빙고와 글을 모두가 볼 수 있어요
--   friends  : 내가 작성한 빙고와 글을 친구만 볼 수 있어요
--   private  : 나만 볼 수 있고, 아이디로 검색되지 않아요
--
-- 빙고 축(bingo_boards.visibility)과의 관계는 기존 규칙 그대로 —
-- 계정 축과 빙고 축 중 **더 엄격한 쪽**이 이긴다.
--
-- 백필: is_private=false → 'public', is_private=true → 'friends'.
-- true 였던 계정을 'private'으로 옮기면 친구도 못 보게 되어 기능이 후퇴한다.
-- 'friends'로 옮기면 열람 범위는 그대로지만 **검색에는 다시 잡히게 된다** (아래 search_users 참고).

-- ============================================================
-- 1. 컬럼
-- ============================================================
alter table public.users
  add column if not exists account_visibility text;

update public.users
set account_visibility = case when is_private then 'friends' else 'public' end
where account_visibility is null;

alter table public.users
  alter column account_visibility set default 'friends',
  alter column account_visibility set not null;

alter table public.users
  drop constraint if exists users_account_visibility_check;

alter table public.users
  add constraint users_account_visibility_check
  check (account_visibility in ('public', 'friends', 'private'));

comment on column public.users.account_visibility is
  '계정 공개 범위. public: 누구나 | friends: 친구만 | private: 나만(검색 제외). 빙고 축과 더 엄격한 쪽이 적용된다.';

-- is_private는 더 이상 정책이 읽지 않지만, 놓친 참조가 이상하게 굴지 않도록 값을 맞춰 둔다.
create or replace function public.sync_is_private()
returns trigger language plpgsql as $$
begin
  new.is_private := (new.account_visibility <> 'public');
  return new;
end;
$$;

drop trigger if exists trg_sync_is_private on public.users;
create trigger trg_sync_is_private
  before insert or update of account_visibility on public.users
  for each row execute function public.sync_is_private();

update public.users set is_private = (account_visibility <> 'public');

comment on column public.users.is_private is
  '@deprecated account_visibility에서 파생된다 (public이 아니면 true). 새 코드는 account_visibility를 쓴다.';

-- ============================================================
-- 2. 검색 — 시안: '비공개'만 검색에서 빠진다
-- ============================================================
create or replace function public.search_users(keyword text)
returns table (
  id             uuid,
  username       text,
  display_name   text,
  avatar_url     text,
  is_friend      boolean,
  request_status text
)
language sql
security definer
set search_path = public
as $$
  select
    u.id,
    u.username,
    u.display_name,
    u.avatar_url,
    exists (
      select 1
      from public.friends f
      where f.user_id  = auth.uid()
        and f.friend_id = u.id
    ) as is_friend,
    (
      select fr.status
      from public.friend_requests fr
      where fr.sender_id   = auth.uid()
        and fr.receiver_id = u.id
      order by fr.created_at desc
      limit 1
    ) as request_status
  from public.users u
  where
    u.deleted_at is null
    and u.account_visibility <> 'private'
    and u.id != coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
    and (
      keyword is null
      or keyword = ''
      or u.username     ilike '%' || keyword || '%'
      or u.display_name ilike '%' || keyword || '%'
    )
  order by u.username asc
  limit 30;
$$;

-- ============================================================
-- 3. users 조회 정책
--    '비공개'는 본인과 친구만 행을 읽을 수 있다.
--    친구까지 막으면 친구 목록에 이름조차 못 띄운다.
-- ============================================================
drop policy if exists "users: 공개 계정만 조회 가능 (본인 제외)" on public.users;
drop policy if exists "users: 공개 범위에 따른 조회" on public.users;

create policy "users: 공개 범위에 따른 조회" on public.users
  for select using (
    deleted_at is null
    and (
      account_visibility <> 'private'
      or id = auth.uid()
      or public.is_friend_with(id, auth.uid())
    )
  );

-- ============================================================
-- 4. 친구 요청 — '비공개'에만 막는다
-- ============================================================
create or replace function public.check_receiver_not_private()
returns trigger language plpgsql as $$
begin
  if exists (
    select 1 from public.users
    where id = new.receiver_id
      and account_visibility = 'private'
  ) then
    raise exception '비공개 계정에는 친구 요청을 보낼 수 없습니다.';
  end if;
  return new;
end;
$$;

-- ============================================================
-- 5. 빙고판·칸 조회 정책 — '전체 공개' 계정만 남에게 열린다
--    (기존 is_private=false 와 같은 범위다)
-- ============================================================
drop policy if exists "bingo_boards: 타인 조회 (비공개 계정 제외)" on public.bingo_boards;
drop policy if exists "bingo_boards: 타인 조회 (전체 공개 계정만)" on public.bingo_boards;

create policy "bingo_boards: 타인 조회 (전체 공개 계정만)" on public.bingo_boards
  for select using (
    auth.uid() != user_id
    and deleted_at is null
    and exists (
      select 1 from public.users u
      where u.id = bingo_boards.user_id
        and u.account_visibility = 'public'
        and u.deleted_at is null
    )
  );

drop policy if exists "bingo_cells: 공개 빙고판 조회" on public.bingo_cells;

create policy "bingo_cells: 공개 빙고판 조회" on public.bingo_cells
  for select using (
    exists (
      select 1 from public.bingo_boards b
      join public.users u on u.id = b.user_id
      where b.id = bingo_cells.board_id
        and b.deleted_at is null
        and u.account_visibility = 'public'
        and u.deleted_at is null
    )
  );

drop policy if exists "bingo_boards: 익명 공개 조회" on public.bingo_boards;

create policy "bingo_boards: 익명 공개 조회" on public.bingo_boards
  for select using (
    auth.uid() is null
    and deleted_at is null
    and exists (
      select 1 from public.users u
      where u.id = bingo_boards.user_id
        and u.account_visibility = 'public'
        and u.deleted_at is null
    )
  );

-- ============================================================
-- 6. can_view_board — 계정 축과 빙고 축 중 더 엄격한 쪽
-- ============================================================
create or replace function public.can_view_board(p_viewer uuid, p_board_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_owner_id      uuid;
  v_visibility    text;
  v_owner_account text;
begin
  select b.user_id, b.visibility, u.account_visibility
    into v_owner_id, v_visibility, v_owner_account
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

  -- 계정 축이 'private'이면 빙고 축과 무관하게 아무도 못 본다
  if v_owner_account = 'private' then
    return false;
  end if;

  return case v_visibility
    when 'private' then false
    when 'friends' then public.is_friend_with(v_owner_id, p_viewer)
    when 'public'  then
      case v_owner_account
        when 'public'  then true
        when 'friends' then public.is_friend_with(v_owner_id, p_viewer)
        else false
      end
    else false
  end;
end;
$$;

-- ============================================================
-- 7. 프로필 조회 — account_visibility를 함께 돌려준다
--    is_private는 기존 클라이언트 호환을 위해 남긴다.
-- ============================================================
-- 반환 컬럼이 늘어나 create or replace로는 못 바꾼다 (42P13). 지우고 다시 만든다.
drop function if exists public.get_user_profile(uuid);

create function public.get_user_profile(p_user_id uuid)
returns table (
  id                   uuid,
  username             text,
  display_name         text,
  avatar_url           text,
  bio                  text,
  is_private           boolean,
  account_visibility   text,
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
    (u.account_visibility <> 'public') as is_private,
    u.account_visibility,
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
