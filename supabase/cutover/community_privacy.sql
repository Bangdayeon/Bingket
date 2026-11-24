-- Run ONLY after app + web use community_posts/community_comments RPCs.
-- Keep owner reads for editing, own posts, and badge counts.
begin;
drop policy if exists "posts: 전체 조회" on public.posts;
drop policy if exists "comments: 전체 조회" on public.comments;
-- A blocked author must not be reidentified by reading the resolved block row.
drop policy if exists "blocks: 본인만" on public.blocks;
create policy "blocks: 본인 삽입" on public.blocks for insert to authenticated
  with check (blocker_id=auth.uid());
create policy "blocks: 본인 삭제" on public.blocks for delete to authenticated
  using (blocker_id=auth.uid());
commit;
