import * as Sentry from '@sentry/react-native';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { Text } from '@/components/Text';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

WebBrowser.maybeCompleteAuthSession();

const KAKAO_REST_API_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY ?? '';
const KAKAO_REDIRECT_URI = 'https://ypwrjasfpjhtghiarxvg.supabase.co/functions/v1/kakao-callback';
const APP_REDIRECT_URI = 'bingket://auth/kakao-callback';

async function signInWithKakao(): Promise<void> {
  const kakaoAuthUrl =
    `https://kauth.kakao.com/oauth/authorize` +
    `?client_id=${KAKAO_REST_API_KEY}` +
    `&redirect_uri=${encodeURIComponent(KAKAO_REDIRECT_URI)}` +
    `&response_type=code`;

  const result = await WebBrowser.openAuthSessionAsync(kakaoAuthUrl, APP_REDIRECT_URI);

  if (result.type !== 'success' || !result.url) return;

  // 토큰은 fragment(#)에 포함됨: bingket://auth/kakao-callback#access_token=...
  const fragment = result.url.split('#')[1] ?? '';
  const params = Object.fromEntries(fragment.split('&').map((p) => p.split('=')));
  const accessToken = params['access_token'];
  const refreshToken = params['refresh_token'];

  if (!accessToken || !refreshToken) {
    Sentry.captureException(new Error('[Kakao] 토큰 파싱 실패'));
    return;
  }

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) throw error;

  router.replace('/(tabs)');
}

export function KakaoButton() {
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    setLoading(true);
    try {
      await signInWithKakao();
    } catch (e) {
      Sentry.captureException(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={loading}
      className="w-full h-14 rounded-xl bg-kakao items-center justify-center"
    >
      {loading ? (
        <ActivityIndicator size="small" color="#000" />
      ) : (
        <>
          <Image
            source={require('@/assets/icons/kakao_logo.png')}
            style={{ width: 18, height: 18 }}
            className="absolute left-4"
            resizeMode="contain"
          />
          <Text className="text-base font-semibold">카카오로 시작하기</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
