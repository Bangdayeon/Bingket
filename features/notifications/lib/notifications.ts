import { supabase } from '@/lib/supabase';

export interface Notification {
  id: string;
  type: string;
  message: string;
  target_id: string | null;
  target_type: string | null;
  is_read: boolean;
  created_at: string;
}

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
  return data ?? [];
};

export const markAllNotificationsRead = async (): Promise<void> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id) // 추가
    .eq('is_read', false);

  if (error) throw error;
};

export const markNotificationRead = async (id: string): Promise<void> => {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);

  if (error) throw error;
};
