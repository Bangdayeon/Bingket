import { Chip } from '@/components/Chip';
import { AddEachBingo } from './AddEachBingo';
import { ScrollView, View } from 'react-native';
import { Text } from '@/components/Text';
import { SectionLabel } from './SectionLabel';
import { fetchThemes } from '@/features/bingo/lib/theme';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const GRID_OPTIONS: { value: string; label: string }[] = [
  { value: '3x3', label: '3x3' },
  { value: '4x3', label: '3x4' },
  { value: '4x4', label: '4x4' },
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
  onDraftCellsChange?: (cells: string[]) => void;
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
  onDraftCellsChange,
}: WriteBingoProps) {
  const { t } = useTranslation();
  const [themes, setThemes] = useState<{ id: string; displayName: string }[]>([]);

  const editCountOptions = [
    {
      value: '0',
      label: t('bingo.modifyCount.none'),
    },
    {
      value: '1',
      label: t('bingo.modifyCount.count', { count: 1 }),
    },
    {
      value: '2',
      label: t('bingo.modifyCount.count', { count: 2 }),
    },
    {
      value: '3',
      label: t('bingo.modifyCount.count', { count: 3 }),
    },
    {
      value: '무제한',
      label: t('bingo.modifyCount.infinite'),
    },
  ];

  useEffect(() => {
    fetchThemes().then((map) => {
      const unique = Object.values(map).filter(
        (v, i, arr) => arr.findIndex((t) => t.id === v.id) === i,
      );
      setThemes(unique.map((t) => ({ id: t.id, displayName: t.displayName })));
    });
  }, []);

  return (
    <View style={{ gap: 32 }}>
      <View>
        <View className="px-4">
          <SectionLabel label={t('bingo.cellGrid.label')} hint={t('bingo.cellGrid.hint')} />
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
        <Text className="px-4 pt-2 text-caption-sm text-gray-600">
          {t('bingo.cellGrid.description')}
        </Text>
      </View>

      <View>
        <View className="px-4">
          <SectionLabel label={t('bingo.modifyCount.label')} hint={t('bingo.modifyCount.hint')} />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
        >
          {editCountOptions.map((opt) => (
            <Chip
              key={opt.value}
              label={opt.label}
              selected={selectedEditCount === opt.value}
              onPress={() => onEditCountSelect(opt.value)}
            />
          ))}
        </ScrollView>
      </View>

      <View>
        <View className="px-4">
          <SectionLabel label={t('home.field.selectTheme')} />
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
      </View>

      <View className="gap-4">
        <View className="px-4">
          <SectionLabel label={t('bingo.cell.label')} hint={t('bingo.cell.hint')} />
        </View>
        <AddEachBingo
          selectedGrid={selectedGrid}
          theme={selectedTheme}
          title={title}
          cells={cells}
          onCellsChange={onCellsChange}
          onDraftCellsChange={onDraftCellsChange}
        />
      </View>
    </View>
  );
}
