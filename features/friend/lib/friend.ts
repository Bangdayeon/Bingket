import { supabase } from '@/lib/supabase';
import type { IncomingRequest, UserSearchResult } from '@/types/friend';

// ─── User Search ─────────────────────────────────────────────

export const searchUsers = async (keyword: string): Promise<UserSearchResult[]> => {
  const { data, error } = await supabase.rpc('search_users', { keyword });
  if (error) throw error;
  return (data ?? []) as UserSearchResult[];
};

// ─── Incoming Friend Requests ─────────────────────────────────

export const fetchIncomingRequests = async (): Promise<IncomingRequest[]> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('friend_requests')
    .select(
      'id, sender_id, users!friend_requests_sender_id_fkey(username, display_name, avatar_url)',
    )
    .eq('receiver_id', user.id)
    .eq('status', 'pending');

  if (error) throw error;

  return (data ?? []).map((r) => {
    const u = r.users as unknown as {
      username: string;
      display_name: string;
      avatar_url: string | null;
    } | null;
    return {
      id: r.id,
      senderId: r.sender_id as string,
      username: u?.username ?? '',
      displayName: u?.display_name ?? '',
      avatarUrl: u?.avatar_url ?? null,
    };
  });
};

// ─── Conflict Check ───────────────────────────────────────────

/** Returns conflict info if `fromUserId` has a pending request TO the current user. */
export const checkIncomingConflict = async (
  fromUserId: string,
): Promise<{ requestId: string; senderDisplayName: string } | null> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('friend_requests')
    .select('id, users!friend_requests_sender_id_fkey(display_name)')
    .eq('sender_id', fromUserId)
    .eq('receiver_id', user.id)
    .eq('status', 'pending')
    .maybeSingle();

  if (!data) return null;

  const u = data.users as unknown as { display_name: string } | null;
  return {
    requestId: data.id as string,
    senderDisplayName: u?.display_name ?? '',
  };
};

// ─── Send Friend Request ──────────────────────────────────────

export const sendFriendRequest = async (params: {
  receiverId: string;
  receiverDisplayName: string;
  existingStatus: string | null;
}): Promise<void> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  if (params.existingStatus !== null) {
    await supabase
      .from('friend_requests')
      .delete()
      .eq('sender_id', user.id)
      .eq('receiver_id', params.receiverId);
  }

  const { data: requestData, error } = await supabase
    .from('friend_requests')
    .insert({ sender_id: user.id, receiver_id: params.receiverId })
    .select('id')
    .single();

  if (error) throw error;

  if (requestData) {
    const { data: sender } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', user.id)
      .single();

    await supabase.from('notifications').insert({
      user_id: params.receiverId,
      type: 'friend_request',
      message: `${sender?.display_name ?? '누군가'}님이 친구 요청을 보냈어요`,
      target_id: requestData.id,
      target_type: null,
    });
  }
};

// ─── Respond to Friend Request ────────────────────────────────

export const respondToFriendRequest = async (requestId: string, accept: boolean): Promise<void> => {
  const { error } = await supabase
    .from('friend_requests')
    .update({ status: accept ? 'accepted' : 'rejected' })
    .eq('id', requestId);

  if (error) throw error;
};
