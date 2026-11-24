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
    <View className="h-[60px] shrink-0 flex-row items-center gap-2 px-2">
      {!hideBack && (
        <Pressable onPress={onBack ?? (() => router.back())} hitSlop={12}>
          <BackArrowIcon width={24} height={24} className="text-gray-900" />
        </Pressable>
      )}
      <View className="flex-1 flex-row items-center gap-2">
        {title ? (
          <Text
            className="shrink text-title-md font-pretendard-medium text-gray-900"
            numberOfLines={1}
          >
            {title}
          </Text>
        ) : null}
        {titleRight}
      </View>
      {right}
    </View>
  );
}
