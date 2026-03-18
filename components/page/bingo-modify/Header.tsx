import { View, Text } from 'react-native';
import IconButton from '@/components/common/IconButton';
import BackArrowIcon from '@/assets/icons/ic_arrow_back.svg';
import { useRouter } from 'expo-router';

export default function BingoModifyHeader({ onBack }: { onBack?: () => void }) {
  const router = useRouter();
  return (
    <View className="h-[60px] flex-row items-center border-b border-gray-300 px-4">
      <IconButton
        variant="ghost"
        icon={<BackArrowIcon width={20} height={20} />}
        onClick={onBack ?? (() => router.back())}
        size={32}
      />
      <Text className="flex-1 text-center text-title-sm text-gray-900">빙고 수정하기</Text>
      <View className="w-8" />
    </View>
  );
}
