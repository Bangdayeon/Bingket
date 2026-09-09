import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, TextInput as RNTextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text } from '@/components/Text';
import { SearchInput } from '@/components/SearchInput';
import { RecentSearchTag } from '@/features/community/components/RecentSearchTag';
import { PostCard } from '@/features/community/components/PostCard';
import ArrowBackIcon from '@/assets/icons/ic_arrow_back.svg';
import { searchPosts } from '@/features/community/lib/community';
import type { CommunityPost } from '@/types/community';
import Loading from '@/components/Loading';
import { LIMITS } from '@/constants/limits';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import * as Sentry from '@sentry/react-native';

const MAX_RECENT = 10;
const RECENT_SEARCHES_KEY = '@bingket/recent-searches';

const Separator = () => <View className="h-px bg-gray-300  " />;

export default function CommunitySearchScreen() {
  const router = useRouter();
  const inputRef = useRef<RNTextInput>(null);

  const [value, setValue] = useState('');
  const [searches, setSearches] = useState<string[]>([]);
  const [results, setResults] = useState<CommunityPost[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);

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
      setSearchFailed(false);
      try {
        setResults(await searchPosts(trimmed));
      } catch (e) {
        Sentry.captureException(e);
        setResults([]);
        setSearchFailed(true);
      } finally {
        setLoading(false);
      }
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
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      {/* 헤더 — 시안에는 구분선이 없다 */}
      <View className="h-[60px] flex-row items-center gap-3 px-4">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <ArrowBackIcon width={24} height={24} className="text-gray-700" />
        </Pressable>
        <SearchInput
          ref={inputRef}
          autoFocus
          value={value}
          onChangeText={(text) => {
            setValue(text);
            if (!text) setResults(null);
          }}
          onSubmitEditing={() => runSearch(value)}
          returnKeyType="search"
          placeholder="검색어"
          maxLength={LIMITS.searchKeyword}
          className="flex-1"
          onClear={() => {
            setValue('');
            setResults(null);
            inputRef.current?.focus();
          }}
        />
      </View>

      {/* 로딩 */}
      {loading && (
        <View className="flex-1 items-center justify-center">
          <Loading />
        </View>
      )}

      {/* 검색 결과 */}
      {!loading &&
        results !== null &&
        (searchFailed ? (
          <ErrorState message="검색하지 못했어요" onRetry={() => void runSearch(value)} />
        ) : results.length === 0 ? (
          <EmptyState message="검색 결과가 없습니다." />
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
        <View className="px-4 pt-5">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-title-sm font-pretendard-semibold text-gray-900">
              최근 검색어
            </Text>
            {searches.length > 0 && (
              <Pressable onPress={handleDeleteAll} hitSlop={8}>
                <Text className="text-body-md text-gray-800">전체 삭제</Text>
              </Pressable>
            )}
          </View>
          {searches.length === 0 ? (
            <Text className="text-body-sm w-full text-center text-gray-500">
              최근 검색어가 없습니다.
            </Text>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 4, rowGap: 8 }}>
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
