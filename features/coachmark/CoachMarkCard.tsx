import { View } from 'react-native';
import Button from '@/components/Button';
import { Text } from '@/components/Text';
import { FIXED } from '@/lib/use-colors';
import { TABLET_MAX_MODAL_WIDTH } from '@/lib/use-responsive';
import type { Hole } from './lib/spotlight-path';

/** 카드와 구멍 사이 간격. 삼각형이 이 사이를 메운다. */
const GAP = 14;
const H_MARGIN = 20;
const POINTER = 14;

interface CoachMarkCardProps {
  text: string;
  stepNumber: number;
  total: number;
  hole: Hole;
  screenWidth: number;
  screenHeight: number;
  /** 통과 단계에서는 감춘다 — 누를 것은 화면의 진짜 버튼이다. */
  nextLabel: string | null;
  onNext: () => void;
  /** 첫 단계에서는 돌아갈 곳이 없다. */
  showPrev: boolean;
  onPrev: () => void;
}

/**
 * 안내 문구 카드.
 *
 * 카드 높이를 재지 않아도 되게 잡는다. 위에 붙일 때는 top이 아니라 bottom을 고정하면
 * 높이를 몰라도 아래 모서리가 구멍 바로 위에 온다. 문구 길이에 따라 카드가 위로
 * 자라기만 하므로 한 번의 배치로 끝난다.
 */
export function CoachMarkCard({
  text,
  stepNumber,
  total,
  hole,
  screenWidth,
  screenHeight,
  nextLabel,
  onNext,
  showPrev,
  onPrev,
}: CoachMarkCardProps) {
  const { rect } = hole;

  /**
   * 구멍이 화면을 통째로 덮는 단계(fullScreen). 이때는 구멍 위도 아래도 화면 밖이라
   * 붙일 자리가 없다. 가운데에 띄우고 삼각형은 뺀다 — 가리킬 대상이 없으니까.
   */
  const coversScreen = rect.width >= screenWidth && rect.height >= screenHeight;

  // 구멍이 아래쪽 절반이면 카드는 위로 간다. 탭바를 가리키는 1~3단계가 늘 여기 걸린다.
  const placeAbove = rect.y + rect.height / 2 > screenHeight / 2;

  const cardWidth = Math.min(screenWidth - H_MARGIN * 2, TABLET_MAX_MODAL_WIDTH);
  const cardLeft = (screenWidth - cardWidth) / 2;

  // 삼각형은 구멍 중심을 가리키되 카드 밖으로 나가지 않게 물린다.
  // components/Information.tsx:36의 클램프 관용구와 같은 방식.
  const pointerLeft = Math.max(
    16,
    Math.min(rect.x + rect.width / 2 - cardLeft - POINTER / 2, cardWidth - 16 - POINTER),
  );

  return (
    <View
      // box-none이라야 카드가 덮은 자리에서도 '다음' 버튼만 터치를 가져간다.
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: cardLeft,
        width: cardWidth,
        ...(coversScreen
          ? { top: 0, bottom: 0, justifyContent: 'center' }
          : placeAbove
            ? { bottom: screenHeight - rect.y + GAP }
            : { top: rect.y + rect.height + GAP }),
      }}
    >
      <View
        className="rounded-2xl bg-white px-5 py-4"
        style={{
          shadowColor: FIXED.fixedBlack,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 5,
        }}
      >
        <Text className="text-caption-sm text-gray-500">
          {stepNumber} / {total}
        </Text>
        <Text className="mt-2 text-body-md text-gray-900">{text}</Text>

        {(showPrev || nextLabel !== null) && (
          <View className="mt-4 flex-row justify-end gap-2">
            {showPrev && <Button label="이전" variant="secondary" size="sm" onClick={onPrev} />}
            {nextLabel !== null && <Button label={nextLabel} size="sm" onClick={onNext} />}
          </View>
        )}
      </View>

      {/* 카드와 같은 색이라 겹치는 자리가 보이지 않고 뾰족한 끝만 남는다. */}
      {!coversScreen && (
        <View
          pointerEvents="none"
          className="absolute bg-white"
          style={{
            left: pointerLeft,
            width: POINTER,
            height: POINTER,
            transform: [{ rotate: '45deg' }],
            ...(placeAbove ? { bottom: -POINTER / 2 } : { top: -POINTER / 2 }),
          }}
        />
      )}
    </View>
  );
}
