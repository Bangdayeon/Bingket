import { View, useColorScheme } from 'react-native';
import { Text } from '@/components/Text';
import SMSIcon from '@/assets/icons/ic_sms.svg';
import { CommunityPost } from '@/types/community';
import { LikeButton } from './LikeButton';

const ICON_SIZE = 20;

interface PostCardProps {
  post: CommunityPost;
}

function Avatar() {
  return <View className="w-[30px] h-[30px] rounded-full bg-gray-300 border border-gray-300" />;
}

function BingoGridPreview({ items }: { items: string[][] }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 }}>
      {items.flat().map((text, i) => (
        <View
          key={i}
          style={{
            width: '31.3%',
            height: 72,
            borderRadius: 4,
            borderWidth: 1,
            borderColor: '#D2D6D6' /* gray-300 */,
            backgroundColor: '#FDFDFD' /* white */,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 4,
          }}
        >
          <Text className="text-body-sm text-center" numberOfLines={2}>
            {text}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function PostCard({ post }: PostCardProps) {
  const isDark = useColorScheme() === 'dark';
  const iconColor = isDark ? '#F6F7F7' /* gray-100 */ : '#4C5252'; /* gray-700 */

  return (
    <View className="px-5 pt-4 pb-4">
      <View className="flex-row items-center gap-2">
        <Avatar />
        <Text className="text-label-sm">{post.author}</Text>
        <Text className="text-caption-sm" style={{ color: '#181C1C' /* gray-900 */ }}>
          •
        </Text>
        <Text className="text-caption-sm" style={{ color: '#929898' /* gray-500 */ }}>
          {post.timeAgo}
        </Text>
      </View>

      <Text className="text-label-sm mt-2">{post.title}</Text>

      {post.bingoItems && <BingoGridPreview items={post.bingoItems} />}

      <View className="flex-row items-center gap-4 mt-3">
        <LikeButton count={post.likeCount} iconColor={iconColor} />

        <View className="flex-row items-center gap-1">
          <SMSIcon width={ICON_SIZE} height={ICON_SIZE} color={iconColor} />
          <Text className="text-body-sm">{post.commentCount}</Text>
        </View>
      </View>
    </View>
  );
}
