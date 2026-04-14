import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, TextInput as RNTextInput, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text } from '@/components/Text';
import { RecentSearchTag } from '@/features/community/components/RecentSearchTag';
import { PostCard } from '@/features/community/components/PostCard';
import ArrowBackIcon from '@/assets/icons/ic_arrow_back.svg';
import SearchIcon from '@/assets/icons/ic_search.svg';
import { searchPosts } from '@/features/community/lib/community';
import type { CommunityPost } from '@/types/community';
import Loading from '@/components/Loading';

const MAX_RECENT = 10;
const RECENT_SEARCHES_KEY = '@bingket/recent-searches';

const Separator = () => <View className="h-px bg-gray-300 dark:bg-gray-700" />;

export default function CommunitySearchScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const iconColor = isDark ? '#F6F7F7' /* gray-100 */ : '#4C5252'; /* gray-700 */
  const inputRef = useRef<RNTextInput>(null);

  const [value, setValue] = useState('');
  const [searches, setSearches] = useState<string[]>([]);
  const [results, setResults] = useState<CommunityPost[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(RECENT_SEARCHES_KEY).then((raw) => {
      if (raw) setSearches(JSON.parse(raw) as string[]);
    });
  }, []);

  const persistSearches = useCallback((list: string[]) => {
    AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(list));
  }, []);

  const runSearch = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;

      // 최근 검색어 맨 앞에 추가 (중복 제거, 최대 10개)
      const updated = [trimmed, ...searches.filter((s) => s !== trimmed)].slice(0, MAX_RECENT);
      setSearches(updated);
      persistSearches(updated);

      setLoading(true);
      const data = await searchPosts(trimmed);
      setResults(data);
      setLoading(false);
    },
    [searches, persistSearches],
  );

  const handleDelete = (label: string) => {
    const updated = searches.filter((s) => s !== label);
    setSearches(updated);
    persistSearches(updated);
  };

  const handleDeleteAll = () => {
    setSearches([]);
    persistSearches([]);
  };

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
            ref={inputRef}
            autoFocus
            value={value}
            onChangeText={(text) => {
              setValue(text);
              if (!text) setResults(null);
            }}
            onSubmitEditing={() => runSearch(value)}
            returnKeyType="search"
            placeholder="글 제목, 내용, 빙고 아이템"
            placeholderTextColor="#929898" /* gray-500 */
            style={{
              flex: 1,
              fontSize: 14,
              lineHeight: 18,
              color: isDark ? '#F6F7F7' /* gray-100 */ : '#181C1C' /* gray-900 */,
            }}
          />
          {value.length > 0 && (
            <Pressable
              hitSlop={8}
              onPress={() => {
                setValue('');
                setResults(null);
                inputRef.current?.focus();
              }}
            >
              <Text style={{ color: '#929898' /* gray-500 */, fontSize: 18, lineHeight: 20 }}>
                ×
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* 로딩 */}
      {loading && (
        <View className="flex-1 items-center justify-center">
          <Loading color="6ADE50" />
        </View>
      )}

      {/* 검색 결과 */}
      {!loading &&
        results !== null &&
        (results.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-body-sm" style={{ color: '#929898' /* gray-500 */ }}>
              검색 결과가 없습니다.
            </Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable onPress={() => router.push(`/community/${item.id}`)}>
                <PostCard post={item} />
              </Pressable>
            )}
            ItemSeparatorComponent={Separator}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        ))}

      {/* 최근 검색어 (검색 전) */}
      {!loading && results === null && (
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
              {searches.map((search) => (
                <RecentSearchTag
                  key={search}
                  label={search}
                  onPress={() => {
                    setValue(search);
                    runSearch(search);
                  }}
                  onDelete={() => handleDelete(search)}
                />
              ))}
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}
