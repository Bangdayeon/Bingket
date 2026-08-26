import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as Sentry from '@sentry/react-native';
import { Text } from '@/components/Text';
import IconButton from '@/components/IconButton';
import Button from '@/components/Button';
import Loading from '@/components/Loading';
import BackArrowIcon from '@/assets/icons/ic_arrow_back.svg';
import { ProfileHeader } from '@/features/profile/components/ProfileHeader';
import { FeedGrid } from '@/features/profile/components/FeedGrid';
import { ErrorModal } from '@/features/friend/components/ErrorModal';
import { fetchProfile, fetchUserFeed } from '@/features/profile/lib/profile';
import type { FeedItem, ProfileSummary } from '@/features/profile/lib/profile';
import { sendFriendRequest } from '@/features/friend/lib/friend';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const p = await fetchProfile(id);
      if (!p) {
        setNotFound(true);
        return;
      }
      setProfile(p);
      // 잠긴 프로필은 피드를 요청해봐야 빈 배열이라 호출을 아낀다
      setFeed(p.isMe || p.isFriend || !p.isPrivate ? await fetchUserFeed(id) : []);
    } catch (e) {
      Sentry.captureException(e);
      setErrorMessage(e instanceof Error ? e.message : '프로필을 불러오지 못했어요.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleFriendRequest = async () => {
    if (!profile) return;
    setRequesting(true);
    try {
      await sendFriendRequest({
        receiverId: profile.id,
        receiverDisplayName: profile.displayName,
        existingStatus: null,
      });
      setProfile({ ...profile, hasPendingRequest: true });
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : '친구 요청에 실패했어요.');
    } finally {
      setRequesting(false);
    }
  };

  const isLocked = !!profile && !profile.isMe && !profile.isFriend && profile.isPrivate;

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <View className="h-[60px] flex-row items-center px-4 border-b border-gray-300">
        <IconButton
          variant="ghost"
          size={32}
          icon={<BackArrowIcon width={20} height={20} />}
          onClick={() => router.back()}
        />
        <Text className="flex-1 text-center text-title-sm" numberOfLines={1}>
          {profile?.displayName ?? ''}
        </Text>
        <View className="w-8" />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Loading color="#6ADE50" />
        </View>
      ) : notFound ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-body-md text-gray-400 text-center">
            {'찾을 수 없는 사용자예요.'}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
          <ProfileHeader profile={profile} onFriendsPress={undefined} onPostsPress={undefined} />

          {!profile?.isFriend && !profile?.isMe && (
            <View className="px-5 mb-4">
              <Button
                label={profile?.hasPendingRequest ? '친구 요청 보냄' : '친구 추가'}
                onClick={handleFriendRequest}
                size="sm"
                disabled={profile?.hasPendingRequest || requesting}
              />
            </View>
          )}

          <View className="h-px bg-gray-200 mx-5 mb-4" />

          {isLocked ? (
            <View className="py-20 items-center px-8 gap-2">
              <Text className="text-title-sm">비공개 계정이에요</Text>
              <Text className="text-body-sm text-gray-500 text-center">
                {'친구가 되면 빙고를 볼 수 있어요.'}
              </Text>
            </View>
          ) : (
            <FeedGrid
              items={feed}
              isMe={false}
              onItemPress={(item) =>
                router.push({ pathname: '/bingo/friend-view', params: { boardId: item.id } })
              }
              emptyText="아직 공개된 빙고가 없어요."
            />
          )}
        </ScrollView>
      )}

      <ErrorModal message={errorMessage} onDismiss={() => setErrorMessage(null)} />
    </View>
  );
}
