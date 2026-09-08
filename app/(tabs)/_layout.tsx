import { Tabs } from 'expo-router';

import { FloatingTabBar } from '@/components/FloatingTabBar';
import { UnreadNotificationsProvider } from '@/features/notifications/unread-context';

export default function TabLayout() {
  return (
    // 탭바는 화면 트리 밖에서 그려지므로, 안 읽은 알림 상태를 여기서 공유한다.
    // 그래야 홈에서 알림을 처리했을 때 빨간 점이 바로 꺼진다.
    <UnreadNotificationsProvider>
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="index" options={{ title: '홈' }} />
        <Tabs.Screen name="community" options={{ title: '게시판' }} />
        <Tabs.Screen name="notifications" options={{ title: '알림' }} />
        <Tabs.Screen name="mypage" options={{ title: '내 공간' }} />
      </Tabs>
    </UnreadNotificationsProvider>
  );
}
