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
    const next = entries.slice();
    next[index] = { id, node };
    entries = next;
  }

  listeners.forEach((listener) => listener());
}
