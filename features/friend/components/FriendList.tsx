import { Pressable, Text, View } from 'react-native';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { type Friend } from '@/types/friend';

interface Props {
  friends: Friend[];
  handleDeleteFriend: (friend: Friend) => void;
  handleProfilePress: (friend: Friend) => void;
}

export function FriendList({ friends, handleDeleteFriend, handleProfilePress }: Props) {
  return (
    <View>
      <Text className="text-title-sm   px-5 pt-4 pb-2">친구 {friends.length}</Text>
      {friends.length === 0 ? (
        <View className="py-10 items-center">
          <Text className="text-body-md text-gray-400">아직 친구가 없어요.</Text>
        </View>
      ) : (
        friends.map((friend) => (
          <View
            key={friend.friendId}
            className="flex-row items-center px-5 py-3 border-b border-gray-100  "
          >
            <Pressable
              onPress={() => handleProfilePress(friend)}
              className="flex-1 flex-row items-center"
            >
              <ProfileAvatar avatarUrl={friend.avatarUrl} size={40} />
              <View className="flex-1 ml-3">
                <Text className="text-title-sm">{friend.displayName}</Text>
                <Text className="text-caption-sm text-gray-500  ">@{friend.username}</Text>
              </View>
            </Pressable>
            {/* 팀 빙고 초대는 '새 빙고 만들기' 흐름에서만 시작한다 */}
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => handleDeleteFriend(friend)}
                className="px-4 py-2 rounded-full border border-gray-200   bg-white  "
              >
                <Text className="text-caption-sm text-gray-700  ">삭제</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
    </View>
  );
}
