import { AppleButton } from '@/features/auth/components/AppleButton';
import { GoogleButton } from '@/features/auth/components/GoogleButton';
import { GuestLoginButton } from '@/features/auth/components/GuestLoginButton';
import { KakaoButton } from '@/features/auth/components/KakaoButton';
import { AgreementModal } from '@/features/auth/components/AgreementModal';
import { useAgreement } from '@/features/auth/use-agreement';
import { useState } from 'react';
import { View } from 'react-native';
import { Toast } from '@/components/Toast';
import { Logo } from '@/components/Logo';
import { Text } from '@/components/Text';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const { requireAgreement, modalVisible, onAgree, onDismiss } = useAgreement();
  // 로그인 실패는 Sentry로만 가고 화면에는 아무 변화가 없었다. 첫 진입 이탈 지점이다.
  const [errorMessage, setErrorMessage] = useState('');

  return (
    <SafeAreaView className="flex-1 items-center bg-surface">
      <View className="flex-1 w-full md:max-w-[480px] items-center justify-center">
        {/* 시안: 로고 150 + 20px 아래 워드마크 */}
        <Logo size={150} />
        <Text
          className="mt-5 font-pretendard-bold text-green-500"
          style={{ fontSize: 48, lineHeight: 48 }}
        >
          빙킷
        </Text>
      </View>

      <View className="w-full gap-3 px-4 pb-9 md:max-w-[480px]">
        <KakaoButton requireAgreement={requireAgreement} onError={setErrorMessage} />
        <AppleButton requireAgreement={requireAgreement} onError={setErrorMessage} />
        <GoogleButton requireAgreement={requireAgreement} onError={setErrorMessage} />
        <GuestLoginButton requireAgreement={requireAgreement} />
      </View>

      <AgreementModal visible={modalVisible} onAgree={onAgree} onDismiss={onDismiss} />
      <Toast
        message={errorMessage}
        visible={!!errorMessage}
        onDismiss={() => setErrorMessage('')}
      />
    </SafeAreaView>
  );
}
