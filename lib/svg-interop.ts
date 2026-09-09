import { cssInterop } from 'nativewind';
import Svg from 'react-native-svg';

/**
 * SVG 아이콘이 className으로 색을 받게 한다.
 *
 * svgr.config.cjs의 replaceAttrValues가 아이콘의 색을 이미 currentColor로
 * 바꿔 두었으므로, className이 만든 color를 react-native-svg의 color prop으로
 * 흘려보내면 아이콘이 테마 토큰을 그대로 따라간다.
 * 내장 ActivityIndicator가 nativewind 안에서 쓰는 것과 같은 방식이다.
 *
 * app/_layout.tsx 최상단에서 한 번만 import한다.
 */
cssInterop(Svg, {
  className: { target: false, nativeStyleToProp: { color: true } },
});
