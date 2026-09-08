import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { supabase } from '@/lib/supabase';

interface UnreadNotificationsValue {
  hasUnread: boolean;
  /** 알림을 읽거나 지운 화면이 직접 호출한다 */
  refresh: () => void;
}

const UnreadNotificationsContext = createContext<UnreadNotificationsValue>({
  hasUnread: false,
  refresh: () => {},
});

/**
 * 하단 탭의 안 읽은 알림 점.
 *
 * 탭바는 네비게이터가 그려서 화면 트리 밖에 있다. 그래서 홈에서 알림을 처리해도
 * 탭바는 그 사실을 모른 채 점을 켜두고 있었다 (탭을 옮기거나 앱을 다시 열어야 꺼졌다).
 * 상태를 여기로 올려 두 쪽이 같은 값을 보게 한다.
 */
export function UnreadNotificationsProvider({ children }: { children: React.ReactNode }) {
  const [hasUnread, setHasUnread] = useState(false);
  const userIdRef = useRef<string | null>(null);

  const refresh = useCallback(() => {
    void (async () => {
      if (!userIdRef.current) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        userIdRef.current = user.id;
      }
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userIdRef.current)
        .eq('is_read', false);
      setHasUnread((count ?? 0) > 0);
    })();
  }, []);

  // 앱 시작 시 1회
  useEffect(() => {
    refresh();
  }, [refresh]);

  // 앱 포그라운드 복귀 시 재조회
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  return (
    <UnreadNotificationsContext.Provider value={{ hasUnread, refresh }}>
      {children}
    </UnreadNotificationsContext.Provider>
  );
}

export const useUnreadNotifications = () => useContext(UnreadNotificationsContext);
