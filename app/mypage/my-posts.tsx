import { PageHeader } from '@/components/PageHeader';
import Button from '@/components/Button';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchMyPosts, MyPost } from '@/features/mypage/lib/mypage';
import Loading from '@/components/Loading';

function PostItem({ post, onPress }: { post: MyPost; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="px-4 pb-4 pt-4">
      {/* 시안: 시각은 제목과 같은 줄 뒤에 붙는다 */}
      <View className="flex-row items-baseline gap-2">
        <Text className="flex-shrink text-body-md text-gray-900" numberOfLines={1}>
          {post.title}
        </Text>
        <Text className="text-caption-sm text-gray-500">{post.createdAt}</Text>
      </View>
      <Text className="mt-1 text-body-sm text-gray-700" numberOfLines={2}>
        {post.content}
      </Text>
    </Pressable>
  );
}

export default function MyPostsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchMyPosts().then((data) => {
        setPosts(data);
        setLoading(false);
      });
    }, []),
  );

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <PageHeader title="게시글" />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Loading />
        </View>
      ) : posts.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-6 px-4">
          <Text className="text-body-md text-gray-500">아직 작성한 글이 없습니다</Text>
          <Button
            label="게시판 둘러보기"
            size="md"
            onClick={() => router.replace('/(tabs)/community')}
            className="px-6"
          />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        >
          {posts.map((post, index) => (
            <View key={post.id}>
              {index > 0 && <View className="h-px bg-gray-300" />}
              <PostItem post={post} onPress={() => router.push(`/community/${post.id}`)} />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
