-- Disposable EMPTY PostgreSQL only. psql -v ON_ERROR_STOP=1 -f this-file
do $$ begin create role anon; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated; exception when duplicate_object then null; end $$;
grant usage on schema public to anon,authenticated;
create schema auth;
create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('test.viewer',true),'')::uuid $$;
grant usage on schema auth to anon,authenticated;
grant execute on function auth.uid() to anon,authenticated;
create table public.users(id uuid primary key,display_name text,avatar_url text);
create table public.posts(id uuid primary key,user_id uuid,title text,content text,is_anonymous boolean,is_deleted boolean,created_at timestamptz default now(),bingo_board_id uuid,bingo_snapshot jsonb);
create table public.comments(id uuid primary key,user_id uuid,post_id uuid,parent_id uuid,content text,is_anonymous boolean,is_deleted boolean,created_at timestamptz default now());
create table public.blocks(blocker_id uuid,blocked_id uuid,unique(blocker_id,blocked_id));
create table public.bingo_boards(id uuid,title text,grid text,theme text,deleted_at timestamptz);
create table public.bingo_cells(board_id uuid,position integer,content text);
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.blocks enable row level security;
grant select on public.posts,public.comments,public.blocks to anon,authenticated;
create policy "posts: 전체 조회" on public.posts for select using(not is_deleted);
create policy "comments: 전체 조회" on public.comments for select using(not is_deleted);
create policy "posts: 본인 글 항상 조회 가능" on public.posts for select using(user_id=auth.uid());
create policy "comments: 본인 댓글 항상 조회 가능" on public.comments for select using(user_id=auth.uid());
create policy "blocks: 본인만" on public.blocks for all using(blocker_id=auth.uid());
\ir ../migrations/20261124010000_community_privacy.sql
insert into public.users values('00000000-0000-0000-0000-000000000001','Secret author','secret-profile'),('00000000-0000-0000-0000-000000000002','Reader',null);
insert into public.posts(id,user_id,title,content,is_anonymous,is_deleted) values('00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000001','Visible','Published',true,false);
insert into public.comments(id,user_id,post_id,content,is_anonymous,is_deleted) values('00000000-0000-0000-0000-000000000020','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000010','Reply',true,false);
select set_config('test.viewer','00000000-0000-0000-0000-000000000002',false);
set role authenticated;
do $$ declare p jsonb; c jsonb; begin
 select * into p from public.community_posts();
 c:=public.community_comments('00000000-0000-0000-0000-000000000010');
 if p->>'user_id'='00000000-0000-0000-0000-000000000001' or p->>'users' is not null then raise exception 'Author exposed'; end if;
 if c->'rows'->0->>'user_id' <> p->>'user_id' then raise exception 'Thread pseudonym mismatch'; end if;
 perform public.community_block_author((p->>'user_id')::uuid);
 if exists(select 1 from public.community_posts()) then raise exception 'Blocked author visible'; end if;
 if exists(select 1 from public.search_post_ids('Published')) then raise exception 'Blocked author searchable'; end if;
end $$;
reset role;
\ir ../cutover/community_privacy.sql
set role authenticated;
do $$ begin
 if exists(select 1 from public.posts) or exists(select 1 from public.comments) or exists(select 1 from public.blocks) then raise exception 'Raw identity leak after cutover'; end if;
end $$;
reset role;
