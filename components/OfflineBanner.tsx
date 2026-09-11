import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsOnline } from '@/lib/use-online';
import { Text } from './Text';
import { useTranslation } from 'react-i18next';

export function OfflineBanner() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const online = useIsOnline();

  if (online) return null;

  return (
    <View
      className="absolute left-0 right-0 top-0 z-50 bg-gray-800 px-4 pb-2"
      style={{ paddingTop: insets.top + 8 }}
    >
      <Text className="text-center text-caption-md text-gray-100">{t('common.offline')}</Text>
    </View>
  );
}
