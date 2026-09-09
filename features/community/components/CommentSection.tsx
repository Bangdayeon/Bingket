import { Pressable, View } from 'react-native';
import { Text } from '@/components/Text';
import { CommentItem } from './CommentItem';
import { Comment } from '@/types/community';
import MascotImage from '@/assets/mascots/mascot_hey_gray.svg';
import Loading from '@/components/Loading';
import { ErrorState } from '@/components/ErrorState';

interface CommentSectionProps {
  comments: Comment[];
  postAuthorId: string;
  iconColor: string;
  onMenuPress: (id: string, pageY: number) => void;
  onReplyPress: (id: string, author: string) => void;
  isLoading?: boolean;
  /** 조회 실패. "첫 댓글을 남겨주세요"로 위장되면 안 된다. */
  hasError?: boolean;
  onRetry?: () => void;
  /** 아직 못 받은 댓글이 남아 있는지. */
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export function CommentSection({
  comments,
  postAuthorId,
  iconColor,
  onMenuPress,
  onReplyPress,
  isLoading = false,
  hasError = false,
  onRetry,
  hasMore = false,
  onLoadMore,
}: CommentSectionProps) {
  return (
    <View className="mt-5 pt-5 border-t border-gray-300 pb-20">
      {isLoading ? (
        <View className="items-center py-12">
          <Loading />
        </View>
      ) : hasError ? (
        <ErrorState message="댓글을 불러오지 못했어요" onRetry={onRetry} />
      ) : comments.length === 0 ? (
        <View className="items-center py-12 gap-5">
          <MascotImage width={130} height={100} className="" />
          <Text className="text-body-md" style={{ color: '#929898' /* gray-500 */ }}>
            첫 댓글을 남겨주세요.
          </Text>
          <Text className="text-body-md" style={{ color: '#929898' /* gray-500 */ }}>
            부적절한 내용은 제재를 받을 수 있어요.
          </Text>
        </View>
      ) : (
        <View className="gap-5">
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              postAuthorId={postAuthorId}
              iconColor={iconColor}
              onMenuPress={onMenuPress}
              onReplyPress={onReplyPress}
            />
          ))}
          {hasMore && onLoadMore && (
            <Pressable onPress={onLoadMore} className="items-center py-3">
              <Text className="text-body-md text-gray-600">댓글 더 보기</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
