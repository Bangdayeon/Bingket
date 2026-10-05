import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/Text';
import { Chip } from '@/components/Chip';
import { SectionLabel } from './SectionLabel';
import type { BoardVisibility } from '@/features/profile/lib/profile';

const OPTIONS = [
  {
    value: 'public',
    labelKey: 'bingo.visibility.public',
    descriptionKey: 'bingo.visibility.publicDescription',
  },
  {
    value: 'friends',
    labelKey: 'bingo.visibility.friends',
    descriptionKey: 'bingo.visibility.friendsDescription',
  },
  {
    value: 'private',
    labelKey: 'bingo.visibility.private',
    descriptionKey: 'bingo.visibility.privateDescription',
  },
] as const satisfies readonly {
  value: BoardVisibility;
  labelKey: 'bingo.visibility.public' | 'bingo.visibility.friends' | 'bingo.visibility.private';
  descriptionKey:
    | 'bingo.visibility.publicDescription'
    | 'bingo.visibility.friendsDescription'
    | 'bingo.visibility.privateDescription';
}[];

interface Props {
  value: BoardVisibility;
  onChange: (value: BoardVisibility) => void;
}

export function VisibilitySelector({ value, onChange }: Props) {
  const { t } = useTranslation();

  const selected = OPTIONS.find((option) => option.value === value);

  return (
    <View>
      <View className="px-4">
        <SectionLabel label={t('bingo.visibility.label')} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
      >
        {OPTIONS.map((option) => (
          <Chip
            key={option.value}
            label={t(option.labelKey)}
            selected={value === option.value}
            onPress={() => onChange(option.value)}
          />
        ))}
      </ScrollView>

      <Text className="px-4 pt-3 text-caption-md text-gray-900">
        {selected ? t(selected.descriptionKey) : ''}
      </Text>
    </View>
  );
}
