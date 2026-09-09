-- users 조회가 anon/authenticated 양쪽에서 전부 실패하던 것을 고친다.
--
--   ERROR 42501: permission denied for function is_friend_with
--
-- 20260812000002_bingo_visibility.sql:407 이 is_friend_with 의 EXECUTE 를
-- public, anon, authenticated 에서 회수했다. "헬퍼는 다른 함수 내부에서만 쓰인다"는
-- 전제였고, 실제로 그때까지 호출부는 전부 SECURITY DEFINER 함수 본문이었다.
-- 함수 본문 안의 호출은 함수 소유자 권한으로 실행되므로 회수 영향을 받지 않는다.
--
-- 그런데 20260909000002_account_visibility.sql:125 가 이 함수를 users 의
-- SELECT RLS 정책 식에서 직접 호출했다. 정책 식은 함수 본문과 달리 질의를 던진
-- 롤 권한으로 평가되므로, EXECUTE 가 없는 anon 은 물론 authenticated 도
-- users 를 한 행도 읽지 못했다.
--
-- 앱과 홍보용 랜딩페이지가 동시에 죽어 있었다. users 를 직접 읽는 곳이
-- app/_layout.tsx, GoogleButton, AppleButton, mypage, team, profile 로
-- 로그인·마이페이지·팀 조회 경로에 걸쳐 있다. 클라이언트가 에러를 삼키고 있어서
-- 빈 목록과 404 로만 보였다. Edge Function 은 service role 이라 무사했다.
--
-- 반면 "bingo_boards: 익명 공개 조회" 는 anon 으로 정상 동작한다(실측 200).
-- 그 정책이 users 를 서브쿼리로 참조하긴 하지만, bingo_boards 의 permissive
-- SELECT 정책이 여럿이고 OR 로 묶이므로 users 를 건드리지 않는 쪽에서 통과한다.
--
-- 고치는 방법으로 is_friend_with 에 EXECUTE 를 다시 부여하는 길이 있지만
-- 택하지 않았다. 이 함수는 SECURITY DEFINER 라서 friends 의 RLS 를 우회한다.
-- anon 에 열어주면 임의의 두 사람을 넣어 친구 여부를 캐물을 수 있고,
-- 그게 바로 20260812000002 가 닫았던 구멍이다.
--
-- 대신 정책 식을 friends 인라인 서브쿼리로 바꾼다. friends 의 정책이
-- "auth.uid() = user_id or auth.uid() = friend_id" (20260331000001:294) 이므로
-- friend_id = auth.uid() 로 고정한 이 조회는 조회자 본인 권한으로 통과한다.
-- 즉 조회자가 원래 알 수 있는 사실만 묻는다. 새로 여는 권한이 없고,
-- SECURITY DEFINER 블랙박스가 아니라 플래너가 idx_friends_friend_id 를 쓸 수 있다.
--
-- anon 은 auth.uid() 가 null 이라 이 항이 항상 거짓이 되고, 비공개가 아닌 계정만
-- 보인다. 기존 의도 그대로다.
--
-- friends 정책은 users 를 참조하지 않으므로 정책이 서로를 부르는 재귀는 없다.

drop policy if exists "users: 공개 범위에 따른 조회" on public.users;

create policy "users: 공개 범위에 따른 조회" on public.users
  for select using (
    deleted_at is null
    and (
      account_visibility <> 'private'
      or id = auth.uid()
      or exists (
        select 1
        from public.friends f
        where f.user_id = users.id
          and f.friend_id = auth.uid()
      )
    )
  );

-- 같은 실수가 반복되지 않도록 제약을 함수 자체에 적어 둔다.
comment on function public.is_friend_with(uuid, uuid) is
  'friends는 양방향 저장이므로 한 방향만 확인하면 된다. '
  'anon/authenticated에 EXECUTE가 없다(20260812000002). '
  'SECURITY DEFINER 함수 본문에서만 호출할 것 — RLS 정책 식에서 부르면 '
  '정책이 조회자 권한으로 평가되어 해당 테이블 조회가 42501로 전부 실패한다.';
