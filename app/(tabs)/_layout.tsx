import { Tabs } from 'expo-router';

import { FloatingTabBar } from '@/components/FloatingTabBar';
import { UnreadNotificationsProvider } from '@/features/notifications/unread-context';

import { useTranslation } from 'react-i18next';

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    // Tabbar drawing over screen tree, so share not read notification status
    // that make when handle notification at home, off notification's red dot
    <UnreadNotificationsProvider>
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="index" options={{ title: t('common.home') }} />
        <Tabs.Screen name="community" options={{ title: t('common.board') }} />
        <Tabs.Screen name="notifications" options={{ title: t('common.notifications') }} />
        <Tabs.Screen name="mypage" options={{ title: t('common.mypage') }} />
      </Tabs>
    </UnreadNotificationsProvider>
  );
}
