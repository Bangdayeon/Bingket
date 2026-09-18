import { useEffect, useRef, useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CommunityPost } from '@/types/community';
import { PostCard } from './PostCard';
import Loading from '@/components/Loading';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';

interface PostListProps {
  posts: CommunityPost[];
  onLoadMore: () => void;
  onRefresh: () => void;
  onBlock?: (userId: string) => void;
  isLoading: boolean;
  isRefreshing: boolean;
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
  const { t } = useTranslation();
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
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="transparent"
            colors={['transparent']}
            progressBackgroundColor="transparent"
          />
        }
        contentContainerStyle={
          posts.length === 0 ? { flexGrow: 1, paddingBottom: 68 } : { paddingBottom: 68 }
        }
        ListEmptyComponent={
          isLoading || isRefreshing ? null : hasError ? (
            <ErrorState onRetry={onRetry} />
          ) : (
            <EmptyState message={t('board.post.empty')} />
          )
        }
        ListFooterComponent={
          isLoading ? (
            <View className="pt-5 items-center">
              <Loading />
            </View>
          ) : null
        }
        windowSize={5}
        initialNumToRender={10}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={30}
        removeClippedSubviews
      />
    </View>
  );
}
