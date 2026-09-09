import { ScrollView, View } from 'react-native';
import { Chip } from '@/components/Chip';
import { DateInput } from '@/components/DateInput';
import { SectionLabel } from './SectionLabel';

// 시안은 '직접 지정'이 맨 앞이다.
const DURATION_OPTIONS = ['직접 지정', '1개월', '3개월', '6개월', '1년'];

interface BingoGoalProps {
  selectedDuration: string | null;
  onDurationSelect: (opt: string) => void;
  startDate: Date | null;
  endDate: Date | null;
  isEndDateDisabled: boolean;
  onOpenStartPicker: () => void;
  onOpenEndPicker: () => void;
  /** 팀 빙고는 기간을 참여자 전원이 공유한다는 안내를 덧붙인다. */
  hint?: string;
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
  hint = '저장 후 변경 불가',
}: BingoGoalProps) {
  return (
    <View className="px-4 py-6">
      <SectionLabel label="목표 기간" hint={hint} />

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

      {/* 시안: 시작일 · 종료일 라벨 없이 date input 두 개를 간격 31로만 벌린다 */}
      <View className="flex-row items-center" style={{ gap: 31 }}>
        <DateInput value={formatDate(startDate) || 'yyyy.mm.dd'} onPress={onOpenStartPicker} />
        <DateInput
          value={formatDate(endDate) || 'yyyy.mm.dd'}
          onPress={onOpenEndPicker}
          disabled={isEndDateDisabled}
        />
      </View>
    </View>
  );
}
