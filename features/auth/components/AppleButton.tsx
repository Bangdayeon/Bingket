import * as Sentry from '@sentry/react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useState } from 'react';
import { Alert, Image, Platform, TouchableOpacity } from 'react-native';
import { Text } from '@/components/Text';
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
}

export function AppleButton({ requireAgreement }: AppleButtonProps) {
  const [loading, setLoading] = useState(false);

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
          const message = e instanceof Error ? e.message : String(e);
          Alert.alert('Apple 로그인 실패', message);
          Sentry.captureException(e);
        } finally {
          setLoading(false);
        }
      });
    } catch (e) {
      Sentry.captureException(e);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={loading}
      className="w-full h-14 rounded-xl bg-gray-900 dark:bg-white items-center justify-center"
    >
      {loading ? (
        <Loading color="#ffffff" />
      ) : (
        <>
          <Image
            source={require('@/assets/icons/apple_logo.png')}
            style={{ width: 18, height: 18 }}
            className="absolute left-4"
            resizeMode="contain"
          />
          <Text className="text-base font-semibold md:text-lg" style={{ color: '#ffffff' }}>
            Sign in with Apple
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
