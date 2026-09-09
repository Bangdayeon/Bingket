import * as Sentry from '@sentry/react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useState } from 'react';
import { Image, Platform, TouchableOpacity } from 'react-native';
import { Text } from '@/components/Text';
import { useResolvedScheme } from '@/lib/color-scheme';
import { FIXED } from '@/lib/use-colors';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import Loading from '@/components/Loading';

async function signInWithApple(): Promise<void> {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) {
    Sentry.captureException(new Error('[Apple] identityToken 없음'));
    return;
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });

  if (error) {
    Sentry.captureException(error);
    return;
  }

  const user = data.session?.user;
  if (!user) return;

  router.replace('/(tabs)');

  // public.users 행 보장 — 탈퇴 후 재가입 시 trigger 미작동 대비
  const username = 'user_' + user.id.replace(/-/g, '').slice(0, 15);
  const fullName = credential.fullName;
  const rawName =
    [fullName?.givenName, fullName?.familyName].filter(Boolean).join(' ') ||
    (user.user_metadata?.full_name as string | undefined) ||
    '빙고유저';
  const safeDisplayName =
    rawName
      .replace(/[^\uAC00-\uD7A3a-zA-Z0-9\s]/g, '')
      .trim()
      .slice(0, 20) || '빙고유저';

  await supabase
    .from('users')
    .upsert(
      { id: user.id, username, display_name: safeDisplayName },
      { onConflict: 'id', ignoreDuplicates: true },
    );
}

interface AppleButtonProps {
  requireAgreement: (action: () => Promise<void>) => Promise<void>;
  /** 로그인 실패를 화면이 알린다. 예전에는 눌러도 아무 일이 없는 것처럼 보였다. */
  onError: (message: string) => void;
}

export function AppleButton({ requireAgreement, onError }: AppleButtonProps) {
  const [loading, setLoading] = useState(false);
  // 버튼 배경이 다크에서 흰색으로 뒤집힌다(bg-fixed-black dark:bg-fixed-white).
  // apple_logo.png는 흰색 단색이라 그대로 두면 다크에서 아이콘이 사라진다.
  const isDark = useResolvedScheme() === 'dark';
  const logoTint = isDark ? FIXED.fixedBlack : FIXED.fixedWhite;

  if (Platform.OS !== 'ios') return null;

  const handlePress = async () => {
    try {
      await requireAgreement(async () => {
        setLoading(true);
        try {
          await signInWithApple();
        } catch (e: unknown) {
          if (
            typeof e === 'object' &&
            e !== null &&
            'code' in e &&
            (e as { code: string }).code === 'ERR_REQUEST_CANCELED'
          ) {
            return;
          }
          Sentry.captureException(e);
          onError(e instanceof Error ? e.message : String(e));
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
      className="h-12 w-full items-center justify-center rounded-2xl border-social-border bg-fixed-black dark:bg-fixed-white"
      style={{ borderWidth: 0.5 }}
    >
      {loading ? (
        <Loading className="text-fixed-white dark:text-fixed-black" />
      ) : (
        <>
          <Image
            source={require('@/assets/icons/apple_logo.png')}
            // 라벨(text-fixed-white dark:text-fixed-black)과 같은 색이어야 한다
            style={{ width: 18, height: 18, tintColor: logoTint }}
            className="absolute left-4"
            resizeMode="contain"
          />
          <Text className="text-label-sm font-pretendard-semibold text-fixed-white dark:text-fixed-black md:text-label-md">
            Apple로 시작하기
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
