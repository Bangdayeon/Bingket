import { Pressable } from 'react-native';
import CalendarIcon from '@/assets/icons/ic_calendar.svg';
import { Text } from './Text';

interface DateInputProps {
  /** 이미 포맷된 날짜 문자열. 예: `2026.09.09` */
  value: string;
  onPress: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * 시안 date input: 높이 40, radius 12, gray-200 배경,
 * 왼쪽 여백 8 / 오른쪽 여백 12, 달력 아이콘과 날짜 사이 간격 8.
 */
export function DateInput({ value, onPress, disabled = false, className = '' }: DateInputProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`h-10 flex-row items-center gap-2 rounded-xl bg-gray-200 pl-2 pr-3 ${
        disabled ? 'opacity-40' : ''
      } ${className}`}
    >
      <CalendarIcon width={24} height={24} className="text-gray-600" />
      <Text className="text-body-md text-gray-700">{value}</Text>
    </Pressable>
  );
}
