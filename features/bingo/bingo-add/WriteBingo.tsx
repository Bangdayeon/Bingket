import { Chip } from '@/components/Chip';
import { AddEachBingo } from './AddEachBingo';
import { View } from 'react-native';
import { Text } from '@/components/Text';

const GRID_OPTIONS = ['3x3', '4x3', '4x4'];
const EDIT_COUNT_OPTIONS = ['0', '1', '2', '3', '무제한'];
const THEME_OPTIONS = ['기본', '토끼', '붉은말', '고먐미'];

interface WriteBingoProps {
  selectedGrid: string;
  onGridSelect: (opt: string) => void;
  selectedEditCount: string;
  onEditCountSelect: (opt: string) => void;
  selectedTheme: string;
  onThemeSelect: (opt: string) => void;
  cells: string[];
  onCellsChange: (cells: string[]) => void;
}

export function WriteBingo({
  selectedGrid,
  onGridSelect,
  selectedEditCount,
  onEditCountSelect,
  selectedTheme,
  onThemeSelect,
  cells,
  onCellsChange,
}: WriteBingoProps) {
  return (
    <View className="px-5 pt-6 pb-5">
      <Text className="text-title-md mb-4">빙고 작성</Text>

      {/* 칸 개수 */}
      <View className="flex-row items-center gap-2 mb-3">
        <Text className="text-body-lg">칸 개수</Text>
        <Text className="text-caption-sm text-red-500">*처음 지정 후 수정이 불가능해요</Text>
      </View>
      <View className="flex-row flex-wrap gap-2 mb-5">
        {GRID_OPTIONS.map((opt) => (
          <Chip
            key={opt}
            label={opt}
            selected={selectedGrid === opt}
            onPress={() => onGridSelect(opt)}
          />
        ))}
      </View>

      {/* 수정 가능 횟수 */}
      <View className="flex-row items-center gap-2 mb-1">
        <Text className="text-body-lg">수정 가능 횟수</Text>
        <Text className="text-caption-sm text-red-500">*처음 지정 후 수정이 불가능해요</Text>
      </View>
      <Text className="text-body-sm text-gray-500 dark:text-gray-400 mb-3">
        빙고 저장 후 각 빙고 아이템 수정 가능 횟수를 정해주세요.
      </Text>
      <View className="flex-row flex-wrap gap-2 mb-6">
        {EDIT_COUNT_OPTIONS.map((opt) => (
          <Chip
            key={opt}
            label={opt}
            selected={selectedEditCount === opt}
            onPress={() => onEditCountSelect(opt)}
          />
        ))}
      </View>

      {/* 테마 */}
      <Text className="text-body-lg mb-3">테마</Text>
      <View className="flex-row flex-wrap gap-2 mb-5">
        {THEME_OPTIONS.map((opt) => (
          <Chip
            key={opt}
            label={opt}
            selected={selectedTheme === opt}
            onPress={() => onThemeSelect(opt)}
          />
        ))}
      </View>

      {/* 빙고 그리드 */}
      <Text className="text-body-lg mb-3">빙고 내용 작성하기</Text>
      <Text className="text-body-sm text-gray-500 dark:text-gray-400 mb-3">
        아래에서 각 칸을 선택해서 빙고 내용을 채워주세요.
      </Text>
      <AddEachBingo
        selectedGrid={selectedGrid}
        theme={selectedTheme}
        cells={cells}
        onCellsChange={onCellsChange}
      />
    </View>
  );
}
