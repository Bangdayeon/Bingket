import { useEffect, useRef, useState } from 'react';
import CloseIcon from '@/assets/icons/ic_close.svg';
import { Pressable, TextInput as RNTextInput, View } from 'react-native';
import { Text } from '@/components/Text';
import { TextInput } from '@/components/TextInput';
import ArrowUpwardIcon from '@/assets/icons/ic_arrow_upward.svg';
import CheckIcon from '@/assets/icons/ic_check.svg';
import IconButton from '@/components/IconButton';
import { LIMITS } from '@/constants/limits';

interface CommentInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  paddingBottom: number;
  replyTo: { id: string; author: string } | null;
  onCancelReply: () => void;
  isAnonymous: boolean;
  onToggleAnonymous: () => void;
  isSubmitting?: boolean;
}

export function CommentInput({
  value,
  onChangeText,
  onSubmit,
  paddingBottom,
  replyTo,
  onCancelReply,
  isAnonymous,
  onToggleAnonymous,
  isSubmitting = false,
}: CommentInputProps) {
  const inputRef = useRef<RNTextInput>(null);

  useEffect(() => {
    if (replyTo) inputRef.current?.focus();
  }, [replyTo?.id]);

  const anonymousColor = isAnonymous ? '#94BD52' /* green-400 */ : '#B4BBBB'; /* gray-400 */
  const [pressed, setPressed] = useState(false);

  return (
    <View className="border-t border-gray-300 bg-white" style={{ paddingBottom }}>
      {replyTo && (
        <View className="flex-row items-center justify-between bg-green-50 px-4 py-2">
          <Text className="text-caption-sm text-gray-500">{replyTo.author}에게 답글 작성 중</Text>
          <Pressable hitSlop={8} onPress={onCancelReply}>
            <CloseIcon width={18} height={18} color="#929898" /* gray-500 */ />
          </Pressable>
        </View>
      )}

      <View className="flex-row items-center gap-3 px-4 pb-1 pt-3">
        <Pressable className="flex-row items-center gap-1" onPress={onToggleAnonymous} hitSlop={8}>
          <Text className="text-body-md" style={{ color: anonymousColor }}>
            익명
          </Text>
          <CheckIcon width={20} height={20} color={anonymousColor} />
        </Pressable>

        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder="댓글을 입력해주세요."
          maxLength={LIMITS.comment}
          className="flex-1"
          style={{ flex: 1 }}
        />

        <IconButton
          icon={<ArrowUpwardIcon width={24} height={24} color={pressed ? '#929898' : '#B4BBBB'} />}
          onClick={onSubmit}
          variant="ghost"
          loading={isSubmitting}
          disabled={isSubmitting}
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
        />
      </View>
    </View>
  );
}
