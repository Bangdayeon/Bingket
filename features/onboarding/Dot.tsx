import { TouchableOpacity, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

// 시안: 높이 16, 비활성 16, 활성 24, radius 99.
const DOT_HEIGHT = 16;
const DOT_ACTIVE_WIDTH = 24;
const DOT_INACTIVE_WIDTH = 16;

export function Dot({ active, onPress }: { active: boolean; onPress: () => void }) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const scale = isTablet ? 1.4 : 1;
  const dotHeight = DOT_HEIGHT * scale;

  const style = useAnimatedStyle(() => ({
    width: withSpring(active ? DOT_ACTIVE_WIDTH * scale : DOT_INACTIVE_WIDTH * scale, {
      damping: 8,
      stiffness: 120,
      mass: 0.6,
    }),
    backgroundColor: withSpring(active ? '#94BD52' : '#D2D6D6', {
      damping: 10,
      stiffness: 100,
    }) /* green-400 : gray-300 */,
  }));

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Animated.View style={[{ height: dotHeight, borderRadius: 99 }, style]} />
    </TouchableOpacity>
  );
}
