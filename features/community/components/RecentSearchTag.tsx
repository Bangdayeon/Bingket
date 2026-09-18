import Animated, { FadeOutUp, LinearTransition } from 'react-native-reanimated';
import { Badge } from '@/components/Badge';

interface RecentSearchTagProps {
  label: string;
  onPress: () => void;
  onDelete: () => void;
}

export function RecentSearchTag({ label, onPress, onDelete }: RecentSearchTagProps) {
  return (
    <Animated.View layout={LinearTransition.duration(250)} exiting={FadeOutUp.duration(200)}>
      <Badge label={label} onPress={onPress} onDelete={onDelete} />
    </Animated.View>
  );
}
