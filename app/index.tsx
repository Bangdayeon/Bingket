import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, View } from 'react-native';
import { Logo } from '@/components/Logo';
import { Text } from '@/components/Text';

export default function SplashScreen() {
  // useRef(...).current는 렌더 중 ref 읽기라 React 규칙 위반이다.
  // useState 초기화 함수도 최초 1회만 실행되므로 값은 그대로 유지된다.
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(async () => {
      // 여기서 throw하면 어떤 라우팅도 일어나지 않아 스플래시에 영영 갇힌다.
      // 세션을 못 읽으면 비로그인으로 보고 로그인 화면으로 보낸다.
      try {
        const [
          {
            data: { session },
          },
          onboardingSeen,
        ] = await Promise.all([
          supabase.auth.getSession(),
          AsyncStorage.getItem('@bingket/onboarding-seen'),
        ]);

        if (session) {
          router.replace('/(tabs)');
        } else if (!onboardingSeen) {
          router.replace('/(auth)/onboarding');
        } else {
          router.replace('/(auth)/login');
        }
      } catch (e) {
        Sentry.captureException(e);
        router.replace('/(auth)/login');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [opacity]);

  return (
    <View className="h-full w-full flex-1 items-center justify-center bg-surface">
      {/* 시안: 로고 150 + 20px 아래 워드마크. 워드마크는 경기천년제목이지만 Pretendard로 대체했다. */}
      <Animated.View style={{ opacity, alignItems: 'center' }}>
        <Logo size={150} />
        <Text
          className="mt-5 font-pretendard-bold text-green-500"
          style={{ fontSize: 48, lineHeight: 48 }}
        >
          빙킷
        </Text>
      </Animated.View>
    </View>
  );
}
