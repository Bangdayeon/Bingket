import { Pressable, View } from 'react-native';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { Text } from '@/components/Text';
import { UserSearchResult as UserSearchResultType } from '@/types/friend';
import Loading from '@/components/Loading';
import { useTranslation } from 'react-i18next';

interface Props {
  searchLoading: boolean;
  searchError: string | null;
  searchResults: UserSearchResultType[] | null;
  sending: string | null;
  handleRequest: (item: UserSearchResultType) => void;
  handleProfilePress: (item: UserSearchResultType) => void;
}

export function SearchList({
  searchLoading,
  searchError,
  searchResults,
  sending,
  handleRequest,
  handleProfilePress,
}: Props) {
  const { t } = useTranslation();

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
        <Text className="text-body-md text-gray-500">{t('common.noSearchResult')}</Text>
      </View>
    );
  }

  return (
    <View>
      {others.map((item) => {
        const isPending = item.request_status === 'pending';
        const isSending = sending === item.id;
        const label = isPending ? t('friends.reRequest') : t('friends.add');

        return (
          <View key={item.id} className="flex-row items-center px-4 py-3">
            <Pressable
              onPress={() => handleProfilePress(item)}
              className="flex-1 flex-row items-center"
            >
              <ProfileAvatar avatarUrl={item.avatar_url} size={40} />
              <View className="ml-3 flex-1">
                <Text className="text-body-md text-gray-900" numberOfLines={1}>
                  {item.display_name}
                </Text>
                <Text className="text-caption-sm text-gray-500" numberOfLines={1}>
                  @{item.username}
                </Text>
              </View>
            </Pressable>
            <Pressable
              disabled={isSending}
              onPress={() => handleRequest(item)}
              className={`rounded-full px-4 py-2 ${isPending ? 'bg-gray-200' : 'bg-green-400'} ${
                isSending ? 'opacity-60' : ''
              }`}
            >
              {isSending ? (
                <Loading className="text-gray-800" />
              ) : (
                <Text
                  className={`text-caption-sm ${isPending ? 'text-gray-800' : 'text-on-brand-dark'}`}
                >
                  {label}
                </Text>
              )}
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
