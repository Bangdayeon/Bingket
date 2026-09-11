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

import { t } from 'i18next';

interface NotificationItemProps {
  item: Notification;
  onRead: () => Promise<void>;
  onAction: (type: string, targetId: string | null) => void;
  onFriendResponse: (requestId: string, accept: boolean) => Promise<void>;
}

function NotificationItem({ item, onRead, onAction, onFriendResponse }: NotificationItemProps) {
  const isFriendRequest = item.type === 'friend_request';
  const isTeamInvite = item.type === 'team_invite';

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
      className={`justify-center border-b border-gray-300 px-4 py-6 ${
        item.is_read ? '' : 'bg-green-100'
      }`}
      onPress={handlePress}
    >
      {(isFriendRequest || isTeamInvite) && item.senderProfile && (
        <View className="mb-3 flex-row items-center gap-3">
          <ProfileAvatar avatarUrl={item.senderProfile.avatarUrl} size={32} />

          <View className="flex-1">
            <Text className="text-label-sm" numberOfLines={1}>
              {item.senderProfile.displayName}
            </Text>

            <Text className="text-caption-sm text-gray-500" numberOfLines={1}>
              @{item.senderProfile.username}
            </Text>
          </View>
        </View>
      )}

      <View className="flex-row items-center justify-between">
        <Text className="flex-1 text-body-md font-pretendard-bold text-gray-800">
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

      {isFriendRequest && item.target_id ? (
        <View className="mt-3 flex-row justify-end gap-2">
          <Button
            label={t('team.deny')}
            variant="ghost"
            size="sm"
            onClick={() => handleFriendResponse(false)}
            disabled={responding}
          />

          <Button
            label={t('team.confirm')}
            size="sm"
            onClick={() => handleFriendResponse(true)}
            disabled={responding}
            loading={responding}
          />
        </View>
      ) : null}

      {isTeamInvite && item.target_id ? (
        <View className="mt-3 flex-row justify-end">
          <Button
            label={t('team.checkInvite')}
            variant="secondary"
            size="sm"
            onClick={async () => {
              await onRead();
              onAction(item.type, item.target_id);
            }}
          />
        </View>
      ) : null}

      {isTeamUpdate && item.target_id ? (
        <View className="mt-3 flex-row justify-end">
          <Button
            label={t('team.checkTeamStauts')}
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
      .catch(() => setFetchError(`$(t('notifications.error')} ${t('common.error.retry')}`))
      .finally(() => setLoading(false));
  }, [limit]);

  useFocusEffect(loadData);

  useOnlineRestore(() => {
    if (fetchError) loadData();
  });

  const markAllRead = async () => {
    await markAllNotificationsRead();

    setNotifications((prev) =>
      prev.map((notification) => ({
        ...notification,
        is_read: true,
      })),
    );

    refreshUnread();
  };

  const handleAction = (type: string, targetId: string | null) => {
    navigateToNotification(type, targetId);
  };

  const handleFriendResponse = async (requestId: string, accept: boolean) => {
    const { error } = await supabase
      .from('friend_requests')
      .update({
        status: accept ? 'accepted' : 'rejected',
      })
      .eq('id', requestId);

    if (error) {
      // for Developer
      console.error('Failed to process friend request:', error);

      // for User
      Alert.alert(`${t('common.error.general')} ${t('common.error.retry')}`);

      return;
    }

    await deleteNotificationByTarget('friend_request', requestId);

    setNotifications((prev) => prev.filter((notification) => notification.target_id !== requestId));

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
      <View className="h-[60px] flex-row items-center justify-end px-4">
        <Pressable onPress={markAllRead} hitSlop={8}>
          <Text className="text-body-md text-gray-800">{t('notifications.setAllRead')}</Text>
        </Pressable>
      </View>

      <View className="h-px bg-gray-300" />

      <ScrollView className="flex-1">
        {fetchError ? (
          <ErrorState message={fetchError} onRetry={loadData} />
        ) : notifications.length === 0 ? (
          <EmptyState message={t('notifications.noNew')} />
        ) : null}

        {notifications.map((item) => (
          <NotificationItem
            key={item.id}
            item={item}
            onRead={async () => {
              await markNotificationRead(item.id);

              setNotifications((prev) =>
                prev.map((notification) =>
                  notification.id === item.id ? { ...notification, is_read: true } : notification,
                ),
              );

              refreshUnread();
            }}
            onAction={handleAction}
            onFriendResponse={handleFriendResponse}
          />
        ))}

        {hasMore && (
          <Pressable
            onPress={() => setLimit((currentLimit) => currentLimit + NOTIFICATION_PAGE_SIZE)}
            className="items-center py-4"
          >
            <Text className="text-body-md text-gray-600">{t('notifications.more')}</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
