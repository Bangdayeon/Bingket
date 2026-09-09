import Animated, { FadeOutUp, LinearTransition } from 'react-native-reanimated';
import { Badge } from '@/components/Badge';

interface RecentSearchTagProps {
  label: string;
  onPress: () => void;
  onDelete: () => void;
}

// 시안에서 최근 검색어는 bage 컴포넌트의 canDel 변형이다.
export function RecentSearchTag({ label, onPress, onDelete }: RecentSearchTagProps) {
  return (
    <Animated.View layout={LinearTransition.duration(250)} exiting={FadeOutUp.duration(200)}>
      <Badge label={label} onPress={onPress} onDelete={onDelete} />
    </Animated.View>
  );
}
