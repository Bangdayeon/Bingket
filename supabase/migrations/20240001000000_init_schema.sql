-- ============================================================
-- 빙고 앱 초기 스키마
-- ============================================================

-- UUID 확장
create extension if not exists "uuid-ossp";


-- ============================================================
-- 1. users
-- ============================================================
create table public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text not null unique,          -- 랜덤 초기값, 중복 불가
  display_name  text not null,
  avatar_url    text,                          -- Cloudflare R2 URL
  bio           text,                          -- 한줄 다짐 (nullable)
  is_private    boolean not null default false,
  created_at    timestamptz not null default now(),
  deleted_at    timestamptz                    -- 탈퇴 시 소프트 딜리트
);

comment on table public.users is '앱 유저 기본 정보';
comment on column public.users.is_private is '계정 비공개 on → 게시글/댓글 작성자를 "꼭꼭 숨은 유저"로 표시';

-- 신규 회원가입 시 public.users 자동 생성 트리거
create or replace function handle_new_auth_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, username, display_name)
  values (
    new.id,
    'user_' || substr(replace(new.id::text, '-', ''), 1, 16),
    coalesce(new.raw_user_meta_data->>'name', '빙고 유저')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();


-- ============================================================
-- 2. social_accounts  (다중 소셜 연동)
-- ============================================================
create table public.social_accounts (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.users (id) on delete cascade,
  provider     text not null,                 -- 'kakao' | 'apple' | 'google'
  provider_id  text not null,                 -- 각 플랫폼 고유 ID
  email        text,
  created_at   timestamptz not null default now(),
  unique (provider, provider_id)
);

comment on table public.social_accounts is '소셜 로그인 연동 정보 (1 유저 n 소셜)';


-- ============================================================
-- 3. bingo_boards  (진행중 / 완료만 DB 저장, 제작중은 로컬)
-- ============================================================
create table public.bingo_boards (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.users (id) on delete cascade,
  title         text not null,
  grid_size     int  not null check (grid_size in (3, 4, 5)),
  theme         text not null default 'basic', -- 테마 키값
  status        text not null default 'active' check (status in ('active', 'completed')),
  max_edits     int  not null default 0 check (max_edits >= 0),  -- 0 = 무제한
  target_date   date,
  created_at    timestamptz not null default now(),
  completed_at  timestamptz,
  deleted_at    timestamptz                         -- 소프트 딜리트
);

comment on table public.bingo_boards is '빙고판 (status = active | completed)';
comment on column public.bingo_boards.max_edits is '빙고 칸 수정 가능 횟수. 0이면 무제한';


-- 유저당 최대 3개 빙고 제한 함수 + 트리거
create or replace function check_bingo_board_limit()
returns trigger language plpgsql as $$
begin
  if (
    select count(*)
    from public.bingo_boards
    where user_id = new.user_id
      and status = 'active'
      and deleted_at is null
  ) >= 3 then
    raise exception '진행 중인 빙고는 최대 3개까지 추가할 수 있습니다.';
  end if;
  return new;
end;
$$;

create trigger trg_bingo_board_limit
  before insert on public.bingo_boards
  for each row execute function check_bingo_board_limit();


-- ============================================================
-- 4. bingo_cells  (빙고 칸)
-- ============================================================
create table public.bingo_cells (
  id          uuid primary key default uuid_generate_v4(),
  board_id    uuid not null references public.bingo_boards (id) on delete cascade,
  position    int  not null check (position >= 0),  -- 0-based, 왼쪽 위 → 오른쪽 아래
  content     text not null default '',
  memo        text,
  is_checked  boolean not null default false,
  edit_count  int not null default 0,               -- 해당 칸 수정 횟수
  checked_at  timestamptz,
  unique (board_id, position)
);

comment on table public.bingo_cells is '빙고판의 각 칸';
comment on column public.bingo_cells.edit_count is '칸 수정 횟수. board의 max_edits와 비교하여 앱단에서 수정 가능 여부 판단';


-- ============================================================
-- 5. badges  (뱃지 정의 — 고정 데이터)
-- ============================================================
create table public.badges (
  id          uuid primary key default uuid_generate_v4(),
  category    text not null,   -- 'streak' | 'bingo' | 'edit' | 'community_post' | 'community_comment' | 'usage' | 'like'
  name        text not null,
  icon_url    text,
  threshold   int  not null,   -- 달성 기준값
  created_at  timestamptz not null default now()
);

comment on table public.badges is '뱃지 정의 (고정 마스터 데이터)';

-- 초기 뱃지 데이터 삽입
insert into public.badges (category, name, threshold) values
  -- 1. 연속 빙고 달성 (consecutive streak)
  ('streak', '연속 달성 3회',   3),
  ('streak', '연속 달성 6회',   6),
  ('streak', '연속 달성 9회',   9),
  ('streak', '연속 달성 12회', 12),
  ('streak', '연속 달성 15회', 15),
  ('streak', '연속 달성 30회', 30),
  ('streak', '연속 달성 50회', 50),
  -- 2. 빙고 달성
  ('bingo', '빙고 달성 1회',   1),
  ('bingo', '빙고 달성 3회',   3),
  ('bingo', '빙고 달성 5회',   5),
  ('bingo', '빙고 달성 10회', 10),
  ('bingo', '빙고 달성 15회', 15),
  ('bingo', '빙고 달성 30회', 30),
  ('bingo', '빙고 달성 50회', 50),
  -- 3. 빙고 수정
  ('edit', '빙고 수정 1회',   1),
  ('edit', '빙고 수정 3회',   3),
  ('edit', '빙고 수정 5회',   5),
  ('edit', '빙고 수정 10회', 10),
  ('edit', '빙고 수정 15회', 15),
  ('edit', '빙고 수정 30회', 30),
  ('edit', '빙고 수정 50회', 50),
  -- 4. 커뮤니티 글쓰기
  ('community_post', '글쓰기 1회',   1),
  ('community_post', '글쓰기 3회',   3),
  ('community_post', '글쓰기 5회',   5),
  ('community_post', '글쓰기 10회', 10),
  ('community_post', '글쓰기 15회', 15),
  ('community_post', '글쓰기 30회', 30),
  ('community_post', '글쓰기 50회', 50),
  -- 5. 커뮤니티 댓글쓰기
  ('community_comment', '댓글쓰기 1회',   1),
  ('community_comment', '댓글쓰기 3회',   3),
  ('community_comment', '댓글쓰기 5회',   5),
  ('community_comment', '댓글쓰기 10회', 10),
  ('community_comment', '댓글쓰기 15회', 15),
  ('community_comment', '댓글쓰기 30회', 30),
  ('community_comment', '댓글쓰기 50회', 50),
  -- 6. 앱 이용 시간
  ('usage', '이용 n시간 1시간',   1),
  ('usage', '이용 n시간 3시간',   3),
  ('usage', '이용 n시간 5시간',   5),
  ('usage', '이용 n시간 10시간', 10),
  ('usage', '이용 n시간 15시간', 15),
  ('usage', '이용 n시간 30시간', 30),
  ('usage', '이용 n시간 50시간', 50),
  -- 7. 좋아요 누르기
  ('like', '좋아요 1회',   1),
  ('like', '좋아요 3회',   3),
  ('like', '좋아요 5회',   5),
  ('like', '좋아요 10회', 10),
  ('like', '좋아요 15회', 15),
  ('like', '좋아요 30회', 30),
  ('like', '좋아요 50회', 50);


-- ============================================================
-- 6. user_badges  (유저가 획득한 뱃지)
-- ============================================================
create table public.user_badges (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.users (id) on delete cascade,
  badge_id   uuid not null references public.badges (id) on delete cascade,
  earned_at  timestamptz not null default now(),
  unique (user_id, badge_id)
);

comment on table public.user_badges is '유저가 획득한 뱃지';


-- ============================================================
-- 7. posts  (커뮤니티 게시글)
-- ============================================================
create table public.posts (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references public.users (id) on delete cascade,
  category         text not null check (category in ('bingo_board', 'bingo_achieve', 'free')),
  title            text not null,
  content          text not null default '',
  image_url        text,                        -- 직접 첨부 이미지 (R2, nullable)
  bingo_image_url  text,                        -- 빙고판 캡처 이미지 (R2, nullable)
  bingo_board_id   uuid references public.bingo_boards (id) on delete set null,
  like_count       int not null default 0,
  comment_count    int not null default 0,
  is_deleted       boolean not null default false,
  created_at       timestamptz not null default now()
);

comment on table public.posts is '커뮤니티 게시글 (모두 익명 표시)';
comment on column public.posts.image_url is '직접 첨부한 이미지. 최대 1장 (추후 확장 가능)';
comment on column public.posts.bingo_image_url is '빙고판을 이미지로 캡처하여 자동 첨부한 URL';


-- ============================================================
-- 8. comments  (댓글 + 대댓글)
-- ============================================================
create table public.comments (
  id          uuid primary key default uuid_generate_v4(),
  post_id     uuid not null references public.posts (id) on delete cascade,
  user_id     uuid not null references public.users (id) on delete cascade,
  parent_id   uuid references public.comments (id) on delete cascade,  -- null이면 댓글, 있으면 대댓글
  content     text not null,
  is_deleted  boolean not null default false,
  created_at  timestamptz not null default now()
);

comment on table public.comments is '댓글 및 대댓글 (parent_id null = 댓글, non-null = 대댓글)';


-- ============================================================
-- 9. likes  (게시글 좋아요)
-- ============================================================
create table public.likes (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.users (id) on delete cascade,
  post_id     uuid not null references public.posts (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, post_id)
);

comment on table public.likes is '게시글 좋아요 (중복 불가)';


-- ============================================================
-- 10. reports  (신고)
-- ============================================================
create table public.reports (
  id           uuid primary key default uuid_generate_v4(),
  reporter_id  uuid not null references public.users (id) on delete cascade,
  target_type  text not null check (target_type in ('post', 'comment')),
  target_id    uuid not null,
  reason       text not null check (reason in (
    '상업적 광고 및 판매',
    '욕설/비하',
    '음란물/성적인 내용',
    '도배',
    '사칭/사기',
    '기타'
  )),
  created_at   timestamptz not null default now()
);

comment on table public.reports is '게시글/댓글 신고';


-- ============================================================
-- 11. notifications  (알림)
-- ============================================================
create table public.notifications (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.users (id) on delete cascade,
  type         text not null check (type in (
    'bingo_reminder',    -- 빙고 기간 알림
    'bingo_dday',        -- D-day 알림
    'comment',           -- 내 게시글에 댓글
    'reply',             -- 내 댓글에 대댓글
    'like',              -- 좋아요 알림
    'popular'            -- 인기 게시글 달성
  )),
  message      text not null,
  target_id    uuid,           -- 관련 게시글 or 빙고 ID
  target_type  text check (target_type in ('post', 'bingo_board')),
  is_read      boolean not null default false,
  created_at   timestamptz not null default now()
);

comment on table public.notifications is '앱 알림';


-- ============================================================
-- 트리거: like_count / comment_count 자동 업데이트
-- ============================================================

-- 좋아요 증가
create or replace function increment_like_count()
returns trigger language plpgsql as $$
begin
  update public.posts set like_count = like_count + 1 where id = new.post_id;
  return new;
end;
$$;

create trigger trg_like_insert
  after insert on public.likes
  for each row execute function increment_like_count();

-- 좋아요 감소
create or replace function decrement_like_count()
returns trigger language plpgsql as $$
begin
  update public.posts set like_count = greatest(like_count - 1, 0) where id = old.post_id;
  return old;
end;
$$;

create trigger trg_like_delete
  after delete on public.likes
  for each row execute function decrement_like_count();

-- 댓글 수 증가
create or replace function increment_comment_count()
returns trigger language plpgsql as $$
begin
  update public.posts set comment_count = comment_count + 1 where id = new.post_id;
  return new;
end;
$$;

create trigger trg_comment_insert
  after insert on public.comments
  for each row execute function increment_comment_count();

-- 댓글 소프트 딜리트 시 카운트 감소
create or replace function decrement_comment_count()
returns trigger language plpgsql as $$
begin
  if old.is_deleted = false and new.is_deleted = true then
    update public.posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
  end if;
  return new;
end;
$$;

create trigger trg_comment_soft_delete
  after update of is_deleted on public.comments
  for each row execute function decrement_comment_count();


-- ============================================================
-- 인덱스
-- ============================================================
create index idx_bingo_boards_user_id   on public.bingo_boards (user_id);
create index idx_bingo_boards_status    on public.bingo_boards (status);
create index idx_bingo_cells_board_id   on public.bingo_cells (board_id);
create index idx_posts_user_id          on public.posts (user_id);
create index idx_posts_category         on public.posts (category);
create index idx_posts_created_at       on public.posts (created_at desc);
create index idx_comments_post_id       on public.comments (post_id);
create index idx_comments_parent_id     on public.comments (parent_id);
create index idx_likes_post_id          on public.likes (post_id);
create index idx_notifications_user_id  on public.notifications (user_id);
create index idx_notifications_is_read  on public.notifications (user_id, is_read);

-- 게시글 전문 검색 인덱스 (제목 + 내용)
create index idx_posts_fts on public.posts
  using gin (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(content, '')));


