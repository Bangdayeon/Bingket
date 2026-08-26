import { View } from 'react-native';
import { Text } from '@/components/Text';

interface WinnerCrownProps {
  visible: boolean;
}

/** 1등 표시용 왕관. 부모에 relative(position) 컨텍스트가 있어야 한다. */
export function WinnerCrown({ visible }: WinnerCrownProps) {
  if (!visible) return null;

  return (
    <View className="absolute z-10 -top-3 -left-2">
      <Text className="-rotate-45">👑</Text>
    </View>
  );
}
