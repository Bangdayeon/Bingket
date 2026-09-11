import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import * as Sentry from '@sentry/react-native';
import { supabase } from '@/lib/supabase';
import Loading from '@/components/Loading';
import { ErrorState } from '@/components/ErrorState';
import { useTranslation } from 'react-i18next';

WebBrowser.maybeCompleteAuthSession();

function extractParam(url: string, key: string): string | undefined {
  // fragment (#access_token=...) or query (?access_token=...)
  const fragment = url.split('#')[1] ?? '';
  const query = url.split('?')[1]?.split('#')[0] ?? '';
  const fromFragment = new URLSearchParams(fragment).get(key);
  const fromQuery = new URLSearchParams(query).get(key);
  return fromFragment ?? fromQuery ?? undefined;
}

export default function KakaoCallback() {
  const { t } = useTranslation();

  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const handle = async (url: string | null) => {
      if (!url) return;
      try {
        const access_token = extractParam(url, 'access_token');
        const refresh_token = extractParam(url, 'refresh_token');
        if (!access_token || !refresh_token) {
          setFailed(true);
          return;
        }
        // session setting → _layout.tsx onAuthStateChange(SIGNED_IN) → /(tabs)
        await supabase.auth.setSession({ access_token, refresh_token });
      } catch (e) {
        Sentry.captureException(e);
        setFailed(true);
      }
    };

    // open by deeplink after closing app
    Linking.getInitialURL().then(handle);

    // get deeplink in foreground
    const sub = Linking.addEventListener('url', ({ url }) => handle(url));
    return () => sub.remove();
  }, []);

  if (failed) {
    return (
      <View className="flex-1 bg-surface">
        <ErrorState
          message={`${t('auth.login.loginFailed')} ${t('common.error.retry')}`}
          onRetry={() => router.replace('/(auth)/login')}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Loading />
    </View>
  );
}
