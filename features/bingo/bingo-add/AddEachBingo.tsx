import { Modal } from '@/components/Modal';
import { useState } from 'react';
import { Dimensions, Image, TextInput, TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/Text';
import { getThemeImage, FIGMA_W, FIGMA_H, GRID_CONFIGS } from '../lib/theme-config';

interface AddBingoProps {
  selectedGrid: string;
  theme: string;
  cells: string[];
  onCellsChange: (cells: string[]) => void;
}

export function AddEachBingo({ selectedGrid, theme, cells, onCellsChange }: AddBingoProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [inputText, setInputText] = useState('');

  const [cols, rows] = selectedGrid.split('x').map(Number);
  const availableWidth = Dimensions.get('window').width - 40;
  const textStyle = selectedGrid === '3x3' ? 'text-body-sm' : 'text-caption-md';

  const image = getThemeImage(theme, selectedGrid);

  const handleCellPress = (index: number) => {
    setInputText(cells[index] ?? '');
    setSelectedIndex(index);
  };

  const handleSave = () => {
    if (selectedIndex === null) return;
    const updated = [...cells];
    updated[selectedIndex] = inputText;
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
          placeholderTextColor="#929898" /* gray-500 */
          multiline
          className="text-body-sm text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 rounded-2xl p-3 min-h-[80px]"
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

  // 테마 이미지가 있을 때: 이미지 배경 위에 셀 절대 위치 렌더링
  if (image !== null) {
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
            source={image}
            style={{ position: 'absolute', width: '100%', height: '100%' }}
            resizeMode="cover"
          />
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
                  {cells[i] ?? ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {modal}
      </>
    );
  }

  // 기본: 테마 이미지 없을 때 기존 스타일 렌더링
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
              {cells[i] ?? ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {modal}
    </>
  );
}
