import { Pressable, View } from 'react-native';
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
            className="flex-row items-center gap-3 px-5 py-3 bg-gray-200  "
            style={{ minHeight: 56 }}
          >
            <Text
              className="flex-1 text-body-sm"
              style={{ color: '#181C1C' /* gray-900 */ }}
              numberOfLines={2}
            >
              {item.message}
            </Text>

            {busy ? (
              <Loading color="#48BE30" variant="iconloading" size={5} />
            ) : isInvite ? (
              <View className="flex-row items-center gap-3">
                <Pressable onPress={() => onDecline(item)} hitSlop={8}>
                  <Text className="text-body-sm" style={{ color: '#4C5252' /* gray-700 */ }}>
                    거절
                  </Text>
                </Pressable>
                {/* 상한에 걸려도 누를 수는 있게 둔다. 눌러야 왜 안 되는지 알려줄 수 있다 */}
                <Pressable
                  onPress={() => onAccept(item)}
                  hitSlop={8}
                  className="px-4 py-1.5 rounded-full bg-green-500  "
                  style={{ opacity: atBingoCap ? 0.4 : 1 }}
                >
                  <Text
                    className="text-body-sm font-pretendard-medium"
                    style={{ color: '#FDFDFD' /* white */ }}
                  >
                    수락
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={() => onConfirm(item)} hitSlop={8}>
                <Text className="text-body-sm" style={{ color: '#4C5252' /* gray-700 */ }}>
                  확인
                </Text>
              </Pressable>
            )}
          </View>
        );
      })}
    </View>
  );
}
