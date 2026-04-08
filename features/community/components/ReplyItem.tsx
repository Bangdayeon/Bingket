import { Pressable, View } from 'react-native';
import { Text } from '@/components/Text';
import MoreVertIcon from '@/assets/icons/ic_more_vert.svg';
import { LikeButton } from './LikeButton';
import AnonymousProfile from '@/components/AnonymousProfile';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { CommentReply } from '@/types/community';
import SubIcon from '@/assets/icons/ic_subdirectory.svg';

interface ReplyItemProps {
  reply: CommentReply;
  postAuthorId: string;
  iconColor: string;
  onMenuPress: (id: string, pageY: number) => void;
}

export function ReplyItem({ reply, postAuthorId, iconColor, onMenuPress }: ReplyItemProps) {
  const isPostAuthor = reply.userId === postAuthorId;
  return (
    <View className="flex-row mt-2 mb-3">
      <SubIcon color="#929898" /* gray-500 */ style={{ marginRight: 4 }} />
      <View
        className="flex-1 rounded-lg px-3 pt-2 pb-2"
        style={{ backgroundColor: '#E8FAFE' /* sky-100 */ }}
      >
        <View className="flex-row items-center">
          {reply.isAnonymous ? (
            <AnonymousProfile seed={reply.userId} size="sm" />
          ) : (
            <ProfileAvatar avatarUrl={reply.avatarUrl ?? null} size={22} />
          )}
          <Text className="text-label-sm ml-2">{reply.author}</Text>
          {isPostAuthor && (
            <View
              className="ml-1.5 px-1.5 py-1 rounded-full"
              style={{ backgroundColor: '#54DBED' /* sky-400 */ }}
            >
              <Text className="text-[10px]">작성자</Text>
            </View>
          )}
          <View style={{ flex: 1 }} />
          <View className="flex-row items-center gap-3">
            <LikeButton
              size="sm"
              count={reply.likeCount}
              iconColor={iconColor}
              commentId={reply.id}
              initialLiked={reply.likedByMe}
            />
            <Pressable hitSlop={8} onPress={(e) => onMenuPress(reply.id, e.nativeEvent.pageY)}>
              <MoreVertIcon width={18} height={18} color={iconColor} />
            </Pressable>
          </View>
        </View>
        <Text className="text-body-sm mt-1">{reply.body}</Text>
        <Text
          className="text-caption-sm mt-1 text-right"
          style={{ color: '#929898' /* gray-500 */ }}
        >
          {reply.createdAt}
        </Text>
      </View>
    </View>
  );
}
