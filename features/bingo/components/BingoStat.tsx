import { View } from 'react-native';
import { Text } from '@/components/Text';

interface BingoStatProps {
  label: string;
  current: number;
  total: number;
  size?: 'sm' | 'md';
  /** 목표를 넘겼을 때 값을 빨간색으로 표시한다. */
  overflowRed?: boolean;
  /** `current/total` 대신 보여줄 문구 (예: 종료일의 `D-3`). */
  valueText?: string;
}

export function BingoStat({
  label,
  current,
  total,
  size = 'md',
  overflowRed = true,
  valueText,
}: BingoStatProps) {
  const isOver = overflowRed && current > total;

  return (
    <View className="items-center gap-1">
      <Text className="text-label-sm font-pretendard-semibold text-gray-800 md:text-label-md">
        {label}
      </Text>
      <Text
        className={`${size === 'sm' ? 'text-caption-sm' : 'text-caption-sm md:text-body-sm'} ${isOver ? 'text-danger' : 'text-gray-700'}`}
      >
        {valueText ?? `${current}/${total}`}
      </Text>
    </View>
  );
}
