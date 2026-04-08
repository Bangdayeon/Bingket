import { Modal } from '@/components/Modal';
import { useEffect, useState } from 'react';
import { Dimensions, Image, TouchableOpacity, View } from 'react-native';
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
  const [fgColor, setFgColor] = useState<string>('#181C1C');

  useEffect(() => {
    setLocalCells(cells);
  }, [cells]);

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

  const [cols, rows] = selectedGrid.split('x').map(Number);
  const availableWidth = Dimensions.get('window').width - 40;
  const textStyle = selectedGrid === '3x3' ? 'text-body-sm' : 'text-caption-md';

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
          maxHeight={120}
          className="min-h-[72px]"
          style={{ textAlignVertical: 'top' }}
        />
      }
      variant="default"
      cancelLabel="취소하기"
      confirmLabel="저장하기"
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
                className="text-title-md"
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
                <Text className={`${textStyle} text-center`} numberOfLines={3}>
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
            style={{
              width: cellSize,
              height: cellSize,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#D2D6D6' /* gray-300 */,
              backgroundColor: '#FDFDFD' /* white */,
              alignItems: 'center',
              justifyContent: 'center',
              padding: 4,
            }}
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
