import { TouchableOpacity, Image } from 'react-native';
import { Text } from '@/components/Text';
import { useColors } from '@/lib/use-colors';
import { router } from 'expo-router';

interface GuestLoginButtonProps {
  requireAgreement: (action: () => Promise<void>) => Promise<void>;
}

export function GuestLoginButton({ requireAgreement }: GuestLoginButtonProps) {
  // 이 버튼만 배경이 없어 화면 배경 위에 바로 올라간다. 소셜 버튼들과 달리
  // 고정색(on-social)을 쓰면 다크에서 검은 글씨·검은 아이콘이 그대로 묻힌다.
  const colors = useColors();

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
        // mail_logo.png는 #1C1B1F 단색이라 다크에서 배경에 묻힌다. 라벨과 같은 색으로 맞춘다.
        style={{ width: 18, height: 18, tintColor: colors.gray[900] }}
        className="absolute left-4"
        resizeMode="contain"
      />
      <Text className="text-label-sm font-pretendard-semibold text-gray-900 md:text-label-md">
        이메일로 시작하기
      </Text>
    </TouchableOpacity>
  );
}
