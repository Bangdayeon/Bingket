-- 게시글 카테고리(빙고판/빙고 달성/자유게시판) 분류를 앱에서 제거한다.
--
-- 컬럼과 check 제약은 그대로 둔다. 기존 게시글의 분류 데이터를 보존하고,
-- 되돌리고 싶을 때 마이그레이션 하나로 돌아올 수 있게 하기 위해서다.
-- 클라이언트가 더 이상 category를 보내지 않으므로 기본값만 준다.
alter table public.posts alter column category set default 'free';
