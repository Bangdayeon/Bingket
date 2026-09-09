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

/**
 * 빙고 진행 상황을 라벨 + 값 두 줄로 보여준다.
 *
 * 이전에는 도넛 게이지 안에 값을 넣었지만, 원 안에 글자를 욱여넣느라 값이 작아지고
 * 자릿수에 따라 폰트 크기를 따로 넘겨야 했다. 게이지를 걷어내고 값을 그대로 읽히게 한다.
 */
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
        className={`${size === 'sm' ? 'text-caption-sm' : 'text-caption-sm md:text-body-sm'} ${isOver ? 'text-danger' : 'text-gray-800'}`}
      >
        {valueText ?? `${current}/${total}`}
      </Text>
    </View>
  );
}
