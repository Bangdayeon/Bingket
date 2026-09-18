import { TouchableOpacity, Image } from 'react-native';
import { Text } from '@/components/Text';
import { useColors } from '@/lib/use-colors';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

interface GuestLoginButtonProps {
  requireAgreement: (action: () => Promise<void>) => Promise<void>;
}

export function GuestLoginButton({ requireAgreement }: GuestLoginButtonProps) {
  const { t } = useTranslation();
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
        style={{ width: 18, height: 18, tintColor: colors.gray[900] }}
        className="absolute left-4"
        resizeMode="contain"
      />
      <Text className="text-label-sm font-pretendard-semibold text-gray-900 md:text-label-md">
        {t('auth.startWith.email')}
      </Text>
    </TouchableOpacity>
  );
}
