import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Chip } from '@/components/Chip';
import { DateInput } from '@/components/DateInput';
import { Text } from '@/components/Text';
import { SectionLabel } from './SectionLabel';

interface BingoGoalProps {
  selectedDuration: string | null;
  onDurationSelect: (opt: string) => void;
  startDate: Date | null;
  endDate: Date | null;
  isEndDateDisabled: boolean;
  onOpenStartPicker: () => void;
  onOpenEndPicker: () => void;
  hint?: string;
}

const formatDate = (date: Date | null) =>
  date
    ? `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
        date.getDate(),
      ).padStart(2, '0')}`
    : '';

export function BingoGoal({
  selectedDuration,
  onDurationSelect,
  startDate,
  endDate,
  isEndDateDisabled,
  onOpenStartPicker,
  onOpenEndPicker,
}: BingoGoalProps) {
  const { t } = useTranslation();

  const durationOptions = [
    t('home.field.duration.custom'),
    t('home.field.duration.oneMonth'),
    t('home.field.duration.threeMonths'),
    t('home.field.duration.sixMonths'),
    t('home.field.duration.oneYear'),
  ];

  return (
    <View className="px-4">
      <SectionLabel label={t('home.field.duration.label')} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 20 }}
      >
        {durationOptions.map((option) => (
          <Chip
            key={option}
            label={option}
            selected={selectedDuration === option}
            onPress={() => onDurationSelect(option)}
          />
        ))}
      </ScrollView>

      <View className="flex-row items-center" style={{ gap: 12 }}>
        <DateInput value={formatDate(startDate) || 'yyyy.mm.dd'} onPress={onOpenStartPicker} />

        <Text className="text-body-md text-gray-600">~</Text>

        <DateInput
          value={formatDate(endDate) || 'yyyy.mm.dd'}
          onPress={onOpenEndPicker}
          disabled={isEndDateDisabled}
        />
      </View>
    </View>
  );
}
