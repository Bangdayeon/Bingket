import { View } from 'react-native';
import Button from '@/components/Button';
import { Text } from '@/components/Text';
import Loading from '@/components/Loading';
import type { Notification } from '@/features/notifications/lib/notifications';

interface NotificationStripProps {
  items: Notification[];
  /** 처리 중인 알림 id. 버튼을 잠그고 스피너를 보여준다 */
  pendingId: string | null;
  /** 빙고 상한에 걸려 수락할 수 없는 상태 */
  atBingoCap: boolean;
  onAccept: (item: Notification) => void;
  onDecline: (item: Notification) => void;
  onConfirm: (item: Notification) => void;
}

/**
 * 홈 최상단에 쌓이는 알림 줄. 알림 페이지와 같은 notifications 행을 보고 그린다.
 * 여기서 처리하면 DB에서 지워지므로 알림 페이지에서도 사라진다.
 *
 * 여러 개면 간격 없이 그대로 쌓는다.
 */
export function NotificationStrip({
  items,
  pendingId,
  atBingoCap,
  onAccept,
  onDecline,
  onConfirm,
}: NotificationStripProps) {
  if (items.length === 0) return null;

  return (
    <View>
      {items.map((item) => {
        const isInvite = item.type === 'team_invite';
        const busy = pendingId === item.id;

        return (
          <View
            key={item.id}
            className="flex-row items-center gap-3 border-b border-gray-300 bg-white px-4"
            style={{ minHeight: 60 }}
          >
            <Text className="flex-1 text-body-sm text-gray-900" numberOfLines={1}>
              {item.message}
            </Text>

            {busy ? (
              <Loading />
            ) : isInvite ? (
              <View className="flex-row items-center gap-2">
                <Button label="거절" variant="ghost" size="sm" onClick={() => onDecline(item)} />
                {/* 상한에 걸려도 누를 수는 있게 둔다. 눌러야 왜 안 되는지 알려줄 수 있다 */}
                <Button
                  label="수락"
                  size="sm"
                  onClick={() => onAccept(item)}
                  className={atBingoCap ? 'opacity-40' : ''}
                />
              </View>
            ) : (
              <Button label="확인" variant="ghost" size="sm" onClick={() => onConfirm(item)} />
            )}
          </View>
        );
      })}
    </View>
  );
}
