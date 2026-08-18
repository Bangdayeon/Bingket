import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/Text';
import { TeamAvatars } from '@/features/team/components/TeamAvatars';
import { calcDaysUntilStart, calcTeamDday } from '@/features/team/lib/team-result';
import { TEAM_MODE_LABEL } from '@/types/team';
import type { TeamListEntry } from '@/features/team/lib/team';

interface TeamListItemProps {
  team: TeamListEntry;
}

function formatDate(yyyyMmDd: string | null): string {
  if (!yyyyMmDd) return '?';
  return yyyyMmDd.replaceAll('-', '.');
}

/** 진행 상태를 한 줄로 요약한다 */
function statusLabel(team: TeamListEntry): string {
  if (team.isFinished) return '종료';
  if (!team.isStarted) return `${calcDaysUntilStart(team.startDate)}일 후 시작`;
  return `D-${calcTeamDday(team.endDate)}`;
}

export function TeamListItem({ team }: TeamListItemProps) {
  const period = `${formatDate(team.startDate)} ~ ${formatDate(team.endDate)}`;

  const handlePress = () => {
    if (team.isInvite) {
      router.push({ pathname: '/bingo/team-invite', params: { teamId: team.teamId } });
      return;
    }
    router.push({ pathname: '/bingo/team-status', params: { teamId: team.teamId } });
  };

  return (
    <Pressable onPress={handlePress} className="bg-green-200 px-4 py-3 rounded-xl gap-2">
      <View className="flex-row gap-2 items-center">
        <TeamAvatars members={team.members} />
        <Text className="text-title-sm font-pretendard-semibold flex-1" numberOfLines={1}>
          {team.title}
        </Text>
        <Text className="text-caption-sm text-gray-700">{statusLabel(team)}</Text>
      </View>

      <View className="flex-row gap-2 items-center">
        <Text className="text-caption-sm text-gray-700">{TEAM_MODE_LABEL[team.mode]}</Text>
        <Text className="text-caption-sm text-gray-400">·</Text>
        <Text className="text-caption-sm text-gray-700">{period}</Text>
        <Text className="text-caption-sm text-gray-400">·</Text>
        <Text className="text-caption-sm text-gray-700">{team.members.length}명</Text>
      </View>
    </Pressable>
  );
}
