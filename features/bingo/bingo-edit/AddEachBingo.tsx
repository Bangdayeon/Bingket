import { Modal } from '@/components/Modal';
import { FIXED } from '@/lib/use-colors';
import { LIMITS } from '@/constants/limits';
import { useEffect, useState } from 'react';
import { Image, TouchableOpacity, View } from 'react-native';
import { useResponsive } from '@/lib/use-responsive';
import { Text } from '@/components/Text';
import { TextInput } from '@/components/TextInput';
import {
  FIGMA_W,
  FIGMA_H,
  GRID_CONFIGS,
  getThemeImageUrl,
  getThemeForegroundColor,
} from '@/features/bingo/lib/theme';

interface AddEachBingoProps {
  selectedGrid: string;
  theme: string;
  title?: string;
  cells: string[];
  onCellsChange: (cells: string[]) => void;
  disabledCells?: boolean[];
}

export function AddEachBingo({
  selectedGrid,
  theme,
  title,
  cells,
  onCellsChange,
  disabledCells,
}: AddEachBingoProps) {
  const [localCells, setLocalCells] = useState<string[]>(cells);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [inputText, setInputText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [fgColor, setFgColor] = useState<string>(FIXED.boardForeground);

  // prop이 바뀌면 렌더 중에 맞춘다(효과로 미러링하면 렌더가 한 번 더 돈다).
  const [prevCells, setPrevCells] = useState(cells);
  if (cells !== prevCells) {
    setPrevCells(cells);
    setLocalCells(cells);
  }

  useEffect(() => {
    const load = async () => {
      const [bg, color] = await Promise.all([
        getThemeImageUrl(theme, selectedGrid as '3x3' | '4x3' | '4x4'),
        getThemeForegroundColor(theme),
      ]);
      setImage(bg);
      setFgColor(color);
    };
    load();
  }, [theme, selectedGrid]);

  const { contentWidth } = useResponsive();
  const [cols, rows] = selectedGrid.split('x').map(Number);
  // 시안: 판은 좌우 여백 없이 화면 폭 전체를 쓴다
  const availableWidth = contentWidth;
  // 완성된 판(BingoCard)과 같은 크기로 보여야 작성 중과 결과가 어긋나지 않는다
  const textStyle = 'text-caption-sm';

  const handleCellPress = (index: number) => {
    if (disabledCells?.[index]) return;
    setInputText(localCells[index] ?? '');
    setSelectedIndex(index);
  };

  const handleSave = () => {
    if (selectedIndex === null) return;
    const updated = [...localCells];
    updated[selectedIndex] = inputText;
    setLocalCells(updated);
    onCellsChange(updated);
    setSelectedIndex(null);
  };

  const handleCancel = () => {
    setSelectedIndex(null);
  };

  const modal = (
    <Modal
      visible={selectedIndex !== null}
      title="빙고 내용을 입력해주세요"
      body={
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="내용을 입력하세요."
          maxLength={LIMITS.bingoCell}
          maxHeight={120}
          className="min-h-[72px]"
          style={{ textAlignVertical: 'top' }}
        />
      }
      variant="default"
      cancelLabel="취소"
      confirmLabel="저장"
      onCancel={handleCancel}
      onConfirm={handleSave}
      onDismiss={handleCancel}
    />
  );

  if (image) {
    const scale = availableWidth / FIGMA_W;
    const cardHeight = FIGMA_H * scale;
    const cfg = GRID_CONFIGS[selectedGrid];
    const gridTop = cfg.top * scale;
    const gridLeft = cfg.left * scale;
    const cellW = cfg.cellW * scale;
    const cellH = cfg.cellH * scale;
    const gapX = cfg.gapX * scale;
    const gapY = cfg.gapY * scale;

    return (
      <>
        <View style={{ width: availableWidth, height: cardHeight }}>
          <Image
            source={{ uri: image }}
            style={{ position: 'absolute', width: '100%', height: '100%' }}
            resizeMode="cover"
          />

          {title ? (
            <View
              style={{
                position: 'absolute',
                top: 16,
                left: 16,
                right: 16,
              }}
            >
              <Text
                className="text-title-md font-pretendard-medium"
                style={{ color: fgColor }}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {title}
              </Text>
            </View>
          ) : null}

          {Array.from({ length: cols * rows }).map((_, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            return (
              <TouchableOpacity
                key={i}
                onPress={() => handleCellPress(i)}
                activeOpacity={0.6}
                style={{
                  position: 'absolute',
                  left: gridLeft + col * (cellW + gapX),
                  top: gridTop + row * (cellH + gapY),
                  width: cellW,
                  height: cellH,
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 4,
                }}
              >
                {/* 판 이미지 위라 앱 테마가 아니라 판의 전경색을 따라야 한다.
                    아래 폴백 그리드는 앱 표면 위에 그리므로 기본 토큰 색이 맞다. */}
                <Text
                  className={`${textStyle} text-center`}
                  // 칸은 모든 테마에서 밝은 색이라 글씨는 늘 어두워야 한다. 토큰 색은 다크모드에서 흰색으로 뒤집혀 사라지고, 테마의 fgColor는 제목용이라 밝을 수 있어 칸에는 못 쓴다.
                  style={{ color: FIXED.boardForeground }}
                  numberOfLines={3}
                >
                  {localCells[i] ?? ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {modal}
      </>
    );
  }

  const gap = 6;
  const cellSize = (availableWidth - gap * (cols - 1)) / cols;

  return (
    <>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
        {Array.from({ length: cols * rows }).map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => handleCellPress(i)}
            activeOpacity={0.7}
            className="items-center justify-center rounded-lg border border-gray-300 bg-white p-1"
            style={{ width: cellSize, height: cellSize }}
          >
            <Text className={`${textStyle} text-center`} numberOfLines={3}>
              {localCells[i] ?? ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {modal}
    </>
  );
}
