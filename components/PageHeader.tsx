import { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import BackArrowIcon from '@/assets/icons/ic_arrow_back.svg';
import { Text } from './Text';

interface PageHeaderProps {
  title?: string;
  titleRight?: ReactNode;
  right?: ReactNode;
  onBack?: () => void;
  hideBack?: boolean;
}

export function PageHeader({
  title,
  titleRight,
  right,
  onBack,
  hideBack = false,
}: PageHeaderProps) {
  const router = useRouter();

  return (
    <View>
      <View className="h-9 flex-row items-center justify-between px-4 pt-3">
        {hideBack ? (
          <View />
        ) : (
          <Pressable onPress={onBack ?? (() => router.back())} hitSlop={12}>
            <BackArrowIcon width={24} height={24} className="text-gray-900" />
          </Pressable>
        )}
        {right}
      </View>

      {title ? (
        <View className="flex-row items-center gap-2 px-4 pb-2 pt-7">
          <Text className="text-title-lg font-pretendard-medium text-gray-900">{title}</Text>
          {titleRight}
        </View>
      ) : null}
    </View>
  );
}
