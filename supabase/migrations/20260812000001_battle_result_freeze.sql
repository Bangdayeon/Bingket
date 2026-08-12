-- ============================================================
-- 대결 종료 결과 동결
--
-- 종료 처리는 앱에서 지연 확정(lazy finalize)한다.
-- 이 마이그레이션은 그 결과가 나중에 바뀌지 않도록 DB 레벨에서 보장한다.
-- ============================================================

alter table public.battles
  add column if not exists completed_at timestamptz;

comment on column public.battles.completed_at is '대결 종료 처리 시각 (앱에서 지연 확정)';

create index if not exists idx_battles_completed_at
  on public.battles (completed_at desc);


-- ============================================================
-- 종료된 대결의 결과 컬럼을 동결하는 트리거
-- ============================================================
create or replace function public.freeze_completed_battle()
returns trigger language plpgsql as $$
begin
  -- 이미 종료된 대결: 결과 관련 컬럼 변경을 무시한다.
  -- 예외 대신 silent freeze -- 두 참가자가 동시에 확정을 시도할 때
  -- 진 쪽에 에러가 뜨지 않게 하기 위함.
  if old.status = 'completed' then
    new.status       := old.status;
    new.score1       := old.score1;
    new.score2       := old.score2;
    new.end_date     := old.end_date;
    new.completed_at := old.completed_at;
    new.board1_id    := old.board1_id;
    new.board2_id    := old.board2_id;
    return new;
  end if;

  if new.status = 'completed' then
    if new.end_date is null then
      raise exception '종료일이 없는 대결은 종료할 수 없습니다.';
    end if;

    -- KST 기준 end_date 다음날 00:00 이후에만 종료를 허용한다 (기기 시계 오차/조작 방어)
    if now() < ((new.end_date + 1)::timestamp at time zone 'Asia/Seoul') then
      raise exception '대결 기간이 아직 끝나지 않았습니다.';
    end if;

    new.completed_at := coalesce(new.completed_at, now());
  end if;

  return new;
end;
$$;

drop trigger if exists trg_freeze_completed_battle on public.battles;
create trigger trg_freeze_completed_battle
  before update on public.battles
  for each row execute function public.freeze_completed_battle();


-- ============================================================
-- UPDATE 정책에 with check 추가
-- 기존 정책은 using만 있어 참여자가 user2_id 재지정까지 할 수 있었다.
-- ============================================================
drop policy if exists "battles: 참여자만 점수 업데이트" on public.battles;

create policy "battles: 참여자만 점수 업데이트" on public.battles
  for update
  using (auth.uid() = user1_id or auth.uid() = user2_id)
  with check (auth.uid() = user1_id or auth.uid() = user2_id);