-- ============================================================
-- RLS (Row Level Security) 활성화
-- ============================================================
alter table public.users             enable row level security;
alter table public.social_accounts   enable row level security;
alter table public.bingo_boards      enable row level security;
alter table public.bingo_cells       enable row level security;
alter table public.user_badges       enable row level security;
alter table public.posts             enable row level security;
alter table public.comments          enable row level security;
alter table public.likes             enable row level security;
alter table public.reports           enable row level security;
alter table public.notifications     enable row level security;

-- ============================================================
-- RLS 정책
-- ============================================================

-- users: 본인만 수정 가능, 조회는 모두 가능 (단 deleted_at is null인 경우만)
create policy "users: 전체 조회 가능" on public.users
  for select using (deleted_at is null);

create policy "users: 본인만 수정 가능" on public.users
  for update using (auth.uid() = id);

-- social_accounts: 본인만 접근
create policy "social_accounts: 본인만" on public.social_accounts
  for all using (auth.uid() = user_id);

-- bingo_boards: 본인만 조회/작성/수정, 다른 유저는 조회만 (비공개 계정 제외)
-- DELETE는 허용하지 않음 — 삭제는 deleted_at 소프트 딜리트로만 처리
create policy "bingo_boards: 본인 조회" on public.bingo_boards
  for select using (auth.uid() = user_id);

