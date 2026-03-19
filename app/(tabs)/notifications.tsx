import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type NotificationType = 'bingo' | 'comment' | 'popular';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'bingo',
    title: '2026 버킷리스트',
    body: '"제주도 여행 가기" 오늘 해보지 않으실래요?\n빙고 마감일까지 5일 남았습니다!',
    read: false,
  },
  {
    id: '2',
    type: 'bingo',
    title: '봄맞이 빙고',
    body: '"벚꽃 구경하기" 오늘 해보지 않으실래요?\n빙고 마감일까지 12일 남았습니다!',
    read: false,
  },
  {
    id: '3',
    type: 'comment',
    title: '2025년 목표 달성 후기',
    body: '댓글: 저도 이번 달 도전해볼게요! 응원합니다 😊',
    read: true,
  },
  {
    id: '4',
    type: 'bingo',
    title: '새해 다짐 빙고',
    body: '"운동 30분 하기" 오늘 해보지 않으실래요?\n빙고 마감일까지 20일 남았습니다!',
    read: true,
  },
  {
    id: '5',
    type: 'popular',
    title: '빙고 완성 후기 공유해요',
    body: '인기 게시글이 되었습니다! 축하드려요 🎉',
    read: false,
  },
];

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="h-[60px] flex-row items-center justify-between px-4 border-b border-gray-300">
        <View className="w-20" />
        <Pressable onPress={markAllRead} className="items-end">
          <Text className="text-body-md text-gray-900">모두 읽음 처리</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1">
        {notifications.map((item) => (
          <Pressable
            key={item.id}
            className={`border-t border-gray-300 px-4 justify-center ${item.read ? 'bg-gray-100' : 'bg-sky-100'}`}
            style={{ minHeight: 115 }}
            onPress={() =>
              setNotifications((prev) =>
                prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)),
              )
            }
          >
            <Text className="text-title-sm text-gray-900 mb-3">{item.title}</Text>
            <Text className="text-body-lg text-gray-900">{item.body}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
