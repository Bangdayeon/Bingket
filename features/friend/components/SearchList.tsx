import { Pressable, View } from 'react-native';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { Text } from '@/components/Text';
import { UserSearchResult as UserSearchResultType } from '@/types/friend';
import Loading from '@/components/Loading';

interface Props {
  searchLoading: boolean;
  searchError: string | null;
  searchResults: UserSearchResultType[] | null;
  sending: string | null;
  handleRequest: (item: UserSearchResultType) => void;
}

// 제목은 바깥의 CollapsibleSection이 그린다. 이미 친구인 사람은 위 '친구' 목록에 있으므로 여기선 뺀다.
export function SearchList({
  searchLoading,
  searchError,
  searchResults,
  sending,
  handleRequest,
}: Props) {
  if (searchLoading) {
    return (
      <View className="items-center py-8">
        <Loading />
      </View>
    );
  }

  if (searchError) {
    return (
      <View className="items-center px-8 py-8">
        <Text className="text-center text-body-md text-danger">{searchError}</Text>
      </View>
    );
  }

  const others = (searchResults ?? []).filter((item) => !item.is_friend);

  if (others.length === 0) {
    return (
      <View className="items-center py-8">
        <Text className="text-body-md text-gray-500">검색 결과가 없습니다</Text>
      </View>
    );
  }

  return (
    <View>
      {others.map((item) => {
        const isPending = item.request_status === 'pending';
        const isSending = sending === item.id;
        const label = isPending ? '재요청' : '친구 추가';

        return (
          <View key={item.id} className="flex-row items-center px-4 py-3">
            <ProfileAvatar avatarUrl={item.avatar_url} size={40} />
            <View className="ml-3 flex-1">
              <Text className="text-body-md text-gray-900" numberOfLines={1}>
                {item.display_name}
              </Text>
              <Text className="text-caption-sm text-gray-500" numberOfLines={1}>
                @{item.username}
              </Text>
            </View>
            <Pressable
              disabled={isSending}
              onPress={() => handleRequest(item)}
              className={`rounded-full px-4 py-2 ${isPending ? 'bg-gray-200' : 'bg-green-400'} ${
                isSending ? 'opacity-60' : ''
              }`}
            >
              {isSending ? (
                <Loading color="#2E3333" />
              ) : (
                <Text className="text-caption-sm text-gray-900">{label}</Text>
              )}
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
