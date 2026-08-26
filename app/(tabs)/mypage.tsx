import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Sentry from '@sentry/react-native';
import { Text } from '@/components/Text';
import IconButton from '@/components/IconButton';
import Loading from '@/components/Loading';
import MoreIcon from '@/assets/icons/ic_more_vert.svg';
import { BadgesPage } from '@/features/mypage/Badges';
import { ProfileHeader } from '@/features/profile/components/ProfileHeader';
import { FeedGrid } from '@/features/profile/components/FeedGrid';
import {
  fetchMyProfileSummary,
  fetchUserFeed,
  type FeedItem,
  type ProfileSummary,
} from '@/features/profile/lib/profile';

const TABS = ['피드', '뱃지'] as const;

export default function MyPageScreen() {
  const router = useRouter();
  const [tabIndex, setTabIndex] = useState(0);
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
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
      return () => {
        cancelled = true;
      };
    }, []),
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="h-[60px] flex-row items-center px-4 border-b border-gray-300">
        <View className="w-8" />
        <Text className="flex-1 text-center text-title-sm">마이페이지</Text>
        <IconButton
          variant="ghost"
          size={32}
          icon={<MoreIcon width={20} height={20} />}
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
            <FeedGrid
              items={feed}
              isMe
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