create policy "bingo_boards: 본인 작성" on public.bingo_boards
  for insert with check (auth.uid() = user_id);

create policy "bingo_boards: 본인 수정" on public.bingo_boards
  for update using (auth.uid() = user_id);

create policy "bingo_boards: 타인 조회 (비공개 계정 제외)" on public.bingo_boards
  for select using (
    auth.uid() != user_id
    and deleted_at is null
    and exists (
      select 1 from public.users u
      where u.id = bingo_boards.user_id
        and u.is_private = false
        and u.deleted_at is null
    )
  );

-- bingo_cells: 빙고판 소유자만 전체 접근
create policy "bingo_cells: 빙고판 소유자만" on public.bingo_cells
  for all using (
    exists (
      select 1 from public.bingo_boards b
      where b.id = bingo_cells.board_id
        and b.user_id = auth.uid()
    )
  );

-- bingo_cells: 공개 계정의 빙고판은 타인도 조회 가능
create policy "bingo_cells: 공개 빙고판 조회" on public.bingo_cells
  for select using (
    exists (
      select 1 from public.bingo_boards b
      join public.users u on u.id = b.user_id
      where b.id = bingo_cells.board_id
        and b.deleted_at is null
        and u.is_private = false
        and u.deleted_at is null
    )
  );

