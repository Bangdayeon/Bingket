import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

// Serialize writes and removal so a pending autosave cannot resurrect a completed draft.
const queues = new Map<string, Promise<void>>();
function enqueue(key: string, action: () => Promise<void>): Promise<void> {
  const next = (queues.get(key) ?? Promise.resolve()).catch(() => {}).then(action);
  queues.set(key, next);
  return next;
}

export function useBingoDraft<T extends object>(
  key: string,
  value: T,
  restore: (draft: Partial<T>) => void,
  enabled = true,
) {
  const [readyKey, setReadyKey] = useState<string | null>(null);
  const ready = readyKey === key;
  const restoreRef = useRef(restore);
  const snapshot = useRef({ key, value, enabled });
  const stopped = useRef(false);
  useLayoutEffect(() => {
    restoreRef.current = restore;
    snapshot.current = { key, value, enabled };
  });

  useEffect(() => {
    let cancelled = false;
    stopped.current = false;
    (queues.get(key) ?? Promise.resolve())
      .catch(() => {})
      .then(() => AsyncStorage.getItem(key))
      .then((raw) => {
        if (cancelled) return;
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed))
            restoreRef.current(parsed as Partial<T>);
        }
      })
      .catch(Sentry.captureException)
      .finally(() => {
        if (!cancelled) setReadyKey(key);
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  const save = useCallback(async () => {
    if (!ready || stopped.current || snapshot.current.key !== key || !snapshot.current.enabled)
      return;
    const raw = JSON.stringify(snapshot.current.value);
    await enqueue(key, () => AsyncStorage.setItem(key, raw));
  }, [key, ready]);

  const serialized = JSON.stringify(value);
  useEffect(() => {
    void save().catch(Sentry.captureException);
  }, [serialized, enabled, save]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') void save().catch(Sentry.captureException);
    });
    return () => {
      subscription.remove();
      void save().catch(Sentry.captureException);
    };
  }, [save]);

  const clear = async () => {
    stopped.current = true;
    await enqueue(key, () => AsyncStorage.removeItem(key));
  };
  return { ready, save, clear };
}
