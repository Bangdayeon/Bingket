import { PageHeader } from '@/components/PageHeader';
import { FIXED, useColors } from '@/lib/use-colors';
import { useRouter } from 'expo-router';
import { ImageSourcePropType, Image, Pressable, View } from 'react-native';
import { Text } from '@/components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Modal } from '@/components/Modal';
import { useCallback, useEffect, useState } from 'react';
import * as Sentry from '@sentry/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  fetchLinkedAccounts,
  LinkedAccount,
  resetMyBingos,
  deleteAccount,
} from '@/features/mypage/lib/mypage';
import Loading from '@/components/Loading';
import { ErrorState } from '@/components/ErrorState';
import { AccountVisibilitySelector } from '@/features/mypage/components/AccountVisibilitySelector';
import {
  fetchMyProfileSummary,
  updateAccountVisibility,
  type AccountVisibility,
} from '@/features/profile/lib/profile';
import { useTranslation } from 'react-i18next';

type ProviderConfig = Record<string, { label: string; bgColor: string; logo: ImageSourcePropType }>;

interface RowItemProps {
  label: string;
  onPress: () => void;
}

function RowItem({ label, onPress }: RowItemProps) {
  return (
    <Pressable onPress={onPress} className="h-12 justify-center px-4">
      <Text className="text-body-md text-danger">{label}</Text>
    </Pressable>
  );
}

