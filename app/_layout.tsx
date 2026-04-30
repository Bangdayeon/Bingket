import '@/global.css';
import * as Sentry from '@sentry/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: !__DEV__,
  tracesSampleRate: 0.2,
});
import { supabase } from '@/lib/supabase';
import { registerForPushNotifications, savePushToken } from '@/lib/push-notifications';
import { router, Stack } from 'expo-router';
import { useEffect } from 'react';
import { Appearance } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
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
          registerForPushNotifications().then((token) => {
            if (token) savePushToken(token);
          });
        })();
      } else if (event === 'INITIAL_SESSION' && session) {
        // 앱 재실행 시 이미 로그인된 경우에도 토큰 갱신
        registerForPushNotifications().then((token) => {
          if (token) savePushToken(token);
        });
      } else if (event === 'SIGNED_OUT') {
        router.replace('/(auth)/login');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

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
        <Stack.Screen name="bingo/battle" options={{ headerShown: false }} />
        <Stack.Screen name="bingo/battle-check" options={{ headerShown: false }} />
        <Stack.Screen name="bingo/battle-select-board" options={{ headerShown: false }} />
        <Stack.Screen name="bingo/battle-status" options={{ headerShown: false }} />
        <Stack.Screen name="bingo/semi-battle-check" options={{ headerShown: false }} />
        <Stack.Screen name="community/search" options={{ headerShown: false }} />
        <Stack.Screen name="community/write" options={{ headerShown: false }} />
        <Stack.Screen name="community/[id]" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
