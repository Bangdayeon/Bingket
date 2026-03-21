import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  View,
} from 'react-native';
import { CommunityPost } from '@/types/community';
import { PostCard } from './PostCard';

interface PostListProps {
  posts: CommunityPost[];
  onLoadMore: () => void;
  isLoading: boolean;
  filterIndex: number;
}

export function PostList({ posts, onLoadMore, isLoading, filterIndex }: PostListProps) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [filterIndex]);

  const handleScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 200) {
      onLoadMore();
    }
  };

  return (
    <ScrollView
      ref={scrollRef}
      onScroll={handleScroll}
      scrollEventThrottle={400}
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 120 }}
    >
      {posts.map((post, index) => (
        <View key={post.id}>
          {index > 0 && <View className="h-px bg-gray-300 dark:bg-gray-700" />}
          <PostCard post={post} />
        </View>
      ))}
      {isLoading && <ActivityIndicator className="py-4" color="#929898" />}
    </ScrollView>
  );
}
