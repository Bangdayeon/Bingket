import { TouchableOpacity, Image } from 'react-native';
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
      className="h-12 w-full items-center justify-center rounded-2xl"
    >
      <Image
        source={require('@/assets/icons/mail_logo.png')}
        style={{ width: 18, height: 18 }}
        className="absolute left-4"
        resizeMode="contain"
      />
      <Text
        className="text-label-sm font-pretendard-semibold md:text-label-md"
        style={{ color: 'rgba(0,0,0,0.85)' }} /* 소셜 버튼과 같은 라벨 색 (시안) */
      >
        이메일로 시작하기
      </Text>
    </TouchableOpacity>
  );
}
