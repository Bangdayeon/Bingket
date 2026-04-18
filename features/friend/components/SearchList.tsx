import { View, Text, FlatList, Pressable } from 'react-native';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { UserSearchResult as UserSearchResultType } from '@/types/friend';
import Loading from '@/components/Loading';

interface Props {
  searchLoading: boolean;
  searchError: string | null;
  searchResults: UserSearchResultType[] | null;
  sending: string | null;
  insets: { bottom: number };
  handleRequest: (item: UserSearchResultType) => void;
}

export function SearchList({
  searchLoading,
  searchError,
  searchResults,
  sending,
  insets,
  handleRequest,
}: Props) {
  return (
    <View className="flex-1">
      {searchLoading ? (
        <View className="flex-1 items-center justify-center">
          <Loading color="#6ADE50" />
        </View>
      ) : searchError ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-body-md text-red-400 text-center">{searchError}</Text>
        </View>
      ) : !searchResults || searchResults.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-body-md text-gray-400">검색 결과가 없어요.</Text>
        </View>
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
          renderItem={({ item }) => {
            const isFriend = item.is_friend;
            const isPending = item.request_status === 'pending';
            const isSending = sending === item.id;
            const label = isFriend ? '친구' : isPending ? '재요청' : '친구 추가';
            const bgClass = isFriend
              ? 'bg-sky-400  '
              : isPending
                ? 'bg-gray-200  '
                : 'bg-green-400';

            return (
              <View className="flex-row items-center px-5 py-3 border-b border-gray-100  ">
                <ProfileAvatar avatarUrl={item.avatar_url} size={40} />
                <View className="flex-1 ml-3">
                  <Text className="text-title-sm">{item.display_name}</Text>
                  <Text className="text-caption-sm text-gray-500  ">@{item.username}</Text>
                </View>
                <Pressable
                  disabled={isFriend || isSending}
                  onPress={() => handleRequest(item)}
                  className={`px-4 py-2 rounded-full ${bgClass} ${isFriend || isSending ? 'opacity-60' : ''}`}
                >
                  {isSending ? (
                    <Loading color="#6ADE50" size={4} spacing={3} />
                  ) : (
                    <Text className="text-caption-sm">{label}</Text>
                  )}
                </Pressable>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}
