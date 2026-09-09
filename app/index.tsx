import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { Logo } from '@/components/Logo';
import { Text } from '@/components/Text';

export default function SplashScreen() {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(async () => {
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
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

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
