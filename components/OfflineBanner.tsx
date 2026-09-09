import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsOnline } from '@/lib/use-online';
import { Text } from './Text';

/**
 * 연결이 끊긴 동안 화면 맨 위에 걸리는 띠.
 * 이게 없으면 오프라인이 "빈 목록"이나 "불러오지 못했어요"로만 보여서
 * 사용자가 원인을 알 수 없다.
 */
export function OfflineBanner() {
  const insets = useSafeAreaInsets();
  const online = useIsOnline();

  if (online) return null;

  return (
    <View
      className="absolute left-0 right-0 top-0 z-50 bg-gray-800 px-4 pb-2"
      style={{ paddingTop: insets.top + 8 }}
    >
      <Text className="text-center text-caption-md text-gray-100">
        오프라인이에요 · 연결되면 자동으로 새로고침돼요
      </Text>
    </View>
  );
}
