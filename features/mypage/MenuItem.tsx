import { Pressable, View } from 'react-native';
import ForwardArrowIcon from '@/assets/icons/ic_arrow_forward.svg';
import { Text } from '@/components/Text';

interface MenuItemProps {
  label: string;
  onPress: () => void;
  rightText?: string;
  showArrow?: boolean;
}

export function MenuItem({ label, onPress, rightText, showArrow = false }: MenuItemProps) {
  const iconColor = '#181C1C'; /* gray-100 : gray-900 */
  return (
    <Pressable onPress={onPress} className="flex-row items-center justify-between py-4">
      <Text className="text-body-md">{label}</Text>
      <View className="flex-row items-center gap-1">
        {rightText && <Text className="text-body-md text-gray-500  ">{rightText}</Text>}
        {showArrow && <ForwardArrowIcon width={20} height={20} color={iconColor} />}
      </View>
    </Pressable>
  );
}