-- user_badges: 조회는 모두, 수정은 본인만
create policy "user_badges: 전체 조회" on public.user_badges
  for select using (true);

create policy "user_badges: 본인 작성" on public.user_badges
  for insert with check (auth.uid() = user_id);

create policy "user_badges: 본인 삭제" on public.user_badges
  for delete using (auth.uid() = user_id);

-- posts: 삭제되지 않은 글은 모두 조회, 작성/수정/삭제는 본인만
create policy "posts: 전체 조회" on public.posts
  for select using (is_deleted = false);

create policy "posts: 본인 작성" on public.posts
  for insert with check (auth.uid() = user_id);

create policy "posts: 본인 수정/삭제" on public.posts
  for update using (auth.uid() = user_id);

-- comments: 삭제되지 않은 댓글 전체 조회, 작성/수정은 본인만
create policy "comments: 전체 조회" on public.comments
  for select using (is_deleted = false);

create policy "comments: 본인 작성" on public.comments
  for insert with check (auth.uid() = user_id);

create policy "comments: 본인 수정/삭제" on public.comments
  for update using (auth.uid() = user_id);

-- likes: 조회는 모두, 작성/삭제는 본인만
create policy "likes: 전체 조회" on public.likes
  for select using (true);

create policy "likes: 본인 작성" on public.likes
  for insert with check (auth.uid() = user_id);

create policy "likes: 본인 삭제" on public.likes
  for delete using (auth.uid() = user_id);

-- reports: 본인만 작성, 조회 불가 (관리자만)
create policy "reports: 본인 작성" on public.reports
  for insert with check (auth.uid() = reporter_id);

-- notifications: 본인만
create policy "notifications: 본인만" on public.notifications
  for all using (auth.uid() = user_id);