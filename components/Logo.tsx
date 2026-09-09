import { Image, View } from 'react-native';

interface LogoProps {
  /** 한 변의 길이. 시안 기준 150. */
  size?: number;
  className?: string;
}

// 시안: 150 정사각형에 radius 28 → 한 변의 18.67%.
const RADIUS_RATIO = 28 / 150;

export function Logo({ size = 150, className = '' }: LogoProps) {
  return (
    <View
      className={`bg-green-500 ${className}`}
      style={{ width: size, height: size, borderRadius: size * RADIUS_RATIO, overflow: 'hidden' }}
    >
      <Image
        source={require('@/assets/logo.png')}
        style={{ width: size, height: size }}
        resizeMode="cover"
      />
    </View>
  );
}
