import { PageHeader } from '@/components/PageHeader';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchMyPosts, MyPost } from '@/features/mypage/lib/mypage';
import Loading from '@/components/Loading';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import * as Sentry from '@sentry/react-native';
import { useTranslation } from 'react-i18next';

function PostItem({ post, onPress }: { post: MyPost; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="px-4 pb-4 pt-4">
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
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setLoadFailed(false);
    fetchMyPosts()
      .then(setPosts)
      .catch((e: unknown) => {
        Sentry.captureException(e);
        setLoadFailed(true);
      })
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(load);

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <PageHeader title={t('settings.post.title')} />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Loading />
        </View>
      ) : loadFailed ? (
        <ErrorState onRetry={load} />
      ) : posts.length === 0 ? (
        <EmptyState
          align="top"
          message={t('settings.post.empty')}
          actionLabel={t('settings.post.emptyBtn')}
          onAction={() => router.replace('/(tabs)/community')}
        />
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
