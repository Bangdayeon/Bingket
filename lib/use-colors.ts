import { useColorScheme } from 'nativewind';
import { DARK, FIXED, LIGHT } from '@/constants/color-tokens.cjs';
import type { Palette } from '@/constants/color-tokens';

export { FIXED };
export type { Palette };

/**
 * className으로 색을 줄 수 없는 자리에서 쓴다 —
 * Animated.interpolate의 outputRange, RefreshControl의 colors, BlurView의 tint,
 * Stack.contentStyle 처럼 값을 문자열로 받아야 하는 곳들.
 *
 * 그 외에는 전부 className(bg- / text- / border- 계열)을 쓴다. tailwind가 CSS 변수로
 * 돌려주기 때문에 테마 전환이 저절로 따라온다.
 */
export function useColors(): Palette {
  const { colorScheme } = useColorScheme();
  return colorScheme === 'dark' ? DARK : LIGHT;
}
