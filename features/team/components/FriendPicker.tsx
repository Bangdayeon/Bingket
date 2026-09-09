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

interface FriendPickerProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  /** 방장을 뺀 초대 가능 인원 */
  maxCount: number;
}

/**
 * 초대할 친구를 고른다.
 *
 * 고르는 일 자체는 친구 목록 화면(`?mode=select`)이 맡는다. 여기서는 고른 사람만
 * 보여주고 빼는 것까지 한다 — 친구 검색 UI를 두 곳에 만들 이유가 없다.
 * 친구가 아닌 사람은 DB 트리거가 막으므로 목록은 친구로 한정된다.
 */
export function FriendPicker({ selectedIds, onChange, maxCount }: FriendPickerProps) {
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
        // catch가 없으면 조회 실패가 "아직 친구가 없어요"로 보인다.
        Sentry.captureException(e);
        setLoadFailed(true);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

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
    return <ErrorState message="친구 목록을 불러오지 못했어요" onRetry={load} />;
  }

  if (friends.length === 0) {
    return (
      <Text className="py-4 text-body-md text-gray-500">
        아직 친구가 없어요. 친구를 먼저 추가해 주세요.
      </Text>
    );
  }

  return (
    <View>
      <Pressable
        onPress={openPicker}
        className="h-12 flex-row items-center justify-between rounded-xl bg-gray-200 px-3"
      >
        <Text className="text-body-md text-gray-500">
          {selected.length > 0 ? `${selected.length}명 선택함` : '친구 고르기'}
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
