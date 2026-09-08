-- '같이 채우기'로 합류할 때도 빙고 3개 제한을 적용한다.
--
-- '각자 채우기'(copied/own)는 내 빙고판을 새로 만들기 때문에 bingo_boards의
-- check_bingo_board_limit 트리거에 걸린다. 그런데 '같이 채우기'(shared)는 방장 판을
-- 그대로 쓰므로 판을 만들지 않고, 이 함수의 shared 분기에는 개수 검사가 빠져 있었다.
-- 그래서 이미 3개를 채운 사람이 '같이 채우기' 초대를 수락하면 4개가 됐고,
-- 그 뒤로는 count_active_bingo_slots가 4를 반환해 새 빙고를 하나도 만들 수 없었다.
--
-- 20260813000002_team_bingo.sql의 주석("팀 참여도 한 칸을 쓴다")이 원래 의도이므로
-- 검사를 두 갈래 공통으로 끌어올린다.
create or replace function public.check_team_member_join()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_team  public.team_bingos;
begin
  if new.status <> 'joined' or old.status is not distinct from 'joined' then
    return new;
  end if;

  select * into v_team from public.team_bingos where id = new.team_id;

  -- 기간이 끝난 팀에는 합류할 수 없다 (초대장은 기간 종료까지만 유효)
  if v_team.status = 'completed'
     or (now() at time zone 'Asia/Seoul')::date > v_team.end_date then
    raise exception '이미 종료된 팀 빙고입니다.';
  end if;

  -- 판 없이 합류할 수 없다 (copied/own은 판 생성이 곧 수락)
  if new.board_id is null then
    raise exception '참여할 빙고판이 필요합니다.';
  end if;

  -- shared는 방장 판을 그대로 쓰고, copied/own은 본인 소유여야 한다
  if v_team.mode = 'shared' then
    if not exists (
      select 1 from public.team_members
      where team_id = new.team_id
        and user_id = v_team.owner_id
        and board_id = new.board_id
    ) then
      raise exception '같이 채우기 빙고는 방장의 빙고판을 사용해야 합니다.';
    end if;
  else
    if not exists (
      select 1 from public.bingo_boards
      where id = new.board_id
        and user_id = new.user_id
        and status = 'progress'
        and deleted_at is null
    ) then
      raise exception '본인 소유의 진행 중인 빙고판만 사용할 수 있습니다.';
    end if;
  end if;

  -- 3칸 제한은 두 갈래 모두에 적용한다.
  -- copied/own은 방금 만든 내 판이 이미 세어지므로 제외하고, shared는 방장 판이라
  -- 애초에 내 몫으로 세어지지 않으므로 제외할 것이 없다.
  if public.count_active_bingo_slots(
       new.user_id,
       case when v_team.mode = 'shared' then null else new.board_id end
     ) >= 3 then
    raise exception '진행 중인 빙고는 최대 3개까지 추가할 수 있습니다.';
  end if;

  new.joined_at := coalesce(new.joined_at, now());
  return new;
end;
$$;
