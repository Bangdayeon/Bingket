import { Image } from 'expo-image';
import { FIXED } from '@/lib/use-colors';
import { InteractionManager, Pressable, TouchableOpacity, View } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { Text } from '@/components/Text';
import { useResponsive } from '@/lib/use-responsive';
import EditIcon from '@/assets/icons/ic_edit.svg';
import ShareIcon from '@/assets/icons/ic_share.svg';
import { Toast } from '@/components/Toast';
import { BingoData } from '@/types/bingo';
import { BingoStat } from './BingoStat';
import { TeamAvatars, type TeamAvatarMember } from '@/features/team/components/TeamAvatars';
import { calcMaxBingo } from '@/lib/calcMaxBingo';
import { getBingoPeriod } from '@/lib/bingo-period';
import { useEffect, useRef, useState } from 'react';
import {
  FIGMA_W,
  FIGMA_H,
  GRID_CONFIGS,
  getThemeImageUrl,
  getThemeForegroundColor,
} from '@/features/bingo/lib/theme';
import { shareBingoBoard } from '@/features/bingo/lib/share-board';
import { useTranslation } from 'react-i18next';

interface BingoCardProps {
  bingo: BingoData;
  completedCells?: boolean[];
  onCellPress: (index: number) => void;
  onEditPress?: () => void;
  onTeamPress?: () => void;
  teamMembers?: TeamAvatarMember[];
}

export function BingoCard({
  bingo,
  completedCells = [],
  onCellPress,
  onEditPress,
  onTeamPress,
  teamMembers,
}: BingoCardProps) {
  const { t } = useTranslation();
  const [image, setImage] = useState<string | null>(null);
  const [checkImage, setCheckImage] = useState<string | null>(null);
  const [fgColor, setFgColor] = useState<string>(FIXED.boardForeground);
  const boardRef = useRef<View>(null);
  const [capturing, setCapturing] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

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

  const { isTablet, contentWidth } = useResponsive();
  const [cols, rows] = bingo.grid.split('x').map(Number);
  const textStyle = 'text-caption-sm';
  const screenWidth = contentWidth;

  const {
    elapsed: dayElapsed,
    total: dayTotal,
    formatted: formattedPeriod,
  } = getBingoPeriod(bingo.startDate, bingo.targetDate);

  if (!image)
    return (
      <View
        style={{ width: screenWidth, height: screenWidth * (FIGMA_H / FIGMA_W) }}
        className="bg-gray-100  "
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

  const handleSharePress = () => {
    if (!image) return;
    setCapturing(true);
    InteractionManager.runAfterInteractions(async () => {
      try {
        await shareBingoBoard(
          boardRef,
          bingo.title,
          {
            width: screenWidth * 1.5,
            height: cardHeight * 1.5,
          },
          t,
        );
      } catch (e) {
        Sentry.captureException(e);
        setSaveFailed(true);
      } finally {
        setCapturing(false);
      }
    });
  };

  return (
    <View className={isTablet ? 'items-center' : undefined}>
      <View ref={boardRef} collapsable={false} style={{ width: screenWidth, height: cardHeight }}>
        <Image
          source={{ uri: image }}
          style={{ position: 'absolute', width: '100%', height: '100%' }}
          contentFit="cover"
          cachePolicy="memory-disk"
        />

        <View className="pt-7 px-5 items-center justify-between flex-row absolute w-full">
          <Text
            className="flex-1 text-title-md font-pretendard-medium"
            style={{ color: fgColor, fontWeight: 600 }}
            numberOfLines={1}
          >
            {bingo.title}
          </Text>
          <View className="flex-row items-center gap-3" style={{ opacity: capturing ? 0 : 1 }}>
            {image && (
              <TouchableOpacity onPress={handleSharePress} hitSlop={8}>
                <ShareIcon width={24} height={24} color={fgColor} />
              </TouchableOpacity>
            )}
            {onEditPress && (
              <TouchableOpacity onPress={onEditPress} hitSlop={8}>
                <EditIcon width={24} height={24} color={fgColor} />
              </TouchableOpacity>
            )}
          </View>
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
                style={{ color: FIXED.boardForeground }}
                numberOfLines={3}
              >
                {bingo.cells[i] ?? ''}
              </Text>

              {completedCells[i] && checkImage && (
                <Image
                  source={{ uri: checkImage }}
                  style={{ position: 'absolute', width: '100%', height: '100%' }}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                />
              )}
            </Pressable>
          );
        })}
      </View>

      <View className="mt-6" style={isTablet ? { width: screenWidth } : undefined}>
        <View className="flex-row justify-between px-10">
          <View className="items-center">
            <BingoStat
              label={t('bingo.stat.achievement')}
              current={bingo.achievedCount}
              total={cols * rows}
            />
          </View>
          <View className="items-center">
            <BingoStat
              label={t('bingo.stat.bingo')}
              current={bingo.bingoCount}
              total={calcMaxBingo(cols, rows)}
              overflowRed
            />
          </View>
          <View className="items-center">
            <BingoStat
              label={t('bingo.stat.endDate')}
              current={dayElapsed}
              total={dayTotal}
              valueText={dayTotal >= 1000 ? `D-${bingo.dday}` : undefined}
            />
          </View>
        </View>

        <View className="mt-8 flex-row items-center justify-between gap-3 px-4">
          {formattedPeriod ? (
            <Text className="text-caption-sm text-gray-700">{formattedPeriod}</Text>
          ) : null}

          {onTeamPress && teamMembers && teamMembers.length > 0 && (
            <TouchableOpacity onPress={onTeamPress} hitSlop={8}>
              <TeamAvatars members={teamMembers} size={32} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Toast
        message={`${t('bingo.error.bingoSave')} ${t('common.error.retry')}`}
        visible={saveFailed}
        onDismiss={() => setSaveFailed(false)}
      />
    </View>
  );
}
