import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import SearchIcon from '@/assets/icons/ic_search.svg';

export function CommunityHeader() {
  const router = useRouter();

  return (
    <View className="flex-row items-center justify-end">
      <Pressable hitSlop={8} onPress={() => router.push('/community/search')}>
        <SearchIcon width={28} height={28} className="text-gray-700" />
      </Pressable>
    </View>
  );
}
