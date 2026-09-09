-- ============================================================
-- 기간이 끝난 빙고판을 서버가 완료 처리한다.
--
-- 지금까지 bingo_boards.status 를 'done' 으로 넘기는 곳은 클라이언트의
-- markBingoDone(features/bingo/lib/bingo.ts) 한 곳뿐이고, 그것도 BingoAll
-- (홈 화면)이 "내가 만든 판"만 훑을 때 부른다. 그래서 판 주인이 앱을 열지 않으면
-- 종료일이 몇 달 지나도 status 는 'progress' 로 남는다.
--
-- 실제로 7월에 끝난 판이 친구 프로필 피드에서 '진행 중' 배지를 달고 있었다.
-- 남의 공유판은 더 심하다 -- BingoAll 이 아예 markBingoDone 대상에서 빼므로
-- (방장만 완료시킬 수 있다는 이유로) 방장이 안 열면 영영 진행 중이다.
--
-- 표시만 파생시키는 방법(RPC 에서 target_date 로 계산)도 있지만 택하지 않았다.
-- status 가 'progress' 로 남아 있는 한 count_active_bingo_slots 가 그 판을
-- 계속 한 칸으로 세서, 끝난 빙고가 3개 제한을 영구히 잡아먹는다.
-- 값 자체를 고쳐야 피드·배지·개수 제한이 한꺼번에 맞는다.
--
-- 팀 종료(finalizeTeam)와는 별개다. 그쪽은 team_bingos.status 를 다루고
-- 표시를 end_date 에서 파생시킨다. 여기서는 판만 본다.
-- ============================================================

-- ------------------------------------------------------------
-- 1. 완료 처리 함수
--
-- completed_at 은 여기서 직접 넣는다. 트리거(set_bingo_board_completed_at)가
-- coalesce(new.completed_at, now()) 이므로, 비워 두면 7월에 끝난 판이
-- "오늘 완료" 로 찍혀 피드 최상단에 올라온다. 실제로 끝난 순간은
-- 종료일 다음날 KST 자정이다.
-- ------------------------------------------------------------
create or replace function public.complete_expired_bingo_boards()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count int;
begin
  update public.bingo_boards b
  set status       = 'done',
      completed_at = ((b.target_date + 1)::timestamp at time zone 'Asia/Seoul')
  where b.status = 'progress'
    and b.deleted_at is null
    and b.target_date is not null
    -- 제작 중(날짜 미정)인 판은 target_date 가 null 이라 걸리지 않는다
    and b.target_date < (now() at time zone 'Asia/Seoul')::date;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

comment on function public.complete_expired_bingo_boards is
  '종료일이 지난 빙고판을 done 으로 넘긴다. completed_at 은 종료일 다음날 KST 자정.';

-- 클라이언트가 부를 일이 없다. cron 과 마이그레이션에서만 쓴다.
revoke execute on function public.complete_expired_bingo_boards() from public, anon, authenticated;

-- ------------------------------------------------------------
-- 2. 소급 적용 — 이미 쌓여 있는 판들
-- ------------------------------------------------------------
do $$
declare
  v_fixed int;
begin
  v_fixed := public.complete_expired_bingo_boards();
  raise notice '[auto-complete] 기간이 끝났는데 진행 중이던 빙고판 % 개를 완료 처리했다', v_fixed;
end $$;

-- ------------------------------------------------------------
-- 3. 매일 자동 실행
--
-- pg_cron 은 UTC 로 돈다. KST 자정 직후에 돌리려면 15:10 UTC 다.
-- 마감 알림(notify-bingo-deadline, 15:00 UTC)이 그날 마감인 판을 먼저 알린 뒤에
-- 넘기도록 10분 뒤에 둔다.
-- ------------------------------------------------------------
do $$
begin
  if to_regclass('cron.job') is null then
    raise notice '[auto-complete] pg_cron 이 없다. 스케줄을 건너뛴다';
    return;
  end if;

  perform cron.unschedule(jobid)
  from cron.job
  where jobname = 'complete-expired-bingo-boards';

  perform cron.schedule(
    'complete-expired-bingo-boards',
    '10 15 * * *',
    $cron$ select public.complete_expired_bingo_boards() $cron$
  );
end $$;
