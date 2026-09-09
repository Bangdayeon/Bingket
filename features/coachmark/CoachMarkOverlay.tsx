import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import IconButton from '@/components/IconButton';
import { Portal } from '@/components/Portal';
import IcClose from '@/assets/icons/ic_close.svg';
import { CoachMarkCard } from './CoachMarkCard';
import { GlowRing } from './GlowRing';
import { SpotlightScrim } from './SpotlightScrim';
import type { CoachMarkStep } from './lib/coach-mark-steps';
import { spotlightHole, type Rect } from './lib/spotlight-path';

interface CoachMarkOverlayProps {
  step: CoachMarkStep;
  rect: Rect;
  stepNumber: number;
  total: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

/**
 * 실제 UI 위에 얹히는 안내 오버레이.
 *
 * Portal로 보내면 PortalHost(app/_layout.tsx의 Stack 다음)에서 그려져 탭바와 헤더까지
 * 덮는다. PortalHost가 pointerEvents="box-none"이라, 자식이 놓인 자리만 터치를 먹고
 * 빈자리는 아래 화면으로 그대로 흘러간다 — 4단계의 구멍 통과가 이 성질에 얹힌다.
 * 그래서 이 루트 View도 반드시 box-none이어야 한다. auto로 두면 전부 다시 막힌다.
 */
export function CoachMarkOverlay({
  step,
  rect,
  stepNumber,
  total,
  onNext,
  onPrev,
  onClose,
}: CoachMarkOverlayProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const hole = spotlightHole(rect, step.shape);

  return (
    <Portal>
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <SpotlightScrim hole={hole} width={width} height={height} />

        {step.passThrough ? (
          <PassThroughBlockers hole={hole.rect} width={width} height={height} />
        ) : (
          // 아무 데나 탭하면 다음으로. 카드와 X가 위에 있어 그쪽 터치를 먼저 가져간다.
          <Pressable style={StyleSheet.absoluteFill} onPress={onNext} />
        )}

        <GlowRing hole={hole} />

        <CoachMarkCard
          text={step.text}
          stepNumber={stepNumber}
          total={total}
          hole={hole}
          screenWidth={width}
          screenHeight={height}
          nextLabel={step.passThrough ? null : stepNumber === total ? '시작하기' : '다음'}
          onNext={onNext}
          showPrev={stepNumber > 1}
          onPrev={onPrev}
        />

        <View style={{ position: 'absolute', top: insets.top + 8, right: 12 }}>
          <IconButton
            variant="ghost"
            size={40}
            icon={<IcClose width={24} height={24} className="text-fixed-white" />}
            onClick={onClose}
            accessibilityLabel="안내 닫기"
          />
        </View>
      </View>
    </Portal>
  );
}

/**
 * 구멍 상·하·좌·우만 막는 투명 판 네 장. 구멍 자리에는 아무것도 두지 않는다.
 *
 * 빈 View는 터치를 잡지 못한다 — 응답자로 등록되지 않아 아래로 그냥 흘러간다.
 * 그래서 막는 쪽은 onPress가 달린 Pressable이어야 한다.
 */
function PassThroughBlockers({
  hole,
  width,
  height,
}: {
  hole: Rect;
  width: number;
  height: number;
}) {
  const noop = () => {};
  const right = hole.x + hole.width;
  const bottom = hole.y + hole.height;

  return (
    <>
      <Pressable
        onPress={noop}
        style={{ position: 'absolute', left: 0, top: 0, width, height: Math.max(0, hole.y) }}
      />
      <Pressable
        onPress={noop}
        style={{
          position: 'absolute',
          left: 0,
          top: bottom,
          width,
          height: Math.max(0, height - bottom),
        }}
      />
      <Pressable
        onPress={noop}
        style={{
          position: 'absolute',
          left: 0,
          top: hole.y,
          width: Math.max(0, hole.x),
          height: hole.height,
        }}
      />
      <Pressable
        onPress={noop}
        style={{
          position: 'absolute',
          left: right,
          top: hole.y,
          width: Math.max(0, width - right),
          height: hole.height,
        }}
      />
    </>
  );
}
