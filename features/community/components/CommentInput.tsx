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

  // replyTo 객체가 아니라 id를 본다. 부모가 리렌더될 때마다 새 객체가 와도
  // 답글 대상이 그대로면 포커스를 다시 뺏지 않는다.
  const replyToId = replyTo?.id;
  useEffect(() => {
    if (replyToId) inputRef.current?.focus();
  }, [replyToId]);

  const anonymousClass = isAnonymous ? 'text-green-400' : 'text-gray-400';
  const [pressed, setPressed] = useState(false);

  return (
    <View className="border-t border-gray-300 bg-white" style={{ paddingBottom }}>
      {replyTo && (
        <View className="flex-row items-center justify-between bg-green-50 px-4 py-2">
          <Text className="text-caption-sm text-gray-500">{replyTo.author}에게 답글 작성 중</Text>
          <Pressable hitSlop={8} onPress={onCancelReply}>
            <CloseIcon width={18} height={18} className="text-gray-500" />
          </Pressable>
        </View>
      )}

      <View className="flex-row items-center gap-3 px-4 pb-1 pt-3">
        <Pressable className="flex-row items-center gap-1" onPress={onToggleAnonymous} hitSlop={8}>
          <Text className={`text-body-md ${anonymousClass}`}>익명</Text>
          <CheckIcon width={20} height={20} className={anonymousClass} />
        </Pressable>

        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder="댓글을 입력해주세요."
          maxLength={LIMITS.comment}
          className="flex-1"
          style={{ flex: 1 }}
          rightIcon={
            // 입력창 안 오른쪽에 붙인다. 입력창 높이가 48이라 버튼은 32로 줄이고,
            // px-4로 잡힌 우측 여백을 -mr-2로 당겨 가장자리에서 8만 띄운다.
            // 줄어든 만큼은 hitSlop으로 메워 터치 영역은 48을 유지한다.
            <IconButton
              size={32}
              className="-mr-2"
              hitSlop={8}
              icon={
                <ArrowUpwardIcon
                  width={24}
                  height={24}
                  className={pressed ? 'text-gray-500' : 'text-gray-400'}
                />
              }
              onClick={onSubmit}
              variant="ghost"
              loading={isSubmitting}
              disabled={isSubmitting}
              onPressIn={() => setPressed(true)}
              onPressOut={() => setPressed(false)}
            />
          }
        />
      </View>
    </View>
  );
}
