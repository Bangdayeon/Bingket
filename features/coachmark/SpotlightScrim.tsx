import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useColors } from '@/lib/use-colors';
import { spotlightPath, type Hole } from './lib/spotlight-path';

interface SpotlightScrimProps {
  hole: Hole;
  width: number;
  height: number;
}

/**
 * 구멍 하나가 뚫린 딤.
 *
 * 터치는 한 픽셀도 받지 않는다 — 화면을 막는 일은 형제인 투명 Pressable들이 맡는다.
 * 그래야 4단계의 구멍 통과가 react-native-svg의 히트 테스트에 기대지 않아도 된다.
 * pointerEvents를 Svg가 아니라 감싸는 View에 주는 것도 같은 이유다. 안드로이드의
 * Svg 호스트는 커스텀 ViewGroup이라 터치 처리에 변수를 두지 않는 편이 안전하다.
 */
export function SpotlightScrim({ hole, width, height }: SpotlightScrimProps) {
  const colors = useColors();

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={width} height={height}>
        <Path
          d={spotlightPath(hole, width, height)}
          // 서브패스 둘이 겹치는 안쪽이 비워진다.
          fillRule="evenodd"
          fill={colors.scrim}
          // 레포의 딤 관례가 bg-scrim/70이다.
          fillOpacity={0.7}
        />
      </Svg>
    </View>
  );
}