export default function AccountScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const PROVIDER_CONFIG: ProviderConfig = {
    google: {
      label: 'Google',
      bgColor: FIXED.fixedWhite,
      logo: require('@/assets/icons/google_logo.png'),
    },
    apple: {
      label: 'Apple',
      bgColor: FIXED.fixedBlack,
      logo: require('@/assets/icons/apple_logo.png'),
    },
    kakao: {
      label: t('my.kakaoLabel'),
      bgColor: FIXED.kakao,
      logo: require('@/assets/icons/kakao_logo.png'),
    },
    email: {
      label: t('auth.email'),
      bgColor: FIXED.fixedWhite,
      logo: require('@/assets/icons/mail_logo.png'),
    },
  };

  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSecessionModal, setShowSecessionModal] = useState(false);
  const [showResetDoneModal, setShowResetDoneModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  // An empty list and "not yet loaded" are different states. It used to check
  // accounts.length === 0 for both, so the spinner spun forever when there
  // were no linked accounts.
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsFailed, setAccountsFailed] = useState(false);
  const colors = useColors();

  const loadAccounts = useCallback(() => {
    setAccountsLoading(true);
    setAccountsFailed(false);
    fetchLinkedAccounts()
      .then(setAccounts)
      .catch((e: unknown) => {
        Sentry.captureException(e);
        setAccountsFailed(true);
      })
      .finally(() => setAccountsLoading(false));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAccounts();
  }, [loadAccounts]);

  // null before the fetch resolves, so the selector isn't rendered yet.
  // Rendering a default value first would look like the user already picked it.
  const [visibility, setVisibility] = useState<AccountVisibility | null>(null);

  useEffect(() => {
    void fetchMyProfileSummary()
      .then((summary) => {
        if (summary) setVisibility(summary.accountVisibility);
      })
      .catch(Sentry.captureException);
  }, []);

  const handleVisibilityChange = (next: AccountVisibility) => {
    const previous = visibility;
    // Apply immediately and roll back on failure. There's no save button on
    // this screen, so waiting for the response would make the tab feel frozen.
    setVisibility(next);
    updateAccountVisibility(next).catch((e: unknown) => {
      Sentry.captureException(e);
      setVisibility(previous);
      setErrorMessage(t('my.visibilityChangeFail'));
      setShowErrorModal(true);
    });
  };

  const handleResetBingos = async () => {
    setShowResetModal(false);
    setLoading(true);
    try {
      await resetMyBingos();
      await AsyncStorage.removeItem('@bingket/draft-bingo');
      setShowResetDoneModal(true);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : t('common.error.retry'));
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setShowSecessionModal(false);
    setLoading(true);
    try {
      await deleteAccount();
      // _layout.tsx's onAuthStateChange picks up the SIGNED_OUT event and navigates to login
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : t('common.error.retry'));
      setShowErrorModal(true);
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <PageHeader title={t('settings.accountManagement')} />

      {/* Linked account info */}
      <View className="px-4 pt-6 pb-4">
        <Text className="mb-4 text-caption-md text-gray-500">{t('my.linkedAccountsTitle')}</Text>
        {accountsLoading ? (
          <Loading />
        ) : accountsFailed ? (
          <ErrorState message={t('my.linkedAccountsLoadFail')} onRetry={loadAccounts} />
        ) : accounts.length === 0 ? (
          <Text className="text-body-md text-gray-500">{t('my.noLinkedAccounts')}</Text>
        ) : (
          accounts.map((account) => {
            const cfg = PROVIDER_CONFIG[account.provider];
            return (
              <View key={account.provider} className="flex-row items-center gap-3 mb-3">
                <View
                  className="w-6 h-6 rounded-md items-center justify-center border border-gray-200  "
                  style={{ backgroundColor: cfg?.bgColor ?? colors.gray[200] }}
                >
                  {cfg?.logo && (
                    <Image
                      source={cfg.logo}
                      style={{ width: 14, height: 14 }}
                      resizeMode="contain"
                    />
                  )}
                </View>
                <Text className="text-body-md text-gray-900">{cfg?.label ?? account.provider}</Text>
                {/* Last line of defense against leaking a fake address.
                    Kakao sends the real email here (or the nickname if none). */}
                <Text className="ml-auto shrink text-body-md text-gray-500" numberOfLines={1}>
                  {account.email?.endsWith('@kakao.bingket') ? '' : (account.email ?? '')}
                </Text>
              </View>
            );
          })
        )}
      </View>

      <View className="h-px bg-gray-300" />

      {/* Account visibility — moved here from the profile edit screen.
          There's no separate save button, so it saves as soon as you pick. */}
      <View className="px-4 py-6">
        <Text className="mb-4 text-caption-md text-gray-500">{t('my.accountVisibilityTitle')}</Text>
        {visibility && (
          <AccountVisibilitySelector value={visibility} onChange={handleVisibilityChange} />
        )}
      </View>

      <View className="h-px bg-gray-300" />

      {loading ? (
        <View className="py-6 items-center">
          <Loading />
        </View>
      ) : (
        <>
          <RowItem label={t('my.resetBingos')} onPress={() => setShowResetModal(true)} />
          <RowItem label={t('my.withdraw')} onPress={() => setShowSecessionModal(true)} />
        </>
      )}

      {/* Reset bingos confirmation modal */}
      <Modal
        visible={showResetModal}
        title={t('my.resetConfirmTitle')}
        body={t('my.resetConfirmBody')}
        variant="warning"
        cancelLabel={t('common.cancel')}
        confirmLabel={t('my.resetConfirmButton')}
        onCancel={() => setShowResetModal(false)}
        onConfirm={handleResetBingos}
        onDismiss={() => setShowResetModal(false)}
      />

      {/* Reset bingos done modal */}
      <Modal
        visible={showResetDoneModal}
        title={t('my.resetDoneTitle')}
        body={t('my.resetDoneBody')}
        variant="single"
        confirmLabel={t('common.confirm')}
        onConfirm={() => {
          setShowResetDoneModal(false);
          router.back();
        }}
        onDismiss={() => {
          setShowResetDoneModal(false);
          router.back();
        }}
      />

      {/* Withdraw account modal */}
      <Modal
        visible={showSecessionModal}
        title={t('my.withdrawConfirmTitle')}
        body={t('my.withdrawConfirmBody')}
        variant="warning"
        cancelLabel={t('common.cancel')}
        confirmLabel={t('my.withdrawButton')}
        onCancel={() => setShowSecessionModal(false)}
        onConfirm={handleDeleteAccount}
        onDismiss={() => setShowSecessionModal(false)}
      />

      {/* Error modal */}
      <Modal
        visible={showErrorModal}
        title={t('common.error.general')}
        body={errorMessage}
        variant="single"
        confirmLabel={t('common.confirm')}
        onConfirm={() => setShowErrorModal(false)}
        onDismiss={() => setShowErrorModal(false)}
      />
    </View>
  );
}
