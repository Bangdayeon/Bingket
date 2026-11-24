-- Phase 1: deploy before the new client. Legacy reads remain until cutover.
create table public.community_author_tokens (
  scope_id uuid not null,
  user_id uuid not null references public.users(id) on delete cascade,
  token uuid not null default gen_random_uuid() unique,
  primary key(scope_id,user_id)
);
alter table public.community_author_tokens enable row level security;
revoke all on public.community_author_tokens from anon, authenticated;

create function public.community_author_token(p_scope uuid, p_user uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v uuid;
begin
  insert into public.community_author_tokens(scope_id,user_id) values(p_scope,p_user)
    on conflict do nothing;
  select token into v from public.community_author_tokens where scope_id=p_scope and user_id=p_user;
  return v;
end $$;
revoke all on function public.community_author_token(uuid,uuid) from public;

create function public.community_posts(p_id uuid default null, p_ids uuid[] default null,
  p_offset integer default 0, p_limit integer default 15)
returns setof jsonb language plpgsql security definer set search_path = '' as $$
declare p record; v_token uuid;
begin
 for p in select x.* from public.posts x where not x.is_deleted
   and (p_id is null or x.id=p_id) and (p_ids is null or x.id=any(p_ids))
   and not exists(select 1 from public.blocks b where b.blocker_id=auth.uid() and b.blocked_id=x.user_id)
   order by x.created_at desc, x.id limit least(greatest(p_limit,0),100) offset greatest(p_offset,0)
 loop
   v_token := case when p.user_id is null then null else public.community_author_token(p.id,p.user_id) end;
   return next (to_jsonb(p) - 'user_id' - 'bingo_board_id') || jsonb_build_object(
     'user_id',case when p.is_anonymous and p.user_id is distinct from auth.uid() then v_token else p.user_id end,
     'users',case when p.is_anonymous then null else (select jsonb_build_object('display_name',u.display_name,'avatar_url',u.avatar_url) from public.users u where u.id=p.user_id) end,
     'bingo_boards',case when p.bingo_snapshot is not null then null else
       (select jsonb_build_object('title',b.title,'grid',b.grid,'theme',b.theme,
         'bingo_cells',coalesce((select jsonb_agg(jsonb_build_object('position',c.position,'content',c.content) order by c.position)
         from public.bingo_cells c where c.board_id=b.id),'[]'::jsonb))
        from public.bingo_boards b where b.id=p.bingo_board_id and b.deleted_at is null) end);
 end loop;
end $$;

create function public.community_comments(p_post_id uuid, p_limit integer default 20)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare c record; rows jsonb := '[]'; n integer; v_token uuid;
begin
 if not exists(select 1 from public.posts where id=p_post_id and not is_deleted) then
   return jsonb_build_object('rows',rows,'total',0);
 end if;
 select count(*) into n from public.comments x where x.post_id=p_post_id and not x.is_deleted
 and not exists(select 1 from public.blocks b where b.blocker_id=auth.uid() and b.blocked_id=x.user_id);
 for c in select x.* from public.comments x where x.post_id=p_post_id and not x.is_deleted
 and not exists(select 1 from public.blocks b where b.blocker_id=auth.uid() and b.blocked_id=x.user_id)
 order by x.created_at,x.id limit least(greatest(p_limit,0),500)
 loop
   v_token:=case when c.user_id is null then null else public.community_author_token(p_post_id,c.user_id) end;
   rows:=rows || jsonb_build_array((to_jsonb(c)-'user_id') || jsonb_build_object(
     'user_id',case when c.is_anonymous and c.user_id is distinct from auth.uid() then v_token else c.user_id end,
     'users',case when c.is_anonymous then null else (select jsonb_build_object('display_name',u.display_name,'avatar_url',u.avatar_url) from public.users u where u.id=c.user_id) end));
 end loop;
 return jsonb_build_object('rows',rows,'total',n);
end $$;

create function public.community_block_author(p_target uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_user uuid;
begin
 if auth.uid() is null then raise exception 'Unauthorized'; end if;
 select user_id into v_user from public.community_author_tokens where token=p_target;
 v_user:=coalesce(v_user,p_target);
 if v_user=auth.uid() then raise exception 'Cannot block yourself'; end if;
 insert into public.blocks(blocker_id,blocked_id) values(auth.uid(),v_user) on conflict do nothing;
end $$;
revoke all on function public.community_block_author(uuid) from public,anon;
grant execute on function public.community_block_author(uuid) to authenticated;
grant execute on function public.community_posts(uuid,uuid[],integer,integer) to anon,authenticated;
grant execute on function public.community_comments(uuid,integer) to anon,authenticated;

-- Search only data explicitly published in posts, never live private board cells.
create or replace function public.search_post_ids(query_text text)
returns table(id uuid) language sql security definer set search_path = '' stable as $$
 select p.id from public.posts p where not p.is_deleted
 and not exists(select 1 from public.blocks b where b.blocker_id=auth.uid() and b.blocked_id=p.user_id)
 and (p.title ilike '%'||query_text||'%' or p.content ilike '%'||query_text||'%'
 or p.bingo_snapshot::text ilike '%'||query_text||'%'
 or exists(select 1 from public.comments c where c.post_id=p.id and not c.is_deleted
 and not exists(select 1 from public.blocks b where b.blocker_id=auth.uid() and b.blocked_id=c.user_id)
 and c.content ilike '%'||query_text||'%'))
 order by p.created_at desc limit 50;
$$;

revoke all on function public.community_posts(uuid,uuid[],integer,integer) from public;
revoke all on function public.community_comments(uuid,integer) from public;
revoke all on function public.search_post_ids(text) from public;
grant execute on function public.search_post_ids(text) to anon,authenticated;
