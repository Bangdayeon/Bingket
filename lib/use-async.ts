import { useCallback, useEffect, useRef, useState } from 'react';
import * as Sentry from '@sentry/react-native';

interface AsyncState<T> {
  data: T | undefined;
  loading: boolean;
  /** null이면 성공. 화면은 loading / error / empty 세 상태를 반드시 구분해서 그린다. */
  error: Error | null;
  reload: () => void;
}

/**
 * `useEffect` + `fetch().then()` 패턴이 20여 곳에서 반복되면서 `.catch` 누락이 잦았고,
 * 그때마다 스피너가 영원히 도는 화면이 생겼다. 이 훅은 로딩 해제와 에러 보관을
 * 구조적으로 강제한다.
 *
 * `deps`가 바뀌면 다시 조회한다. 언마운트 뒤에는 상태를 건드리지 않는다.
 */
export function useAsync<T>(fetcher: () => Promise<T>, deps: readonly unknown[]): AsyncState<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [nonce, setNonce] = useState(0);

  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // fetcher는 대개 화면에서 인라인으로 만들어져 매 렌더 새 참조가 된다.
  // deps만 보고 다시 돌리기 위해 ref에 담아 둔다.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetcherRef
      .current()
      .then((result) => {
        if (!alive.current) return;
        setData(result);
      })
      .catch((e: unknown) => {
        if (!alive.current) return;
        Sentry.captureException(e);
        setError(e instanceof Error ? e : new Error(String(e)));
      })
      .finally(() => {
        if (!alive.current) return;
        setLoading(false);
      });
  }, [...deps, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return { data, loading, error, reload };
}
