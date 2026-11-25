import { supabase } from '@/lib/supabase';

export async function fetchThemeFavoriteCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase.rpc('theme_favorite_counts');
  if (error) throw error;
  return Object.fromEntries(
    (data ?? []).map((row: { theme_id: string; favorite_count: number }) => [
      row.theme_id,
      Number(row.favorite_count),
    ]),
  );
}

export async function fetchFavoriteThemeIds(): Promise<Set<string>> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new Set();
  const { data, error } = await supabase
    .from('theme_favorites')
    .select('theme_id')
    .eq('user_id', auth.user.id);
  if (error) throw error;
  return new Set((data ?? []).map((row) => row.theme_id));
}

export async function setThemeFavorite(themeId: string, favorite: boolean): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Login required');
  const query = favorite
    ? supabase.from('theme_favorites').insert({ user_id: auth.user.id, theme_id: themeId })
    : supabase.from('theme_favorites').delete().eq('user_id', auth.user.id).eq('theme_id', themeId);
  const { error } = await query;
  if (error) throw error;
}

export async function submitThemeSuggestion(content: string): Promise<void> {
  const trimmed = content.trim();
  if (!trimmed || trimmed.length > 500) throw new Error('Invalid suggestion');
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Login required');
  const { error } = await supabase
    .from('theme_suggestions')
    .insert({ user_id: auth.user.id, content: trimmed });
  if (error) throw error;
}

let pendingTheme: string | null = null;
export function queueAppliedTheme(id: string): void {
  pendingTheme = id;
}
export function takeAppliedTheme(): string | null {
  const id = pendingTheme;
  pendingTheme = null;
  return id;
}
