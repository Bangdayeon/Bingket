import AsyncStorage from '@react-native-async-storage/async-storage';

// 적용은 lib/color-scheme.ts가 한다. 이 파일은 저장/복원만 맡는다.
// 임포트 경로를 바꾸지 않으려고 여기서 그대로 다시 내보낸다.
export { applyAppTheme } from '@/lib/color-scheme';
export type { AppTheme } from '@/lib/color-scheme';

import type { AppTheme } from '@/lib/color-scheme';

export const APP_THEME_STORAGE_KEY = '@bingket/app-theme';

export async function loadAppTheme(): Promise<AppTheme> {
  const saved = await AsyncStorage.getItem(APP_THEME_STORAGE_KEY);
  return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
}

export async function saveAppTheme(theme: AppTheme): Promise<void> {
  await AsyncStorage.setItem(APP_THEME_STORAGE_KEY, theme);
}
