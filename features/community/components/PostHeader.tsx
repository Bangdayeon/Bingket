import { Pressable, View } from 'react-native';
import { Text } from '@/components/Text';
import ArrowBackIcon from '@/assets/icons/ic_arrow_back.svg';
import MoreVertIcon from '@/assets/icons/ic_more_vert.svg';

export const HEADER_H = 60;

interface PostHeaderProps {
  iconColor: string;
  onBack: () => void;
  onMenuPress: () => void;
}

export function PostHeader({ iconColor, onBack, onMenuPress }: PostHeaderProps) {
  return (
    <View className="flex-row items-center border-b border-gray-300  " style={{ height: HEADER_H }}>
      <View style={{ width: 56 }} className="pl-4">
        <Pressable onPress={onBack} hitSlop={8}>
          <ArrowBackIcon width={20} height={20} color={iconColor} />
        </Pressable>
      </View>
      <Text className="flex-1 text-title-sm text-center font-pretendard-medium">게시글</Text>
      <View style={{ width: 56 }} className="pr-4 items-end">
        <Pressable onPress={onMenuPress} hitSlop={8}>
          <MoreVertIcon width={24} height={24} color={iconColor} />
        </Pressable>
      </View>
    </View>
  );
}
