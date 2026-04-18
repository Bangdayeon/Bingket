import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { CommunityHeader } from '@/features/community/components/Header';
import { CommunityFilter } from '@/features/community/components/Filter';
import { PostList } from '@/features/community/components/PostList';
import EditIcon from '@/assets/icons/ic_edit.svg';
import { CommunityPost, PostCategory } from '@/types/community';
import { fetchPosts, PAGE_SIZE } from '@/features/community/lib/community';

const FILTER_CATEGORIES: (PostCategory | null)[] = [null, 'bingo_board', 'bingo_achieve', 'free'];

export default function CommunityScreen() {
  const router = useRouter();
  const [filterIndex, setFilterIndex] = useState(0);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const loadingRef = useRef(false);
  const isFocused = useRef(false); // 현재 포커스 상태
  const filterIndexRef = useRef(filterIndex); // 최신 filterIndex를 ref로 추적

  const category = FILTER_CATEGORIES[filterIndex];
  const categoryRef = useRef(category);

  // ref 최신값 유지
  useEffect(() => {
    filterIndexRef.current = filterIndex;
    categoryRef.current = FILTER_CATEGORIES[filterIndex];
  }, [filterIndex]);

  const loadPosts = useCallback(
    async (pageNum: number, cat: PostCategory | null, reset: boolean) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);

      const fetched = await fetchPosts(pageNum, cat);

      setPosts((prev) => (reset ? fetched : [...prev, ...fetched]));
      setHasMore(fetched.length === PAGE_SIZE);
      setLoading(false);
      loadingRef.current = false;
    },
    [],
  );

  // 포커스 진입 시 1회만 호출 (필터 변경은 별도 처리)
  useFocusEffect(
    useCallback(() => {
      isFocused.current = true;
      setPage(0);
      setHasMore(true);
      loadPosts(0, categoryRef.current, true);

      return () => {
        isFocused.current = false;
      };
    }, [loadPosts]), // loadPosts만 의존 → category 변경으로 재실행 안됨
  );

  // 필터 변경 시에만 호출 (포커스 진입은 useFocusEffect가 처리)
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setPage(0);
    setHasMore(true);
    loadPosts(0, category, true);
  }, [filterIndex]); // filterIndex만 의존

  const handleLoadMore = useCallback(() => {
    if (!hasMore || loadingRef.current) return;
    const next = page + 1;
    setPage(next);
    loadPosts(next, categoryRef.current, false);
  }, [hasMore, page, loadPosts]);

  const handleRefresh = useCallback(async () => {
    if (loadingRef.current) return;
    setRefreshing(true);
    const fetched = await fetchPosts(0, categoryRef.current);
    setPosts(fetched);
    setPage(0);
    setHasMore(fetched.length === PAGE_SIZE);
    setRefreshing(false);
  }, [loadPosts]);

  const handleFilterSelect = useCallback((index: number) => {
    setFilterIndex(index);
  }, []);

  const handleBlock = useCallback((userId: string) => {
    setPosts((prev) => prev.filter((p) => p.userId !== userId));
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-1 md:self-center md:w-full md:max-w-[600px]">
        <CommunityHeader />
        <CommunityFilter selectedIndex={filterIndex} onSelect={handleFilterSelect} color="blue" />
        <PostList
          posts={posts}
          onLoadMore={handleLoadMore}
          onRefresh={handleRefresh}
          onBlock={handleBlock}
          isLoading={loading}
          isRefreshing={refreshing}
          filterIndex={filterIndex}
        />
      </View>
      <Pressable
        onPress={() => router.push('/community/write')}
        className="absolute bottom-[104px] shadow-gray-100 right-5 w-14 h-14 rounded-full bg-sky-300 items-center justify-center"
      >
        <EditIcon width={32} height={32} color="#4C5252" />
      </Pressable>
    </SafeAreaView>
  );
}
