import { Pressable, View, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/Text';
import SearchIcon from '@/assets/icons/ic_search.svg';

export function CommunityHeader() {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const iconColor = isDark ? '#F6F7F7' /* gray-100 */ : '#4C5252'; /* gray-700 */

  return (
    <View className="h-[60px] flex-row items-center justify-between border-b border-gray-300 dark:border-gray-700 px-4 bg-white dark:bg-gray-900">
      <Text className="text-title-lg">커뮤니티</Text>
      <Pressable hitSlop={8} onPress={() => router.push('/community/search')}>
        <SearchIcon width={24} height={24} color={iconColor} />
      </Pressable>
    </View>
  );
}
