import { Pressable, Text } from 'react-native';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export default function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`h-7 px-3 rounded-full items-center justify-center border ${
        selected ? 'bg-green-400 border-green-500' : 'bg-white border-gray-300'
      }`}
    >
      <Text
        className={`text-caption-md ${selected ? 'font-semibold text-gray-900' : 'text-gray-900'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
