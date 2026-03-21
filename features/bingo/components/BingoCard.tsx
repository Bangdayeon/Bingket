import { Dimensions, Pressable, TouchableOpacity, View, useColorScheme } from 'react-native';
import { Text } from '@/components/Text';
import EditIcon from '@/assets/icons/ic_edit.svg';
import { BingoData } from '@/types/bingo';

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
  const gap = 6;
  const availableWidth = Dimensions.get('window').width - 40;
  const cellSize = (availableWidth - gap * (cols - 1)) / cols;
  const textStyle = bingo.grid === '3x3' ? 'text-body-sm' : 'text-caption-md';

  return (
    <View className="pb-40">
      {/* 제목 + 편집 아이콘 */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-title-md">{bingo.title}</Text>
        {onEditPress && (
          <TouchableOpacity onPress={onEditPress} hitSlop={8}>
            <EditIcon width={18} height={18} color={editIconColor} />
          </TouchableOpacity>
        )}
      </View>

      {/* 빙고 그리드 */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
        {Array.from({ length: cols * rows }).map((_, i) => (
          <Pressable
            key={i}
            onPress={() => onCellPress(i)}
            style={{
              width: cellSize,
              height: cellSize,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: completedCells[i] ? '#8EF275' : '#D2D6D6' /* green-400 : gray-300 */,
              backgroundColor: completedCells[i] ? '#F2FDE8' : '#FDFDFD' /* green-100 : white */,
              alignItems: 'center',
              justifyContent: 'center',
              padding: 4,
            }}
          >
            <Text
              className={`${textStyle} text-center`}
              style={{ color: '#181C1C' /* gray-900 */ }}
              numberOfLines={3}
            >
              {bingo.cells[i] ?? ''}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* 스탯 */}
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
