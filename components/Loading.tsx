import { ActivityIndicator } from 'react-native';

interface LoadingProps {
  /** 채워진 버튼 위처럼 회색이 묻히는 곳에서만 넘긴다. 기본은 회색. */
  color?: string;
  /** 버튼 안처럼 좁은 자리에는 'small'을 쓴다. */
  size?: 'small' | 'large';
}

const DEFAULT_COLOR = '#929898'; /* gray-500 */

/** 앱 공통 로딩 표시. 플랫폼 기본 스피너를 쓴다. */
export default function Loading({ color = DEFAULT_COLOR, size = 'small' }: LoadingProps) {
  return <ActivityIndicator size={size} color={color} />;
}
