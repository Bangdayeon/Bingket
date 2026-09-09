import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import SearchIcon from '@/assets/icons/ic_search.svg';

export function CommunityHeader() {
  const router = useRouter();
  const iconColor = '#4C5252'; /* gray-700 */

  return (
    <View className="h-[60px] flex-row items-center justify-end border-b border-gray-300 bg-surface px-4">
      <Pressable hitSlop={8} onPress={() => router.push('/community/search')}>
        <SearchIcon width={36} height={36} color={iconColor} />
      </Pressable>
    </View>
  );
}
