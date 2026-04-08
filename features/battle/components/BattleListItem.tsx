import { View } from 'react-native';
import { Text } from '@/components/Text';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { router } from 'expo-router';
import { Pressable } from 'react-native';

type Variant = 'ongoing' | 'finished';

interface Player {
  name: string;
  avatarUrl?: string | null;
  isWinner?: boolean;
}

interface BattleListItemProps {
  variant: Variant;
  myBoardTitle: string;
  opponentBoardTitle: string;
  me: Player;
  opponent: Player;
  battleId: string;
}

export function BattleListItem({
  variant,
  myBoardTitle,
  opponentBoardTitle,
  me,
  opponent,
  battleId,
}: BattleListItemProps) {
  const isFinished = variant === 'finished';

  const leftBg = isFinished ? (me.isWinner ? 'bg-green-200' : 'bg-gray-200') : 'bg-green-200';

  const rightBg = isFinished ? (opponent.isWinner ? 'bg-green-200' : 'bg-gray-200') : 'bg-sky-200';

  const renderCard = (player: Player, boardTitle: string, bg: string) => (
    <View className={`gap-2 flex items-start p-3 h-24 ${bg} rounded-lg`}>
      <View className="flex-row items-center gap-2">
        <ProfileAvatar size={16} avatarUrl={player.avatarUrl} />
        <Text className="text-body-md" numberOfLines={1}>
          {player.name}
        </Text>
        {isFinished && player.isWinner && <Text>👑</Text>}
      </View>
      <Text className="text-body-sm" numberOfLines={2}>
        {boardTitle}
      </Text>
    </View>
  );

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/bingo/battle-status',
          params: { battleId },
        })
      }
    >
      <View className="flex-row items-center">
        <View className="flex-1">{renderCard(me, myBoardTitle, leftBg)}</View>

        <Text className="text-label-md mx-2">VS</Text>

        <View className="flex-1">{renderCard(opponent, opponentBoardTitle, rightBg)}</View>
      </View>
    </Pressable>
  );
}
