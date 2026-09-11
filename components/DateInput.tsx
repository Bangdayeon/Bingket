import { Pressable } from 'react-native';
import CalendarIcon from '@/assets/icons/ic_calendar.svg';
import { Text } from './Text';

interface DateInputProps {
  value: string; // formated date string
  onPress: () => void;
  disabled?: boolean;
  className?: string;
}

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
