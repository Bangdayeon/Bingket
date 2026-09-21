import { Modal, Pressable, View, Image } from 'react-native';
import { Text } from '@/components/Text';
import type { BadgeKey } from '@/lib/badge-checker';
import Button from '@/components/Button';
import { useTranslation } from 'react-i18next';

interface BadgeModalProps {
  visible: boolean;
  badge: {
    badgeId: string;
    iconUrl: string;
    name: string; // DB의 name 컬럼값 (예: 'comment_1')
    earnedAt: string;
  } | null;
  onClose: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
}

export function BadgeModal({ visible, badge, onClose }: BadgeModalProps) {
  const { t } = useTranslation();
  if (!badge) return null;

  const badgeKey = badge.name as BadgeKey;
  const displayName = t(`badge.${badgeKey}.name`);
  const message = t(`badge.${badgeKey}.message`);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="absolute bottom-0 left-0 right-0 top-0 bg-scrim/70" onPress={onClose} />

      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        pointerEvents="box-none"
      >
        <View
          className="bg-white"
          style={{ width: 280, borderRadius: 30, padding: 28, alignItems: 'center', gap: 16 }}
        >
          {badge.iconUrl ? (
            <Image
              source={{ uri: badge.iconUrl }}
              style={{ width: 120, height: 120, borderRadius: 20 }}
              resizeMode="contain"
            />
          ) : (
            <View className="bg-gray-200" style={{ width: 120, height: 120, borderRadius: 20 }} />
          )}

          <Text className="text-title-lg text-center text-gray-900">{displayName}</Text>

          {message ? (
            <Text className="text-body-md text-center text-gray-700">{message}</Text>
          ) : null}

          <View
            className="bg-gray-200"
            style={{ borderRadius: 9999, paddingHorizontal: 16, paddingVertical: 8 }}
          >
            <Text className="text-body-sm text-gray-500">
              {formatDate(badge.earnedAt)} {t('badge.get')}
            </Text>
          </View>

          <Button onClick={onClose} label={t('common.confirm')} size="sm" className="px-10" />
        </View>
      </View>
    </Modal>
  );
}
