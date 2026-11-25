import { View } from 'react-native';
import { SubHeader } from '@/components/SubHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SettingsMenu } from '@/features/mypage/SettingsMenu';
import { useTranslation } from 'react-i18next';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <SubHeader title={t('settings.label')} />

      <SettingsMenu />
    </View>
  );
}
