-- ============================================================
-- 피드 정렬: 진행중 먼저, 그다음 완료일 최신순
--
-- 문제: bingo_boards.completed_at 은 컬럼만 있고 아무도 채우지 않는다.
-- 'done' 으로 넘기는 곳은 클라이언트의 markBingoDone(bingo.ts) 한 곳뿐인데
-- status 만 update 한다. 트리거도 없다. 그래서 지금 이 컬럼은 전부 null 이고,
-- fetchDoneBingos 의 order('completed_at') 도 사실상 아무 일도 안 하고 있었다.
--
-- 1) 트리거로 완료 시각을 실제로 남기고
-- 2) 이미 done 인 판은 마지막으로 칸을 체크한 시각으로 소급 채우고
-- 3) get_user_feed 정렬을 바꾼다
-- ============================================================

-- ------------------------------------------------------------
-- 1. status 가 done 으로 바뀌는 순간 완료 시각을 찍는다.
--    시각은 서버가 정한다 — 클라이언트가 보낸 값을 믿지 않는다.
--    done 에서 풀리면 지운다. 남겨두면 다음 완료 때 옛 날짜로 정렬된다.
-- ------------------------------------------------------------
-- NEW 만 만지므로 권한을 올릴 이유가 없다. security definer 를 붙이지 않는다.
create or replace function public.set_bingo_board_completed_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- INSERT 에서는 old 가 아예 배정되지 않는다. 필드를 건드리면 plpgsql 이
  -- "record old is not assigned yet" 으로 죽어서 빙고 생성이 통째로 막힌다.
  if tg_op = 'INSERT' then
    new.completed_at := case when new.status = 'done'
                          then coalesce(new.completed_at, now())
                          else null
                        end;
  elsif new.status = 'done' and old.status <> 'done' then
    new.completed_at := coalesce(new.completed_at, now());
  elsif new.status <> 'done' then
    new.completed_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_bingo_board_completed_at on public.bingo_boards;
create trigger trg_bingo_board_completed_at
  before insert or update of status on public.bingo_boards
  for each row
  execute function public.set_bingo_board_completed_at();

-- ------------------------------------------------------------
-- 2. 소급 적용. 완료 시각을 알 방법이 없으니 마지막으로 체크한 칸의 시각을 쓴다.
--    칸을 하나도 체크하지 않고 완료된 판은 생성 시각으로 떨어뜨린다.
-- ------------------------------------------------------------
update public.bingo_boards b
set completed_at = coalesce(
  (select max(c.checked_at) from public.bingo_cells c where c.board_id = b.id),
  b.created_at
)
where b.status = 'done'
  and b.completed_at is null;

-- ------------------------------------------------------------
-- 3. 피드 정렬 변경. 본문은 그대로고 order by 만 다르다.
--    (b.status = 'done') 은 진행중이 false → 오름차순이면 항상 앞에 온다.
--    진행중끼리는 completed_at 이 전부 null 이라 created_at 으로 갈린다.
-- ------------------------------------------------------------
create or replace function public.get_user_feed(p_user_id uuid)
returns table (
  id             uuid,
  title          text,
  grid           text,
  theme          text,
  status         text,
  visibility     text,
  cells          jsonb,
  created_at     timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_viewer uuid := auth.uid();
begin
  if v_viewer is null then
    return;
  end if;

  return query
  select
    b.id,
    b.title,
    b.grid,
    b.theme,
    b.status,
    -- 공개범위는 본인에게만 의미가 있다 (피드에서 배지로 표시)
    case when b.user_id = v_viewer then b.visibility else null end as visibility,
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
    ) as cells,
    b.created_at
  from public.bingo_boards b
  where b.user_id = p_user_id
    and b.deleted_at is null
    and public.can_view_board(v_viewer, b.id)
  order by
    (b.status = 'done') asc,
    b.completed_at desc nulls last,
    b.created_at desc;
end;
$$;

comment on function public.get_user_feed is
  'memo / retrospective 는 반환하지 않는다. 정렬은 진행중 먼저, 그다음 완료일 최신순';
