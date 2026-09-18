import { View } from 'react-native';
import Button from '@/components/Button';
import { Text } from '@/components/Text';
import Loading from '@/components/Loading';
import type { Notification } from '@/features/notifications/lib/notifications';
import { useTranslation } from 'react-i18next';
interface NotificationStripProps {
  items: Notification[];
  pendingId: string | null;
  atBingoCap: boolean;
  onAccept: (item: Notification) => void;
  onDecline: (item: Notification) => void;
  onConfirm: (item: Notification) => void;
}

export function NotificationStrip({
  items,
  pendingId,
  atBingoCap,
  onAccept,
  onDecline,
  onConfirm,
}: NotificationStripProps) {
  const { t } = useTranslation();
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
                <Button
                  label={t('notifications.action.deny_short')}
                  variant="ghost"
                  size="sm"
                  onClick={() => onDecline(item)}
                />
                <Button
                  label={t('notifications.action.confirm_short')}
                  size="sm"
                  onClick={() => onAccept(item)}
                  className={atBingoCap ? 'opacity-40' : ''}
                />
              </View>
            ) : (
              <Button
                label={t('common.confirm')}
                variant="ghost"
                size="sm"
                onClick={() => onConfirm(item)}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}
