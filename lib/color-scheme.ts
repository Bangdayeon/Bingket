import { useSyncExternalStore } from 'react';
import { Appearance, AppState } from 'react-native';
import { systemColorScheme } from 'react-native-css-interop/dist/runtime/native/appearance-observables';

export type AppTheme = 'system' | 'light' | 'dark';
export type ResolvedScheme = 'light' | 'dark';

const asScheme = (value: unknown): ResolvedScheme | null =>
  value === 'light' || value === 'dark' ? value : null;

let preference: AppTheme = 'system'; // user pick
let osScheme: ResolvedScheme = asScheme(Appearance.getColorScheme()) ?? 'light'; // check os (only in system)
let override: ResolvedScheme | null = null;
let resolved: ResolvedScheme = osScheme;

const listeners = new Set<() => void>();

function publish(): void {
  const next: ResolvedScheme = preference === 'system' ? osScheme : preference;

  systemColorScheme.set(next);

  if (next === resolved) return;
  resolved = next;
  listeners.forEach((l) => l());
}

Appearance.addChangeListener(({ colorScheme }) => {
  const next = asScheme(colorScheme);
  if (next && preference === 'system') osScheme = next;
  publish();
});

AppState.addEventListener('change', (state) => {
  if (state !== 'active') return;
  const next = asScheme(Appearance.getColorScheme());
  if (next && preference === 'system') osScheme = next;
  publish();
  queueMicrotask(publish);
});

export function applyAppTheme(theme: AppTheme): void {
  preference = theme;

  if (theme === 'system') {
    if (override) osScheme = override;
    override = null;
    Appearance.setColorScheme('unspecified');
  } else {
    override = theme;
    Appearance.setColorScheme(theme);
  }

  publish();
}

export function getResolvedScheme(): ResolvedScheme {
  return resolved;
}

export function useResolvedScheme(): ResolvedScheme {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => resolved,
    () => resolved,
  );
}
