import { Fragment, useSyncExternalStore } from 'react';
import { View } from 'react-native';
import { getPortalEntries, subscribePortal } from '@/lib/portal-store';

// put on the app root 1 time for Portal.tsx
export function PortalHost() {
  const nodes = useSyncExternalStore(subscribePortal, getPortalEntries, getPortalEntries);

  if (nodes.length === 0) return null;

  return (
    <View
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      pointerEvents="box-none"
    >
      {nodes.map((entry) => (
        <Fragment key={entry.id}>{entry.node}</Fragment>
      ))}
    </View>
  );
}
