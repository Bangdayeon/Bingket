import { Tabs } from 'expo-router';

import { FloatingTabBar } from '@/components/FloatingTabBar';

import { useTranslation } from 'react-i18next';

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    // Tabbar drawing over screen tree, so share not read notification status
    // that make when handle notification at home, off notification's red dot
    <Tabs tabBar={(props) => <FloatingTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: t('common.screen.home') }} />
      <Tabs.Screen name="community" options={{ title: t('common.screen.board'), href: null }} />
      <Tabs.Screen name="bingos" options={{ title: t('common.screen.bingos') }} />
      <Tabs.Screen name="mypage" options={{ title: t('common.screen.mypage') }} />
    </Tabs>
  );
}
