import { ScrollView, View } from 'react-native';
import { Text } from '@/components/Text';
import { Chip } from '@/components/Chip';
import { SectionLabel } from './SectionLabel';
import type { BoardVisibility } from '@/features/profile/lib/profile';

// 시안 순서: 전체 공개 → 친구 공개 → 비공개
const OPTIONS: { value: BoardVisibility; label: string; description: string }[] = [
  { value: 'public', label: '전체 공개', description: '빙고를 누구에게나 공개해요' },
  { value: 'friends', label: '친구 공개', description: '빙고를 친구들에게만 공개해요' },
  { value: 'private', label: '비공개', description: '빙고를 나만 봐요' },
];

interface Props {
  value: BoardVisibility;
  onChange: (value: BoardVisibility) => void;
}

export function VisibilitySelector({ value, onChange }: Props) {
  const selected = OPTIONS.find((opt) => opt.value === value);

  return (
    <View className="py-8">
      <View className="px-4">
        <SectionLabel label="빙고 공개 범위" />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
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
      {/* 시안: 선택한 값에 따라 설명 한 줄이 바뀐다 */}
      <Text className="px-4 pt-3 text-caption-md text-gray-900">{selected?.description}</Text>
    </View>
  );
}
