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
import LockIcon from '@/assets/icons/ic_lock.svg';
import { ProfileHeader } from '@/features/profile/components/ProfileHeader';
import { FeedGrid } from '@/features/profile/components/FeedGrid';
import { ProfileTabs, type ProfileTab } from '@/features/profile/components/ProfileTabs';
import { BadgesPage } from '@/features/mypage/Badges';
import { ErrorModal } from '@/features/friend/components/ErrorModal';
import { fetchProfile, fetchUserFeed } from '@/features/profile/lib/profile';
import type { FeedItem, ProfileSummary } from '@/features/profile/lib/profile';
import { sendFriendRequest } from '@/features/friend/lib/friend';

/**
 * 이 사람의 피드·뱃지를 볼 수 있는지. 계정 축만 본다 — 빙고 축은 서버가 거른다.
 * 'private'은 친구에게도 잠긴다 (can_view_board / get_user_badges 와 같은 규칙).
 *
 * 게시글 수는 여기서 판단하지 않는다. get_user_profile 이 본인이 아니면 null 로
 * 내려주고 ProfileHeader 가 그때 카운터를 통째로 감춘다 — 익명 게시글 역산 차단.
 */
const canSeeContent = (p: ProfileSummary): boolean =>
  p.isMe || p.accountVisibility === 'public' || (p.accountVisibility === 'friends' && p.isFriend);

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [tab, setTab] = useState<ProfileTab>('피드');
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
      setFeed(canSeeContent(p) ? await fetchUserFeed(id) : []);
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

  const isLocked = !!profile && !canSeeContent(profile);
  // 친구가 되면 열리는 잠금인지. 'private'은 친구가 돼도 안 열려서 잠금 안내에
  // 친구 신청 버튼을 두지 않는다 — 누르면 열릴 것처럼 보이면 안 된다.
  const unlockableByFriend = isLocked && profile?.accountVisibility === 'friends';
  const canAddFriend = !!profile && !profile.isMe && !profile.isFriend;

  const friendButton = (
    <Button
      label={profile?.hasPendingRequest ? '친구 요청 보냄' : '친구 신청'}
      onClick={handleFriendRequest}
      size="sm"
      disabled={profile?.hasPendingRequest || requesting}
    />
  );

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <View className="h-[60px] flex-row items-center px-4 border-b border-gray-300">
        <IconButton
          variant="ghost"
          size={32}
          icon={<BackArrowIcon width={24} height={24} />}
          onClick={() => router.back()}
        />
        <Text className="flex-1 text-center text-title-sm" numberOfLines={1}>
          {profile?.displayName ?? ''}
        </Text>
        <View className="w-8" />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Loading />
        </View>
      ) : notFound ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-body-md text-gray-400 text-center">
            {'찾을 수 없는 사용자예요.'}
          </Text>
        </View>
      ) : (
        <>
          <ProfileHeader profile={profile} onFriendsPress={undefined} onPostsPress={undefined} />

          {/* 잠금 안내가 버튼을 들고 있을 때는 같은 버튼을 위에 또 두지 않는다 */}
          {canAddFriend && !unlockableByFriend && <View className="px-4 mt-4">{friendButton}</View>}

          {isLocked ? (
            <>
              <View className="h-px bg-gray-200 mx-5 mt-4" />
              <View className="py-20 items-center px-8 gap-2">
                <LockIcon width={40} height={40} className="text-gray-400" />
                <Text className="text-title-sm mt-1">
                  {unlockableByFriend ? '친구만 볼 수 있어요' : '비공개 계정이에요'}
                </Text>
                <Text className="text-body-sm text-gray-500 text-center">
                  {unlockableByFriend
                    ? '친구가 되면 빙고와 뱃지를 볼 수 있어요.'
                    : '이 계정은 빙고와 뱃지를 공개하지 않아요.'}
                </Text>
                {unlockableByFriend && canAddFriend && (
                  <View className="mt-4 w-full max-w-[240px]">{friendButton}</View>
                )}
              </View>
            </>
          ) : (
            <>
              <ProfileTabs value={tab} onChange={setTab} className="mt-4" />
              {tab === '피드' ? (
                <ScrollView
                  className="flex-1"
                  contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + 32 }}
                >
                  <FeedGrid
                    items={feed}
                    onItemPress={(item) =>
                      router.push({ pathname: '/bingo/friend-view', params: { boardId: item.id } })
                    }
                    emptyText="아직 공개된 빙고가 없어요."
                  />
                </ScrollView>
              ) : (
                // 내 프로필을 이 화면으로 열었으면 RPC 대신 기존 본인 조회 경로를 태운다.
                // 여기엔 플로팅 탭바가 없어서 내 공간처럼 80을 비워둘 이유도 없다.
                <BadgesPage userId={profile?.isMe ? undefined : id} bottomGap={insets.bottom} />
              )}
            </>
          )}
        </>
      )}

      <ErrorModal message={errorMessage} onDismiss={() => setErrorMessage(null)} />
    </View>
  );
}
