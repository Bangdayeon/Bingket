import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import IconButton from '@/components/IconButton';
import { Toggle } from '@/components/Toggle';
import BackArrowIcon from '@/assets/icons/ic_arrow_back.svg';
import { Text } from '@/components/Text';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  fetchNotificationSettings,
  loadCachedNotificationSettings,
  saveNotificationSettings,
  type NotificationSettings,
} from '@/features/mypage/lib/notification-settings';

interface ToggleRowProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}

function ToggleRow({ label, description, value, onValueChange }: ToggleRowProps) {
  return (
    <View className="flex-row items-center justify-between px-5 py-3">
      <View className="flex-1 mr-4">
        <Text className="text-body-lg">{label}</Text>
        {description ? (
          <Text className="text-caption-sm" style={{ color: '#929898' /* gray-500 */ }}>
            {description}
          </Text>
        ) : null}
      </View>
      <Toggle value={value} onValueChange={onValueChange} />
    </View>
  );
}

export default function AlertSettingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. AsyncStorage 캐시 → 즉시 표시
    loadCachedNotificationSettings().then((cached) => {
      if (cached) setSettings(cached);
    });
    // 2. Supabase → 최신값으로 업데이트
    fetchNotificationSettings().then((data) => {
      setSettings(data);
      setLoading(false);
    });
  }, []);

  const update = (patch: Partial<NotificationSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveNotificationSettings(next);
  };

  const allAlert = Object.values(settings).every(Boolean);

  const handleAllAlert = (v: boolean) => {
    update({
      bingoDeadline: v,
      bingoDaily: v,
      communityPopular: v,
      communityComment: v,
      communityLike: v,
      eventPush: v,
    });
  };

  return (
    <View className="flex-1 bg-white dark:bg-gray-900" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="h-[60px] flex-row items-center px-4 border-b border-gray-300 dark:border-gray-700">
        <IconButton
          variant="ghost"
          size={32}
          icon={<BackArrowIcon width={20} height={20} />}
          onClick={() => router.back()}
        />
        <Text className="flex-1 text-center text-title-sm">알림 설정</Text>
        {loading ? (
          <ActivityIndicator size="small" color="#929898" /* gray-500 */ style={{ width: 32 }} />
        ) : (
          <View className="w-8" />
        )}
      </View>

      <ScrollView className="flex-1">
        <ToggleRow label="전체 알림" value={allAlert} onValueChange={handleAllAlert} />

        <View className="h-px bg-gray-200 dark:bg-gray-700 mx-5 my-2" />

        {/* 빙고 알림 */}
        <View className="px-5 pt-3 pb-1">
          <Text className="text-title-md">빙고 알림</Text>
        </View>
        <ToggleRow
          label="기간 임박 알림"
          description="빙고 기간이 10일, 5일 남았을 때"
          value={settings.bingoDeadline}
          onValueChange={(v) => update({ bingoDeadline: v })}
        />

        <View className="h-px bg-gray-200 dark:bg-gray-700 mx-5 my-2" />

        {/* 커뮤니티 알림 */}
        <View className="px-5 pt-3 pb-1">
          <Text className="text-title-md">커뮤니티 알림</Text>
        </View>
        <ToggleRow
          label="인기글 알림"
          description="내 게시글이 좋아요 10개를 받았을 때"
          value={settings.communityPopular}
          onValueChange={(v) => update({ communityPopular: v })}
        />
        <ToggleRow
          label="댓글 및 대댓글 알림"
          description="내 게시글에 댓글이 달렸을 때"
          value={settings.communityComment}
          onValueChange={(v) => update({ communityComment: v })}
        />
        <ToggleRow
          label="좋아요 알림"
          description="내 게시글에 좋아요가 달렸을 때"
          value={settings.communityLike}
          onValueChange={(v) => update({ communityLike: v })}
        />

        <View className="h-px bg-gray-200 dark:bg-gray-700 mx-5 my-2" />

        {/* 이벤트 및 혜택 알림 */}
        <View className="px-5 pt-3 pb-1">
          <Text className="text-title-md">이벤트 및 혜택 알림</Text>
        </View>
        <ToggleRow
          label="앱 푸시"
          description="새로운 이벤트 및 혜택 소식"
          value={settings.eventPush}
          onValueChange={(v) => update({ eventPush: v })}
        />
      </ScrollView>
    </View>
  );
}
