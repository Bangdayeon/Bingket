import { TouchableOpacity } from 'react-native';
import { Text } from '@/components/Text';
import { router } from 'expo-router';

interface GuestLoginButtonProps {
  requireAgreement: (action: () => Promise<void>) => Promise<void>;
}

export function GuestLoginButton({ requireAgreement }: GuestLoginButtonProps) {
  const handlePress = () => {
    void requireAgreement(async () => {
      router.push('/(auth)/email-login');
    });
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="w-full h-14 rounded-xl items-center justify-center"
    >
      <Text className="text-base font-pretendard-semibold md:text-lg">이메일로 시작하기</Text>
    </TouchableOpacity>
  );
}
