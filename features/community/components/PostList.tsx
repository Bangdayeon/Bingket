import { useEffect, useRef, useCallback } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CommunityPost } from '@/types/community';
import { PostCard } from './PostCard';
import Loading from '@/components/Loading';

interface PostListProps {
  posts: CommunityPost[];
  onLoadMore: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  isRefreshing: boolean;
  filterIndex: number;
}

const Separator = () => <View className="h-px bg-gray-300 dark:bg-gray-700" />;

export function PostList({
  posts,
  onLoadMore,
  onRefresh,
  isLoading,
  isRefreshing,
  filterIndex,
}: PostListProps) {
  const router = useRouter();
  const flatListRef = useRef<FlatList<CommunityPost>>(null);
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [filterIndex]);

  const renderItem = useCallback(
    ({ item }: { item: CommunityPost }) => (
      <Pressable
        onPress={() => {
          if (isNavigatingRef.current) return;
          isNavigatingRef.current = true;
          router.push(`/community/${item.id}`);
          setTimeout(() => {
            isNavigatingRef.current = false;
          }, 1000);
        }}
      >
        <PostCard post={item} />
      </Pressable>
    ),
    [router],
  );

  const keyExtractor = useCallback((item: CommunityPost) => item.id, []);

  return (
    <View className="flex-1">
      {/* ✅ 커스텀 상단 로딩 */}
      {isRefreshing && (
        <View className="absolute top-2 left-0 right-0 items-center z-10">
          <Loading color="#6ADE50" />
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={posts}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ItemSeparatorComponent={Separator}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        // gesture 유지 + 기본 spinner 숨김
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="transparent" // iOS spinner 숨김
            colors={['transparent']} // Android spinner 숨김
            progressBackgroundColor="transparent"
          />
        }
        contentContainerStyle={{ paddingBottom: 120 }}
        // 하단 로딩
        ListFooterComponent={
          isLoading ? (
            <View className="pt-5 items-center">
              <Loading color="#6ADE50" />
            </View>
          ) : null
        }
        // ── 성능 ─────────────────────────
        windowSize={5}
        initialNumToRender={10}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={30}
        removeClippedSubviews
      />
    </View>
  );
}
