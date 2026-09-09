import { Fragment, useSyncExternalStore } from 'react';
import { View } from 'react-native';
import { getPortalEntries, subscribePortal } from '@/lib/portal-store';

/** 앱 루트에 한 번만 둔다. Portal로 보낸 내용이 여기 쌓여 화면 위에 그려진다 */
export function PortalHost() {
  const nodes = useSyncExternalStore(subscribePortal, getPortalEntries, getPortalEntries);

  if (nodes.length === 0) return null;

  return (
    // box-none: 오버레이가 실제로 덮은 자리 말고는 아래 화면이 그대로 터치돼야 한다
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
