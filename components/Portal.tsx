import { useEffect, useState, type ReactNode } from 'react';
import { nextPortalId, setPortalNode } from '@/lib/portal-store';

//always draw children in root's portalhost
export function Portal({ children }: { children: ReactNode }) {
  // execute only 1 time
  const [id] = useState(() => nextPortalId());

  // no dependency array
  useEffect(() => {
    setPortalNode(id, children);
  });

  useEffect(() => () => setPortalNode(id, null), [id]);

  return null;
}
