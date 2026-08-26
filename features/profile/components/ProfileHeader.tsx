import { Pressable, View } from 'react-native';
import { Text } from '@/components/Text';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import Loading from '@/components/Loading';
import type { ProfileSummary } from '@/features/profile/lib/profile';

interface Props {
  profile: ProfileSummary | null;
  onFriendsPress?: () => void;
  onPostsPress?: () => void;
}

export function ProfileHeader({ profile, onFriendsPress, onPostsPress }: Props) {
  return (
    <View className="px-5">
      <View className="h-5" />

      <View className="flex-row items-start mb-5 gap-4 h-[100px]">
        <ProfileAvatar avatarUrl={profile?.avatarUrl} />
        <View className="flex-1 pt-1 flex flex-col justify-between h-full">
          <View>
            {profile ? (
              <>
                <Text className="text-title-sm mb-1">{profile.displayName}</Text>
                <Text className="text-body-sm">@{profile.username}</Text>
              </>
            ) : (
              <Loading color="#6ADE50" />
            )}
          </View>

          <View className="flex-row gap-8">
            {/* 게시글 수는 본인에게만 노출한다 — 익명 게시글이 역산되는 것을 막는다 */}
            {profile?.feedCount !== null && profile?.feedCount !== undefined && (
              <View className="flex-row gap-3 mb-2">
                <Pressable onPress={onPostsPress} className="flex-row gap-1">
                  <Text className="text-body-sm">게시글</Text>
                  <Text className="text-body-sm font-pretendard-semibold">{profile.feedCount}</Text>
                </Pressable>
              </View>
            )}
            <View className="flex-row gap-3 mb-2">
              <Pressable onPress={onFriendsPress} className="flex-row gap-1">
                <Text className="text-body-sm">친구</Text>
                <Text className="text-body-sm font-pretendard-semibold">
                  {profile?.friendCount ?? 0}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      <View className="mb-3">
        <Text className="text-label-sm">한 줄 다짐</Text>
        <Text className="text-caption-md">{profile?.bio || '아직 한 줄 다짐이 없어요.'}</Text>
      </View>
    </View>
  );
}
