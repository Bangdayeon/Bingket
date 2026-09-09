import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Text';
import { PageHeader } from '@/components/PageHeader';
import ArrowForwardIcon from '@/assets/icons/ic_arrow_forward.svg';
import {
  SELECTABLE_TEAM_MODES,
  TEAM_MAX_MEMBERS,
  TEAM_MODE_DESCRIPTION,
  TEAM_MODE_LABEL,
  type TeamMode,
} from '@/types/team';

interface ModeCardProps {
  label: string;
  description: string;
  onPress: () => void;
}

// 시안: 358×70, radius 16, 테두리만(배경 없음), 우측에 화살표.
function ModeCard({ label, description, onPress }: ModeCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="h-[70px] flex-row items-center justify-between rounded-2xl border border-gray-300 px-3"
    >
      <View className="gap-2">
        <Text className="text-body-md font-pretendard-medium text-gray-800">{label}</Text>
        <Text className="text-body-sm text-gray-700">{description}</Text>
      </View>
      <ArrowForwardIcon width={24} height={24} className="text-gray-800" />
    </Pressable>
  );
}

export default function TeamModeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const goCreate = (mode: TeamMode) => {
    router.push({ pathname: '/bingo/team-create', params: { mode } });
  };

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <PageHeader title="친구와 같이하기" />

      <ScrollView className="flex-1 px-4">
        <Text className="pb-6 text-caption-md text-gray-700">
          친구는 최대 {TEAM_MAX_MEMBERS - 1}명까지 같이할 수 있어요.
        </Text>

        <View className="gap-4">
          {SELECTABLE_TEAM_MODES.map((mode) => (
            <ModeCard
              key={mode}
              label={TEAM_MODE_LABEL[mode]}
              description={TEAM_MODE_DESCRIPTION[mode]}
              onPress={() => goCreate(mode)}
            />
          ))}
        </View>

        <View className="h-24" />
      </ScrollView>
    </View>
  );
}
