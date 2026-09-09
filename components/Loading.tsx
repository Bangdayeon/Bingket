import { ActivityIndicator } from 'react-native';

interface LoadingProps {
  /** 채워진 버튼 위처럼 회색이 묻히는 곳에서만 넘긴다. 기본은 회색. */
  color?: string;
}

const DEFAULT_COLOR = '#929898'; /* gray-500 */

/** 앱 공통 로딩 표시. 플랫폼 기본 스피너를 쓴다. */
export default function Loading({ color = DEFAULT_COLOR }: LoadingProps) {
  return <ActivityIndicator size="small" color={color} />;
}
