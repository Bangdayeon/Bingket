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
import { useTranslation } from 'react-i18next';

const MAX_RECENT = 10;
const RECENT_SEARCHES_KEY = '@bingket/recent-searches';

const Separator = () => <View className="h-px bg-gray-300  " />;

export default function CommunitySearchScreen() {
  const { t } = useTranslation();
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

      // Add to the front of recent searches (dedupe, cap at 10)
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
      {/* Header — no divider in the design */}
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
          placeholder={t('friends.searchPlaceholder')}
          maxLength={LIMITS.searchKeyword}
          className="flex-1"
          onClear={() => {
            setValue('');
            setResults(null);
            inputRef.current?.focus();
          }}
        />
      </View>

      {/* Loading */}
      {loading && (
        <View className="flex-1 items-center justify-center">
          <Loading />
        </View>
      )}

      {/* Search results */}
      {!loading &&
        results !== null &&
        (searchFailed ? (
          <ErrorState message={t('community.searchFailed')} onRetry={() => void runSearch(value)} />
        ) : results.length === 0 ? (
          <EmptyState message={t('common.noSearchResult')} />
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

      {/* Recent searches (before searching) */}
      {!loading && results === null && (
        <View className="px-4 pt-5">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-title-sm font-pretendard-semibold text-gray-900">
              {t('community.recentSearches')}
            </Text>
            {searches.length > 0 && (
              <Pressable onPress={handleDeleteAll} hitSlop={8}>
                <Text className="text-body-md text-gray-800">{t('community.deleteAll')}</Text>
              </Pressable>
            )}
          </View>
          {searches.length === 0 ? (
            <Text className="text-body-sm w-full text-center text-gray-500">
              {t('community.noRecentSearches')}
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
