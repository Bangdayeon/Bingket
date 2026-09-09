import { ActivityIndicator } from 'react-native';

interface LoadingProps {
  /**
   * 스피너 색. 채워진 버튼 위처럼 회색이 묻히는 곳에서만 바꾼다.
   * NativeWind가 ActivityIndicator의 className color를 color prop으로 넘겨준다.
   */
  className?: string;
}

/** 앱 공통 로딩 표시. 플랫폼 기본 스피너를 쓴다. */
export default function Loading({ className = 'text-gray-500' }: LoadingProps) {
  return <ActivityIndicator size="small" className={className} />;
}
