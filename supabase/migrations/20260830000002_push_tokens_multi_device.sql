-- ============================================================
-- 다기기 지원 + 죽은 토큰 정리 기반
--
-- 1) push_tokens 의 PK 가 user_id 단독이라 유저당 기기 1대였다.
--    두 번째 기기가 로그인하면 upsert 가 첫 기기의 토큰을 조용히 덮어써서
--    첫 기기는 그때부터 아무 알림도 받지 못했다. (user_id, token) 복합 PK 로 바꾼다.
--
-- 2) Expo push receipt 를 조회하려면 티켓 id 를 어딘가 보관해야 한다.
--    티켓은 전송 직후에 나오고 receipt 는 최소 수 분 뒤에야 확정되므로
--    같은 요청 안에서 확인할 수 없다. push_receipts 에 적어두고 Cron 이 훑는다.
-- ============================================================


-- ============================================================
-- 1. push_tokens 복합 PK
--
-- ⚠️ 이 변경은 **구버전 앱의 토큰 등록을 깨뜨린다.** 스토어에 있는 1.0.7 빌드는
--    `onConflict: 'user_id'` 로 upsert 하는데(커밋 1eae10d), user_id 단독 유니크가
--    사라지므로 PostgREST 가 42P10 을 돌려준다.
--
--    그럼에도 지금 적용하는 이유: 그 빌드들은 **애초에 푸시를 한 건도 받지 못한다.**
--    (TODO.md / docs/push-notification-handoff.md — 푸시 수정이 담긴 빌드가 어느
--    스토어에도 올라간 적이 없다) 갱신이 멈추는 토큰은 어차피 아무것도 못 받는
--    토큰이고, 1.1.0 을 설치하는 순간 정상화된다. 잃는 기능이 없다.
-- ============================================================
-- 기존 PK 가 user_id 단독이었으므로 (user_id, token) 중복은 존재할 수 없다.
-- 따라서 중복 정리 없이 바로 교체한다.
alter table public.push_tokens drop constraint if exists push_tokens_pkey;
alter table public.push_tokens add primary key (user_id, token);

-- 조회는 여전히 user_id 기준이다 (복합 PK 의 선두 컬럼이라 별도 인덱스는 불필요하지만
-- 의도를 명시하기 위해 남긴다 -- 이미 PK 인덱스가 커버하므로 생성하지 않는다)

comment on table public.push_tokens is
  '기기별 Expo 푸시 토큰. (user_id, token) 복합 PK -- 한 유저가 여러 기기를 쓸 수 있다';

-- ============================================================
-- 2. push_receipts -- 전송 티켓 보관함
-- ============================================================
create table if not exists public.push_receipts (
  ticket_id   text primary key,
  token       text not null,
  created_at  timestamptz not null default now()
);

comment on table public.push_receipts is
  'Expo 푸시 티켓 id. check-push-receipts 엣지 함수가 훑고 지운다. service_role 전용';

create index if not exists idx_push_receipts_created_at
  on public.push_receipts (created_at);

alter table public.push_receipts enable row level security;

-- 정책을 만들지 않는다. RLS 가 켜져 있고 정책이 없으면 anon / authenticated 는 접근 불가.
-- service_role 은 RLS 를 우회하므로 엣지 함수만 읽고 쓴다.
