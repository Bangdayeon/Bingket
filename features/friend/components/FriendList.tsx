import { Pressable, View } from 'react-native';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { Text } from '@/components/Text';
import CheckIcon from '@/assets/icons/ic_check.svg';
import { type Friend } from '@/types/friend';

interface Props {
  friends: Friend[];
  handleDeleteFriend: (friend: Friend) => void;
  handleProfilePress: (friend: Friend) => void;
  /** 검색어가 있는데 결과가 없을 때는 다른 문구를 보여준다. */
  searching?: boolean;
  /** 팀 빙고 초대처럼 친구를 고르러 들어왔을 때. 삭제 대신 선택 표시를 보여준다. */
  selectable?: boolean;
  selectedIds?: string[];
}

// 제목은 바깥의 CollapsibleSection이 그린다. 여기서는 행만 그린다.
export function FriendList({
  friends,
  handleDeleteFriend,
  handleProfilePress,
  searching = false,
  selectable = false,
  selectedIds = [],
}: Props) {
  if (friends.length === 0) {
    return (
      <View className="items-center py-8">
        <Text className="text-body-md text-gray-500">
          {searching ? '일치하는 친구가 없습니다' : '아직 친구가 없습니다'}
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
              <Text className="text-body-md text-gray-900">{friend.displayName}</Text>
              <Text className="text-caption-sm text-gray-500">@{friend.username}</Text>
            </View>
          </Pressable>
          {selectable ? (
            <CheckIcon
              width={24}
              height={24}
              color={
                selectedIds.includes(friend.friendId) ? '#94BD52' : '#D2D6D6'
              } /* green-400 : gray-300 */
            />
          ) : (
            /* 팀 빙고 초대는 '새 빙고 만들기' 흐름에서만 시작한다 */
            <Pressable
              onPress={() => handleDeleteFriend(friend)}
              className="rounded-full border border-gray-200 bg-white px-4 py-2"
            >
              <Text className="text-caption-sm text-gray-700">삭제</Text>
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );
}
