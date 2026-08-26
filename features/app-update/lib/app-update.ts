import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { compareVersion } from '@/lib/compare-version';
import { ANDROID_PACKAGE_NAME, IOS_APP_ID } from '@/constants/store';

/**
 * 설치된 앱 버전. OTA(updates.enabled)가 꺼져 있으므로
 * expoConfig.version 이 곧 스토어에서 받은 바이너리의 버전이다.
 */
export const currentAppVersion = (): string | null => Constants.expoConfig?.version ?? null;

/**
 * 이 버전으로 계속 써도 되는지 서버에 묻는다.
 *
 * 실패하면 무조건 false 를 돌려준다 (fail open).
 * 네트워크 오류·행 없음·버전 문자열 파싱 실패 전부 통과시킨다.
 * 서버가 잠깐 흔들렸다고 앱이 벽돌이 되는 쪽이 훨씬 나쁘다.
 */
export const isUpdateRequired = async (): Promise<boolean> => {
  try {
    const current = currentAppVersion();
    if (!current) return false;

    const { data, error } = await supabase
      .from('app_config')
      .select('min_version')
      .eq('platform', Platform.OS)
      .maybeSingle();

    if (error || !data) return false;

    const result = compareVersion(current, data.min_version as string);
    // null 이면 버전 문자열을 읽을 수 없다는 뜻 -- 막지 않는다
    return result === -1;
  } catch (e) {
    Sentry.captureException(e);
    return false;
  }
};

/** 스토어의 앱 페이지 주소. Android 는 앱이 없을 때를 위한 웹 폴백을 함께 준다 */
export const storeUrls = (): { primary: string; fallback: string } =>
  Platform.OS === 'android'
    ? {
        primary: `market://details?id=${ANDROID_PACKAGE_NAME}`,
        fallback: `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE_NAME}`,
      }
    : {
        primary: `itms-apps://itunes.apple.com/app/id${IOS_APP_ID}`,
        fallback: `https://apps.apple.com/kr/app/id${IOS_APP_ID}`,
      };
