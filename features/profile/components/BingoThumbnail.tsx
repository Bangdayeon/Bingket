import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '@/components/Text';
import {
  FIGMA_W,
  FIGMA_H,
  GRID_CONFIGS,
  getThemeImageUrl,
  getThemeForegroundColor,
} from '@/features/bingo/lib/theme';
import type { BingoTheme } from '@/types/bingo';
import type { FeedCell } from '@/features/profile/lib/profile';

/**
 * 피드 그리드용 빙고판 축소 렌더.
 * BingoCard와 같은 FIGMA 좌표계(1080x1440, 3:4)를 쓰되
 * 인터랙션·편집 버튼·통계를 뺀 표시 전용 컴포넌트다.
 */

// FIGMA 좌표계 기준 폰트 크기. BingoCard의 tailwind 값을 환산한 것
// (전체 폭 렌더 시 title-md 20px, body-sm 14px, caption-md 12px)
const TITLE_FIGMA_SIZE = 60;
const CELL_FIGMA_SIZE: Record<string, number> = { '3x3': 42, '4x3': 36, '4x4': 36 };

// 2열 그리드에서는 비례 축소만 하면 글자가 읽히지 않아 하한을 둔다
const MIN_CELL_FONT = 7;
const MIN_TITLE_FONT = 10;

interface Props {
  width: number;
  grid: string;
  theme: BingoTheme;
  title: string;
  cells: FeedCell[];
}

export function BingoThumbnail({ width, grid, theme, title, cells }: Props) {
  const [image, setImage] = useState<string | null>(null);
  const [checkImage, setCheckImage] = useState<string | null>(null);
  const [fgColor, setFgColor] = useState<string>('#181C1C'); /* gray-900 */

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [bg, check, color] = await Promise.all([
        getThemeImageUrl(theme, grid as '3x3' | '4x3' | '4x4'),
        getThemeImageUrl(theme, 'check'),
        getThemeForegroundColor(theme),
      ]);
      if (cancelled) return;
      setImage(bg);
      setCheckImage(check);
      setFgColor(color);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [theme, grid]);

  const height = width * (FIGMA_H / FIGMA_W);

  if (!image) {
    return <View style={{ width, height, borderRadius: 8 }} className="bg-gray-100" />;
  }

  const scale = width / FIGMA_W;
  const cfg = GRID_CONFIGS[grid] ?? GRID_CONFIGS['3x3'];
  const [cols, rows] = grid.split('x').map(Number);

  const cellW = cfg.cellW * scale;
  const cellH = cfg.cellH * scale;
  const cellFont = Math.max((CELL_FIGMA_SIZE[grid] ?? 36) * scale, MIN_CELL_FONT);
  const titleFont = Math.max(TITLE_FIGMA_SIZE * scale, MIN_TITLE_FONT);

  return (
    <View style={{ width, height, borderRadius: 8, overflow: 'hidden' }}>
      <Image
        source={{ uri: image }}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
        contentFit="cover"
        cachePolicy="memory-disk"
      />

      <Text
        numberOfLines={1}
        style={{
          position: 'absolute',
          top: height * 0.045,
          left: 0,
          right: 0,
          textAlign: 'center',
          color: fgColor,
          fontSize: titleFont,
          lineHeight: titleFont * 1.2,
          fontWeight: '600',
        }}
      >
        {title}
      </Text>

      {Array.from({ length: cols * rows }).map((_, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const cell = cells[i];
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: cfg.left * scale + col * (cellW + cfg.gapX * scale),
              top: cfg.top * scale + row * (cellH + cfg.gapY * scale),
              width: cellW,
              height: cellH,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 2,
            }}
          >
            <Text
              numberOfLines={3}
              style={{
                textAlign: 'center',
                color: '#181C1C' /* gray-900 */,
                fontSize: cellFont,
                lineHeight: cellFont * 1.25,
              }}
            >
              {cell?.content ?? ''}
            </Text>

            {cell?.isChecked && checkImage && (
              <Image
                source={{ uri: checkImage }}
                style={{ position: 'absolute', width: '100%', height: '100%' }}
                contentFit="contain"
                cachePolicy="memory-disk"
              />
            )}
          </View>
        );
      })}
    </View>
  );
}
