import { cssInterop } from 'nativewind';
import Svg from 'react-native-svg';

// make svg icon getting color from classname
// import one time in app/_layout.tsx

cssInterop(Svg, {
  className: { target: false, nativeStyleToProp: { color: true } },
});
