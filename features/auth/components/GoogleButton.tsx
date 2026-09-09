import * as Sentry from '@sentry/react-native';
import { supabase } from '@/lib/supabase';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Image, TouchableOpacity } from 'react-native';
import { Text } from '@/components/Text';
import { router } from 'expo-router';
import Loading from '@/components/Loading';

WebBrowser.maybeCompleteAuthSession();

const REDIRECT_URI = makeRedirectUri({ scheme: 'bingket', path: 'auth/callback' });

async function signInWithGoogle(): Promise<void> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: REDIRECT_URI,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    Sentry.captureException(error ?? new Error('[Google] OAuth URL 없음'));
    return;
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, REDIRECT_URI);

  if (result.type !== 'success' || !result.url) return;

  // implicit flow: 토큰이 hash fragment(#)에 포함됨
  const fragment = result.url.split('#')[1] ?? '';
  const params = Object.fromEntries(fragment.split('&').map((p) => p.split('=')));
  const accessToken = params['access_token'];
  const refreshToken = params['refresh_token'];

  if (!accessToken || !refreshToken) {
    Sentry.captureException(new Error('[Google] 토큰 파싱 실패'));
    return;
  }

  const { data: sessionResult, error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (sessionError) {
    Sentry.captureException(sessionError);
    return;
  }

  // public.users 행 보장 — 탈퇴 후 재가입 시 trigger 미작동 대비
  const user = sessionResult.session?.user;
  if (!user) return;

  router.replace('/(tabs)');

  if (user) {
    const username = 'user_' + user.id.replace(/-/g, '').slice(0, 15);
    const rawName =
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      '빙고유저';
    const safeDisplayName =
      rawName.replace(/[^\uAC00-\uD7A3a-zA-Z0-9]/g, '').slice(0, 20) || '빙고유저';
    await supabase
      .from('users')
      .upsert(
        { id: user.id, username, display_name: safeDisplayName },
        { onConflict: 'id', ignoreDuplicates: true },
      );
  }
}

interface GoogleButtonProps {
  requireAgreement: (action: () => Promise<void>) => Promise<void>;
  /** 로그인 실패를 화면이 알린다. 예전에는 눌러도 아무 일이 없는 것처럼 보였다. */
  onError: (message: string) => void;
}

export function GoogleButton({ requireAgreement, onError }: GoogleButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    try {
      await requireAgreement(async () => {
        setLoading(true);
        try {
          await signInWithGoogle();
        } finally {
          setLoading(false);
        }
      });
    } catch (e) {
      Sentry.captureException(e);
      onError(e instanceof Error ? e.message : '로그인에 실패했어요. 잠시 후 다시 시도해주세요.');
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={loading}
      className="h-12 w-full items-center justify-center rounded-2xl border-social-border bg-fixed-white"
      style={{ borderWidth: 0.5 }}
    >
      {loading ? (
        <Loading className="text-fixed-black" />
      ) : (
        <>
          <Image
            source={require('@/assets/icons/google_logo.png')}
            style={{ width: 18, height: 18 }}
            className="absolute left-4"
            resizeMode="contain"
          />
          <Text className="text-label-sm font-pretendard-semibold text-on-social md:text-label-md">
            Google로 시작하기
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
