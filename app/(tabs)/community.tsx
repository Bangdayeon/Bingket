import { useCallback, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { CommunityHeader } from '@/features/community/components/Header';
import { PostList } from '@/features/community/components/PostList';
import EditIcon from '@/assets/icons/ic_edit.svg';
import { CommunityPost } from '@/types/community';
import { fetchPosts, PAGE_SIZE } from '@/features/community/lib/community';

const TAB_BAR_CONTENT_HEIGHT = 72; // icon(36) + label(20) + paddingVertical(8*2)

export default function CommunityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fabBottom = TAB_BAR_CONTENT_HEIGHT + insets.bottom + 16;
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const loadingRef = useRef(false);
  const isFocused = useRef(false); // 현재 포커스 상태

  const loadPosts = useCallback(async (pageNum: number, reset: boolean) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    const fetched = await fetchPosts(pageNum);

    setPosts((prev) => (reset ? fetched : [...prev, ...fetched]));
    setHasMore(fetched.length === PAGE_SIZE);
    setLoading(false);
    loadingRef.current = false;
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
    const fetched = await fetchPosts(0);
    setPosts(fetched);
    setPage(0);
    setHasMore(fetched.length === PAGE_SIZE);
    setRefreshing(false);
  }, []);

  const handleBlock = useCallback((userId: string) => {
    setPosts((prev) => prev.filter((p) => p.userId !== userId));
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-1 md:self-center md:w-full md:max-w-[600px]">
        <CommunityHeader />
        <PostList
          posts={posts}
          onLoadMore={handleLoadMore}
          onRefresh={handleRefresh}
          onBlock={handleBlock}
          isLoading={loading}
          isRefreshing={refreshing}
        />
      </View>
      <Pressable
        onPress={() => router.push('/community/write')}
        style={{ position: 'absolute', bottom: fabBottom, right: 20 }}
        className="shadow-gray-100 w-14 h-14 rounded-full bg-sky-300 items-center justify-center"
      >
        <EditIcon width={32} height={32} color="#4C5252" />
      </Pressable>
    </SafeAreaView>
  );
}
