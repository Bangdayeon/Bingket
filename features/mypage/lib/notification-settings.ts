import AsyncStorage from '@react-native-async-storage/async-storage';
import { CACHE_KEY_ALERT_SETTINGS } from '@/constants/cache_key';
import { supabase } from '@/lib/supabase';

export interface NotificationSettings {
  bingoDeadline: boolean;
  communityPopular: boolean;
  communityComment: boolean;
  communityLike: boolean;
  /** 팀원이 칸을 채우거나 팀에 합류했을 때 */
  teamActivity: boolean;
}

// DB(notification_settings) 컬럼 DEFAULT와 반드시 동일하게 유지할 것
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  bingoDeadline: true,
  communityPopular: true,
  communityComment: true,
  communityLike: true,
  teamActivity: true,
};

// Supabase에서 설정 조회 (없으면 기본값 반환)
export const fetchNotificationSettings = async (): Promise<NotificationSettings> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return DEFAULT_NOTIFICATION_SETTINGS;

  const { data } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!data) return DEFAULT_NOTIFICATION_SETTINGS;

  const settings: NotificationSettings = {
    bingoDeadline: data.bingo_deadline as boolean,
    communityPopular: data.community_popular as boolean,
    communityComment: data.community_comment as boolean,
    communityLike: data.community_like as boolean,
    teamActivity: data.team_activity as boolean,
  };

  // 다음 진입 시 깜빡임 없이 표시되도록 캐시에도 반영한다
  await AsyncStorage.setItem(CACHE_KEY_ALERT_SETTINGS, JSON.stringify(settings));

  return settings;
};

// 설정 저장: AsyncStorage(즉시) + Supabase(백엔드 동기화)
// bingo_daily / event_push 컬럼은 읽는 서버 코드도 UI 행도 없어 여기서 건드리지 않는다.
// (DB 컬럼은 DEFAULT true 로 남겨둔다 -- 이벤트 발송 기능이 생기면 그때 다시 연결)
export const saveNotificationSettings = async (settings: NotificationSettings): Promise<void> => {
  await AsyncStorage.setItem(CACHE_KEY_ALERT_SETTINGS, JSON.stringify(settings));

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from('notification_settings').upsert(
    {
      user_id: user.id,
      bingo_deadline: settings.bingoDeadline,
      community_popular: settings.communityPopular,
      community_comment: settings.communityComment,
      community_like: settings.communityLike,
      team_activity: settings.teamActivity,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  if (error) throw error;
};

// AsyncStorage 캐시에서 즉시 로드 (화면 깜빡임 없이 초기값 설정용)
export const loadCachedNotificationSettings = async (): Promise<NotificationSettings | null> => {
  const raw = await AsyncStorage.getItem(CACHE_KEY_ALERT_SETTINGS);
  if (!raw) return null;
  try {
    const cached = JSON.parse(raw) as Partial<NotificationSettings>;
    // 스프레드로 통째로 합치면 예전 버전이 저장해둔 키(bingoDaily, eventPush 등)가 그대로 살아남아
    // 화면의 "전체 알림" 계산을 다시 망가뜨린다. 아는 키만 골라 담는다.
    const pick = (key: keyof NotificationSettings): boolean =>
      typeof cached[key] === 'boolean' ? cached[key] : DEFAULT_NOTIFICATION_SETTINGS[key];

    return {
      bingoDeadline: pick('bingoDeadline'),
      communityPopular: pick('communityPopular'),
      communityComment: pick('communityComment'),
      communityLike: pick('communityLike'),
      teamActivity: pick('teamActivity'),
    };
  } catch {
    return null;
  }
};

/**
 * 로그아웃·탈퇴 시 호출해야 한다.
 * 지우지 않으면 같은 기기에 다른 계정이 로그인했을 때
 * 이전 사용자의 알림 설정이 초기 화면에 그대로 뜬다.
 */
export const clearNotificationSettingsCache = async (): Promise<void> => {
  await AsyncStorage.removeItem(CACHE_KEY_ALERT_SETTINGS);
};
