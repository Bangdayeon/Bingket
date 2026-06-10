import { BadgesPage } from '@/features/mypage/Badges';
import { SettingPage } from '@/features/mypage/Setting';
import { useCallback, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HeaderTabBar } from '@/components/HeaderTabbar';
import { useFocusEffect } from 'expo-router';

export default function MyPageScreen() {
  const [tabIndex, setTabIndex] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setTabIndex(0);
    }, []),
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <HeaderTabBar
        menus={['내 정보', '뱃지']}
        selectedIndex={tabIndex}
        onTabChange={setTabIndex}
      />
      {tabIndex === 0 ? <SettingPage /> : <BadgesPage />}
    </SafeAreaView>
  );
}
