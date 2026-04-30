import { View, Pressable } from 'react-native';
import { Text } from '@/components/Text';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { router } from 'expo-router';

interface Player {
  name: string;
  avatarUrl?: string | null;
  isWinner?: boolean;
}

interface BattleListItemProps {
  me: Player;
  opponent: Player;
  battleId: string;
  battleTitle: string | null;
  startDate: string | null;
  endDate: string | null;
}

function formatDate(iso: string | null): string {
  if (!iso) return '?';
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

const AVATAR_SIZE = 32;
const OVERLAP = 12;

function OverlappingAvatars({ me, opponent }: { me: Player; opponent: Player }) {
  const meWins = me.isWinner === true;
  const opponentWins = opponent.isWinner === true;

  return (
    <View style={{ width: AVATAR_SIZE * 2 - OVERLAP, height: AVATAR_SIZE }}>
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: AVATAR_SIZE,
          alignItems: 'center',
          zIndex: opponentWins ? 1 : 2,
        }}
      >
        <View className="relative w-full">
          {meWins && <Text className="absolute z-10 -top-3 -left-2 -rotate-45">👑</Text>}
        </View>
        <ProfileAvatar size={AVATAR_SIZE} avatarUrl={me.avatarUrl} />
      </View>

      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: AVATAR_SIZE - OVERLAP,
          width: AVATAR_SIZE,
          alignItems: 'center',
          zIndex: opponentWins ? 2 : 1,
        }}
      >
        {opponentWins && <Text className="absolute z-10 -top-3 -left-2 -rotate-45">👑</Text>}
        <ProfileAvatar size={AVATAR_SIZE} avatarUrl={opponent.avatarUrl} />
      </View>
    </View>
  );
}

export function BattleListItem({
  me,
  opponent,
  battleId,
  battleTitle,
  startDate,
  endDate,
}: BattleListItemProps) {
  const period = `${formatDate(startDate)} ~ ${formatDate(endDate)}`;

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/bingo/battle-status', params: { battleId } })}
      className="bg-green-200 px-4 py-3 rounded-xl gap-2"
    >
      <View className="flex-row gap-2 items-center">
        <OverlappingAvatars me={me} opponent={opponent} />
        {battleTitle && (
          <Text className="text-title-sm font-pretendard-semibold">{battleTitle}</Text>
        )}
      </View>
      <Text className="text-caption-sm text-gray-700">{period}</Text>
    </Pressable>
  );
}
