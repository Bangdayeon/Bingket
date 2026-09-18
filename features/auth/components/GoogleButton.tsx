import * as Sentry from '@sentry/react-native';
import { supabase } from '@/lib/supabase';
import { generateUsername } from '../lib/generate-username';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Image, TouchableOpacity } from 'react-native';
import { Text } from '@/components/Text';
import { router } from 'expo-router';
import Loading from '@/components/Loading';
import { useTranslation } from 'react-i18next';

WebBrowser.maybeCompleteAuthSession();

const REDIRECT_URI = makeRedirectUri({
  scheme: 'bingket',
  path: 'auth/callback',
});

async function signInWithGoogle(language: string): Promise<void> {
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

  const user = sessionResult.session?.user;

  if (!user) return;

  const username = generateUsername(language);

  const { error: userError } = await supabase.from('users').upsert(
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

  if (userError) {
    Sentry.captureException(userError);
  }

  router.replace('/(tabs)');
}

interface GoogleButtonProps {
  requireAgreement: (action: () => Promise<void>) => Promise<void>;
  onError: (message: string) => void;
}

export function GoogleButton({ requireAgreement, onError }: GoogleButtonProps) {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    try {
      await requireAgreement(async () => {
        setLoading(true);

        try {
          await signInWithGoogle(i18n.language);
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
            {t('auth.startWith.google')}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
