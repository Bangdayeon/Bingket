-- Standalone regression harness for a DISPOSABLE, EMPTY PostgreSQL database.
-- psql -v ON_ERROR_STOP=1 -f supabase/tests/team_cell_rules.sql
begin;
create schema auth;
create function auth.uid() returns uuid language sql as $$
  select nullif(current_setting('test.viewer', true), '')::uuid;
$$;
create table public.team_bingos (id uuid primary key, mode text, owner_id uuid, start_date date, end_date date, status text);
create table public.bingo_boards (id uuid primary key, max_edits int, title text, grid text, theme text);
create table public.team_members (team_id uuid, user_id uuid, board_id uuid, status text);
create table public.bingo_cells (
  id int primary key, board_id uuid, position int, content text,
  edit_count int not null default 0, is_checked boolean default false,
  checked_at timestamptz, completed_by uuid, memo text, memo_updated_by uuid,
  first_checked_at timestamptz
);
create function public.team_of_board(p_id uuid) returns public.team_bingos language sql as $$
  select t.* from public.team_bingos t join public.team_members m on m.team_id = t.id where m.board_id = p_id limit 1;
$$;
\ir ../migrations/20260916000001_per_cell_edit_limits.sql
create trigger trg_enforce_team_cell_rules before update on public.bingo_cells
  for each row execute function public.enforce_team_cell_rules();
select set_config('test.viewer', '00000000-0000-0000-0000-000000000001', true);
insert into public.team_bingos values ('00000000-0000-0000-0000-000000000010', 'competition', auth.uid(), current_date - 1, current_date + 10, 'active');
insert into public.bingo_boards values ('00000000-0000-0000-0000-000000000020', 1, '친구 빙고', '3x3', 'default');
insert into public.team_members values ('00000000-0000-0000-0000-000000000010', auth.uid(), '00000000-0000-0000-0000-000000000020', 'joined');
insert into public.bingo_cells (id, board_id, position, content, edit_count) values
  (1, '00000000-0000-0000-0000-000000000020', 0, 'used', 1),
  (2, '00000000-0000-0000-0000-000000000020', 1, 'unused', 0),
  (3, '00000000-0000-0000-0000-000000000020', 2, 'unused', 0);
-- Another cell's exhausted budget must not block this one.
update public.bingo_cells set content = 'changed', edit_count = 1 where id = 2;
do $$ begin
  begin
    update public.bingo_cells set content = 'over limit', edit_count = 0 where id = 2;
    raise exception 'TEST FAILED: exhausted cell changed';
  exception when raise_exception then
    if sqlerrm <> '수정 가능 횟수를 모두 사용했습니다.' then raise; end if;
  end;
end $$;
-- Count cannot be reset without changing content.
update public.bingo_cells set edit_count = 0 where id = 2;
do $$ begin
  if (select edit_count from public.bingo_cells where id = 2) <> 1 then
    raise exception 'TEST FAILED: count reset';
  end if;
end $$;
update public.bingo_boards set max_edits = 0;
do $$ begin
  begin
    update public.bingo_cells set content = 'blocked' where id = 3;
    raise exception 'TEST FAILED: zero limit allowed an edit';
  exception when raise_exception then
    if sqlerrm <> '수정 가능 횟수를 모두 사용했습니다.' then raise; end if;
  end;
end $$;
update public.bingo_boards set max_edits = -1;
update public.bingo_cells set content = 'unlimited' where id = 2;
update public.bingo_boards set max_edits = 9999;
update public.bingo_cells set content = 'still unlimited' where id = 2;
-- Shared board ownership restriction is preserved.
update public.team_bingos set mode = 'shared';
select set_config('test.viewer', '00000000-0000-0000-0000-000000000002', true);
do $$ begin
  begin
    update public.bingo_cells set content = 'guest edit' where id = 3;
    raise exception 'TEST FAILED: shared guest changed content';
  exception when raise_exception then
    if sqlerrm <> '같이 채우기 빙고의 내용은 방장만 수정할 수 있습니다.' then raise; end if;
  end;
end $$;
rollback;
