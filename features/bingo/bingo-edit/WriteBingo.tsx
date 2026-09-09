import { Chip } from '@/components/Chip';
import { AddEachBingo } from './AddEachBingo';
import { ScrollView, View } from 'react-native';
import { Text } from '@/components/Text';
import { SectionLabel } from './SectionLabel';
import { fetchThemes } from '@/features/bingo/lib/theme';
import { useEffect, useState } from 'react';

// 내부 키는 DB·GRID_CONFIGS와 맞춰 두고, 화면에는 시안 표기(3x4)로 보여준다.
const GRID_OPTIONS: { value: string; label: string }[] = [
  { value: '3x3', label: '3x3' },
  { value: '4x3', label: '3x4' },
  { value: '4x4', label: '4x4' },
];

const EDIT_COUNT_OPTIONS: { value: string; label: string }[] = [
  { value: '0', label: '수정 불가' },
  { value: '1', label: '1회' },
  { value: '2', label: '2회' },
  { value: '3', label: '3회' },
  { value: '무제한', label: '무제한' },
];

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
    <View className="py-6">
      {/* 빙고 칸 수 */}
      <View className="px-4">
        <SectionLabel label="빙고 칸 수" hint="저장 후 변경 불가" />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
      >
        {GRID_OPTIONS.map((opt) => (
          <Chip
            key={opt.value}
            label={opt.label}
            selected={selectedGrid === opt.value}
            onPress={() => onGridSelect(opt.value)}
          />
        ))}
      </ScrollView>
      <Text className="px-4 pb-5 pt-2 text-caption-sm text-gray-600">
        대각선 3칸도 빙고로 인정돼요
      </Text>

      {/* 각 항목 수정 가능 횟수 */}
      <View className="px-4">
        <SectionLabel label="각 항목 수정 가능 횟수" hint="저장 후 변경 불가" />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
      >
        {EDIT_COUNT_OPTIONS.map((opt) => (
          <Chip
            key={opt.value}
            label={opt.label}
            selected={selectedEditCount === opt.value}
            onPress={() => onEditCountSelect(opt.value)}
          />
        ))}
      </ScrollView>

      {/* 테마 선택 */}
      <View className="px-4 pt-5">
        <SectionLabel label="테마 선택" />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
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

      {/* 빙고 내용 작성 — 판은 화면 좌우 끝까지 */}
      <View className="px-4 pt-5">
        <SectionLabel label="빙고 내용 작성" hint="각 칸을 선택해서 빙고 내용을 채워주세요." />
      </View>
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
