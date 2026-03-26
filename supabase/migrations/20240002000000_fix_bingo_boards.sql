-- grid_size(int) → grid(text), start_date 추가, max_edits -1 허용 (무제한)

alter table public.bingo_boards
  add column grid text not null default '3x3',
  add column start_date date;

alter table public.bingo_boards
  drop column grid_size;

alter table public.bingo_boards
  drop constraint bingo_boards_max_edits_check;

alter table public.bingo_boards
  add constraint bingo_boards_max_edits_check check (max_edits >= -1);