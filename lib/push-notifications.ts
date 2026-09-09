import * as Sentry from '@sentry/react-native';
import { LIGHT } from '@/constants/color-tokens.cjs';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import { navigateToNotification } from '@/features/notifications/lib/notification-route';
import { supabase } from '@/lib/supabase';

// 포그라운드 알림 표시 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    // shouldShowAlert는 deprecated -- banner(상단 배너) + list(알림 센터)로 분리됐다
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export type PushRegistrationResult =
  | { status: 'ok'; token: string }
  // 시뮬레이터/에뮬레이터 -- 원격 푸시 자체가 불가능하므로 실패가 아니다
  | { status: 'unsupported' }
  | { status: 'denied' }
  | { status: 'error'; error: unknown };

/**
 * Supabase 에러 객체의 details/hint에는 실패한 행의 값이 그대로 실려 온다.
 * push_tokens upsert가 실패하면 거기에 푸시 토큰과 user_id가 포함되므로,
 * 원인 파악에 필요한 message와 code만 남기고 나머지는 버린다.
 */
const describeError = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object') {
    const { message, code } = error as { message?: unknown; code?: unknown };
    if (typeof message === 'string') {
      return typeof code === 'string' ? `${message} (${code})` : message;
    }
  }
  return '알 수 없는 오류';
};

/**
 * 푸시 관련 실패는 전 구간이 조용히 무시되면 원인 추적이 불가능하므로
 * 반드시 콘솔 + Sentry 양쪽에 남긴다.
 */
const reportPushFailure = (context: string, error: unknown): void => {
  const detail = describeError(error);
  console.warn(`[push] ${context}: ${detail}`);
  Sentry.captureException(error instanceof Error ? error : new Error(`[push] ${context}`), {
    tags: { feature: 'push-notifications' },
    extra: { context, error: detail },
  });
};

/** app.json의 extra.eas.projectId를 단일 출처로 사용한다 (하드코딩 금지) */
const getProjectId = (): string | null => {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? null;
};

export async function registerForPushNotifications(): Promise<PushRegistrationResult> {
  // 실제 기기에서만 동작
  if (!Device.isDevice) return { status: 'unsupported' };

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: '기본 알림',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      // 예전 팔레트(주황)가 남아 있었다. green-400은 라이트/다크에서 같은 값이라
      // 안드로이드 알림 LED 색으로 그대로 쓸 수 있다.
      lightColor: LIGHT.green[400],
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  // 한 번 거부하면 OS가 재프롬프트를 띄우지 않는다 -- 호출측에서 설정 앱 유도 가능하도록 구분해 반환
  if (finalStatus !== 'granted') return { status: 'denied' };

  const projectId = getProjectId();
  if (!projectId) {
    const error = new Error('app.json의 extra.eas.projectId를 찾을 수 없습니다');
    reportPushFailure('projectId 누락', error);
    return { status: 'error', error };
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    return { status: 'ok', token };
  } catch (error) {
    // APNs 키 미등록, FCM 미설정 등이 여기로 떨어진다
    reportPushFailure('getExpoPushTokenAsync 실패', error);
    return { status: 'error', error };
  }
}

export async function savePushToken(token: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  // (user_id, token) 복합 PK -- 유저당 기기 여러 대를 허용한다 (20260830000002)
  const { error } = await supabase
    .from('push_tokens')
    .upsert(
      { user_id: user.id, token, platform, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,token' },
    );

  if (error) reportPushFailure('push_tokens upsert 실패', error);
}

/**
 * 토큰 발급 → 저장까지 한 번에 처리한다.
 * 로그인 직후와 앱 재실행(이미 로그인 상태) 양쪽에서 호출된다.
 */
export async function syncPushToken(): Promise<PushRegistrationResult> {
  const result = await registerForPushNotifications();
  if (result.status === 'ok') {
    await savePushToken(result.token);
  } else if (result.status === 'denied') {
    console.warn('[push] 알림 권한이 거부되어 토큰을 등록하지 않았습니다');
  }
  return result;
}

/**
 * 이미 권한이 있을 때만 현재 기기의 토큰을 돌려준다.
 * registerForPushNotifications 와 달리 **권한을 요청하지 않는다** --
 * 로그아웃 도중에 권한 팝업이 뜨면 안 되기 때문이다.
 */
const currentDeviceToken = async (): Promise<string | null> => {
  if (!Device.isDevice) return null;

  const projectId = getProjectId();
  if (!projectId) return null;

  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return null;

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    return token;
  } catch (error) {
    reportPushFailure('현재 기기 토큰 조회 실패', error);
    return null;
  }
};

