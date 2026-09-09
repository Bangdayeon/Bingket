-- ============================================================
-- 타인 빙고 상세에 진행 기간을 함께 내려준다.
--
-- 기존 결정("친구 빙고 상세는 빙고판 + 제목만")을 뒤집는 변경이다.
-- 달성 수·빙고 수는 이미 내려주는 cells 의 is_checked 로 클라이언트가 세므로
-- 여기서는 start_date / target_date 만 추가하면 된다.
--
-- memo / retrospective 는 그대로 쿼리에 넣지 않는다 — 이건 유지한다.
-- ============================================================

-- 반환 컬럼이 늘어나 create or replace 로는 못 바꾼다 (42P13).
drop function if exists public.get_board_detail(uuid);

create function public.get_board_detail(p_board_id uuid)
returns table (
  id           uuid,
  user_id      uuid,
  title        text,
  grid         text,
  theme        text,
  status       text,
  start_date   date,
  target_date  date,
  cells        jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_viewer uuid := auth.uid();
begin
  if v_viewer is null or not public.can_view_board(v_viewer, p_board_id) then
    return;
  end if;

  return query
  select
    b.id,
    b.user_id,
    b.title,
    b.grid,
    b.theme,
    b.status,
    b.start_date,
    b.target_date,
    coalesce(
      (
        select jsonb_agg(
                 jsonb_build_object(
                   'position',   c.position,
                   'content',    c.content,
                   'is_checked', c.is_checked
                 )
                 order by c.position
               )
        from public.bingo_cells c
        where c.board_id = b.id
      ),
      '[]'::jsonb
    ) as cells
  from public.bingo_boards b
  where b.id = p_board_id;
end;
$$;

comment on function public.get_board_detail is
  '타인 빙고 상세. 진행 기간까지 내려주되 memo / retrospective 는 쿼리에서 제외한다';
