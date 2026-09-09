import { Pressable, View } from 'react-native';
import ForwardArrowIcon from '@/assets/icons/ic_arrow_forward.svg';
import { Text } from '@/components/Text';

interface MenuItemProps {
  label: string;
  onPress: () => void;
  rightText?: string;
  showArrow?: boolean;
  /** 로그아웃처럼 톤을 낮추는 항목 */
  muted?: boolean;
}

// 시안: 행 높이 44, 라벨 16/20 Regular gray-800, 화살표 24 gray-800, 우측 텍스트 gray-600.
// 항목 사이 간격은 이 컴포넌트가 아니라 감싸는 그룹의 gap이 준다 —
// 행 높이를 키워 대신하면 라벨만 헐렁해지고 간격은 여전히 0이다.
export function MenuItem({
  label,
  onPress,
  rightText,
  showArrow = false,
  muted = false,
}: MenuItemProps) {
  return (
    <Pressable onPress={onPress} className="h-11 flex-row items-center justify-between">
      <Text className={`text-body-md ${muted ? 'text-gray-600' : 'text-gray-800'}`}>{label}</Text>
      <View className="flex-row items-center gap-1">
        {rightText && <Text className="text-body-md text-gray-600">{rightText}</Text>}
        {showArrow && <ForwardArrowIcon width={24} height={24} className="text-gray-800" />}
      </View>
    </Pressable>
  );
}
