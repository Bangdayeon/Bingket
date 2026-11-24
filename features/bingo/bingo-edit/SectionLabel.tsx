import { View } from 'react-native';
import { Text } from '@/components/Text';

interface SectionLabelProps {
  label: string;
  hint?: string;
}

export function SectionLabel({ label, hint }: SectionLabelProps) {
  return (
    <View className="mb-2 flex-row items-center gap-2">
      <Text className="text-label-md text-gray-800 ml-1">{label}</Text>
      {hint ? <Text className="text-caption-sm text-gray-500">{hint}</Text> : null}
    </View>
  );
}
