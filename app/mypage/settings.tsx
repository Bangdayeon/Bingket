import { View } from 'react-native';
import { PageHeader } from '@/components/PageHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SettingsMenu } from '@/features/mypage/SettingsMenu';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <PageHeader title="설정" />

      <SettingsMenu />
    </View>
  );
}
