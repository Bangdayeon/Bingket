import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Text';
import IconButton from '@/components/IconButton';
import BackArrowIcon from '@/assets/icons/ic_arrow_back.svg';
import { TEAM_MODE_DESCRIPTION, TEAM_MODE_LABEL, type TeamMode } from '@/types/team';

interface ModeCardProps {
  label: string;
  description: string;
  selected?: boolean;
  onPress: () => void;
}

function ModeCard({ label, description, selected, onPress }: ModeCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-2xl px-5 py-4 gap-1 ${selected ? 'bg-green-200' : 'bg-green-100'}`}
    >
      <Text className="text-title-sm font-pretendard-semibold">{label}</Text>
      <Text className="text-body-sm" style={{ color: '#4C5252' /* gray-700 */ }}>
        {description}
      </Text>
    </Pressable>
  );
}

export default function TeamModeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState(false);

  const goCreate = (mode: TeamMode) => {
    router.push({ pathname: '/bingo/team-create', params: { mode } });
  };

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <View className="h-[60px] flex-row items-center px-4 border-b border-gray-300">
        <IconButton
          variant="ghost"
          size={32}
          icon={<BackArrowIcon width={20} height={20} />}
          onClick={() => router.back()}
        />
        <Text className="flex-1 text-center text-title-sm">친구와 같이하기</Text>
        <View className="w-8" />
      </View>

      <ScrollView className="flex-1 px-5 pt-6">
        <Text className="text-title-md mb-1">어떻게 함께할까요?</Text>
        <Text className="text-body-sm mb-6" style={{ color: '#4C5252' /* gray-700 */ }}>
          친구는 최대 5명까지 초대할 수 있어요.
        </Text>

        <View className="gap-3">
          <ModeCard
            label={TEAM_MODE_LABEL.shared}
            description={TEAM_MODE_DESCRIPTION.shared}
            onPress={() => goCreate('shared')}
          />

          <ModeCard
            label="각자 채우기"
            description="각자 자기 빙고판을 채우고 달성률을 견줘요"
            selected={expanded}
            onPress={() => setExpanded((prev) => !prev)}
          />

          {expanded && (
            <View className="gap-3 pl-4">
              <ModeCard
                label={TEAM_MODE_LABEL.copied}
                description={TEAM_MODE_DESCRIPTION.copied}
                onPress={() => goCreate('copied')}
              />
              <ModeCard
                label={TEAM_MODE_LABEL.own}
                description={TEAM_MODE_DESCRIPTION.own}
                onPress={() => goCreate('own')}
              />
            </View>
          )}
        </View>

        <View className="h-24" />
      </ScrollView>
    </View>
  );
}
