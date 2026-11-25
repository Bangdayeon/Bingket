alter table public.posts drop constraint if exists posts_category_check;
alter table public.posts add constraint posts_category_check
  check (category in ('bingo_board', 'bingo_achieve', 'free', 'bingo_memo'));

-- The existing privacy-aware RPC remains the source of post details. Keep Board
-- pagination separate from the new BINGOS feed.
create or replace function public.bingos_post_ids(p_offset integer default 0, p_limit integer default 15)
returns table(id uuid) language sql security definer set search_path = '' stable as $$
  select p.id from public.posts p
  where p.category = 'bingo_memo' and not p.is_deleted
    and not exists (select 1 from public.blocks b
                    where b.blocker_id = auth.uid() and b.blocked_id = p.user_id)
  order by p.created_at desc, p.id
  limit least(greatest(p_limit, 0), 100) offset greatest(p_offset, 0);
$$;
revoke all on function public.bingos_post_ids(integer, integer) from public;
grant execute on function public.bingos_post_ids(integer, integer) to anon, authenticated;

create or replace function public.community_posts(p_id uuid default null, p_ids uuid[] default null,
  p_offset integer default 0, p_limit integer default 15)
returns setof jsonb language plpgsql security definer set search_path = '' as $$
declare p record; v_token uuid;
begin
 for p in select x.* from public.posts x where not x.is_deleted
   and (p_id is null or x.id=p_id) and (p_ids is null or x.id=any(p_ids))
   and (p_id is not null or p_ids is not null or x.category <> 'bingo_memo')
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
