import AsyncStorage from '@react-native-async-storage/async-storage';
import { colorScheme } from 'nativewind';

export type AppTheme = 'system' | 'light' | 'dark';

export const APP_THEME_STORAGE_KEY = '@bingket/app-theme';

/**
 * 테마를 적용한다.
 *
 * 예전에는 화면과 루트 레이아웃이 각자 `Appearance.setColorScheme`을 부르면서
 * 한쪽은 `null as unknown as ...`, 다른 쪽은 `'unspecified'`를 넘겼다.
 * RN 0.83 타입에는 null이 없다. nativewind의 colorScheme.set은 'system'을 받아
 * 버전별 차이를 라이브러리 쪽에서 처리하므로 여기 한 곳으로 모은다.
 */
export function applyAppTheme(theme: AppTheme): void {
  colorScheme.set(theme);
}

export async function loadAppTheme(): Promise<AppTheme> {
  const saved = await AsyncStorage.getItem(APP_THEME_STORAGE_KEY);
  return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
}

export async function saveAppTheme(theme: AppTheme): Promise<void> {
  await AsyncStorage.setItem(APP_THEME_STORAGE_KEY, theme);
}
