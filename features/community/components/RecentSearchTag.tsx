import { Pressable } from 'react-native';
import Animated, { FadeOutUp, LinearTransition } from 'react-native-reanimated';
import { Text } from '@/components/Text';

interface RecentSearchTagProps {
  label: string;
  onDelete: () => void;
}

export function RecentSearchTag({ label, onDelete }: RecentSearchTagProps) {
  return (
    <Animated.View layout={LinearTransition.duration(250)} exiting={FadeOutUp.duration(200)}>
      <Pressable
        onPress={onDelete}
        className="flex-row items-center gap-1 h-7 px-3 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
      >
        <Text className="text-body-sm">{label}</Text>
        <Text style={{ color: '#929898' /* gray-500 */, fontSize: 16, lineHeight: 18 }}>×</Text>
      </Pressable>
    </Animated.View>
  );
}
