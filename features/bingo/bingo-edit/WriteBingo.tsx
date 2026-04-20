import { Chip } from '@/components/Chip';
import { AddEachBingo } from './AddEachBingo';
import { ScrollView, View } from 'react-native';
import { Text } from '@/components/Text';
import { Information } from '@/components/Information';
import { fetchThemes } from '@/features/bingo/lib/theme';
import { useEffect, useState } from 'react';

const GRID_OPTIONS = ['3x3', '4x3', '4x4'];
const EDIT_COUNT_OPTIONS = ['0', '1', '2', '3', '무제한'];

interface WriteBingoProps {
  title?: string;
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
  title,
  selectedGrid,
  onGridSelect,
  selectedEditCount,
  onEditCountSelect,
  selectedTheme,
  onThemeSelect,
  cells,
  onCellsChange,
}: WriteBingoProps) {
  const [themes, setThemes] = useState<{ id: string; displayName: string }[]>([]);

  useEffect(() => {
    fetchThemes().then((map) => {
      const unique = Object.values(map).filter(
        (v, i, arr) => arr.findIndex((t) => t.id === v.id) === i,
      );
      setThemes(unique.map((t) => ({ id: t.id, displayName: t.displayName })));
    });
  }, []);

  return (
    <View className="px-5 py-6 border-t border-gray-100  ">
      <Text className="text-title-md font-pretendard-medium mb-4">빙고 작성</Text>

      {/* 칸 개수 */}
      <View className="flex-row items-center gap-2 mb-3">
        <Text className="text-title-sm">칸 개수</Text>
        <Information
          content={`• 처음 지정 후 수정이 불가능해요.\n• 4x3 빙고는 대각선 3칸도 빙고로 인정이 돼요`}
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 20 }}
      >
        {GRID_OPTIONS.map((opt) => (
          <Chip
            key={opt}
            label={opt}
            selected={selectedGrid === opt}
            onPress={() => onGridSelect(opt)}
          />
        ))}
      </ScrollView>

      {/* 수정 가능 횟수 */}
      <View className="flex-row items-center gap-2 mb-2">
        <Text className="text-title-sm">수정 가능 횟수</Text>
        <Information content="처음 지정 후 수정이 불가능해요." />
      </View>
      <Text className="text-body-sm text-gray-500   mb-3">
        빙고 항목을 수정할 수 있는 횟수를 선택해주세요.{'\n'}
        선택한 횟수만큼 원하는 항목을 바꿀 수 있어요.
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 20 }}
      >
        {EDIT_COUNT_OPTIONS.map((opt) => (
          <Chip
            key={opt}
            label={opt}
            selected={selectedEditCount === opt}
            onPress={() => onEditCountSelect(opt)}
          />
        ))}
      </ScrollView>

      {/* 테마 */}
      <Text className="text-title-sm mb-3">테마</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 20 }}
      >
        {themes.map((theme) => (
          <Chip
            key={theme.id}
            label={theme.displayName}
            selected={selectedTheme === theme.id}
            onPress={() => onThemeSelect(theme.id)}
          />
        ))}
      </ScrollView>

      {/* 빙고 그리드 */}
      <Text className="text-title-sm mb-2">빙고 내용 작성하기</Text>
      <Text className="text-body-sm text-gray-500   mb-3">
        아래에서 각 칸을 선택해서 빙고 내용을 채워주세요.
      </Text>
      <AddEachBingo
        selectedGrid={selectedGrid}
        theme={selectedTheme}
        title={title}
        cells={cells}
        onCellsChange={onCellsChange}
      />
    </View>
  );
}
