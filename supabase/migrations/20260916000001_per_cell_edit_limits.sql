-- 생성 UI의 "각 항목 수정 가능 횟수"와 서버 규칙을 일치시킨다.
-- 기존 max_edits 및 각 칸의 edit_count는 그대로 보존한다.
comment on column public.bingo_boards.max_edits is
  '각 빙고 칸의 수정 가능 횟수. 0이면 수정 불가, -1 또는 9999면 무제한';
comment on column public.bingo_cells.edit_count is
  '해당 칸의 수정 횟수. board의 max_edits와 칸별로 비교한다';

create or replace function public.enforce_team_cell_rules()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_team       public.team_bingos;
  v_max_edits  int;
  v_today      date := (now() at time zone 'Asia/Seoul')::date;
  v_uid        uuid := auth.uid();
begin
  v_team := public.team_of_board(new.board_id);

  -- 개인 빙고는 기존 동작 그대로
  if v_team.id is null then
    return new;
  end if;

  select max_edits into v_max_edits
    from public.bingo_boards where id = new.board_id;

  -- ---- 칸 내용 수정 ----
  if new.content is distinct from old.content then
    if old.is_checked then
      raise exception '이미 완료한 칸의 내용은 수정할 수 없습니다.';
    end if;

    if v_team.mode = 'shared' and v_uid <> v_team.owner_id then
      raise exception '같이 채우기 빙고의 내용은 방장만 수정할 수 있습니다.';
    end if;

    -- 칸별 예산. 다른 칸의 사용량 때문에 이 칸을 잠그지 않는다.
    -- 클라이언트가 카운터를 생략하거나 낮춰 보내도 내용 변경은 최소 1회 사용한다.
    new.edit_count := greatest(old.edit_count + 1, new.edit_count);
    if v_max_edits not in (-1, 9999) and new.edit_count > v_max_edits then
      raise exception '수정 가능 횟수를 모두 사용했습니다.';
    end if;
  end if;

  -- 내용 변경 없이 수정 횟수만 낮추는 우회를 막는다.
  new.edit_count := greatest(old.edit_count, new.edit_count);

  -- ---- 체크 ----
  if new.is_checked and not old.is_checked then
    if v_today < v_team.start_date then
      raise exception '아직 시작하지 않은 팀 빙고입니다.';
    end if;
    if v_team.status = 'completed' then
      raise exception '이미 종료된 팀 빙고입니다.';
    end if;
    new.completed_by := coalesce(new.completed_by, v_uid);
  end if;

  -- ---- 체크 해제: 채운 본인만 ----
  if old.is_checked and not new.is_checked then
    if old.completed_by is not null and old.completed_by <> v_uid then
      raise exception '다른 사람이 채운 칸은 해제할 수 없습니다.';
    end if;
    new.completed_by := null;
  end if;

  -- ---- 완료 날짜는 진행 기간 안에서만 ----
  if new.checked_at is not null then
    if (new.checked_at at time zone 'Asia/Seoul')::date < v_team.start_date
       or (new.checked_at at time zone 'Asia/Seoul')::date > v_team.end_date then
      raise exception '팀 빙고는 진행 기간 안의 날짜만 선택할 수 있습니다.';
    end if;
  end if;

  -- ---- 메모는 전원 편집 가능, 마지막 수정자를 남긴다 ----
  if new.memo is distinct from old.memo then
    new.memo_updated_by := v_uid;
  end if;

  return new;
end;
$$;
