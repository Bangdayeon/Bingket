import { Pressable } from 'react-native';
import { Text } from './Text';

const SELECTED_CLASSES = {
  green: 'bg-green-400 border-green-500',
  blue: 'bg-sky-300 border-sky-500',
} as const;

const SELECTED_TEXT_COLOR: Record<string, string | undefined> = {
  green: undefined,
  blue: '#023540', // sky-900
};

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  color?: 'green' | 'blue';
}

export function Chip({ label, selected, onPress, color = 'green' }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`h-10 px-5 rounded-full items-center justify-center ${
        selected ? SELECTED_CLASSES[color] : 'bg-gray-200 dark:bg-gray-900'
      }`}
    >
      <Text
        className={`text-body-md ${selected ? 'font-semibold' : ''}`}
        style={selected ? { color: SELECTED_TEXT_COLOR[color] } : undefined}
      >
        {label}
      </Text>
    </Pressable>
  );
}
