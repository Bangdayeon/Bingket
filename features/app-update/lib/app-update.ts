import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { compareVersion } from '@/lib/compare-version';
import { ANDROID_PACKAGE_NAME, IOS_APP_ID } from '@/constants/store';

export const currentAppVersion = (): string | null => Constants.expoConfig?.version ?? null;

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
    return result === -1;
  } catch (e) {
    Sentry.captureException(e);
    return false;
  }
};

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
