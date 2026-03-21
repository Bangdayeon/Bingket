import { ScrollView, View } from 'react-native';
import { Chip } from '@/components/Chip';

const FILTERS = ['전체', '빙고판', '빙고 달성', '자유게시판'];

interface FilterProps {
  selectedIndex: number;
  onSelect: (index: number) => void;
  color?: 'green' | 'blue';
}

export function CommunityFilter({ selectedIndex, onSelect, color = 'green' }: FilterProps) {
  return (
    <View className="border-b border-gray-300 dark:border-gray-700" style={{ height: 48 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, alignItems: 'center', gap: 8 }}
      >
        {FILTERS.map((filter, index) => (
          <Chip
            key={filter}
            label={filter}
            selected={selectedIndex === index}
            onPress={() => onSelect(index)}
            color={color}
          />
        ))}
      </ScrollView>
    </View>
  );
}
