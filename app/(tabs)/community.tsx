import { useCallback, useMemo, useState } from 'react';
import { Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CommunityHeader } from '@/features/community/components/Header';
import { CommunityFilter } from '@/features/community/components/Filter';
import { PostList } from '@/features/community/components/PostList';
import EditIcon from '@/assets/icons/ic_edit.svg';
import { MOCK_COMMUNITY_POSTS } from '@/mocks/community-posts';
import { CommunityPost } from '@/types/community';

const PAGE_SIZE = 10;

const FILTER_TYPES: (CommunityPost['type'] | null)[] = [null, 'bingo', 'achievement', 'free'];

export default function CommunityScreen() {
  const router = useRouter();
  const [filterIndex, setFilterIndex] = useState(0);
  const [page, setPage] = useState(PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(false);

  const filteredAll = useMemo(() => {
    const type = FILTER_TYPES[filterIndex];
    return type === null
      ? MOCK_COMMUNITY_POSTS
      : MOCK_COMMUNITY_POSTS.filter((p) => p.type === type);
  }, [filterIndex]);

  const posts = useMemo(() => filteredAll.slice(0, page), [filteredAll, page]);

  const handleFilterSelect = useCallback((index: number) => {
    setFilterIndex(index);
    setPage(PAGE_SIZE); // 필터 변경 시 페이지 초기화
  }, []);

  const handleLoadMore = useCallback(() => {
    if (isLoading || page >= filteredAll.length) return;
    setIsLoading(true);
    setTimeout(() => {
      setPage((prev) => prev + PAGE_SIZE);
      setIsLoading(false);
    }, 500);
  }, [isLoading, page, filteredAll.length]);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900" edges={['top']}>
      <CommunityHeader />
      <CommunityFilter selectedIndex={filterIndex} onSelect={handleFilterSelect} color="blue" />
      <PostList
        posts={posts}
        onLoadMore={handleLoadMore}
        isLoading={isLoading}
        filterIndex={filterIndex}
      />

      <Pressable
        onPress={() => router.push('/community/write')}
        className="absolute bottom-[104px] right-5 w-10 h-10 rounded-full bg-sky-300 items-center justify-center"
        style={Platform.select({
          ios: {
            shadowColor: '#000000', // black
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.12,
            shadowRadius: 24,
          },
          android: {
            elevation: 16,
          },
        })}
      >
        <EditIcon width={24} height={24} color="#4C5252" /* gray-700 */ />
      </Pressable>
    </SafeAreaView>
  );
}
