import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

export interface NotificationSettings {
  bingoDeadline: boolean;
  bingoDaily: boolean;
  communityPopular: boolean;
  communityComment: boolean;
  communityLike: boolean;
  eventPush: boolean;
  /** 팀원이 칸을 채우거나 팀에 합류했을 때 */
  teamActivity: boolean;
}

const STORAGE_KEY = '@bingket/alert-settings';

// DB(notification_settings) 컬럼 DEFAULT와 반드시 동일하게 유지할 것
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  bingoDeadline: true,
  bingoDaily: true,
  communityPopular: true,
  communityComment: true,
  communityLike: true,
  eventPush: true,
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
    bingoDaily: data.bingo_daily as boolean,
    communityPopular: data.community_popular as boolean,
    communityComment: data.community_comment as boolean,
    communityLike: data.community_like as boolean,
    eventPush: data.event_push as boolean,
    teamActivity: data.team_activity as boolean,
  };

  // 다음 진입 시 깜빡임 없이 표시되도록 캐시에도 반영한다
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

  return settings;
};

// 설정 저장: AsyncStorage(즉시) + Supabase(백엔드 동기화)
export const saveNotificationSettings = async (settings: NotificationSettings): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from('notification_settings').upsert(
    {
      user_id: user.id,
      bingo_deadline: settings.bingoDeadline,
      bingo_daily: settings.bingoDaily,
      community_popular: settings.communityPopular,
      community_comment: settings.communityComment,
      community_like: settings.communityLike,
      event_push: settings.eventPush,
      team_activity: settings.teamActivity,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  if (error) throw error;
};

// AsyncStorage 캐시에서 즉시 로드 (화면 깜빡임 없이 초기값 설정용)
export const loadCachedNotificationSettings = async (): Promise<NotificationSettings | null> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      ...(JSON.parse(raw) as Partial<NotificationSettings>),
    };
  } catch {
    return null;
  }
};
