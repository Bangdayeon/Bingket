import { Pressable, View } from 'react-native';
import { Text } from '@/components/Text';
import MoreVertIcon from '@/assets/icons/ic_more_vert.svg';
import SMSIcon from '@/assets/icons/ic_sms.svg';
import { LikeButton } from './LikeButton';
import AnonymousProfile from '@/components/AnonymousProfile';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { ReplyItem } from './ReplyItem';
import { Comment } from '@/types/community';

interface CommentItemProps {
  comment: Comment;
  postAuthorId: string;
  onMenuPress: (id: string, pageY: number) => void;
  onReplyPress: (id: string, author: string) => void;
}

export function CommentItem({
  comment,
  postAuthorId,
  onMenuPress,
  onReplyPress,
}: CommentItemProps) {
  const isPostAuthor = comment.userId === postAuthorId;

  if (comment.isDeleted) {
    return (
      <View>
        <Text className="text-body-sm pb-6 border-b px-4 border-gray-200 text-gray-400">
          (삭제된 댓글입니다.)
        </Text>
        {comment.replies?.map((r) => (
          <ReplyItem key={r.id} reply={r} postAuthorId={postAuthorId} onMenuPress={onMenuPress} />
        ))}
      </View>
    );
  }

  return (
    <View className="pb-1 border-b border-gray-200 px-4">
      <View className="flex-row items-center">
        {comment.isAnonymous ? (
          <AnonymousProfile seed={comment.userId} />
        ) : (
          <ProfileAvatar avatarUrl={comment.avatarUrl ?? null} size={32} />
        )}
        <Text className="ml-2 shrink text-label-sm" numberOfLines={1}>
          {comment.author}
        </Text>
        {isPostAuthor && (
          <View className="ml-1.5 px-1.5 py-1 rounded-full bg-green-200">
            <Text className="text-caption-sm text-green-800">작성자</Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        <View className="flex-row items-center gap-3">
          <LikeButton
            size="sm"
            count={comment.likeCount}
            commentId={comment.id}
            initialLiked={comment.likedByMe}
          />
          <Pressable hitSlop={8} onPress={() => onReplyPress(comment.id, comment.author)}>
            <SMSIcon width={20} height={20} className="text-gray-400" />
          </Pressable>
          <Pressable hitSlop={8} onPress={(e) => onMenuPress(comment.id, e.nativeEvent.pageY)}>
            <MoreVertIcon width={24} height={24} className="text-gray-700" />
          </Pressable>
        </View>
      </View>
      <Text className="text-body-sm mt-1">{comment.body}</Text>
      <Text className="text-caption-sm mt-1 text-right text-gray-500">{comment.createdAt}</Text>

      {comment.replies?.map((r) => (
        <ReplyItem key={r.id} reply={r} postAuthorId={postAuthorId} onMenuPress={onMenuPress} />
      ))}
    </View>
  );
}
