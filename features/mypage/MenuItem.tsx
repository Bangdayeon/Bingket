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

// 시안은 행 높이 44였는데 항목이 서로 붙어 보여 48로 올렸다.
// (h-13은 tailwind 기본 스케일에 없어 조용히 무시된다 — 쓰지 말 것)
// 라벨 16/20 Regular gray-800, 화살표 24 gray-800, 우측 텍스트 gray-600.
export function MenuItem({
  label,
  onPress,
  rightText,
  showArrow = false,
  muted = false,
}: MenuItemProps) {
  return (
    <Pressable onPress={onPress} className="h-12 flex-row items-center justify-between">
      <Text className={`text-body-md ${muted ? 'text-gray-600' : 'text-gray-800'}`}>{label}</Text>
      <View className="flex-row items-center gap-1">
        {rightText && <Text className="text-body-md text-gray-600">{rightText}</Text>}
        {showArrow && <ForwardArrowIcon width={24} height={24} className="text-gray-800" />}
      </View>
    </Pressable>
  );
}
