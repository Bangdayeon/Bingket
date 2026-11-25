import { Chip } from '@/components/Chip';
import { AddEachBingo } from './AddEachBingo';
import { ScrollView, View } from 'react-native';
import { Text } from '@/components/Text';
import { SectionLabel } from './SectionLabel';
import { fetchThemes, getThemeName, type BingoThemeConfig } from '@/features/bingo/lib/theme';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import Button from '@/components/Button';
import { fetchFavoriteThemeIds, takeAppliedTheme } from '@/features/bingo/lib/theme-interactions';

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
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const onThemeSelectRef = useRef(onThemeSelect);
  useEffect(() => {
    onThemeSelectRef.current = onThemeSelect;
  }, [onThemeSelect]);
  const [themes, setThemes] = useState<BingoThemeConfig[]>([]);

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

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const applied = takeAppliedTheme();
      if (applied) onThemeSelectRef.current(applied);
      Promise.all([fetchThemes(true), fetchFavoriteThemeIds()])
        .then(([map, favorites]) => {
          if (active)
            setThemes(
              Object.values(map)
                .filter((v, i, arr) => arr.findIndex((t) => t.id === v.id) === i)
                .sort(
                  (a, b) =>
                    Number(favorites.has(b.id)) - Number(favorites.has(a.id)) ||
                    a.sortOrder - b.sortOrder ||
                    a.id.localeCompare(b.id),
                ),
            );
        })
        .catch(() => {
          void fetchThemes(true).then((map) => {
            if (active)
              setThemes(
                Object.values(map)
                  .filter((v, i, arr) => arr.findIndex((t) => t.id === v.id) === i)
                  .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id)),
              );
          });
        });
      return () => {
        active = false;
      };
    }, []),
  );

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
        {selectedGrid === '4x3' && (
          <Text className="px-4 pt-2 text-caption-sm text-gray-600">
            {t('bingo.cellGrid.description')}
          </Text>
        )}
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
        <View className="flex-row items-center justify-between px-4">
          <SectionLabel label={t('home.field.selectTheme')} />
          <Button
            label="더보기"
            variant="ghost"
            size="sm"
            onClick={() => router.push('/bingo/themes')}
          />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
        >
          {themes.map((theme) => (
            <Chip
              key={theme.id}
              label={getThemeName(theme, i18n.language)}
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
        />
      </View>
    </View>
  );
}
