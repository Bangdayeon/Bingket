import type { ReactNode } from 'react';

export interface PortalEntry {
  id: number;
  node: ReactNode;
}

let entries: readonly PortalEntry[] = [];
const listeners = new Set<() => void>();
let nextId = 0;

export function nextPortalId(): number {
  return nextId++;
}

export function subscribePortal(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getPortalEntries(): readonly PortalEntry[] {
  return entries;
}

export function setPortalNode(id: number, node: ReactNode | null): void {
  const index = entries.findIndex((entry) => entry.id === id);

  if (node === null) {
    if (index === -1) return;
    entries = entries.filter((entry) => entry.id !== id);
  } else if (index === -1) {
    entries = [...entries, { id, node }];
  } else {
    // 자리를 유지한 채 교체한다. 매번 뒤에 다시 붙이면 여러 개가 겹칠 때 z-order가 뒤집힌다
    const next = entries.slice();
    next[index] = { id, node };
    entries = next;
  }

  listeners.forEach((listener) => listener());
}
