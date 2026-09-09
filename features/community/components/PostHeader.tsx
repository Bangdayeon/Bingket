import { Pressable, View } from 'react-native';
import { HEADER_HEIGHT } from '@/lib/layout';
import ArrowBackIcon from '@/assets/icons/ic_arrow_back.svg';
import MoreVertIcon from '@/assets/icons/ic_more_vert.svg';

interface PostHeaderProps {
  onBack: () => void;
  onMenuPress: () => void;
}

export function PostHeader({ onBack, onMenuPress }: PostHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-4" style={{ height: HEADER_HEIGHT }}>
      <Pressable onPress={onBack} hitSlop={8}>
        <ArrowBackIcon width={24} height={24} className="text-gray-900" />
      </Pressable>
      <Pressable onPress={onMenuPress} hitSlop={8}>
        <MoreVertIcon width={24} height={24} className="text-gray-700" />
      </Pressable>
    </View>
  );
}
