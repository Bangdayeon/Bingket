import { useSyncExternalStore } from 'react';

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

export function useFriendSelection(): string[] {
  return useSyncExternalStore(friendSelection.subscribe, friendSelection.get, friendSelection.get);
}
