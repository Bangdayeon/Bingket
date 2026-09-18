import * as Sentry from '@sentry/react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking, Modal, View } from 'react-native';
import { Text } from '@/components/Text';
import Button from '@/components/Button';
import { isUpdateRequired, storeUrls } from '@/features/app-update/lib/app-update';
import { useTranslation } from 'react-i18next';

export function ForceUpdateGate() {
  const { t } = useTranslation();
  const [blocked, setBlocked] = useState(false);
  const checkingRef = useRef(false);

  const check = useCallback(() => {
    if (checkingRef.current) return;
    checkingRef.current = true;
    isUpdateRequired()
      .then(setBlocked)
      .catch(Sentry.captureException)
      .finally(() => {
        checkingRef.current = false;
      });
  }, []);

  useEffect(() => {
    check();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => subscription.remove();
  }, [check]);

  const openStore = async () => {
    const { primary, fallback } = storeUrls();
    try {
      await Linking.openURL(primary);
    } catch (e) {
      Sentry.captureException(e);
      await Linking.openURL(fallback).catch(Sentry.captureException);
    }
  };

  return (
    <Modal visible={blocked} animationType="fade" onRequestClose={() => {}}>
      <View className="flex-1 bg-white items-center justify-center px-8">
        <Text className="text-title-md font-pretendard-semibold text-center">
          {t('update.title')}
        </Text>
        <Text className="text-body-sm text-center mt-3 text-gray-700">
          {t('update.description')}
        </Text>
        <Button label={t('update.button')} onClick={openStore} className="w-full mt-8" />
      </View>
    </Modal>
  );
}
