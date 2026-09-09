import { Pressable } from 'react-native';
import { Text } from './Text';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}

/**
 * 시안의 bage 컴포넌트를 누를 수 있게 만든 것. 선택지 목록(목표 기간·칸 수·테마·공개 범위)에 쓴다.
 * 선택하면 배경과 테두리가 green-200으로 차고 글자가 green-800 SemiBold로 진해진다.
 */
export function Chip({ label, selected, onPress, disabled = false }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`h-10 items-center justify-center rounded-full border px-4 ${
        selected ? 'border-green-200 bg-green-200' : 'border-gray-200 bg-gray-200'
      } ${disabled ? 'opacity-40' : ''}`}
    >
      <Text
        className={
          selected
            ? 'text-label-sm font-pretendard-semibold text-green-800'
            : 'text-body-sm text-gray-800'
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}
