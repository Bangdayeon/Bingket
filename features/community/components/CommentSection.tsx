import { Image, Pressable, View } from 'react-native';
import { Text } from '@/components/Text';
import { CommentItem } from './CommentItem';
import { Comment } from '@/types/community';
import Loading from '@/components/Loading';
import { ErrorState } from '@/components/ErrorState';
import { useTranslation } from 'react-i18next';

interface CommentSectionProps {
  comments: Comment[];
  postAuthorId: string;
  onMenuPress: (id: string, pageY: number) => void;
  onReplyPress: (id: string, author: string) => void;
  isLoading?: boolean;
  hasError?: boolean;
  onRetry?: () => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export function CommentSection({
  comments,
  postAuthorId,
  onMenuPress,
  onReplyPress,
  isLoading = false,
  hasError = false,
  onRetry,
  hasMore = false,
  onLoadMore,
}: CommentSectionProps) {
  const { t } = useTranslation();
  return (
    <View className="mt-5 pt-5 border-t border-gray-300 pb-20">
      {isLoading ? (
        <View className="items-center py-12">
          <Loading />
        </View>
      ) : hasError ? (
        <ErrorState message={t('board.comment.error.load')} onRetry={onRetry} />
      ) : comments.length === 0 ? (
        <View className="items-center py-12 gap-5">
          <Image
            source={require('@/assets/mascots/3D_01.png')}
            style={{ width: 130, height: 110 }}
            resizeMode="contain"
          />
          <Text className="text-body-md text-gray-500">{t('board.comment.first')}</Text>
          <Text className="text-body-md text-gray-500">{t('board.comment.warning')}</Text>
        </View>
      ) : (
        <View className="gap-5">
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              postAuthorId={postAuthorId}
              onMenuPress={onMenuPress}
              onReplyPress={onReplyPress}
            />
          ))}
          {hasMore && onLoadMore && (
            <Pressable onPress={onLoadMore} className="items-center py-3">
              <Text className="text-body-md text-gray-600">{t('board.comment.more')}</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
