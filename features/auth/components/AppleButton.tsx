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
import { useTranslation } from 'react-i18next';
import { generateUsername } from '../lib/generate-username';

async function signInWithApple(language: string): Promise<void> {
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

  const username = generateUsername(language);

  await supabase.from('users').upsert(
    {
      id: user.id,
      username,
      display_name: username,
    },
    {
      onConflict: 'id',
      ignoreDuplicates: true,
    },
  );

  router.replace('/(tabs)');
}

interface AppleButtonProps {
  requireAgreement: (action: () => Promise<void>) => Promise<void>;
  onError: (message: string) => void;
}

export function AppleButton({ requireAgreement, onError }: AppleButtonProps) {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const isDark = useResolvedScheme() === 'dark';
  const logoTint = isDark ? FIXED.fixedBlack : FIXED.fixedWhite;

  if (Platform.OS !== 'ios') return null;

  const handlePress = async () => {
    try {
      await requireAgreement(async () => {
        setLoading(true);
        try {
          await signInWithApple(i18n.language);
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
      onError(
        e instanceof Error ? e.message : `${t('auth.login.failed')} ${t('common.error.retry')}`,
      );
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
            style={{ width: 18, height: 18, tintColor: logoTint }}
            className="absolute left-4"
            resizeMode="contain"
          />
          <Text className="text-label-sm font-pretendard-semibold text-fixed-white dark:text-fixed-black md:text-label-md">
            {t('auth.startWith.apple')}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
