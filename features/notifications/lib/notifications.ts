import { supabase } from '@/lib/supabase';
import type { TeamMode } from '@/types/team';

export interface SenderProfile {
  displayName: string;
  username: string;
  avatarUrl: string | null;
}

export interface Notification {
  id: string;
  type: string;
  message: string;
  target_id: string | null;
  target_type: string | null;
  is_read: boolean;
  created_at: string;
  senderProfile?: SenderProfile;
  /**
   * team_invite일 때만 채워진다. 홈 알림 스트립이 인라인으로 수락할 수 있는
   * 모드인지 판단하는 데 쓴다 ('competition'은 빙고를 직접 만들어야 해서 화면 이동이 필요하다).
   */
  teamMode?: TeamMode;
}

type RequestRow = {
  id: string;
  sender: { display_name: string; username: string; avatar_url: string | null } | null;
};

type TeamRow = RequestRow & { mode: TeamMode };

export const fetchNotifications = async (): Promise<Notification[]> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, message, target_id, target_type, is_read, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  const notifications = data ?? [];

  // friend_request / team_invite 알림에 보낸 사람 프로필 병렬 조회
  const friendIds = notifications
    .filter((n) => n.type === 'friend_request' && n.target_id)
    .map((n) => n.target_id as string);
  // team_invite의 target_id는 팀 id이고, 보낸 사람은 그 팀의 방장이다
  const teamIds = notifications
    .filter((n) => n.type === 'team_invite' && n.target_id)
    .map((n) => n.target_id as string);

  const senderMap = new Map<string, SenderProfile>();
  const modeMap = new Map<string, TeamMode>();

  const [friendRows, teamRows] = await Promise.all([
    friendIds.length > 0
      ? supabase
          .from('friend_requests')
          .select(
            'id, sender:users!friend_requests_sender_id_fkey(display_name, username, avatar_url)',
          )
          .in('id', friendIds)
          .returns<RequestRow[]>()
      : Promise.resolve({ data: [] as RequestRow[] }),
    teamIds.length > 0
      ? supabase
          .from('team_bingos')
          .select(
            'id, mode, sender:users!team_bingos_owner_id_fkey(display_name, username, avatar_url)',
          )
          .in('id', teamIds)
          .returns<TeamRow[]>()
      : Promise.resolve({ data: [] as TeamRow[] }),
  ]);

  for (const row of friendRows.data ?? []) {
    if (row.sender) {
      senderMap.set(row.id, {
        displayName: row.sender.display_name,
        username: row.sender.username,
        avatarUrl: row.sender.avatar_url,
      });
    }
  }
  for (const row of teamRows.data ?? []) {
    modeMap.set(row.id, row.mode);
    if (row.sender) {
      senderMap.set(row.id, {
        displayName: row.sender.display_name,
        username: row.sender.username,
        avatarUrl: row.sender.avatar_url,
      });
    }
  }

  return notifications.map((n) => ({
    ...n,
    senderProfile: n.target_id ? senderMap.get(n.target_id) : undefined,
    teamMode: n.target_id ? modeMap.get(n.target_id) : undefined,
  }));
};

/**
 * 처리가 끝난 알림을 지운다. 남겨두면 다시 눌러 또 처리할 수 있어서다
 * (팀 초대는 재수락 시 빙고판이 하나 더 만들어졌다).
 *
 * 홈 알림 스트립과 알림 페이지가 같은 경로를 쓰도록 여기에 둔다.
 */
export const deleteNotificationByTarget = async (type: string, targetId: string): Promise<void> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', user.id)
    .eq('type', type)
    .eq('target_id', targetId);

  if (error) throw error;
};

export const markAllNotificationsRead = async (): Promise<void> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) throw error;
};

export const markNotificationRead = async (id: string): Promise<void> => {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);

  if (error) throw error;
};
