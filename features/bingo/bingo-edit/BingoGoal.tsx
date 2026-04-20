import { Chip } from '@/components/Chip';
import Calendar from '@/assets/icons/ic_calendar.svg';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/components/Text';
import { Information } from '@/components/Information';

const DURATION_OPTIONS = ['1개월', '3개월', '6개월', '1년', '직접 지정'];

interface BingoGoalProps {
  selectedDuration: string | null;
  onDurationSelect: (opt: string) => void;
  startDate: Date | null;
  endDate: Date | null;
  isEndDateDisabled: boolean;
  onOpenStartPicker: () => void;
  onOpenEndPicker: () => void;
}

const formatDate = (date: Date | null) =>
  date
    ? `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
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
  const iconColor = '#181C1C'; /* gray-100 : gray-900 */
  return (
    <View className="px-5 py-6 border-t border-gray-100  ">
      <View className="flex-row items-center gap-2 mb-4">
        <Text className="text-title-md font-pretendard-medium">목표 기간</Text>
        <Information content="처음 지정 후 수정이 불가능해요." />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 20 }}
      >
        {DURATION_OPTIONS.map((opt) => (
          <Chip
            key={opt}
            label={opt}
            selected={selectedDuration === opt}
            onPress={() => onDurationSelect(opt)}
          />
        ))}
      </ScrollView>

      <View className="flex-row gap-4">
        <View className="flex-1">
          <Text className="text-title-sm mb-2">시작일</Text>
          <Pressable
            onPress={onOpenStartPicker}
            className="flex-row items-center gap-1 bg-gray-100   rounded-full px-3 h-10"
          >
            <Calendar width={16} height={16} color={iconColor} />
            <Text className="text-body-sm text-gray-700  ">
              {formatDate(startDate) || '선택하기'}
            </Text>
          </Pressable>
        </View>

        <View className="flex-1">
          <Text className="text-title-sm mb-2">종료일</Text>
          <Pressable
            onPress={!isEndDateDisabled ? onOpenEndPicker : undefined}
            className="flex-row items-center gap-1 bg-gray-100   rounded-full px-3 h-10"
            style={{ opacity: isEndDateDisabled ? 0.6 : 1 }}
          >
            <Calendar width={16} height={16} color={iconColor} />
            <Text className="text-body-md text-gray-500  ">
              {formatDate(endDate) || '선택하기'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
