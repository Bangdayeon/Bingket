import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Sentry from '@sentry/react-native';
import { Text } from '@/components/Text';
import IconButton from '@/components/IconButton';
import Loading from '@/components/Loading';
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
import { TeamListItem } from '@/features/team/components/TeamListItem';

const TABS = ['피드', '뱃지'] as const;

export default function MyPageScreen() {
  const router = useRouter();
  const [tabIndex, setTabIndex] = useState(0);
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [teams, setTeams] = useState<TeamListEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      fetchMyProfileSummary()
        .then(async (p) => {
          if (cancelled || !p) return;
          setProfile(p);
          const items = await fetchUserFeed(p.id);
          if (!cancelled) setFeed(items);
        })
        .catch(Sentry.captureException)
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
    }, []),
  );

  // 수락 안 한 초대는 빙고판이 아직 없어 썸네일로 못 그린다. 피드 맨 위에 따로 띄운다.
  const invites = teams.filter((t) => t.isInvite);
  // 팀에 속한 내 빙고판. 피드 항목에 '함께' 뱃지를 붙이는 데 쓴다.
  const teamBoardIds = new Set(
    teams.filter((t) => !t.isInvite && t.myBoardId).map((t) => t.myBoardId as string),
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="h-[60px] flex-row items-center px-4 border-b border-gray-300">
        <View className="w-8" />
        <Text className="flex-1 text-center text-title-sm">마이페이지</Text>
        <IconButton
          variant="ghost"
          size={32}
          icon={<SettingsIcon width={20} height={20} />}
          onClick={() => router.push('/mypage/settings')}
        />
      </View>

      <ProfileHeader
        profile={profile}
        onFriendsPress={() => router.push('/mypage/friend-list')}
        onPostsPress={() => router.push('/mypage/my-posts')}
      />

      <View className="flex-row border-b border-gray-200 px-5">
        {TABS.map((tab, index) => (
          <Pressable
            key={tab}
            onPress={() => setTabIndex(index)}
            className="px-4 py-3"
            style={{
              borderBottomWidth: 2,
              borderBottomColor: tabIndex === index ? '#181C1C' : 'transparent',
            }}
          >
            <Text
              className="text-title-sm"
              style={{ color: tabIndex === index ? '#181C1C' : '#929898' }}
            >
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      {tabIndex === 0 ? (
        loading ? (
          <View className="flex-1 items-center justify-center">
            <Loading color="#6ADE50" />
          </View>
        ) : (
          <ScrollView className="flex-1" contentContainerStyle={{ paddingTop: 16 }}>
            {invites.length > 0 && (
              <View className="mb-4">
                {invites.map((team) => (
                  <TeamListItem key={team.teamId} team={team} />
                ))}
              </View>
            )}
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
