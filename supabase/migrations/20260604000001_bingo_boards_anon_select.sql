-- 랜딩 페이지(Supabase anon 키)에서 공개 계정의 빙고판을 조회할 수 있도록 허용.
-- 기존 정책은 auth.uid()를 사용하여 anon(인증 없음)에서 NULL = uuid → false 로 평가되어
-- 모든 bingo_boards 행이 차단됨. 이 정책은 auth.uid() is null 케이스를 별도로 처리.
-- bingo_cells의 기존 "공개 빙고판 조회" 정책 subquery도 이 정책이 해결되면 자동으로 동작함.
create policy "bingo_boards: 익명 공개 조회" on public.bingo_boards
  for select using (
    auth.uid() is null
    and deleted_at is null
    and exists (
      select 1 from public.users u
      where u.id = bingo_boards.user_id
        and u.is_private = false
        and u.deleted_at is null
    )
  );
