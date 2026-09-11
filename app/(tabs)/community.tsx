import { useCallback, useRef, useState } from 'react';
import * as Sentry from '@sentry/react-native';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { CommunityHeader } from '@/features/community/components/Header';
import { PostList } from '@/features/community/components/PostList';
import EditIcon from '@/assets/icons/ic_edit.svg';
import { CommunityPost } from '@/types/community';
import { fetchPosts, PAGE_SIZE } from '@/features/community/lib/community';
import { useOnlineRestore } from '@/lib/use-online';

export default function CommunityScreen() {
  const router = useRouter();
  const fabBottom = 16;
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const loadingRef = useRef(false);
  const isFocused = useRef(false);

  const loadPosts = useCallback(async (pageNum: number, reset: boolean) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    try {
      const fetched = await fetchPosts(pageNum);
      setPosts((prev) => (reset ? fetched : [...prev, ...fetched]));
      setHasMore(fetched.length === PAGE_SIZE);
      setLoadFailed(false);
    } catch (e) {
      Sentry.captureException(e);
      if (reset) setPosts([]);
      setLoadFailed(true);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      isFocused.current = true;
      setPage(0);
      setHasMore(true);
      loadPosts(0, true);

      return () => {
        isFocused.current = false;
      };
    }, [loadPosts]),
  );

  const handleLoadMore = useCallback(() => {
    if (!hasMore || loadingRef.current) return;
    const next = page + 1;
    setPage(next);
    loadPosts(next, false);
  }, [hasMore, page, loadPosts]);

  const handleRefresh = useCallback(async () => {
    if (loadingRef.current) return;
    setRefreshing(true);
    try {
      const fetched = await fetchPosts(0);
      setPosts(fetched);
      setPage(0);
      setHasMore(fetched.length === PAGE_SIZE);
      setLoadFailed(false);
    } catch (e) {
      Sentry.captureException(e);
      setLoadFailed(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useOnlineRestore(() => {
    if (loadFailed) loadPosts(0, true);
  });

  const handleBlock = useCallback((userId: string) => {
    setPosts((prev) => prev.filter((p) => p.userId !== userId));
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <View className="flex-1 md:self-center md:w-full md:max-w-[600px]">
        <CommunityHeader />
        <PostList
          posts={posts}
          onLoadMore={handleLoadMore}
          onRefresh={handleRefresh}
          onBlock={handleBlock}
          isLoading={loading}
          isRefreshing={refreshing}
          hasError={loadFailed}
          onRetry={() => loadPosts(0, true)}
        />
      </View>
      <Pressable
        onPress={() => router.push('/community/write')}
        style={{ position: 'absolute', bottom: fabBottom, right: 16 }}
        className="h-[52px] w-[52px] items-center justify-center rounded-full bg-green-400 shadow-gray-100"
      >
        <EditIcon width={36} height={36} className="text-on-brand" />
      </Pressable>
    </SafeAreaView>
  );
}
