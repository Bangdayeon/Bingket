import { useState } from 'react';
import { Pressable, TextInput as RNTextInput, View } from 'react-native';
import { useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text } from '@/components/Text';
import { RecentSearchTag } from '@/features/community/components/RecentSearchTag';
import { MOCK_RECENT_SEARCHES } from '@/mocks/recent-searches';
import ArrowBackIcon from '@/assets/icons/ic_arrow_back.svg';
import SearchIcon from '@/assets/icons/ic_search.svg';

const MAX_RECENT = 10;

export default function CommunitySearchScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const iconColor = isDark ? '#F6F7F7' /* gray-100 */ : '#4C5252'; /* gray-700 */

  const [searches, setSearches] = useState<string[]>(MOCK_RECENT_SEARCHES);

  const handleDelete = (label: string) => {
    setSearches((prev) => prev.filter((s) => s !== label));
  };

  const handleDeleteAll = () => {
    setSearches([]);
  };

  const visibleSearches = searches.slice(0, MAX_RECENT);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900" edges={['top']}>
      {/* 헤더 */}
      <View className="flex-row items-center h-[60px] px-4 gap-3 border-b border-gray-300 dark:border-gray-700">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <ArrowBackIcon width={24} height={24} color={iconColor} />
        </Pressable>
        <View className="flex-1 flex-row items-center h-10 px-3 rounded-full bg-gray-200 dark:bg-gray-800 gap-2">
          <SearchIcon width={20} height={20} color="#929898" /* gray-500 */ />
          <RNTextInput
            autoFocus
            placeholder="글 제목, 내용, 빙고 아이템"
            placeholderTextColor="#929898" /* gray-500 */
            style={{
              flex: 1,
              fontSize: 14,
              lineHeight: 18,
              color: isDark ? '#F6F7F7' : '#181C1C' /* gray-100 : gray-900 */,
            }}
          />
        </View>
      </View>

      {/* 최근 검색어 */}
      <View className="px-5 pt-5">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-title-sm">최근 검색어</Text>
          {searches.length > 0 && (
            <Pressable onPress={handleDeleteAll} hitSlop={8}>
              <Text className="text-label-sm">전체 삭제</Text>
            </Pressable>
          )}
        </View>
        {searches.length === 0 ? (
          <Text
            className="text-body-sm w-full text-center"
            style={{ color: '#929898' /* gray-500 */ }}
          >
            최근 검색어가 없습니다.
          </Text>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {visibleSearches.map((search) => (
              <RecentSearchTag key={search} label={search} onDelete={() => handleDelete(search)} />
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
