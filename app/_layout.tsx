import '@/global.css';
// SVG 아이콘이 className으로 색을 받게 하는 등록. import만으로 동작한다.
import '@/lib/svg-interop';
import * as Sentry from '@sentry/react-native';
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
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { applyAppTheme, loadAppTheme } from '@/lib/app-theme';
import { useColors } from '@/lib/use-colors';
import { useResolvedScheme } from '@/lib/color-scheme';
import { ForceUpdateGate } from '@/features/app-update/ForceUpdateGate';
import { CoachMarkHost } from '@/features/coachmark/CoachMarkHost';
import { PortalHost } from '@/components/PortalHost';
import { OfflineBanner } from '@/components/OfflineBanner';
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

  // 저장된 테마를 적용하기 전에 첫 프레임이 나가면 OS 테마로 그려졌다가 뒤집힌다.
  // 스플래시를 테마까지 읽은 뒤에 내린다.
  const [themeLoaded, setThemeLoaded] = useState(false);

  useEffect(() => {
    if (fontsLoaded && themeLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded, themeLoaded]);

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
    // 읽기가 실패해도 스플래시에 갇히면 안 된다. 그때는 기본값(시스템)으로 간다.
    void loadAppTheme()
      .then(applyAppTheme)
      .finally(() => setThemeLoaded(true));
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

  const scheme = useResolvedScheme();
  const colors = useColors();
  // 화면 전환 애니메이션 중 react-navigation의 기본 흰 배경이 비치지 않게 한다.
  const navigationTheme = {
    ...(scheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(scheme === 'dark' ? DarkTheme : DefaultTheme).colors,
      background: colors.surface,
      card: colors.white,
      text: colors.gray[900],
      border: colors.gray[300],
      primary: colors.green[500],
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <SafeAreaProvider>
        {/* style="auto"는 RN의 useColorScheme을 읽는데, 그 값이 오염되면
            상태바만 반대로 뒤집힌다. 우리가 정한 값에서 직접 파생시킨다. */}
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.surface },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)/login" />
          <Stack.Screen name="(auth)/onboarding" />
          <Stack.Screen name="(auth)/email-login" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="bingo/add" />
          <Stack.Screen name="bingo/modify" />
          <Stack.Screen name="bingo/view" />
          <Stack.Screen name="mypage/profile-edit" />
          <Stack.Screen name="mypage/account" />
          <Stack.Screen name="mypage/alert-setting" />
          <Stack.Screen name="mypage/app-theme" />
          <Stack.Screen name="mypage/my-posts" />
          <Stack.Screen name="mypage/friend-list" />
          <Stack.Screen name="mypage/settings" />
          <Stack.Screen name="profile/[id]" />
          <Stack.Screen name="bingo/friend-view" />
          <Stack.Screen name="bingo/team-mode" />
          <Stack.Screen name="bingo/team-create" />
          <Stack.Screen name="bingo/team-invite" />
          <Stack.Screen name="bingo/team-status" />
          <Stack.Screen name="community/search" />
          <Stack.Screen name="community/write" />
          <Stack.Screen name="community/[id]" />
        </Stack>
        <OfflineBanner />
        <ForceUpdateGate />
        <CoachMarkHost />
        {/* 다이얼로그 오버레이가 Stack 위에 그려지도록 마지막에 둔다 */}
        <PortalHost />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

export default Sentry.wrap(RootLayout);
