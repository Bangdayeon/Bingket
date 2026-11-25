import { FIXED } from '@/lib/use-colors';
import { supabase } from '@/lib/supabase';
import { GridType } from '@/types/bingo-cell';

export interface BingoThemeConfig {
  id: string;
  displayName: string;
  names: Record<string, string>;
  sortOrder: number;
  images: {
    '3x3': string;
    '4x3': string;
    '4x4': string;
    check: string;
  };
  foregroundColor: string;
}

let themeCache: Record<string, BingoThemeConfig> | null = null;

export const FIGMA_W = 1080;
export const FIGMA_H = 1440;

export const GRID_CONFIGS: Record<
  string,
  { top: number; left: number; cellW: number; cellH: number; gapX: number; gapY: number }
> = {
  '3x3': { top: 185, left: 40, cellW: 320, cellH: 280, gapX: 20, gapY: 20 },
  '4x3': { top: 185, left: 40, cellW: 233, cellH: 280, gapX: 22, gapY: 14 },
  '4x4': { top: 185, left: 40, cellW: 233, cellH: 212, gapX: 22, gapY: 10 },
};

export async function fetchThemes(refresh = false): Promise<Record<string, BingoThemeConfig>> {
  if (themeCache && !refresh) return themeCache;

  const { data, error } = await supabase
    .from('bingo_themes')
    .select(
      'id, display_name, names, sort_order, grid_3x3_url, grid_4x3_url, grid_4x4_url, check_url, foreground_color',
    )
    .order('sort_order')
    .order('id');
  if (error) return themeCache ?? {};

  const map: Record<string, BingoThemeConfig> = {};

  for (const row of data ?? []) {
    const config: BingoThemeConfig = {
      id: row.id,
      displayName: row.display_name,
      names: row.names ?? {},
      sortOrder: row.sort_order,
      images: {
        '3x3': row.grid_3x3_url,
        '4x3': row.grid_4x3_url,
        '4x4': row.grid_4x4_url,
        check: row.check_url,
      },
      foregroundColor: row.foreground_color,
    };

    map[row.id] = config;
    map[row.display_name] = config;
  }

  themeCache = map;
  return map;
}

export function getThemeName(theme: BingoThemeConfig, locale: string): string {
  return theme.names[locale] ?? theme.names.en ?? theme.names.ko ?? theme.displayName ?? theme.id;
}

export async function getThemeImageUrl(theme: string, grid: GridType): Promise<string | null> {
  const themes = await fetchThemes();
  return themes[theme]?.images?.[grid] ?? null;
}

export async function getThemeForegroundColor(theme: string): Promise<string> {
  const themes = await fetchThemes();
  return themes[theme]?.foregroundColor ?? FIXED.boardForeground;
}
