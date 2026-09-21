import { Pressable, View } from 'react-native';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { Text } from '@/components/Text';
import CheckIcon from '@/assets/icons/ic_check.svg';
import { type Friend } from '@/types/friend';
import { useTranslation } from 'react-i18next';

interface Props {
  friends: Friend[];
  handleDeleteFriend: (friend: Friend) => void;
  handleProfilePress: (friend: Friend) => void;
  searching?: boolean;
  selectable?: boolean;
  selectedIds?: string[];
}

export function FriendList({
  friends,
  handleDeleteFriend,
  handleProfilePress,
  searching = false,
  selectable = false,
  selectedIds = [],
}: Props) {
  const { t } = useTranslation();

  if (friends.length === 0) {
    return (
      <View className="items-center py-8">
        <Text className="text-body-md text-gray-500">
          {searching ? t('friends.noSameFriend') : t('friends.noFriend')}
        </Text>
      </View>
    );
  }

  return (
    <View>
      {friends.map((friend) => (
        <View key={friend.friendId} className="flex-row items-center px-4 py-3">
          <Pressable
            onPress={() => handleProfilePress(friend)}
            className="flex-1 flex-row items-center"
          >
            <ProfileAvatar avatarUrl={friend.avatarUrl} size={40} />
            <View className="ml-3 flex-1">
              <Text className="text-body-md text-gray-900" numberOfLines={1}>
                {friend.displayName}
              </Text>
              <Text className="text-caption-sm text-gray-500" numberOfLines={1}>
                @{friend.username}
              </Text>
            </View>
          </Pressable>
          {selectable ? (
            <CheckIcon
              width={24}
              height={24}
              className={selectedIds.includes(friend.friendId) ? 'text-green-400' : 'text-gray-300'}
            />
          ) : (
            <Pressable
              onPress={() => handleDeleteFriend(friend)}
              className="rounded-full border border-gray-200 bg-white px-4 py-2"
            >
              <Text className="text-caption-sm text-gray-700">{t('common.delete')}</Text>
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );
}
