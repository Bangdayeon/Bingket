import '@/global.css';
import * as Sentry from '@sentry/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { hasConsent, loadConsent } from '@/lib/consent';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: !__DEV__,
  tracesSampleRate: 0.2,
  /**
   * 개인정보 수집·이용에 동의하기 전에는 이벤트를 버린다.
   *
   * init 자체를 뒤로 미루지 않는 이유는, 그러면 동의 이후 다시 init해야 하고 그 사이
   * 네이티브 크래시 핸들러도 붙지 않기 때문이다. 여기서 걸러내면 전송만 막히고
   * 동의 즉시 별도 처리 없이 반영된다.
   */
  beforeSend: (event) => (hasConsent() ? event : null),
});
import { supabase } from '@/lib/supabase';
import { addNotificationTapListener, syncPushToken } from '@/lib/push-notifications';
import { applyAnalyticsConsent, logScreenView } from '@/lib/analytics';
import { router, Stack, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ForceUpdateGate } from '@/features/app-update/ForceUpdateGate';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Pretendard-Regular': require('../assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-Medium': require('../assets/fonts/Pretendard-Medium.otf'),
    'Pretendard-SemiBold': require('../assets/fonts/Pretendard-SemiBold.otf'),
    'Pretendard-Bold': require('../assets/fonts/Pretendard-Bold.otf'),
    'Pretendard-ExtraBold': require('../assets/fonts/Pretendard-ExtraBold.otf'),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  // 동의 여부를 읽기 전에는 텔레메트리 게이트가 기본값(미동의)이므로, 읽기가 끝나야
  // 화면 조회 로깅을 시작한다.
  const [consentLoaded, setConsentLoaded] = useState(false);
  useEffect(() => {
    void loadConsent().then(() => {
      setConsentLoaded(true);
      // 분석 수집 실패가 앱을 멈추게 해서는 안 된다.
      void applyAnalyticsConsent().catch(() => {});
    });
  }, []);

  useEffect(() => {
    AsyncStorage.getItem('@bingket/app-theme').then((saved) => {
      if (saved === 'light' || saved === 'dark') {
        Appearance.setColorScheme(saved);
      } else {
        Appearance.setColorScheme('unspecified');
      }
    });
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const user = session.user;
        void (async () => {
          // re-signup 또는 trigger 미작동 대비: public.users 행 보장
          const rawName = (user.user_metadata?.name as string | undefined) ?? '';
          const displayName =
            rawName.replace(/[^\u{AC00}-\u{D7A3}a-zA-Z0-9]/gu, '').slice(0, 20) || '빙고유저';
          const username = `user_${user.id.replace(/-/g, '').slice(0, 15)}`;
          await supabase
            .from('users')
            .upsert(
              { id: user.id, username, display_name: displayName },
              { onConflict: 'id', ignoreDuplicates: true },
            );
          router.replace('/(tabs)');
          void syncPushToken().catch(Sentry.captureException);
        })();
      } else if (event === 'INITIAL_SESSION' && session) {
        // 앱 재실행 시 이미 로그인된 경우에도 토큰 갱신
        void syncPushToken().catch(Sentry.captureException);
      } else if (event === 'SIGNED_OUT') {
        router.replace('/(auth)/login');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // 푸시 알림 탭 → 화면 이동
  useEffect(() => addNotificationTapListener(), []);

  const segments = useSegments();
  useEffect(() => {
    if (!consentLoaded) return;
    void logScreenView(segments.join('/') || 'index').catch(Sentry.captureException);
  }, [segments, consentLoaded]);

  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/email-login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="bingo/add" options={{ headerShown: false }} />
        <Stack.Screen name="bingo/modify" options={{ headerShown: false }} />
        <Stack.Screen name="bingo/view" options={{ headerShown: false }} />
        <Stack.Screen name="mypage/profile-edit" options={{ headerShown: false }} />
        <Stack.Screen name="mypage/account" options={{ headerShown: false }} />
        <Stack.Screen name="mypage/alert-setting" options={{ headerShown: false }} />
        <Stack.Screen name="mypage/app-theme" options={{ headerShown: false }} />
        <Stack.Screen name="mypage/my-posts" options={{ headerShown: false }} />
        <Stack.Screen name="mypage/friend-list" options={{ headerShown: false }} />
        <Stack.Screen name="mypage/settings" options={{ headerShown: false }} />
        <Stack.Screen name="profile/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="bingo/friend-view" options={{ headerShown: false }} />
        <Stack.Screen name="bingo/team-mode" options={{ headerShown: false }} />
        <Stack.Screen name="bingo/team-create" options={{ headerShown: false }} />
        <Stack.Screen name="bingo/team-invite" options={{ headerShown: false }} />
        <Stack.Screen name="bingo/team-status" options={{ headerShown: false }} />
        <Stack.Screen name="community/search" options={{ headerShown: false }} />
        <Stack.Screen name="community/write" options={{ headerShown: false }} />
        <Stack.Screen name="community/[id]" options={{ headerShown: false }} />
      </Stack>
      <ForceUpdateGate />
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(RootLayout);
