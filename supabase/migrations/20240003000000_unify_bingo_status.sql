-- bingo_boards.status: 'active' → 'progress', 'completed' → 'done'
-- 앱의 BingoState('progress' | 'done')와 통일

alter table public.bingo_boards drop constraint bingo_boards_status_check;

update public.bingo_boards set status = 'progress' where status = 'active';
update public.bingo_boards set status = 'done'     where status = 'completed';

alter table public.bingo_boards
  alter column status set default 'progress';

alter table public.bingo_boards
  add constraint bingo_boards_status_check check (status in ('progress', 'done'));