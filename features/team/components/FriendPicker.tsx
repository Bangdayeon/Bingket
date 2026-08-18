import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/Text';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import Loading from '@/components/Loading';
import CheckIcon from '@/assets/icons/ic_check.svg';
import { fetchFriends } from '@/features/friend/lib/friend';
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
 * 친구가 아닌 사람은 DB 트리거가 막으므로 목록 자체를 친구로 한정한다.
 */
export function FriendPicker({ selectedIds, onChange, maxCount }: FriendPickerProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFriends()
      .then(setFriends)
      .finally(() => setLoading(false));
  }, []);

  const toggle = (friendId: string) => {
    if (selectedIds.includes(friendId)) {
      onChange(selectedIds.filter((id) => id !== friendId));
      return;
    }
    if (selectedIds.length >= maxCount) return;
    onChange([...selectedIds, friendId]);
  };

  if (loading) {
    return (
      <View className="py-8 items-center">
        <Loading color="#6ADE50" />
      </View>
    );
  }

  if (friends.length === 0) {
    return (
      <Text className="text-body-md text-gray-400 py-4">
        아직 친구가 없어요. 친구를 먼저 추가해 주세요.
      </Text>
    );
  }

  return (
    <View className="gap-2">
      <Text className="text-caption-md text-gray-600">
        {selectedIds.length} / {maxCount}명 선택
      </Text>

      {friends.map((friend) => {
        const selected = selectedIds.includes(friend.friendId);
        const disabled = !selected && selectedIds.length >= maxCount;

        return (
          <Pressable
            key={friend.friendId}
            onPress={() => toggle(friend.friendId)}
            className={`flex-row items-center gap-3 px-4 py-3 rounded-2xl ${
              selected ? 'bg-green-200' : 'bg-gray-100'
            }`}
            style={{ opacity: disabled ? 0.4 : 1 }}
          >
            <ProfileAvatar avatarUrl={friend.avatarUrl} size={36} />
            <View className="flex-1">
              <Text className="text-body-md">{friend.displayName}</Text>
              <Text className="text-caption-sm text-gray-600">@{friend.username}</Text>
            </View>
            {selected && <CheckIcon width={24} height={24} color="#4ADE80" /* green-400 */ />}
          </Pressable>
        );
      })}
    </View>
  );
}
