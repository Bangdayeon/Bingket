import NetInfo from '@react-native-community/netinfo';
import { useEffect, useRef, useSyncExternalStore } from 'react';

// NetInfo 구독은 앱에 하나면 충분하다. 모듈 스코프에 두고 화면들이 나눠 쓴다.
let online = true;
const listeners = new Set<() => void>();
// 오프라인 → 온라인으로 "돌아온" 순간에만 발화한다. 최초 온라인은 복구가 아니다.
const restoreListeners = new Set<() => void>();

NetInfo.addEventListener((state) => {
  // isInternetReachable은 확인 전 null이다. 그때는 연결됐다고 보고 화면을 막지 않는다.
  const next = state.isConnected !== false && state.isInternetReachable !== false;
  if (next === online) return;
  online = next;
  listeners.forEach((l) => l());
  if (next) restoreListeners.forEach((l) => l());
});

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** 현재 네트워크 연결 여부. */
export function useIsOnline(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => online,
    () => true,
  );
}

/** 오프라인이었다가 연결이 돌아왔을 때 한 번 호출된다. 실패한 조회를 자동으로 다시 태우는 용도. */
export function useOnlineRestore(callback: () => void): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const listener = () => callbackRef.current();
    restoreListeners.add(listener);
    return () => {
      restoreListeners.delete(listener);
    };
  }, []);
}
