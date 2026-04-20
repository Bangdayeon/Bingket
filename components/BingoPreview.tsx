import { Image } from 'expo-image';
import { View, Text, Pressable } from 'react-native';
import { useEffect, useState } from 'react';
import { BingoData } from '@/types/bingo';
import {
  FIGMA_W,
  FIGMA_H,
  GRID_CONFIGS,
  getThemeImageUrl,
  getThemeForegroundColor,
} from '@/features/bingo/lib/theme';

type PreviewSize = 'sm' | 'md';

const TITLE_STYLE: Record<
  PreviewSize,
  {
    top: number;
    left: number;
    right: number;
    fontSize: number;
    fontWeight: '600' | '700';
  }
> = {
  sm: { top: 30, left: 30, right: 30, fontSize: 12, fontWeight: '600' },
  md: { top: 48, left: 48, right: 48, fontSize: 18, fontWeight: '700' },
};

interface BingoPreviewProps {
  bingo: BingoData;
  completedCells?: boolean[];
  /** 제목 텍스트 크기 */
  size?: PreviewSize;
  /** 래퍼 너비 Tailwind 클래스 (e.g. 'w-full', 'w-48') */
  className?: string;
  onPress?: () => void;
}

export default function BingoPreview({
  bingo,
  completedCells = [],
  size = 'sm',
  className = 'w-full',
  onPress,
}: BingoPreviewProps) {
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
  const Wrapper = onPress ? Pressable : View;
  const titleStyle = TITLE_STYLE[size];

  if (image) {
    const cfg = GRID_CONFIGS[bingo.grid];

    return (
      <Wrapper className={className} {...(onPress ? { onPress } : {})}>
        <View style={{ width: '100%', aspectRatio: FIGMA_W / FIGMA_H }}>
          <Image
            source={{ uri: image }}
            style={{ position: 'absolute', width: '100%', height: '100%' }}
            contentFit="cover"
            cachePolicy="memory-disk"
          />

          <Text
            numberOfLines={2}
            ellipsizeMode="tail"
            style={{
              position: 'absolute',
              top: `${(titleStyle.top / FIGMA_H) * 100}%`,
              left: `${(titleStyle.left / FIGMA_W) * 100}%`,
              right: `${(titleStyle.right / FIGMA_W) * 100}%`,
              color: fgColor,
              fontSize: titleStyle.fontSize,
            }}
            className="font-pretendard-medium"
          >
            {bingo.title}
          </Text>

          {Array.from({ length: cols * rows }).map((_, i: number) => {
            const col = i % cols;
            const row = Math.floor(i / cols);

            return (
              <View
                key={i}
                style={{
                  position: 'absolute',
                  left: `${((cfg.left + col * (cfg.cellW + cfg.gapX)) / FIGMA_W) * 100}%`,
                  top: `${((cfg.top + row * (cfg.cellH + cfg.gapY)) / FIGMA_H) * 100}%`,
                  width: `${(cfg.cellW / FIGMA_W) * 100}%`,
                  height: `${(cfg.cellH / FIGMA_H) * 100}%`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 4,
                }}
              >
                <Text
                  className="text-caption-sm text-center md:text-body-md "
                  style={{ color: '#181C1C' }}
                  numberOfLines={2}
                >
                  {bingo.cells[i] ?? ''}
                </Text>

                {completedCells[i] && checkImage && (
                  <Image
                    source={{ uri: checkImage }}
                    style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                    }}
                    contentFit="contain"
                    cachePolicy="memory-disk"
                  />
                )}
              </View>
            );
          })}
        </View>
      </Wrapper>
    );
  }

  return (
    <Wrapper className={`${className} flex-row flex-wrap gap-1`} {...(onPress ? { onPress } : {})}>
      {bingo.cells.map((text: string, i: number) => (
        <View
          key={i}
          style={{
            width: `${100 / cols}%`,
            aspectRatio: 1,
            borderRadius: 4,
            borderWidth: 1,
            borderColor: '#D2D6D6' /* gray-300 */,
            backgroundColor: '#FDFDFD' /* white */,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 4,
          }}
        >
          <Text
            className="text-caption-sm text-center"
            style={{ color: '#181C1C' }}
            numberOfLines={2}
          >
            {text}
          </Text>
        </View>
      ))}
    </Wrapper>
  );
}
