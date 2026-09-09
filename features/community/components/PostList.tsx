import { useEffect, useRef, useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CommunityPost } from '@/types/community';
import { PostCard } from './PostCard';
import Loading from '@/components/Loading';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { supabase } from '@/lib/supabase';

interface PostListProps {
  posts: CommunityPost[];
  onLoadMore: () => void;
  onRefresh: () => void;
  onBlock?: (userId: string) => void;
  isLoading: boolean;
  isRefreshing: boolean;
  /** 조회가 실패했는지. 빈 목록과 구분해서 그려야 한다. */
  hasError?: boolean;
  onRetry?: () => void;
}

const Separator = () => <View className="h-px bg-gray-300" />;

export function PostList({
  posts,
  onLoadMore,
  onRefresh,
  onBlock,
  isLoading,
  isRefreshing,
  hasError = false,
  onRetry,
}: PostListProps) {
  const router = useRouter();
  const flatListRef = useRef<FlatList<CommunityPost>>(null);
  const isNavigatingRef = useRef(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setCurrentUserId(data.session?.user.id ?? null);
    });
  }, []);

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
        <PostCard post={item} currentUserId={currentUserId} onBlock={onBlock} />
      </Pressable>
    ),
    [router, currentUserId, onBlock],
  );

  const keyExtractor = useCallback((item: CommunityPost) => item.id, []);

  return (
    <View className="flex-1">
      {/* ✅ 커스텀 상단 로딩 */}
      {isRefreshing && (
        <View className="absolute top-2 left-0 right-0 items-center z-10">
          <Loading />
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
        contentContainerStyle={
          posts.length === 0 ? { flexGrow: 1, paddingBottom: 120 } : { paddingBottom: 120 }
        }
        // 목록이 비었을 때 백지로 두지 않는다. 에러와 빈 값은 다른 화면을 보여준다.
        ListEmptyComponent={
          isLoading || isRefreshing ? null : hasError ? (
            <ErrorState onRetry={onRetry} />
          ) : (
            <EmptyState message={'아직 게시글이 없어요\n첫 글을 남겨보세요'} />
          )
        }
        // 하단 로딩
        ListFooterComponent={
          isLoading ? (
            <View className="pt-5 items-center">
              <Loading />
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
