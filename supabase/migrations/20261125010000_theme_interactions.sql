create table public.theme_suggestions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  content text not null check (char_length(btrim(content)) between 1 and 500),
  created_at timestamptz not null default now()
);
alter table public.theme_suggestions enable row level security;
create policy "theme_suggestions: 본인 작성" on public.theme_suggestions
  for insert to authenticated with check (user_id = auth.uid());

create table public.theme_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  theme_id text not null references public.bingo_themes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, theme_id)
);
alter table public.theme_favorites enable row level security;
create policy "theme_favorites: 본인 조회" on public.theme_favorites for select to authenticated using (user_id = auth.uid());
create policy "theme_favorites: 본인 작성" on public.theme_favorites for insert to authenticated with check (user_id = auth.uid());
create policy "theme_favorites: 본인 삭제" on public.theme_favorites for delete to authenticated using (user_id = auth.uid());
