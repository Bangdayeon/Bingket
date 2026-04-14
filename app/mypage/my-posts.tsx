import IconButton from '@/components/IconButton';
import BackArrowIcon from '@/assets/icons/ic_arrow_back.svg';
import SMSIcon from '@/assets/icons/ic_sms.svg';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View, useColorScheme } from 'react-native';
import { Text } from '@/components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchMyPosts, MyPost } from '@/features/mypage/lib/mypage';
import FavoriteOffIcon from '@/assets/icons/ic_favorite_off.svg';
import Loading from '@/components/Loading';

const CATEGORY_LABEL: Record<MyPost['category'], string> = {
  bingo_board: '빙고판',
  bingo_achieve: '빙고달성',
  free: '자유',
};

function PostItem({ post, onPress }: { post: MyPost; onPress: () => void }) {
  const isDark = useColorScheme() === 'dark';
  const iconColor = isDark ? '#F6F7F7' /* gray-100 */ : '#4C5252'; /* gray-700 */

  return (
    <Pressable onPress={onPress} className="px-5 pt-4 pb-4">
      <View className="flex-row items-center gap-2 mb-2">
        <View className="bg-sky-100 dark:bg-sky-900 rounded-full px-2 py-0.5">
          <Text className="text-caption-sm text-sky-600 dark:text-sky-300">
            {CATEGORY_LABEL[post.category]}
          </Text>
        </View>
        <Text className="text-caption-sm text-gray-500 dark:text-gray-400">{post.createdAt}</Text>
      </View>

      <Text className="text-label-sm mb-1" numberOfLines={1}>
        {post.title}
      </Text>
      <Text className="text-body-sm text-gray-500 dark:text-gray-400" numberOfLines={2}>
        {post.content}
      </Text>

      <View className="flex-row items-center gap-4 mt-3">
        <View className="flex-row items-center gap-1">
          <FavoriteOffIcon width={18} height={18} color={iconColor} />
          <Text className="text-body-sm">{post.likeCount}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <SMSIcon width={18} height={18} color={iconColor} />
          <Text className="text-body-sm">{post.commentCount}</Text>
        </View>
      </View>
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
    <View className="flex-1 bg-white dark:bg-gray-900" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="h-[60px] flex-row items-center px-4 border-b border-gray-300 dark:border-gray-700">
        <IconButton
          variant="ghost"
          size={32}
          icon={<BackArrowIcon width={20} height={20} />}
          onClick={() => router.back()}
        />
        <Text className="flex-1 text-center text-title-sm">게시글</Text>
        <View className="w-8" />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Loading color="6ADE50" />
        </View>
      ) : posts.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-title-md text-gray-400 dark:text-gray-500">
            등록한 게시글이 없어요.
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        >
          {posts.map((post, index) => (
            <View key={post.id}>
              {index > 0 && <View className="h-px bg-gray-200 dark:bg-gray-700" />}
              <PostItem post={post} onPress={() => router.push(`/community/${post.id}`)} />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
