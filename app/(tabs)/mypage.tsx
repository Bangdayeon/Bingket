import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Sentry from '@sentry/react-native';
import { Text } from '@/components/Text';
import Loading from '@/components/Loading';
import { ErrorState } from '@/components/ErrorState';
import SettingsIcon from '@/assets/icons/ic_settings.svg';
import { BadgesPage } from '@/features/mypage/Badges';
import { ProfileHeader } from '@/features/profile/components/ProfileHeader';
import { FeedGrid } from '@/features/profile/components/FeedGrid';
import {
  fetchMyProfileSummary,
  fetchUserFeed,
  type FeedItem,
  type ProfileSummary,
} from '@/features/profile/lib/profile';
import { fetchMyTeams, type TeamListEntry } from '@/features/team/lib/team';

const TABS = ['피드', '뱃지'] as const;

export default function MyPageScreen() {
  const router = useRouter();
  const [tabIndex, setTabIndex] = useState(0);
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
    // 함께하는 빙고는 여기서만 볼 수 있다 (홈의 '함께' 탭이 없어졌다)
    fetchMyTeams()
      .then((t) => {
        if (!cancelled) setTeams(t);
      })
      .catch(Sentry.captureException);
    return () => {
      cancelled = true;
    };
  }, []);

  useFocusEffect(load);

  // 팀에 속한 내 빙고판. 피드 항목에 '함께' 뱃지를 붙이는 데 쓴다.
  const teamBoardIds = new Set(
    teams.filter((t) => !t.isInvite && t.myBoardId).map((t) => t.myBoardId as string),
  );

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      {/* 시안에는 화면 제목이 없다 — 설정 아이콘만 우측 */}
      <View className="h-[60px] flex-row items-center justify-end border-b border-gray-300 px-4">
        <Pressable onPress={() => router.push('/mypage/settings')} hitSlop={8}>
          <SettingsIcon width={36} height={36} color="#4C5252" /* gray-700 */ />
        </Pressable>
      </View>

      <ProfileHeader
        profile={profile}
        onFriendsPress={() => router.push('/mypage/friend-list')}
        onPostsPress={() => router.push('/mypage/my-posts')}
      />

      <View className="flex-row border-b border-gray-300 px-4">
        {TABS.map((tab, index) => (
          <Pressable key={tab} onPress={() => setTabIndex(index)} className="items-center py-3">
            <Text
              className={
                tabIndex === index
                  ? 'text-body-md font-pretendard-bold text-gray-800'
                  : 'text-body-md font-pretendard-medium text-gray-400'
              }
            >
              {tab}
            </Text>
            {/* 시안: 밑줄은 44×1.5 */}
            <View
              className="mt-2 h-[1.5px] w-11"
              style={{ backgroundColor: tabIndex === index ? '#2E3333' : 'transparent' }}
            />
          </Pressable>
        ))}
      </View>

      {tabIndex === 0 ? (
        loading ? (
          <View className="flex-1 items-center justify-center">
            <Loading />
          </View>
        ) : loadFailed ? (
          <ErrorState onRetry={() => void load()} />
        ) : (
          <ScrollView className="flex-1" contentContainerStyle={{ paddingTop: 16 }}>
            <FeedGrid
              items={feed}
              isMe
              teamBoardIds={teamBoardIds}
              onItemPress={(item) =>
                router.push({ pathname: '/bingo/view', params: { bingoId: item.id } })
              }
            />
            <View className="h-24" />
          </ScrollView>
        )
      ) : (
        <BadgesPage />
      )}
    </SafeAreaView>
  );
}
