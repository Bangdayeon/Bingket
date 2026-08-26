import { ScrollView, View } from 'react-native';
import { Text } from '@/components/Text';
import { Chip } from '@/components/Chip';
import { Information } from '@/components/Information';
import type { BoardVisibility } from '@/features/profile/lib/profile';

const OPTIONS: { value: BoardVisibility; label: string }[] = [
  { value: 'private', label: '나만 보기' },
  { value: 'friends', label: '친구 공개' },
  { value: 'public', label: '전체 공개' },
];

interface Props {
  value: BoardVisibility;
  onChange: (value: BoardVisibility) => void;
}

export function VisibilitySelector({ value, onChange }: Props) {
  return (
    <View className="px-5 py-6 border-t border-gray-100">
      <View className="flex-row items-center gap-2 mb-2">
        <Text className="text-title-md font-pretendard-medium">공개 범위</Text>
        <Information content="계정이 비공개면 전체 공개로 두어도 친구에게만 보여요." />
      </View>
      <Text className="text-body-sm text-gray-500 mb-3">
        내 프로필을 방문한 사람에게 이 빙고를 보여줄 범위예요.{'\n'}
        라운지 게시글에 첨부한 빙고는 이 설정과 무관하게 보입니다.
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {OPTIONS.map((opt) => (
          <Chip
            key={opt.value}
            label={opt.label}
            selected={value === opt.value}
            onPress={() => onChange(opt.value)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
