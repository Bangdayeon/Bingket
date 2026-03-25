import type { ImageSourcePropType } from 'react-native';
import type { BingoTheme } from '@/types/bingo';
const defaultImages: Record<string, ImageSourcePropType> = {
  '3x3': require('@/assets/bingo_themes/default/default_3x3.png'),
  '4x3': require('@/assets/bingo_themes/default/default_4x3.png'),
  '4x4': require('@/assets/bingo_themes/default/default_4x4.png'),
  check: require('@/assets/bingo_themes/default/default_check.png'),
};
const rabbitImages: Record<string, ImageSourcePropType> = {
  '3x3': require('@/assets/bingo_themes/rabbit/rabbit_3x3.png'),
  '4x3': require('@/assets/bingo_themes/rabbit/rabbit_4x3.png'),
  '4x4': require('@/assets/bingo_themes/rabbit/rabbit_4x4.png'),
  check: require('@/assets/bingo_themes/rabbit/rabbit_check.png'),
};
const red_horseImages: Record<string, ImageSourcePropType> = {
  '3x3': require('@/assets/bingo_themes/red_horse/red_horse_3x3.png'),
  '4x3': require('@/assets/bingo_themes/red_horse/red_horse_4x3.png'),
  '4x4': require('@/assets/bingo_themes/red_horse/red_horse_4x4.png'),
  check: require('@/assets/bingo_themes/red_horse/red_horse_check.png'),
};
const square_catImages: Record<string, ImageSourcePropType> = {
  '3x3': require('@/assets/bingo_themes/square_cat/square_cat_3x3.png'),
  '4x3': require('@/assets/bingo_themes/square_cat/square_cat_4x3.png'),
  '4x4': require('@/assets/bingo_themes/square_cat/square_cat_4x4.png'),
  check: require('@/assets/bingo_themes/square_cat/square_cat_check.png'),
};

// BingoTheme 키와 한국어 표시명 모두 지원
const THEME_IMAGES: Record<string, Record<string, ImageSourcePropType>> = {
  default: defaultImages,
  기본: defaultImages,
  rabbit: rabbitImages,
  토끼: rabbitImages,
  red_horse: red_horseImages,
  붉은말: red_horseImages,
  square_cat: square_catImages,
  고먐미: square_catImages,
};

// 피그마 프레임 기준 (px) — 모든 이미지 동일
export const FIGMA_W = 1080;
export const FIGMA_H = 1440;

// 그리드별 셀/위치 정보 (피그마 px 기준)
export const GRID_CONFIGS: Record<
  string,
  { top: number; left: number; cellW: number; cellH: number; gapX: number; gapY: number }
> = {
  '3x3': { top: 185, left: 40, cellW: 320, cellH: 280, gapX: 20, gapY: 20 },
  '4x3': { top: 185, left: 40, cellW: 233, cellH: 280, gapX: 22, gapY: 14 },
  '4x4': { top: 185, left: 40, cellW: 233, cellH: 212, gapX: 22, gapY: 10 },
};

export function getThemeImage(
  theme: BingoTheme | string,
  grid: string,
): ImageSourcePropType | null {
  return THEME_IMAGES[theme]?.[grid] ?? null;
}
