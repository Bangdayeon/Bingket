import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import * as Sentry from '@sentry/react-native';
import { supabase } from '@/lib/supabase';
import Loading from '@/components/Loading';
import { ErrorState } from '@/components/ErrorState';

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
  // 토큰을 못 받거나 세션 설정이 실패하면 예전에는 스피너만 도는 화면에 갇혔다.
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
        // 세션 설정 → _layout.tsx onAuthStateChange(SIGNED_IN) → /(tabs)
        await supabase.auth.setSession({ access_token, refresh_token });
      } catch (e) {
        Sentry.captureException(e);
        setFailed(true);
      }
    };

    // 앱이 종료 후 딥링크로 열린 경우
    Linking.getInitialURL().then(handle);

    // 앱이 포그라운드인 상태에서 딥링크가 들어온 경우
    const sub = Linking.addEventListener('url', ({ url }) => handle(url));
    return () => sub.remove();
  }, []);

  if (failed) {
    return (
      <View className="flex-1 bg-surface">
        <ErrorState
          message="로그인을 마치지 못했어요"
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
