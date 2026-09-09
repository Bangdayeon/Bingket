import { Modal, Pressable, View, Image } from 'react-native';
import { Text } from '@/components/Text';
import { BADGE_META } from '@/lib/badge-checker';
import Button from '@/components/Button';

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
  if (!badge) return null;

  const meta = BADGE_META[badge.name];
  const displayName = meta?.name ?? badge.name;
  const message = meta?.message ?? '';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Backdrop */}
      <Pressable className="absolute bottom-0 left-0 right-0 top-0 bg-scrim/70" onPress={onClose} />

      {/* Centered card */}
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        pointerEvents="box-none"
      >
        <View
          style={{
            width: 280,
            backgroundColor: '#FDFDFD',
            borderRadius: 30,
            padding: 28,
            alignItems: 'center',
            gap: 16,
          }}
        >
          {/* 뱃지 이미지 */}
          {badge.iconUrl ? (
            <Image
              source={{ uri: badge.iconUrl }}
              style={{ width: 120, height: 120, borderRadius: 20 }}
              resizeMode="contain"
            />
          ) : (
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 20,
                backgroundColor: '#F6F7F7',
              }}
            />
          )}

          {/* 뱃지 이름 */}
          <Text className="text-title-lg text-center text-gray-900">{displayName}</Text>

          {/* 설명 */}
          {message ? (
            <Text className="text-body-md text-center text-gray-700">{message}</Text>
          ) : null}

          {/* 획득일 */}
          <View
            style={{
              backgroundColor: '#F6F7F7',
              borderRadius: 9999,
              paddingHorizontal: 16,
              paddingVertical: 8,
            }}
          >
            <Text className="text-body-sm text-gray-500">{formatDate(badge.earnedAt)} 획득</Text>
          </View>

          {/* 닫기 */}
          <Button onClick={onClose} label="확인" size="sm" className="px-10" />
        </View>
      </View>
    </Modal>
  );
}
