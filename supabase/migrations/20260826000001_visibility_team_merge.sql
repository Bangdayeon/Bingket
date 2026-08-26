-- ============================================================
-- 공개범위(20260812000002) x 팀 빙고(20260813000002) 병합 보정
--
-- 두 작업이 병렬로 진행되어 서로를 모른 채 같은 대상을 건드렸다.
-- 1) 팀 빙고가 create_bingo_with_cells 를 visibility 없이 재정의해서
--    사용자가 고른 공개범위가 조용히 무시되고 항상 기본값(friends)이 됐다.
-- 2) 팀 빙고가 battles / battle_requests 테이블을 드롭해서
--    get_battle_boards 가 없는 테이블을 참조하는 죽은 함수가 됐다.
--    (plpgsql 이라 생성 시점엔 안 터지고 호출할 때 터진다)
-- ============================================================

-- ------------------------------------------------------------
-- 1. create_bingo_with_cells: p_visibility 추가
-- ------------------------------------------------------------
-- 인자 개수가 달라지므로 구 시그니처를 명시적으로 드롭한다.
drop function if exists public.create_bingo_with_cells(text, text, text, int, date, date, text[]);

create or replace function public.create_bingo_with_cells(
  p_title        text,
  p_grid         text,
  p_theme        text,
  p_max_edits    int,
  p_start_date   date,
  p_target_date  date,
  p_cells        text[],
  p_visibility   text default 'friends'
)
returns uuid language plpgsql security invoker as $$
declare
  v_board_id  uuid;
  v_uid       uuid := auth.uid();
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if p_visibility not in ('public', 'friends', 'private') then
    raise exception '알 수 없는 공개범위입니다: %', p_visibility;
  end if;

  insert into public.bingo_boards
    (user_id, title, grid, theme, max_edits, start_date, target_date, status, visibility)
  values
    (v_uid, p_title, p_grid, p_theme, p_max_edits, p_start_date, p_target_date, 'progress', p_visibility)
  returning id into v_board_id;

  insert into public.bingo_cells (board_id, position, content, edit_count)
  select v_board_id, t.ordinality - 1, t.value, 0
  from unnest(p_cells) with ordinality as t(value, ordinality);

  return v_board_id;
end;
$$;

-- ------------------------------------------------------------
-- 2. get_battle_boards 제거
-- ------------------------------------------------------------
-- 대결 기능 자체가 팀 빙고로 대체되어 참조 테이블이 사라졌다.
-- 팀원 빙고판 조회는 아직 team.ts 가 bingo_boards 를 직접 읽고 있고,
-- 같은 방식의 security definer RPC(get_team_boards)로 옮기는 작업이 남아 있다.
drop function if exists public.get_battle_boards(uuid[]);
