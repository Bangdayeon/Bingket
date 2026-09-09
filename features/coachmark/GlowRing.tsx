import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import type { Hole } from './lib/spotlight-path';

const PULSE_MS = 1100;
/** 후광 테두리 두께. 구멍 바깥으로 이만큼 번진다. */
const HALO = 12;
const MID = 5;
const CORE = 2;

/**
 * 구멍을 두르는 브랜드색 글로우.
 *
 * 플랫폼 그림자(shadowColor / elevation)를 쓰지 않는다. iOS는 그림자 색을 받지만
 * 안드로이드는 elevation 그림자 색을 API 28 미만에서 무시해 회색으로 나온다.
 * 같은 화면이 기기마다 달라지느니, 양쪽에서 똑같이 그려지는 반투명 테두리 세 겹을 쓴다.
 *
 * SVG로 그리지 않는 것도 의도다 — Reanimated가 Fabric에서 SVG prop 애니메이션을
 * 안정적으로 지원하지 않는다. 평범한 View의 transform/opacity만 움직인다.
 */
export function GlowRing({ hole }: { hole: Hole }) {
  const pulse = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;

    pulse.value = withRepeat(
      withTiming(1, { duration: PULSE_MS, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );

    // 무한 반복은 언마운트해도 UI 스레드에서 계속 돈다. 반드시 끊는다.
    return () => cancelAnimation(pulse);
  }, [pulse, reduceMotion]);

  // width/height가 아니라 transform을 움직인다. 레이아웃을 다시 돌리지 않아 훨씬 싸고
  // 후광 모양은 동일하다.
  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.05 }],
    opacity: 1 - pulse.value * 0.45,
  }));

  const { rect, radius } = hole;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
      }}
    >
      <Animated.View
        className="absolute border-green-400/25"
        style={[
          {
            left: -HALO,
            top: -HALO,
            right: -HALO,
            bottom: -HALO,
            borderRadius: radius + HALO,
            borderWidth: HALO,
          },
          haloStyle,
        ]}
      />
      <View
        className="absolute border-green-400/40"
        style={{
          left: -MID,
          top: -MID,
          right: -MID,
          bottom: -MID,
          borderRadius: radius + MID,
          borderWidth: MID,
        }}
      />
      <View
        className="absolute border-green-400"
        style={{
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          borderRadius: radius,
          borderWidth: CORE,
        }}
      />
    </View>
  );
}
