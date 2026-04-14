import { useEffect } from 'react';
import { View } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import * as Sentry from '@sentry/react-native';
import { supabase } from '@/lib/supabase';
import Loading from '@/components/Loading';

WebBrowser.maybeCompleteAuthSession();

function extractParam(url: string, key: string): string | undefined {
  // fragment (#access_token=...) 또는 query (?access_token=...) 모두 대응
  const fragment = url.split('#')[1] ?? '';
  const query = url.split('?')[1]?.split('#')[0] ?? '';
  const fromFragment = new URLSearchParams(fragment).get(key);
  const fromQuery = new URLSearchParams(query).get(key);
  return fromFragment ?? fromQuery ?? undefined;
}

export default function KakaoCallback() {
  useEffect(() => {
    const handle = async (url: string | null) => {
      if (!url) return;
      try {
        const access_token = extractParam(url, 'access_token');
        const refresh_token = extractParam(url, 'refresh_token');
        if (!access_token || !refresh_token) return;
        // 세션 설정 → _layout.tsx onAuthStateChange(SIGNED_IN) → /(tabs)
        await supabase.auth.setSession({ access_token, refresh_token });
      } catch (e) {
        Sentry.captureException(e);
      }
    };

    // 앱이 종료 후 딥링크로 열린 경우
    Linking.getInitialURL().then(handle);

    // 앱이 포그라운드인 상태에서 딥링크가 들어온 경우
    const sub = Linking.addEventListener('url', ({ url }) => handle(url));
    return () => sub.remove();
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
      <Loading color="6ADE50" />
    </View>
  );
}
