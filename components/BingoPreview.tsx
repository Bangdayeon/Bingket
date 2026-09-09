import { Image } from 'expo-image';
import { FIXED } from '@/lib/use-colors';
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
  /**
   * 정사각형으로 잘라 보여준다. 판은 3:4라 아랫부분이 잘린다.
   * 목록 카드처럼 세로를 아껴야 하는 자리에서 쓴다 — 상세에서는 전체를 보여준다.
   */
  square?: boolean;
  onPress?: () => void;
}

export default function BingoPreview({
  bingo,
  completedCells = [],
  size = 'sm',
  className = 'w-full',
  square = false,
  onPress,
}: BingoPreviewProps) {
  const [image, setImage] = useState<string | null>(null);
  const [checkImage, setCheckImage] = useState<string | null>(null);
  const [fgColor, setFgColor] = useState<string>(FIXED.boardForeground);

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

    const board = (
      <>
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
              {/* 판 배경은 앱 테마와 무관한 서버 이미지다. 토큰 색을 쓰면 다크에서
                    흰색으로 뒤집혀 밝은 판 위에서 사라진다. 제목과 같은 전경색을 쓴다. */}
              <Text
                className="text-caption-sm text-center md:text-body-md"
                // 칸은 모든 테마에서 밝은 색이라 글씨는 늘 어두워야 한다. 토큰 색은 다크모드에서 흰색으로 뒤집혀 사라지고, 테마의 fgColor는 제목용이라 밝을 수 있어 칸에는 못 쓴다.
                style={{ color: FIXED.boardForeground }}
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
      </>
    );

    return (
      <Wrapper className={className} {...(onPress ? { onPress } : {})}>
        {square ? (
          // 판은 3:4라 정사각형 틀보다 세로가 길다. 위를 맞추고 아랫부분을 잘라낸다.
          // 안쪽을 absolute로 두는 건 부모 높이(정사각형)에 눌리지 않게 하려는 것이다.
          <View style={{ width: '100%', aspectRatio: 1, overflow: 'hidden' }}>
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                aspectRatio: FIGMA_W / FIGMA_H,
              }}
            >
              {board}
            </View>
          </View>
        ) : (
          <View style={{ width: '100%', aspectRatio: FIGMA_W / FIGMA_H }}>{board}</View>
        )}
      </Wrapper>
    );
  }

  return (
    <Wrapper className={`${className} flex-row flex-wrap gap-1`} {...(onPress ? { onPress } : {})}>
      {bingo.cells.map((text: string, i: number) => (
        <View
          key={i}
          className="items-center justify-center rounded border border-gray-300 bg-white p-1"
          style={{ width: `${100 / cols}%`, aspectRatio: 1 }}
        >
          <Text className="text-caption-sm text-center text-gray-900" numberOfLines={2}>
            {text}
          </Text>
        </View>
      ))}
    </Wrapper>
  );
}
