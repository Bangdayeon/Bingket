import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/components/Text';
import Button from '@/components/Button';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  deleteNotificationByTarget,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type Notification,
  NOTIFICATION_PAGE_SIZE,
} from '@/features/notifications/lib/notifications';
import { navigateToNotification } from '@/features/notifications/lib/notification-route';
import {
  formatNotificationTime,
  hasNotificationBody,
  notificationTitle,
} from '@/features/notifications/lib/notification-display';
import { useUnreadNotifications } from '@/features/notifications/unread-context';
import { supabase } from '@/lib/supabase';
import Loading from '@/components/Loading';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { useOnlineRestore } from '@/lib/use-online';
import { ProfileAvatar } from '@/components/ProfileAvatar';

interface NotificationItemProps {
  item: Notification;
  onRead: () => Promise<void>;
  onAction: (type: string, targetId: string | null) => void;
  onFriendResponse: (requestId: string, accept: boolean) => Promise<void>;
}

function NotificationItem({ item, onRead, onAction, onFriendResponse }: NotificationItemProps) {
  const isFriendRequest = item.type === 'friend_request';
  const isTeamInvite = item.type === 'team_invite';
  // 합류/거절/종료 알림은 모두 팀 현황으로 보낸다
  const isTeamUpdate =
    item.type === 'team_joined' ||
    item.type === 'team_invite_declined' ||
    item.type === 'team_finished' ||
    item.type === 'team_cell_checked';
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
      // 좌우는 화면 여백(16)에 맞추고 세로만 넉넉히 준다. 알림이 두세 줄씩이라
      // 사방 16으로는 줄끼리 붙어 보인다.
      className={`justify-center border-b border-gray-300 px-4 py-6 ${
        item.is_read ? '' : 'bg-green-100'
      }`}
      onPress={handlePress}
    >
      {/* 친구/배틀 요청: sender 프로필 */}
      {(isFriendRequest || isTeamInvite) && item.senderProfile && (
        <View className="flex-row items-center gap-3 mb-3">
          <ProfileAvatar avatarUrl={item.senderProfile.avatarUrl} size={32} />
          <View className="flex-1">
            <Text className="text-label-sm" numberOfLines={1}>
              {item.senderProfile.displayName}
            </Text>
            <Text className="text-caption-sm text-gray-500  " numberOfLines={1}>
              @{item.senderProfile.username}
            </Text>
          </View>
        </View>
      )}

      <View className="flex-row items-center justify-between">
        <Text className="flex-1 text-title-sm font-pretendard-semibold text-gray-800">
          {notificationTitle(item.type)}
        </Text>
        <Text className="ml-2 text-caption-md text-gray-600">
          {formatNotificationTime(item.created_at)}
        </Text>
      </View>

      {hasNotificationBody(item.type, item.message) && (
        <Text className="mt-3 text-body-md text-gray-800" numberOfLines={2}>
          {item.message}
        </Text>
      )}

      {/* 친구 요청: 수락/거절 버튼 */}
      {isFriendRequest && item.target_id ? (
        <View className="mt-3 flex-row justify-end gap-2">
          <Button
            label="거절하기"
            variant="ghost"
            size="sm"
            onClick={() => handleFriendResponse(false)}
            disabled={responding}
          />
          <Button
            label="수락하기"
            size="sm"
            onClick={() => handleFriendResponse(true)}
            disabled={responding}
            loading={responding}
          />
        </View>
      ) : null}

      {/* 팀 초대: 초대장 확인 */}
      {isTeamInvite && item.target_id ? (
        <View className="mt-3 flex-row justify-end">
          <Button
            label="초대 확인하기"
            variant="secondary"
            size="sm"
            onClick={async () => {
              await onRead();
              onAction(item.type, item.target_id);
            }}
          />
        </View>
      ) : null}

      {/* 팀 소식: 현황 보기 */}
      {isTeamUpdate && item.target_id ? (
        <View className="mt-3 flex-row justify-end">
          <Button
            label="팀 현황 보기"
            variant="secondary"
            size="sm"
            onClick={async () => {
              await onRead();
              onAction(item.type, item.target_id);
            }}
          />
        </View>
      ) : null}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { refresh: refreshUnread } = useUnreadNotifications();
  // 예전에는 limit(50)이 하드코딩돼 51번째 이후 알림에 닿을 수 없었다.
  const [limit, setLimit] = useState(NOTIFICATION_PAGE_SIZE);
  const [hasMore, setHasMore] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    setFetchError(null);
    fetchNotifications(limit)
      .then((list) => {
        setNotifications(list);
        setHasMore(list.length === limit);
      })
      .catch(() => setFetchError('알림을 불러오지 못했어요. 잠시 후 다시 시도해주세요.'))
      .finally(() => setLoading(false));
  }, [limit]);

  useFocusEffect(loadData);

  useOnlineRestore(() => {
    if (fetchError) loadData();
  });

  const markAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    refreshUnread();
  };

  const handleAction = (type: string, targetId: string | null) => {
    navigateToNotification(type, targetId);
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
    await deleteNotificationByTarget('friend_request', requestId);

    setNotifications((prev) => prev.filter((n) => n.target_id !== requestId));
    refreshUnread();
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-surface" edges={['top']}>
        <Loading />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      {/* 시안에는 화면 제목이 없다 — '모두 읽음 처리'만 우측에 둔다 */}
      <View className="h-[60px] flex-row items-center justify-end px-4">
        <Pressable onPress={markAllRead} hitSlop={8}>
          <Text className="text-body-md text-gray-800">모두 읽음 처리</Text>
        </Pressable>
      </View>
      {/* 설정 화면과 같은 구분선 규격 — 화면 끝까지 닿는 풀블리드 */}
      <View className="h-px bg-gray-300" />

      <ScrollView className="flex-1">
        {fetchError ? (
          <ErrorState message={fetchError} onRetry={loadData} />
        ) : notifications.length === 0 ? (
          <EmptyState message="새로운 알림이 없어요!" />
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
              refreshUnread();
            }}
            onAction={handleAction}
            onFriendResponse={handleFriendResponse}
          />
        ))}
        {hasMore && (
          <Pressable
            onPress={() => setLimit((n) => n + NOTIFICATION_PAGE_SIZE)}
            className="items-center py-4"
          >
            <Text className="text-body-md text-gray-600">알림 더 보기</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
