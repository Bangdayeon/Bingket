import Chip from '@/components/common/Chip';
import IconButton from '@/components/common/IconButton';
import Calendar from '@/assets/icons/ic_calendar.svg';
import { Text, View } from 'react-native';

const DURATION_OPTIONS = ['1개월', '3개월', '6개월', '1년', '직접 지정'];
const ALERT_TEXT = '*처음 지정 후 수정이 불가능해요.';

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

export default function BingoGoal({
  selectedDuration,
  onDurationSelect,
  startDate,
  endDate,
  isEndDateDisabled,
  onOpenStartPicker,
  onOpenEndPicker,
}: BingoGoalProps) {
  return (
    <View className="px-5 pt-6 pb-5">
      <View className="flex-row items-center gap-2 mb-3">
        <Text className="text-title-md text-gray-900">목표 기간</Text>
        <Text className="text-caption-sm text-red-500">{ALERT_TEXT}</Text>
      </View>
      <View className="flex-row flex-wrap gap-2">
        {DURATION_OPTIONS.map((opt) => (
          <Chip
            key={opt}
            label={opt}
            selected={selectedDuration === opt}
            onPress={() => onDurationSelect(opt)}
          />
        ))}
      </View>
      <View className="flex-row mt-4">
        <View className="flex-1 flex-row items-center">
          <IconButton
            icon={<Calendar width={16} height={16} />}
            variant="ghost"
            size={28}
            onClick={onOpenStartPicker}
          />
          <Text className="text-body-lg text-gray-900">시작일</Text>
          <Text className="text-body-sm text-gray-700 pl-1">{formatDate(startDate)}</Text>
        </View>
        <View className="flex-1 flex-row items-center">
          <IconButton
            icon={<Calendar width={16} height={16} />}
            variant="ghost"
            size={28}
            disabled={isEndDateDisabled}
            onClick={onOpenEndPicker}
          />
          <Text className="text-body-lg text-gray-900">종료일</Text>
          <Text className="text-body-sm text-gray-700 pl-1">{formatDate(endDate)}</Text>
        </View>
      </View>
    </View>
  );
}
