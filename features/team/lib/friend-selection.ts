import { useSyncExternalStore } from 'react';

/**
 * 팀 빙고를 만들 때 고른 친구 id.
 *
 * 친구 고르기는 친구 목록 화면(`/mypage/friend-list?mode=select`)에서 하고,
 * 제작 화면으로 돌아와야 한다. Expo Router에는 화면이 값을 되돌려주는 수단이 없고,
 * 라우트 파라미터로 되돌리면 제작 화면의 폼 상태(제목·칸·기간)가 날아간다.
 * 그래서 두 화면이 같이 보는 작은 저장소를 따로 둔다.
 */
let selectedIds: string[] = [];
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

export const friendSelection = {
  get: (): string[] => selectedIds,
  set: (ids: string[]): void => {
    selectedIds = ids;
    emit();
  },
  toggle: (id: string, maxCount: number): void => {
    if (selectedIds.includes(id)) {
      selectedIds = selectedIds.filter((selected) => selected !== id);
    } else {
      if (selectedIds.length >= maxCount) return;
      selectedIds = [...selectedIds, id];
    }
    emit();
  },
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

/** 고른 친구 id 목록을 구독한다. */
export function useFriendSelection(): string[] {
  return useSyncExternalStore(friendSelection.subscribe, friendSelection.get, friendSelection.get);
}
