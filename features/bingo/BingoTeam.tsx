import { useCallback, useState } from 'react';
import { Image, RefreshControl, ScrollView, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Text } from '@/components/Text';
import { Modal } from '@/components/Modal';
import Loading from '@/components/Loading';
import { TeamListItem } from '@/features/team/components/TeamListItem';
import { fetchMyTeams, type TeamListEntry } from '@/features/team/lib/team';
import TeamDoneIcon from '@/assets/pngIcons/pencil.png';
import TeamProgressIcon from '@/assets/pngIcons/fire.png';

export function BingoTeam() {
  const [teams, setTeams] = useState<TeamListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    fetchMyTeams()
      .then(setTeams)
      .catch(() => setErrorMessage('데이터를 불러오지 못했어요.'))
      .finally(() => setLoading(false));
  }, []);

  // Realtime을 쓰지 않으므로 팀원이 채운 칸은 당겨서 새로고침으로 반영한다
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMyTeams()
      .then(setTeams)
      .catch(() => setErrorMessage('데이터를 불러오지 못했어요.'))
      .finally(() => setRefreshing(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const invites = teams.filter((t) => t.isInvite);
  const ongoing = teams.filter((t) => !t.isInvite && !t.isFinished);
  const finished = teams.filter((t) => !t.isInvite && t.isFinished);

  return (
    <>
      <ScrollView
        className="flex-1 mt-[70px] bg-white mb-20"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6ADE50" />
        }
      >
        {loading && teams.length === 0 ? (
          <View className="py-10 items-center">
            <Loading color="#6ADE50" />
          </View>
        ) : (
          <>
            {invites.length > 0 && (
              <View className="mt-4 mx-5">
                <View className="flex-row gap-1 mb-4 items-center">
                  <Text className="text-title-md">받은 초대</Text>
                </View>
                <View className="flex gap-2">
                  {invites.map((team) => (
                    <TeamListItem key={team.teamId} team={team} />
                  ))}
                </View>
              </View>
            )}

            <View className="mt-4 mx-5">
              <View className="flex-row gap-1 mb-4 items-center">
                <Image
                  source={TeamProgressIcon}
                  style={{ width: 24, height: 24 }}
                  resizeMode="contain"
                />
                <Text className="text-title-md">함께하는 빙고</Text>
              </View>
              {ongoing.length === 0 ? (
                <Text className="text-body-md text-gray-400 mt-2">
                  아직 함께하는 빙고가 없어요.
                </Text>
              ) : (
                <View className="flex gap-2">
                  {ongoing.map((team) => (
                    <TeamListItem key={team.teamId} team={team} />
                  ))}
                </View>
              )}
            </View>

            <View className="mt-8 mx-5 mb-4">
              <View className="flex-row gap-1 mb-3 items-center">
                <Image
                  source={TeamDoneIcon}
                  style={{ width: 24, height: 24 }}
                  resizeMode="contain"
                />
                <Text className="text-title-md">지난 기록</Text>
              </View>
              {finished.length === 0 ? (
                <Text className="text-body-md text-gray-400 mt-2">종료된 빙고가 없어요.</Text>
              ) : (
                <View className="flex gap-2">
                  {finished.map((team) => (
                    <TeamListItem key={team.teamId} team={team} />
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      <Modal
        visible={!!errorMessage}
        title="오류"
        body={errorMessage ?? ''}
        variant="error"
        confirmLabel="확인"
        onConfirm={() => setErrorMessage(null)}
        onDismiss={() => setErrorMessage(null)}
      />
    </>
  );
}
