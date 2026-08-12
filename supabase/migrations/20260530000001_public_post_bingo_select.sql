-- 웹 라운지(bingket-landing)는 로그인 없는 익명(anon) 클라이언트로 게시글을 읽는다.
-- 기존 bingo_boards/bingo_cells RLS는 "본인(auth.uid())만 조회"라 익명은 0행을 받아
-- 게시글에 첨부된 빙고판이 웹에서 렌더링되지 않는다.
--
-- 아래 정책은 "이미 공개 게시글(is_deleted=false)에 연결되어 공유된 빙고판"만
-- 누구나(anon 포함) SELECT 할 수 있게 추가한다. 기존 정책은 건드리지 않으며
-- RLS 정책은 OR로 결합되므로 권한 약화 없이 확장만 된다.
-- (TO 절 생략 = public 롤 = anon + authenticated)

create policy "bingo_boards: 공개 게시글 연결 조회" on public.bingo_boards
  for select using (
    deleted_at is null
    and exists (
      select 1 from public.posts p
      where p.bingo_board_id = bingo_boards.id
        and p.is_deleted = false
    )
  );

create policy "bingo_cells: 공개 게시글 연결 조회" on public.bingo_cells
  for select using (
    exists (
      select 1 from public.bingo_boards b
      join public.posts p on p.bingo_board_id = b.id
      where b.id = bingo_cells.board_id
        and b.deleted_at is null
        and p.is_deleted = false
    )
  );
