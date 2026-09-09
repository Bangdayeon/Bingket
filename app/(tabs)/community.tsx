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
  /**
   * 탭바는 absolute가 아니라 화면과 나란한 flex 형제다(BottomTabView가 column으로
   * [화면, 탭바]를 쌓는다). 그래서 이 화면의 bottom: 0 이 이미 탭바 바로 위다.
   * 탭바 높이나 safe-area를 더하면 그만큼 공중에 뜬다 — 실제로 그랬다.
   */
  const fabBottom = 16;
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const loadingRef = useRef(false);
  const isFocused = useRef(false); // 현재 포커스 상태

  const loadPosts = useCallback(async (pageNum: number, reset: boolean) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    // 조회가 throw하면 loadingRef가 true로 잠겨 이후 새로고침·무한스크롤이
    // 통째로 무시된다. 해제는 반드시 finally에서 한다.
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

  // 연결이 돌아오면 실패했던 첫 페이지를 자동으로 다시 받는다.
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
