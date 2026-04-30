-- battle_requests와 battles에 title 컬럼 추가

ALTER TABLE battle_requests
  ADD COLUMN IF NOT EXISTS title TEXT;

ALTER TABLE battles
  ADD COLUMN IF NOT EXISTS title TEXT;
