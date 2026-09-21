import { useCallback, useEffect, useState } from 'react';
import * as Sentry from '@sentry/react-native';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/Text';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import Loading from '@/components/Loading';
import { ErrorState } from '@/components/ErrorState';
import CloseIcon from '@/assets/icons/ic_close.svg';
import ArrowForwardIcon from '@/assets/icons/ic_arrow_forward.svg';
import { fetchFriends } from '@/features/friend/lib/friend';
import { friendSelection } from '@/features/team/lib/friend-selection';
import type { Friend } from '@/types/friend';
import { useTranslation } from 'react-i18next';

interface FriendPickerProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  maxCount: number;
}

export function FriendPicker({ selectedIds, onChange, maxCount }: FriendPickerProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setLoadFailed(false);
    fetchFriends()
      .then(setFriends)
      .catch((e: unknown) => {
        Sentry.captureException(e);
        setLoadFailed(true);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const selected = selectedIds
    .map((id) => friends.find((f) => f.friendId === id))
    .filter((f): f is Friend => Boolean(f));

  const openPicker = () => {
    friendSelection.set(selectedIds);
    router.push({ pathname: '/mypage/friend-list', params: { mode: 'select', max: maxCount } });
  };

  if (loading) {
    return (
      <View className="items-center py-8">
        <Loading />
      </View>
    );
  }

  if (loadFailed) {
    return <ErrorState message={t('friends.error.load')} onRetry={load} />;
  }

  if (friends.length === 0) {
    return <Text className="py-4 text-body-md text-gray-500">{t('friends.noFriend')}</Text>;
  }

  return (
    <View>
      <Pressable
        onPress={openPicker}
        className="h-12 flex-row items-center justify-between rounded-xl bg-gray-200 px-3"
      >
        <Text className="text-body-md text-gray-500">
          {selected.length > 0
            ? t('home.field.friend.selected', { count: selected.length })
            : t('home.field.friend.label')}
        </Text>
        <ArrowForwardIcon width={24} height={24} className="text-gray-600" />
      </Pressable>

      <View className="pt-2">
        {selected.map((friend) => (
          <View key={friend.friendId} className="h-11 flex-row items-center gap-2">
            <ProfileAvatar avatarUrl={friend.avatarUrl} size={32} />
            <Text className="shrink text-body-md text-gray-900" numberOfLines={1}>
              {friend.displayName}
            </Text>
            <Text className="flex-1 text-caption-sm text-gray-500" numberOfLines={1}>
              @{friend.username}
            </Text>
            <Pressable
              onPress={() => onChange(selectedIds.filter((id) => id !== friend.friendId))}
              hitSlop={8}
            >
              <CloseIcon width={24} height={24} className="text-gray-700" />
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}
