-- midnight 의 제목 글씨색을 다시 검정으로 되돌린다. 20260909000005 를 취소한다.
--
-- 000005 에서 '#FDFDFD' 로 바꿨던 이유는 midnight 상단이 짙은 남색이라
-- 검정 제목이 안 읽혀서였는데, 흰 제목도 원하는 그림이 아니었다.
--
-- 참고 — 이 값이 실제로 칠하는 곳은 셋뿐이다(전부 판 이미지 위):
--   빙고판 제목, 공유 아이콘, 편집 아이콘
-- 칸 안의 글씨는 이 값을 쓰지 않는다. 여섯 테마 모두 칸이 밝은 색이라
-- 앱이 FIXED.boardForeground('#181C1C') 로 고정한다.
-- (constants/color-tokens.cjs / BingoCard·BingoPreview·BingoThumbnail·AddEachBingo)
--
-- 그래서 지금은 여섯 테마가 전부 '#181C1C' 이고, 제목과 칸이 같은 색이다.

update public.bingo_themes
set foreground_color = '#181C1C'
where id = 'midnight';
