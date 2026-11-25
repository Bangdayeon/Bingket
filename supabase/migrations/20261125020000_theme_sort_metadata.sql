alter table public.bingo_themes add column updated_at timestamptz not null default now();

create function public.set_bingo_theme_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger bingo_themes_updated_at
before update on public.bingo_themes
for each row execute function public.set_bingo_theme_updated_at();

create function public.theme_favorite_counts()
returns table(theme_id text, favorite_count bigint)
language sql stable security definer set search_path = '' as $$
  select f.theme_id, count(*)::bigint
  from public.theme_favorites f
  join public.bingo_themes t on t.id = f.theme_id
  where t.is_active
  group by f.theme_id;
$$;

revoke all on function public.theme_favorite_counts() from public;
grant execute on function public.theme_favorite_counts() to authenticated;
