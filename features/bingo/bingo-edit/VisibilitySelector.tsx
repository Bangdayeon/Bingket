import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/Text';
import { Chip } from '@/components/Chip';
import { SectionLabel } from './SectionLabel';
import type { BoardVisibility } from '@/features/profile/lib/profile';

const OPTIONS = [
  {
    value: 'public',
    labelKey: 'common.visibility.public',
    descriptionKey: 'common.visibility.public_des',
  },
  {
    value: 'friends',
    labelKey: 'common.visibility.friends',
    descriptionKey: 'common.visibility.friends_des',
  },
  {
    value: 'private',
    labelKey: 'common.visibility.private',
    descriptionKey: 'common.visibility.private_des',
  },
] as const satisfies readonly {
  value: BoardVisibility;
  labelKey: 'common.visibility.public' | 'common.visibility.friends' | 'common.visibility.private';
  descriptionKey:
    | 'common.visibility.public_des'
    | 'common.visibility.friends_des'
    | 'common.visibility.private_des';
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
        <SectionLabel label={t('common.visibility.label')} />
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
