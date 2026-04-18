import { useEffect, useRef, useState } from 'react';
import { Pressable, TextInput as RNTextInput, View } from 'react-native';
import { Text } from '@/components/Text';
import { TextInput } from '@/components/TextInput';
import SendIcon from '@/assets/icons/ic_send.svg';
import CheckIcon from '@/assets/icons/ic_check.svg';
import IconButton from '@/components/IconButton';

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

  const anonymousColor = isAnonymous ? '#28C8DE' /* sky-500 */ : '#B4BBBB'; /* gray-400 */
  const [pressed, setPressed] = useState(false);

  return (
    <View className="border-t border-gray-200   bg-white  " style={{ paddingBottom }}>
      {replyTo && (
        <View className="flex-row items-center justify-between px-5 py-2 bg-sky-100">
          <Text className="text-caption-sm text-gray-500">{replyTo.author}에게 답글 작성 중</Text>
          <Pressable hitSlop={8} onPress={onCancelReply}>
            <Text className="text-gray-500 text-base">×</Text>
          </Pressable>
        </View>
      )}

      <View className="flex-row items-center px-5 gap-3 pt-3 pb-1">
        <Pressable className="flex-row items-center gap-1" onPress={onToggleAnonymous} hitSlop={8}>
          <Text className="text-caption-md" style={{ color: anonymousColor }}>
            익명
          </Text>
          <CheckIcon width={16} height={16} color={anonymousColor} />
        </Pressable>

        <TextInput
          ref={inputRef}
          variant="community"
          value={value}
          onChangeText={onChangeText}
          placeholder="부적절한 내용은 제재를 받을 수 있어요."
          className="flex-1"
          style={{ flex: 1 }}
        />

        <IconButton
          icon={<SendIcon width={24} height={24} color={pressed ? '#F79A6E' : '#F07840'} />}
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
