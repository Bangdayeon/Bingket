import * as Sentry from '@sentry/react-native';
import * as Notifications from 'expo-notifications';
import { PageHeader } from '@/components/PageHeader';
import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Toggle } from '@/components/Toggle';
import { Text } from '@/components/Text';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  fetchNotificationSettings,
  loadCachedNotificationSettings,
  saveNotificationSettings,
  type NotificationSettings,
} from '@/features/mypage/lib/notification-settings';
import Loading from '@/components/Loading';
import { Toast } from '@/components/Toast';

interface ToggleRowProps {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}

function ToggleRow({ label, value, onValueChange }: ToggleRowProps) {
  return (
    <View className="h-14 flex-row items-center justify-between px-4">
      <Text className="text-body-md text-gray-800">{label}</Text>
      <Toggle value={value} onValueChange={onValueChange} />
    </View>
  );
}

/** 시안: 그룹 이름은 작은 회색 캡션이다 */
function GroupCaption({ label }: { label: string }) {
  return <Text className="px-4 pb-1 pt-6 text-caption-md text-gray-500">{label}</Text>;
}

const Divider = () => <View className="h-px bg-gray-300" />;

export default function AlertSettingScreen() {
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saveFailed, setSaveFailed] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [osDenied, setOsDenied] = useState(false);

  useEffect(() => {
    // 1. AsyncStorage 캐시 → 즉시 표시
    loadCachedNotificationSettings().then((cached) => {
      if (cached) setSettings(cached);
    });
    // 2. Supabase → 최신값으로 업데이트.
    //    실패하면 헤더 스피너가 영영 돌고, 토글은 서버값이 아닌 기본값으로 굳어
    //    실제 설정과 화면이 달라진다.
    fetchNotificationSettings()
      .then(setSettings)
      .catch((error: unknown) => {
        Sentry.captureException(error);
        setLoadFailed(true);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    Notifications.getPermissionsAsync()
      .then(({ status }) => setOsDenied(status !== 'granted'))
      .catch((error: unknown) => Sentry.captureException(error));
  }, []);

  const update = (patch: Partial<NotificationSettings>) => {
    const prev = settings;
    const next = { ...settings, ...patch };
    setSettings(next);
    // 저장 실패 시 토글이 켜진 것처럼 보이는데 실제로는 반영되지 않는 상황을 막는다
    saveNotificationSettings(next).catch((error: unknown) => {
      Sentry.captureException(error);
      setSettings(prev);
      setSaveFailed(true);
    });
  };

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <PageHeader title="알림 설정" right={loading ? <Loading /> : undefined} />

      <ScrollView className="flex-1">
        {osDenied ? (
          <Pressable
            onPress={() => void Linking.openSettings()}
            className="mx-4 mt-4 rounded-xl bg-gray-100 px-4 py-3"
          >
            <Text className="text-body-md font-pretendard-medium">기기 알림이 꺼져 있어요</Text>
            <Text className="mt-0.5 text-caption-sm text-gray-500">
              아래 설정과 무관하게 알림이 오지 않아요. 눌러서 기기 설정에서 켜주세요.
            </Text>
          </Pressable>
        ) : null}

        <GroupCaption label="빙고" />
        <ToggleRow
          label="기간 임박 알림"
          value={settings.bingoDeadline}
          onValueChange={(v) => update({ bingoDeadline: v })}
        />

        <Divider />

        <GroupCaption label="팀 빙고" />
        <ToggleRow
          label="팀원 활동 알림"
          value={settings.teamActivity}
          onValueChange={(v) => update({ teamActivity: v })}
        />

        <Divider />

        <GroupCaption label="게시판" />
        <ToggleRow
          label="인기글 알림"
          value={settings.communityPopular}
          onValueChange={(v) => update({ communityPopular: v })}
        />
        <ToggleRow
          label="댓글 알림"
          value={settings.communityComment}
          onValueChange={(v) => update({ communityComment: v })}
        />
        <ToggleRow
          label="좋아요 알림"
          value={settings.communityLike}
          onValueChange={(v) => update({ communityLike: v })}
        />
      </ScrollView>

      <Toast
        message="알림 설정 저장에 실패했어요. 잠시 후 다시 시도해주세요."
        visible={saveFailed}
        onDismiss={() => setSaveFailed(false)}
      />
      <Toast
        message="알림 설정을 불러오지 못했어요. 화면의 값이 실제와 다를 수 있어요."
        visible={loadFailed}
        onDismiss={() => setLoadFailed(false)}
      />
    </View>
  );
}
