-- reports 테이블을 빠른 문의(content만 있는 형태)도 수용하도록 수정
-- 기존 커뮤니티 신고(reporter_id, target_type, target_id, reason)는 그대로 유지

-- 1. 기존 NOT NULL 컬럼들을 nullable로 변경 (빠른 문의는 이 값들이 없음)
ALTER TABLE public.reports
  ALTER COLUMN reporter_id DROP NOT NULL,
  ALTER COLUMN target_type DROP NOT NULL,
  ALTER COLUMN target_id   DROP NOT NULL,
  ALTER COLUMN reason      DROP NOT NULL;

-- 2. 빠른 문의용 content 컬럼 추가
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS content TEXT CHECK (char_length(content) <= 500);
