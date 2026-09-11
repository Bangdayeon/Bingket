import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Sentry from '@sentry/react-native';
import Loading from '@/components/Loading';
import { ErrorState } from '@/components/ErrorState';
import SettingsIcon from '@/assets/icons/ic_settings.svg';
import { BadgesPage } from '@/features/mypage/Badges';
import { ProfileHeader } from '@/features/profile/components/ProfileHeader';
import { FeedGrid } from '@/features/profile/components/FeedGrid';
import { ProfileTabs, type ProfileTab } from '@/features/profile/components/ProfileTabs';
import {
  fetchMyProfileSummary,
  fetchUserFeed,
  type FeedItem,
  type ProfileSummary,
} from '@/features/profile/lib/profile';
import { fetchMyTeams, type TeamListEntry } from '@/features/team/lib/team';

export default function MyPageScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<ProfileTab>('feed');
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [teams, setTeams] = useState<TeamListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const load = useCallback(() => {
    let cancelled = false;
    setLoadFailed(false);
    fetchMyProfileSummary()
      .then(async (p) => {
        if (cancelled || !p) return;
        setProfile(p);
        const items = await fetchUserFeed(p.id);
        if (!cancelled) setFeed(items);
      })
      .catch((e: unknown) => {
        Sentry.captureException(e);
        if (!cancelled) setLoadFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    fetchMyTeams()
      .then((t) => {
        if (!cancelled) setTeams(t);
      })
      .catch(Sentry.captureException);
    return () => {
      cancelled = true;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      // always show feed tab first
      setTab('feed');
      return load();
    }, [load]),
  );

  const teamBoardIds = new Set(
    teams.filter((t) => !t.isInvite && t.myBoardId).map((t) => t.myBoardId as string),
  );

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <View className="h-[60px] flex-row items-center justify-end border-b border-gray-300 px-4">
        <Pressable onPress={() => router.push('/mypage/settings')} hitSlop={8}>
          <SettingsIcon width={36} height={36} className="text-gray-700" />
        </Pressable>
      </View>

      <ProfileHeader
        profile={profile}
        onFriendsPress={() => router.push('/mypage/friend-list')}
        onPostsPress={() => router.push('/mypage/my-posts')}
      />

      <ProfileTabs value={tab} onChange={setTab} feedCount={loading ? undefined : feed.length} />

      {tab === 'feed' ? (
        loading ? (
          <View className="flex-1 items-center justify-center">
            <Loading />
          </View>
        ) : loadFailed ? (
          <ErrorState onRetry={() => void load()} />
        ) : (
          <View className="flex-1">
            <FeedGrid
              items={feed}
              teamBoardIds={teamBoardIds}
              onItemPress={(item) =>
                router.push({ pathname: '/bingo/view', params: { bingoId: item.id } })
              }
            />
          </View>
        )
      ) : (
        <BadgesPage />
      )}
    </SafeAreaView>
  );
}
