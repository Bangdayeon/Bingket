import { View } from 'react-native';
import { Text } from '@/components/Text';
import { CommentItem } from './CommentItem';
import { Comment } from '@/types/community';
import MascotImage from '@/assets/mascots/mascot_hey_gray.svg';

interface CommentSectionProps {
  comments: Comment[];
  postAuthorId: string;
  iconColor: string;
  onMenuPress: (id: string, pageY: number) => void;
  onReplyPress: (id: string, author: string) => void;
}

export function CommentSection({
  comments,
  postAuthorId,
  iconColor,
  onMenuPress,
  onReplyPress,
}: CommentSectionProps) {
  return (
    <View className="mt-5 pt-5 border-t border-gray-400 pb-20">
      {comments.length === 0 ? (
        <View className="items-center py-12 gap-5">
          <MascotImage width={130} height={100} className="" />
          <Text className="text-body-md" style={{ color: '#929898' /* gray-500 */ }}>
            첫 댓글을 남겨주세요.
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
        </View>
      )}
    </View>
  );
}
