import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/components/Text';
import Button from '@/components/Button';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type Notification,
} from '@/features/notifications/lib/notifications';
import { supabase } from '@/lib/supabase';
import Loading from '@/components/Loading';
import { ProfileAvatar } from '@/components/ProfileAvatar';

interface NotificationItemProps {
  item: Notification;
  onRead: () => Promise<void>;
  onAction: (type: string, targetId: string | null) => void;
  onFriendResponse: (requestId: string, accept: boolean) => Promise<void>;
}

function NotificationItem({ item, onRead, onAction, onFriendResponse }: NotificationItemProps) {
  const isFriendRequest = item.type === 'friend_request';
  const isBattleRequest = item.type === 'battle_request';
  const isBattleAccepted = item.type === 'battle_accepted';
  const [responding, setResponding] = useState(false);

  const handlePress = async () => {
    await onRead();
    onAction(item.type, item.target_id);
  };

  const handleFriendResponse = async (accept: boolean) => {
    if (!item.target_id) return;
    setResponding(true);
    await onRead();
    await onFriendResponse(item.target_id, accept);
    setResponding(false);
  };

  return (
    <Pressable
      className={`border-t border-gray-300   px-4 py-4 justify-center ${
        item.is_read ? 'bg-gray-100  ' : 'bg-sky-100  '
      }`}
      onPress={handlePress}
    >
      {/* 친구/배틀 요청: sender 프로필 */}
      {(isFriendRequest || isBattleRequest) && item.senderProfile && (
        <View className="flex-row items-center gap-3 mb-3">
          <ProfileAvatar avatarUrl={item.senderProfile.avatarUrl} size={40} />
          <View>
            <Text className="text-label-sm">{item.senderProfile.displayName}</Text>
            <Text className="text-caption-sm text-gray-500  ">@{item.senderProfile.username}</Text>
          </View>
        </View>
      )}

      <Text className="text-body-lg mb-3">{item.message}</Text>

      {/* 친구 요청: 수락/거절 버튼 */}
      {isFriendRequest && item.target_id ? (
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button
              label="수락하기"
              onClick={() => handleFriendResponse(true)}
              disabled={responding}
              loading={responding}
            />
          </View>
          <View className="flex-1">
            <Button
              label="거절하기"
              variant="secondary"
              onClick={() => handleFriendResponse(false)}
              disabled={responding}
            />
          </View>
        </View>
      ) : null}

      {/* 배틀 요청: 확인하기 버튼 */}
      {isBattleRequest && item.target_id ? (
        <Button
          label="확인하기"
          variant="secondary"
          onClick={async () => {
            await onRead();
            onAction(item.type, item.target_id);
          }}
        />
      ) : null}

      {/* 배틀 수락: 대결 현황 보기 버튼 */}
      {isBattleAccepted && item.target_id ? (
        <Button
          label="대결 현황 보기"
          variant="secondary"
          onClick={async () => {
            await onRead();
            onAction(item.type, item.target_id);
          }}
        />
      ) : null}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    setFetchError(null);
    fetchNotifications()
      .then(setNotifications)
      .catch(() => setFetchError('알림을 불러오지 못했어요. 잠시 후 다시 시도해주세요.'))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(loadData);

  const markAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleAction = (type: string, targetId: string | null) => {
    if (type === 'friend_request') {
      router.push('/mypage/friend-list');
    } else if (type === 'battle_request' && targetId) {
      router.push({ pathname: '/bingo/battle-check', params: { requestId: targetId } });
    } else if (type === 'battle_accepted' && targetId) {
      router.push({ pathname: '/bingo/battle-status', params: { battleId: targetId } });
    } else if (
      (type === 'comment' || type === 'reply' || type === 'like' || type === 'popular') &&
      targetId
    ) {
      router.push(`/community/${targetId}`);
    }
  };

  const handleFriendResponse = async (requestId: string, accept: boolean) => {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: accept ? 'accepted' : 'rejected' })
      .eq('id', requestId);

    if (error) {
      Alert.alert('오류', error.message ?? '처리에 실패했어요.');
      return;
    }

    // 알림 DB에서 삭제 (재진입 시 버튼 재노출 방지)
    await supabase
      .from('notifications')
      .delete()
      .eq('target_id', requestId)
      .eq('type', 'friend_request');

    setNotifications((prev) => prev.filter((n) => n.target_id !== requestId));
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white   items-center justify-center">
        <Loading color="#6ADE50" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white  ">
      {/* Header */}
      <View className="h-[60px] flex-row items-center justify-between px-4 border-b border-gray-300  ">
        <View className="w-20" />
        <Pressable onPress={markAllRead} className="items-end">
          <Text className="text-body-md">모두 읽음 처리</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1">
        {fetchError ? (
          <View className="flex-1 items-center justify-center mt-20">
            <Text className="text-body-md text-gray-400">{fetchError}</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View className="flex-1 items-center justify-center mt-20">
            <Text className="text-body-md text-gray-400">새로운 알림이 없어요!</Text>
          </View>
        ) : null}
        {notifications.map((item) => (
          <NotificationItem
            key={item.id}
            item={item}
            onRead={async () => {
              await markNotificationRead(item.id);
              setNotifications((prev) =>
                prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n)),
              );
            }}
            onAction={handleAction}
            onFriendResponse={handleFriendResponse}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
