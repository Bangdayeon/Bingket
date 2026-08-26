import * as Sentry from '@sentry/react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking, Modal, View } from 'react-native';
import { Text } from '@/components/Text';
import Button from '@/components/Button';
import { isUpdateRequired, storeUrls } from '@/features/app-update/lib/app-update';

/**
 * 최소 버전 미만이면 앱 위를 통째로 덮는다.
 *
 * Stack 을 조건부로 들어내지 않고 오버레이로 덮는 이유는,
 * expo-router 가 마운트되지 않으면 라우팅 자체가 깨지기 때문이다.
 * 이 컴포넌트는 화면을 차지하지 않으므로 _layout 어디에 두어도 된다.
 */
export function ForceUpdateGate() {
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

    // 앱을 며칠 켜둔 사용자도 잡아야 한다. 포그라운드로 돌아올 때 다시 본다.
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => subscription.remove();
  }, [check]);

  const openStore = async () => {
    const { primary, fallback } = storeUrls();
    try {
      const supported = await Linking.canOpenURL(primary);
      await Linking.openURL(supported ? primary : fallback);
    } catch (e) {
      Sentry.captureException(e);
      await Linking.openURL(fallback).catch(Sentry.captureException);
    }
  };

  return (
    <Modal
      visible={blocked}
      animationType="fade"
      // 하드웨어 백으로 닫히면 게이트가 아니다
      onRequestClose={() => {}}
    >
      <View className="flex-1 bg-white items-center justify-center px-8">
        <Text className="text-title-md font-pretendard-semibold text-center">
          업데이트가 필요해요
        </Text>
        <Text className="text-body-sm text-center mt-3" style={{ color: '#4C5252' /* gray-700 */ }}>
          새 버전으로 업데이트해야{'\n'}계속 사용할 수 있어요
        </Text>
        <Button label="업데이트하러 가기" onClick={openStore} className="w-full mt-8" />
      </View>
    </Modal>
  );
}
