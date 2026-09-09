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

/**
 * 시안: 아바타 80, 이름 16/20 Medium, @id 12/20, 게시글·친구는 라벨 12/20 + 값 14/18 SemiBold.
 * 한 줄 다짐은 라벨 없이 본문만 아바타 아래 왼쪽 끝(x=16)에 붙는다.
 */
export function ProfileHeader({ profile, onFriendsPress, onPostsPress }: Props) {
  return (
    <View className="px-4 pt-4">
      <View className="flex-row items-start gap-4">
        <ProfileAvatar avatarUrl={profile?.avatarUrl} size={80} />

        <View className="flex-1 gap-1.5">
          {profile ? (
            <>
              <Text className="text-body-md font-pretendard-medium text-gray-800">
                {profile.displayName}
              </Text>
              <Text className="text-caption-md text-gray-600">@{profile.username}</Text>
            </>
          ) : (
            <Loading />
          )}

          <View className="mt-1 flex-row gap-6">
            {/* 게시글 수는 본인에게만 노출한다 — 익명 게시글이 역산되는 것을 막는다 */}
            {profile?.feedCount !== null && profile?.feedCount !== undefined && (
              <Pressable onPress={onPostsPress} className="flex-row items-center gap-1">
                <Text className="text-caption-md text-gray-800">게시글</Text>
                <Text className="text-label-sm font-pretendard-semibold text-gray-800">
                  {profile.feedCount}
                </Text>
              </Pressable>
            )}
            <Pressable onPress={onFriendsPress} className="flex-row items-center gap-1">
              <Text className="text-caption-md text-gray-800">친구</Text>
              <Text className="text-label-sm font-pretendard-semibold text-gray-800">
                {profile?.friendCount ?? 0}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* 시안에는 '한 줄 다짐' 라벨이 없다 — 본문만 그린다 */}
      <Text className="pt-3 text-body-sm text-gray-700">
        {profile?.bio || '아직 한 줄 다짐이 없어요.'}
      </Text>
    </View>
  );
}
