import { Image } from 'react-native';

interface LogoProps {
  /** 한 변의 길이. 시안 기준 150. */
  size?: number;
  className?: string;
}

/**
 * 앱 로고. 소스는 `assets/logo1024.png` 하나뿐이다 — 둥근 모서리와 배경 초록이
 * 그림 안에 들어 있으므로 초록 컨테이너로 감싸거나 cover로 잘라내면 안 된다.
 */
export function Logo({ size = 150, className = '' }: LogoProps) {
  return (
    <Image
      source={require('@/assets/logo1024.png')}
      className={className}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}
