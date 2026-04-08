import { View } from 'react-native';
import { Text } from '@/components/Text';
import IconButton from '@/components/IconButton';
import BackArrowIcon from '@/assets/icons/ic_arrow_back.svg';
import { useRouter } from 'expo-router';

interface BingoEditHeaderProps {
  title: string;
  onBack?: () => void;
}

export function BingoEditHeader({ title, onBack }: BingoEditHeaderProps) {
  const router = useRouter();
  return (
    <View className="h-14 flex-row items-center border-b border-gray-100 dark:border-gray-800 px-4">
      <IconButton
        variant="ghost"
        icon={<BackArrowIcon width={20} height={20} />}
        onClick={onBack ?? (() => router.back())}
        size={32}
      />
      <Text className="flex-1 text-center text-title-sm">{title}</Text>
      <View className="w-8" />
    </View>
  );
}
