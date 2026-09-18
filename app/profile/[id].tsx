import { useCallback, useState } from 'react';
import { View } from 'react-native';
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
import { useTranslation } from 'react-i18next';

// 이 사람의 피드·뱃지를 볼 수 있는지.

const canSeeContent = (p: ProfileSummary): boolean =>
  p.isMe || p.accountVisibility === 'public' || (p.accountVisibility === 'friends' && p.isFriend);

export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [tab, setTab] = useState<ProfileTab>('feed');
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
      // don't call feeds of locked profile
      setFeed(canSeeContent(p) ? await fetchUserFeed(id) : []);
    } catch (e) {
      Sentry.captureException(e);
      setErrorMessage(e instanceof Error ? e.message : t('profile.error.loadProfile'));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

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
      setErrorMessage(e instanceof Error ? e.message : t('profile.error.friendRequire'));
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
      label={
        profile?.hasPendingRequest ? t('profile.beFriend.require') : t('profile.beFriend.require')
      }
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
            {t('profile.error.notFound')}
          </Text>
        </View>
      ) : (
        <>
          <ProfileHeader profile={profile} onFriendsPress={undefined} onPostsPress={undefined} />

          {canAddFriend && !unlockableByFriend && <View className="px-4 mt-4">{friendButton}</View>}

          {isLocked ? (
            <>
              <View className="h-px bg-gray-200 mx-5 mt-4" />
              <View className="py-20 items-center px-8 gap-2">
                <LockIcon width={40} height={40} className="text-gray-400" />

                <Text className="text-title-sm mt-1">
                  {unlockableByFriend ? t('profile.visible.friend') : t('profile.visible.locked')}
                </Text>

                <Text className="text-body-sm text-gray-500 text-center">
                  {unlockableByFriend
                    ? t('profile.visible.friend_des')
                    : t('profile.visible.locked_des')}
                </Text>

                {unlockableByFriend && canAddFriend && (
                  <View className="mt-4 w-full max-w-[240px]">{friendButton}</View>
                )}
              </View>
            </>
          ) : (
            <>
              <ProfileTabs value={tab} onChange={setTab} className="mt-4" />

              {tab === 'feed' ? (
                <View className="flex-1">
                  <FeedGrid
                    items={feed}
                    onChanged={profile?.isMe ? () => void load() : undefined}
                    onItemPress={(item) =>
                      router.push(
                        profile?.isMe
                          ? { pathname: '/bingo/view', params: { bingoId: item.id } }
                          : { pathname: '/bingo/friend-view', params: { boardId: item.id } },
                      )
                    }
                  />
                </View>
              ) : (
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
