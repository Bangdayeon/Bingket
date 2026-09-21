import { Pressable, View } from 'react-native';
import { Text } from '@/components/Text';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import Loading from '@/components/Loading';
import type { ProfileSummary } from '@/features/profile/lib/profile';
import { useTranslation } from 'react-i18next';

interface Props {
  profile: ProfileSummary | null;
  onFriendsPress?: () => void;
  onPostsPress?: () => void;
}

export function ProfileHeader({ profile, onFriendsPress, onPostsPress }: Props) {
  const { t } = useTranslation();

  return (
    <View className="px-4 pt-4">
      <View className="flex-row items-start gap-4">
        <ProfileAvatar avatarUrl={profile?.avatarUrl} size={80} />

        <View className="flex-1 gap-1.5">
          {profile ? (
            <View className="gap-0.5">
              <Text className="text-body-md font-pretendard-medium text-gray-800" numberOfLines={1}>
                {profile.displayName}
              </Text>
              <Text className="text-caption-md text-gray-600" numberOfLines={1}>
                @{profile.username}
              </Text>
            </View>
          ) : (
            <Loading />
          )}

          <View className="mt-1 flex-row gap-6">
            {/* 게시글 수는 본인에게만 노출한다 — 익명 게시글이 역산되는 것을 막는다 */}
            {profile?.feedCount !== null && profile?.feedCount !== undefined && (
              <Pressable onPress={onPostsPress} className="flex-row items-center gap-1">
                <Text className="text-caption-md text-gray-800">{t('my.post.title')}</Text>
                <Text className="text-label-sm font-pretendard-semibold text-gray-800">
                  {profile.feedCount}
                </Text>
              </Pressable>
            )}
            <Pressable onPress={onFriendsPress} className="flex-row items-center gap-1">
              <Text className="text-caption-md text-gray-800">{t('friends.label')}</Text>
              <Text className="text-label-sm font-pretendard-semibold text-gray-800">
                {profile?.friendCount ?? 0}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      <Text className="pt-3 text-body-sm text-gray-700">
        {profile?.bio || t('settings.profile.bio.empty')}
      </Text>
    </View>
  );
}
