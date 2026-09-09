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

interface BingoCardProps {
  bingo: BingoData;
  completedCells?: boolean[];
  onCellPress: (index: number) => void;
  onEditPress?: () => void;
  /** 팀 빙고일 때만 넘긴다. 팀 현황으로 이동한다 */
  onTeamPress?: () => void;
  /** 비어 있으면 개인 빙고로 보고 아이콘을 그리지 않는다 */
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
  const [image, setImage] = useState<string | null>(null);
  const [checkImage, setCheckImage] = useState<string | null>(null);
  const [fgColor, setFgColor] = useState<string>(FIXED.boardForeground);
  const boardRef = useRef<View>(null);
  // 캡처 중에는 저장·편집 버튼을 감춘다
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
  const textStyle = bingo.grid === '3x3' ? 'text-body-sm' : 'text-caption-md';
  const screenWidth = contentWidth;

  // 시작일 - 종료일. 둘 중 하나만 있으면 있는 쪽만 보여준다 (제작 중 빙고는 비어 있을 수 있다)
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
    // 배경이 아직 안 왔으면 빈 판이 찍힌다. 버튼도 이때는 안 그리지만 한 번 더 막는다.
    if (!image) return;
    setCapturing(true);
    // 버튼을 감춘 프레임이 실제로 그려진 뒤에 찍어야 이미지에 버튼이 남지 않는다
    InteractionManager.runAfterInteractions(async () => {
      try {
        await shareBingoBoard(boardRef, bingo.title, {
          // 화면 폭 그대로 뽑으면 저해상도라 2배로 키워 캡처한다
          width: screenWidth * 2,
          height: cardHeight * 2,
        });
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
          {/* display:none으로 지우면 레이아웃이 흔들려 opacity로만 감춘다 */}
          <View className="flex-row items-center gap-3" style={{ opacity: capturing ? 0 : 1 }}>
            {/* 테마 배경을 받기 전에는 캡처해봐야 빈 판이라 버튼을 내놓지 않는다 */}
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
                // 칸은 모든 테마에서 밝은 색이라 글씨는 늘 어두워야 한다. 토큰 색은 다크모드에서 흰색으로 뒤집혀 사라지고, 테마의 fgColor는 제목용이라 밝을 수 있어 칸에는 못 쓴다.
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
            <BingoStat label="달성" current={bingo.achievedCount} total={cols * rows} />
          </View>
          <View className="items-center">
            <BingoStat
              label="빙고"
              current={bingo.bingoCount}
              total={calcMaxBingo(cols, rows)}
              overflowRed
            />
          </View>
          <View className="items-center">
            <BingoStat
              label="종료일"
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

          {/* 팀 빙고 표시 겸 현황 이동. 개인 빙고에는 그리지 않는다. */}
          {onTeamPress && teamMembers && teamMembers.length > 0 && (
            <TouchableOpacity onPress={onTeamPress} hitSlop={8}>
              <TeamAvatars members={teamMembers} size={32} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Toast
        message="빙고판을 저장하지 못했어요. 잠시 후 다시 시도해 주세요."
        visible={saveFailed}
        onDismiss={() => setSaveFailed(false)}
      />
    </View>
  );
}
