import { Image } from 'react-native';

interface LogoProps {
  size?: number;
  className?: string;
}

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
