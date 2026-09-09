import { Pressable, View } from 'react-native';
import { Text } from '@/components/Text';
import MoreVertIcon from '@/assets/icons/ic_more_vert.svg';
import { LikeButton } from './LikeButton';
import { AuthorLink } from './AuthorLink';
import AnonymousProfile from '@/components/AnonymousProfile';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { CommentReply } from '@/types/community';
import SubIcon from '@/assets/icons/ic_subdirectory.svg';

interface ReplyItemProps {
  reply: CommentReply;
  postAuthorId: string;
  onMenuPress: (id: string, pageY: number) => void;
}

export function ReplyItem({ reply, postAuthorId, onMenuPress }: ReplyItemProps) {
  const isPostAuthor = reply.userId === postAuthorId;
  return (
    <View className="flex-row mt-2 mb-3">
      <SubIcon className="text-gray-500" style={{ marginRight: 4 }} />
      <View className="flex-1 rounded-lg px-3 pt-2 pb-2 bg-green-50">
        <View className="flex-row items-center">
          <AuthorLink
            userId={reply.userId}
            isAnonymous={reply.isAnonymous}
            className="shrink flex-row items-center"
          >
            {reply.isAnonymous ? (
              <AnonymousProfile seed={reply.userId} />
            ) : (
              <ProfileAvatar avatarUrl={reply.avatarUrl ?? null} size={32} />
            )}
            <Text className="ml-2 shrink text-label-sm" numberOfLines={1}>
              {reply.author}
            </Text>
          </AuthorLink>
          {isPostAuthor && (
            <View className="ml-1.5 px-1.5 py-1 rounded-full bg-green-200">
              <Text className="text-caption-sm text-green-800">작성자</Text>
            </View>
          )}
          <View style={{ flex: 1 }} />
          <View className="flex-row items-center gap-3">
            <LikeButton
              size="sm"
              count={reply.likeCount}
              commentId={reply.id}
              initialLiked={reply.likedByMe}
            />
            <Pressable hitSlop={8} onPress={(e) => onMenuPress(reply.id, e.nativeEvent.pageY)}>
              <MoreVertIcon width={24} height={24} className="text-gray-700" />
            </Pressable>
          </View>
        </View>
        <Text className="text-body-sm mt-1">{reply.body}</Text>
        <Text className="text-caption-sm mt-1 text-right text-gray-500">{reply.createdAt}</Text>
      </View>
    </View>
  );
}
