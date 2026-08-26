-- ============================================================
-- 팀원 간 memo / retrospective 유출 차단
--
-- 공개범위 작업의 확정 설계는 "타인 빙고 접근은 security definer RPC로만 하고
-- memo / retrospective 는 쿼리에 아예 넣지 않는다" 였는데,
-- 병렬로 진행된 팀 빙고 전환이 그걸 모른 채 팀원 간 조회를 RLS 정책으로 열었다.
--
-- can_access_team_board 에 모드 필터가 없어서 각자 채우기(own/copied)에서도
-- 팀원이 남의 판 행에 접근할 수 있었다. RLS는 행 단위라 접근이 열리면
-- bingo_cells.memo 와 bingo_boards.retrospective 컬럼까지 딸려온다.
-- 컬럼 단위 GRANT로는 막을 수 없다 -- 본인은 자기 memo를 읽어야 하므로
-- 역할 단위 컬럼 권한으로는 "내 것만" 을 표현할 수 없다.
--
-- 같이 채우기(shared)는 다르다. memo_updated_by 컬럼과 '마지막 수정: X님' UI가
-- 있는 것처럼 memo 공동 편집이 의도된 설계다. 그래서 모드별로 나눈다.
--
--   - 팀 현황 / 초대 미리보기용 조회 -> get_team_boards RPC (안전한 컬럼만)
--   - RLS 정책 -> 같이 채우기 모드로 좁혀서 재작성
-- ============================================================


-- ============================================================
-- 1. 헬퍼: 같이 채우기 공유판에만 열린 조회 권한
-- ============================================================
-- can_access_team_board 와 같되 t.mode = 'shared' 를 건다.
-- invited 를 남겨두는 이유는 초대 수락 전 공유판 미리보기 때문.
create or replace function public.can_read_shared_team_board(p_board_id uuid, p_user_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.team_members me
    join public.team_bingos t on t.id = me.team_id
    join public.team_members other on other.team_id = me.team_id
    where me.user_id = p_user_id
      and me.status in ('invited', 'joined')
      and other.board_id = p_board_id
      and t.mode = 'shared'
  );
$$;


-- ============================================================
-- 2. 정책 재작성
-- ============================================================
-- 정책이 함수에 의존하므로 정책을 먼저 내리고 함수를 지운다.
drop policy if exists "bingo_boards: 팀 멤버 조회" on public.bingo_boards;
drop policy if exists "bingo_cells: 팀 멤버 조회"  on public.bingo_cells;

create policy "bingo_boards: 같이 채우기 공유판 조회" on public.bingo_boards
  for select using (
    public.can_read_shared_team_board(id, auth.uid())
  );

create policy "bingo_cells: 같이 채우기 공유판 조회" on public.bingo_cells
  for select using (
    public.can_read_shared_team_board(board_id, auth.uid())
  );

-- 쓰기 정책("bingo_cells: 공유 판 팀 멤버 수정")은 이미 shared 한정이라 그대로 둔다.

-- 이제 참조하는 정책이 없다.
drop function if exists public.can_access_team_board(uuid, uuid);


-- ============================================================
-- 3. 팀 빙고판 배치 조회
-- ============================================================
-- 각자 채우기에서도 팀 현황 화면은 서로의 판을 보여줘야 한다.
-- 그 경로를 RLS 대신 이 함수 하나로 모아, 반환 컬럼을 여기서 통제한다.
-- memo / retrospective 는 select 목록에 없다.
create or replace function public.get_team_boards(p_team_id uuid)
returns table (
  member_id   uuid,
  board_id    uuid,
  title       text,
  grid        text,
  theme       text,
  max_edits   int,
  cells       jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_viewer uuid := auth.uid();
begin
  if v_viewer is null or p_team_id is null then
    return;
  end if;

  -- 이 팀의 멤버(초대 대기 포함)만 볼 수 있다
  if not exists (
    select 1 from public.team_members
    where team_id = p_team_id
      and user_id = v_viewer
      and status in ('invited', 'joined')
  ) then
    return;
  end if;

  return query
  select
    m.user_id,
    b.id,
    b.title,
    b.grid,
    b.theme,
    b.max_edits,
    coalesce(
      (
        select jsonb_agg(
                 jsonb_build_object(
                   'is_checked',       c.is_checked,
                   'position',         c.position,
                   'content',          c.content,
                   'completed_by',     c.completed_by,
                   'first_checked_at', c.first_checked_at
                 )
                 order by c.position
               )
        from public.bingo_cells c
        where c.board_id = b.id
      ),
      '[]'::jsonb
    )
  from public.team_members m
  join public.bingo_boards b on b.id = m.board_id
  where m.team_id = p_team_id
    and m.status in ('invited', 'joined');
end;
$$;

comment on function public.get_team_boards is
  'memo / retrospective 는 반환하지 않는다. 각자 채우기 팀원에게 노출되면 안 된다';


-- ============================================================
-- 4. 실행 권한
-- ============================================================
grant execute on function public.get_team_boards(uuid) to authenticated;

-- can_read_shared_team_board 는 revoke 하지 않는다.
-- RLS 정책은 호출자 권한으로 평가되므로 authenticated 가 EXECUTE 를 잃으면
-- 정책이 걸린 테이블 조회가 통째로 permission denied 로 죽는다.
-- (공개범위 마이그레이션의 헬퍼들은 security definer 함수 안에서만 불려서 revoke 가 가능했다)
-- 기존 can_write_team_board 와 같은 취급이며, 노출되는 것은 boolean 판정뿐이다.
