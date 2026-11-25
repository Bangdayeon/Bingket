import { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import BellIcon from '@/assets/icons/ic_bell_off.svg';
import { useUnreadNotifications } from '@/features/notifications/unread-context';
import { Text } from './Text';

export function MainHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  const router = useRouter();
  const { hasUnread } = useUnreadNotifications();
  return (
    <View className="h-[60px] flex-row items-center border-b border-gray-200 px-4">
      <Text className="flex-1 text-title-md font-pretendard-medium text-gray-900">{title}</Text>
      {actions}
      <Pressable
        onPress={() => router.push('/notifications')}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="알림"
        className="ml-4"
      >
        <BellIcon width={28} height={28} className="text-gray-700" />
        {hasUnread && (
          <View className="absolute right-0 top-0 h-[6px] w-[6px] rounded-full bg-danger" />
        )}
      </Pressable>
    </View>
  );
}