/**
 * 로그아웃 직전에 호출해야 한다.
 * push_tokens RLS가 auth.uid() = user_id이므로 세션이 끊긴 뒤에는 0행만 삭제된다.
 * 정리하지 않으면 같은 기기에 다른 계정이 로그인했을 때 이전 계정 알림이 이 기기로 온다.
 *
 * 다기기를 지원하므로 **이 기기의 토큰만** 지운다. 전부 지우면 로그아웃한 적도 없는
 * 다른 기기가 알림을 못 받는다.
 * 토큰을 못 구하면(권한 거부, 시뮬레이터 등) 이 유저의 행을 전부 지운다 --
 * 그 기기에 남은 낡은 토큰을 치울 다른 방법이 없고, 남의 알림이 새는 쪽이 더 나쁘다.
 */
export async function deletePushToken(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const token = await currentDeviceToken();

  let query = supabase.from('push_tokens').delete().eq('user_id', user.id);
  if (token) query = query.eq('token', token);

  const { error } = await query;
  if (error) reportPushFailure('push_tokens 삭제 실패', error);
}

interface PushPayload {
  type?: string;
  targetId?: string;
  // 하위 호환: 기존 엣지 함수들이 쓰던 필드
  postId?: string;
  boardId?: string;
}

/** 푸시 data 페이로드를 화면 이동으로 변환한다 */
const handleNotificationTap = (raw: unknown): void => {
  const data = (raw ?? {}) as PushPayload;
  const type = data.type ?? (data.postId ? 'comment' : data.boardId ? 'bingo_reminder' : '');
  const targetId = data.targetId ?? data.postId ?? data.boardId ?? null;

  // 대응 화면이 없는 타입(badge 등)은 알림 목록으로 보낸다
  if (!navigateToNotification(type, targetId)) {
    router.push('/(tabs)/notifications');
  }
};

/**
 * 이미 처리한 알림 응답 id.
 * 리스너와 콜드스타트 경로가 같은 탭을 두 번 잡아 화면이 두 번 밀리는 것을 막는다.
 */
const handledResponseIds = new Set<string>();

/**
 * getLastNotificationResponseAsync 는 "가장 최근" 응답을 앱 실행 원인과 무관하게 돌려준다.
 * 매 마운트마다 확인하면 푸시로 연 게 아닌 실행에서도 예전에 탭했던 알림으로 이동한다.
 * 그래서 프로세스당 1회만 본다.
 */
let coldStartResponseChecked = false;

const handleResponse = (response: Notifications.NotificationResponse): void => {
  const id = response.notification.request.identifier;
  if (handledResponseIds.has(id)) return;
  handledResponseIds.add(id);
  handleNotificationTap(response.notification.request.content.data);
};

/**
 * 푸시를 탭했을 때의 화면 이동을 등록한다.
 * 반환된 함수를 useEffect cleanup에서 호출할 것.
 */
export function addNotificationTapListener(): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);

  // 앱이 완전히 종료된 상태에서 푸시로 실행된 경우 리스너가 잡지 못하므로 별도 확인
  if (!coldStartResponseChecked) {
    coldStartResponseChecked = true;
    void Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) handleResponse(response);
      })
      .catch((error: unknown) => reportPushFailure('getLastNotificationResponseAsync 실패', error));
  }

  return () => subscription.remove();
}
