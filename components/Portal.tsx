import { useEffect, useRef, type ReactNode } from 'react';
import { nextPortalId, setPortalNode } from '@/lib/portal-store';

/**
 * children을 트리 위치와 무관하게 루트의 PortalHost에서 그리게 한다.
 *
 * 다이얼로그를 네이티브 Modal 대신 인트리 오버레이로 그리려면 화면 전체를 덮는 위치에
 * 렌더해야 하는데, 호출부가 ScrollView 안일 수도 있어서(AddEachBingo) 포털이 필요하다.
 */
export function Portal({ children }: { children: ReactNode }) {
  const idRef = useRef<number | null>(null);
  if (idRef.current === null) idRef.current = nextPortalId();
  const id = idRef.current;

  // 의존성 배열이 없다. children이 바뀔 때마다 호스트에 반영해야 한다
  useEffect(() => {
    setPortalNode(id, children);
  });

  useEffect(() => () => setPortalNode(id, null), [id]);

  return null;
}
