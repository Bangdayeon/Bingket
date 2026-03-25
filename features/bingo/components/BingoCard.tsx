import { Dimensions, Image, Pressable, TouchableOpacity, View, useColorScheme } from 'react-native';
import { Text } from '@/components/Text';
import EditIcon from '@/assets/icons/ic_edit.svg';
import { BingoData } from '@/types/bingo';
import { getThemeImage, FIGMA_W, FIGMA_H, GRID_CONFIGS } from '../lib/theme-config';

interface BingoCardProps {
  bingo: BingoData;
  completedCells?: boolean[];
  onCellPress: (index: number) => void;
  onEditPress?: () => void;
}

export function BingoCard({
  bingo,
  completedCells = [],
  onCellPress,
  onEditPress,
}: BingoCardProps) {
  const isDark = useColorScheme() === 'dark';
  const editIconColor = isDark ? '#F6F7F7' /* gray-100 */ : '#4C5252'; /* gray-700 */
  const [cols, rows] = bingo.grid.split('x').map(Number);
  const textStyle = bingo.grid === '3x3' ? 'text-body-sm' : 'text-caption-md';
  const screenWidth = Dimensions.get('window').width;
  const image = getThemeImage(bingo.theme, bingo.grid);
  const checkImage = getThemeImage(bingo.theme, 'check');

  if (image !== null) {
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
      <View className="pb-32">
        {/* 이미지 + 셀 오버레이 */}
        <View style={{ width: screenWidth, height: cardHeight }}>
          <Image
            source={image}
            style={{ position: 'absolute', width: '100%', height: '100%' }}
            resizeMode="cover"
          />

          {/* 제목 + 편집 아이콘 */}
          <View className="pt-5 px-5 items-center justify-between flex-row absolute w-full">
            <Text className="text-title-md">{bingo.title}</Text>
            {onEditPress && (
              <TouchableOpacity onPress={onEditPress} hitSlop={8}>
                <EditIcon width={18} height={18} color={editIconColor} />
              </TouchableOpacity>
            )}
          </View>

          {/* 빙고 그리드 */}
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
                  padding: 8 /* px-2 */,
                }}
              >
                <Text
                  className={`${textStyle} text-center`}
                  style={{ color: '#181C1C' /* gray-900 */ }}
                  numberOfLines={3}
                >
                  {bingo.cells[i] ?? ''}
                </Text>
                {completedCells[i] && checkImage && (
                  <Image
                    source={checkImage}
                    style={{ position: 'absolute', width: '100%', height: '100%' }}
                    resizeMode="contain"
                  />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* 스탯 — 이미지 외부 */}
        <View className="flex-row mt-4">
          <View className="flex-1 items-center gap-1">
            <Text className="text-label-sm">달성</Text>
            <Text className="text-body-sm">
              {bingo.achievedCount}/{cols * rows}
            </Text>
          </View>
          <View className="flex-1 items-center gap-1">
            <Text className="text-label-sm">빙고</Text>
            <Text className="text-body-sm">{bingo.bingoCount}</Text>
          </View>
          <View className="flex-1 items-center gap-1">
            <Text className="text-label-sm">D-day</Text>
            <Text className="text-body-sm">{bingo.dday}</Text>
          </View>
        </View>
      </View>
    );
  }
}
