alter table public.team_bingos
  drop constraint team_bingos_bet_only_competition;

alter table public.team_bingos
  add constraint team_bingos_bet_only_active_modes
  check (mode in ('shared', 'competition') or bet_text is null);

comment on column public.team_bingos.bet_text is
  'Competition wager or shared bingo achievement reward';
