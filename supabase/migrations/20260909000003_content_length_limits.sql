-- 사용자 입력 길이 상한을 DB에도 건다.
--
-- 지금까지 posts.title / posts.content / comments.content / bingo_boards.title /
-- bingo_cells.content 가 전부 제한 없는 text였다. 클라이언트에 maxLength가 없었으므로
-- 수십만 자를 붙여넣어 저장하는 것이 가능했고, 그게 목록 카드 레이아웃 붕괴와
-- 게시글 상세의 댓글 전량 로드 문제로 이어졌다.
--
-- 값은 constants/limits.ts 와 같다. 한쪽만 바꾸면 안 된다.
--   게시글 제목 50 / 본문 5000 / 댓글 500 / 빙고 제목 20 / 빙고 칸 30
--
-- NOT VALID로 거는 이유: 이미 상한을 넘겨 저장된 행이 있어도 마이그레이션이
-- 실패하지 않게 한다. 새로 들어오거나 수정되는 행에는 그대로 적용된다.
-- 기존 행을 정리한 뒤 VALIDATE CONSTRAINT로 마저 검증하면 된다.

do $$
declare
  target record;
begin
  for target in
    select * from (values
      ('posts',        'title',   50),
      ('posts',        'content', 5000),
      ('comments',     'content', 500),
      ('bingo_boards', 'title',   20),
      ('bingo_cells',  'content', 30)
    ) as t(tbl, col, max_len)
  loop
    -- 대상 컬럼이 없는 환경(로컬 리셋 등)에서도 조용히 넘어간다
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = target.tbl
        and column_name = target.col
    ) then
      continue;
    end if;

    execute format(
      'alter table public.%I drop constraint if exists %I',
      target.tbl, target.tbl || '_' || target.col || '_length_check'
    );

    execute format(
      'alter table public.%I add constraint %I check (char_length(%I) <= %s) not valid',
      target.tbl,
      target.tbl || '_' || target.col || '_length_check',
      target.col,
      target.max_len
    );
  end loop;
end
$$;
