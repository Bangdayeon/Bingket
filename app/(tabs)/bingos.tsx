import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Sentry from '@sentry/react-native';
import { useTranslation } from 'react-i18next';
import { MainHeader } from '@/components/MainHeader';
import { Text } from '@/components/Text';
import { PostList } from '@/features/community/components/PostList';
import { fetchBingosPosts, PAGE_SIZE } from '@/features/community/lib/community';
import type { CommunityPost } from '@/types/community';

export default function BingosScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const first = await fetchBingosPosts(0);
      setPosts(first);
      setPage(0);
      setHasMore(first.length === PAGE_SIZE);
      setLoadFailed(false);
    } catch (error) {
      Sentry.captureException(error);
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);
  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const next = page + 1;
      const fetched = await fetchBingosPosts(next);
      setPosts((previous) => [...previous, ...fetched]);
      setPage(next);
      setHasMore(fetched.length === PAGE_SIZE);
    } catch (error) {
      Sentry.captureException(error);
    } finally {
      setLoading(false);
    }
  };
  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <MainHeader title={t('common.screen.bingos')} />
      <View className="flex-1">
        <PostList
          posts={posts}
          onLoadMore={loadMore}
          onRefresh={refresh}
          isLoading={loading}
          isRefreshing={refreshing}
          hasError={loadFailed}
          onRetry={load}
        />
      </View>
      <Pressable
        onPress={() => router.push('/bingos/write')}
        className="absolute bottom-4 right-4 rounded-full bg-green-400 p-4"
      >
        <Text>+</Text>
      </Pressable>
    </SafeAreaView>
  );
}
