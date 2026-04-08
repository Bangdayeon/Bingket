// BingoCard.tsx (수정)

import { Dimensions, Image, Pressable, TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/Text';
import EditIcon from '@/assets/icons/ic_edit.svg';
import AddBattleIcon from '@/assets/icons/ic_add_battle.svg';
import BattleIcon from '@/assets/icons/ic_battle.svg';
import { BingoData } from '@/types/bingo';
import { DonutStat } from './DonutStat';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { calcMaxBingo } from '@/lib/calcMaxBingo';
import { useEffect, useState } from 'react';
import {
  FIGMA_W,
  FIGMA_H,
  GRID_CONFIGS,
  getThemeImageUrl,
  getThemeForegroundColor,
} from '@/features/bingo/lib/theme';

const DAY_MS = 24 * 60 * 60 * 1000;

function calcDayProgress(startDate: string | null, targetDate: string | null): [number, number] {
  if (!startDate || !targetDate) return [0, 0];
  const start = new Date(startDate).getTime();
  const end = new Date(targetDate).getTime();
  const total = Math.max(Math.round((end - start) / DAY_MS), 1);
  const elapsed = Math.min(Math.max(Math.round((Date.now() - start) / DAY_MS), 0), total);
  return [elapsed, total];
}

function formatDate(date: string | null): string {
  if (!date) return '';
  const [y, m, d] = date.split('-');
  return `${y.slice(2)}.${m}.${d}`;
}

interface BingoCardProps {
  bingo: BingoData;
  completedCells?: boolean[];
  onCellPress: (index: number) => void;
  onEditPress?: () => void;
  onBattlePress?: () => void;
  hasBattle?: boolean;
  friendAvatarUrl?: string | null;
}

export function BingoCard({
  bingo,
  completedCells = [],
  onCellPress,
  onEditPress,
  onBattlePress,
  hasBattle = false,
  friendAvatarUrl,
}: BingoCardProps) {
  const [image, setImage] = useState<string | null>(null);
  const [checkImage, setCheckImage] = useState<string | null>(null);
  const [fgColor, setFgColor] = useState<string>('#181C1C');

  useEffect(() => {
    const load = async () => {
      const [bg, check, color] = await Promise.all([
        getThemeImageUrl(bingo.theme, bingo.grid as '3x3' | '4x3' | '4x4'),
        getThemeImageUrl(bingo.theme, 'check'),
        getThemeForegroundColor(bingo.theme),
      ]);
      setImage(bg);
      setCheckImage(check);
      setFgColor(color);
    };
    load();
  }, [bingo.theme, bingo.grid]);

  const [cols, rows] = bingo.grid.split('x').map(Number);
  const textStyle = bingo.grid === '3x3' ? 'text-body-sm' : 'text-caption-md';
  const screenWidth = Dimensions.get('window').width;

  const [dayElapsed, dayTotal] = calcDayProgress(bingo.startDate, bingo.targetDate);
  const formattedEndDate = formatDate(bingo.targetDate);

  if (!image)
    return (
      <View
        style={{ width: screenWidth, height: screenWidth * (FIGMA_H / FIGMA_W) }}
        className="bg-gray-100 dark:bg-gray-800"
      />
    );

  const scale = screenWidth / FIGMA_W;
  const cardHeight = FIGMA_H * scale;
  const cfg = GRID_CONFIGS[bingo.grid];
  const gridTop = cfg.top * scale;
  const gridLeft = cfg.left * scale;
  const cellW = cfg.cellW * scale;
  const cellH = cfg.cellH * scale;
  const gapX = cfg.gapX * scale;
  const gapY = cfg.gapY * scale;

  return (
    <View className="pb-24">
      <View style={{ width: screenWidth, height: cardHeight }}>
        <Image
          source={{ uri: image }}
          style={{ position: 'absolute', width: '100%', height: '100%' }}
          resizeMode="cover"
        />

        <View className="pt-7 px-5 items-center justify-between flex-row absolute w-full">
          <Text className="text-title-md" style={{ color: fgColor }}>
            {bingo.title}
          </Text>
          {onEditPress && (
            <TouchableOpacity onPress={onEditPress} hitSlop={8}>
              <EditIcon width={18} height={18} color={fgColor} />
            </TouchableOpacity>
          )}
        </View>

        {Array.from({ length: cols * rows }).map((_, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          return (
            <Pressable
              key={i}
              onPress={() => onCellPress(i)}
              style={{
                position: 'absolute',
                left: gridLeft + col * (cellW + gapX),
                top: gridTop + row * (cellH + gapY),
                width: cellW,
                height: cellH,
                alignItems: 'center',
                justifyContent: 'center',
                padding: 8,
              }}
            >
              <Text
                className={`${textStyle} text-center`}
                style={{ color: '#181C1C' }}
                numberOfLines={3}
              >
                {bingo.cells[i] ?? ''}
              </Text>

              {completedCells[i] && checkImage && (
                <Image
                  source={{ uri: checkImage }}
                  style={{ position: 'absolute', width: '100%', height: '100%' }}
                  resizeMode="contain"
                />
              )}
            </Pressable>
          );
        })}
      </View>

      <View className="mt-10">
        <View className="flex-row">
          <View className="flex-1 items-center">
            <DonutStat label="달성" current={bingo.achievedCount} total={cols * rows} />
          </View>
          <View className="flex-1 items-center">
            <DonutStat
              label="빙고"
              current={bingo.bingoCount}
              total={calcMaxBingo(cols, rows)}
              overflowRed
            />
          </View>
          <View className="flex-1 items-center">
            <DonutStat label="종료일" current={dayElapsed} total={dayTotal} />
          </View>
        </View>

        <View className="flex-row items-center justify-between px-5 mt-10 gap-3">
          {formattedEndDate ? (
            <Text className="text-caption-sm text-gray-600">{formattedEndDate}</Text>
          ) : null}

          {onBattlePress && (
            <TouchableOpacity onPress={onBattlePress} hitSlop={8}>
              {hasBattle ? (
                <View className="flex-row items-center gap-2">
                  <BattleIcon width={22} height={22} color="#4C5252" />
                  <ProfileAvatar size={22} avatarUrl={friendAvatarUrl} />
                </View>
              ) : (
                <AddBattleIcon width={22} height={22} color="#4C5252" />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}
