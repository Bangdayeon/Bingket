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
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const { requireAgreement, modalVisible, onAgree, onDismiss } = useAgreement();
  // login fail sent only to Sentry, and now it's fist exit point
  const [errorMessage, setErrorMessage] = useState('');

  return (
    <SafeAreaView className="flex-1 items-center bg-surface">
      <View className="flex-1 w-full md:max-w-[480px] items-center justify-center">
        <Logo size={150} />
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
