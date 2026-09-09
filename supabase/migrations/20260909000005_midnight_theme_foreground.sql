-- midnight 테마의 제목 글씨색을 밝게 바꾼다.
--
-- bingo_themes.foreground_color 는 빙고판 이미지 위에 얹히는 **제목**의 색이다.
-- (칸 글씨는 모든 테마에서 칸이 밝은 색이라 앱이 고정 어두운 색을 쓴다 —
--  constants/color-tokens.cjs 의 FIXED.boardForeground)
--
-- 여섯 테마가 전부 '#181C1C' 로 시드돼 있는데, midnight 만 제목이 놓이는 상단이
-- 짙은 남색이라 검정 제목이 읽히지 않는다. 나머지 다섯은 상단이 밝아서 그대로 둔다.
--
-- 되돌리려면:
--   update public.bingo_themes set foreground_color = '#181C1C' where id = 'midnight';

update public.bingo_themes
set foreground_color = '#FDFDFD'
where id = 'midnight';
