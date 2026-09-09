import { supabase } from '@/lib/supabase';
import type { Friend, IncomingRequest, UserSearchResult } from '@/types/friend';

// ─── Friends ──────────────────────────────────────────────────

/**
 * 친구 수만 센다. 목록을 받을 필요가 없는 자리(홈의 '친구와 할래요' 노출 판정)에서
 * 쓴다 — head: true 라 행은 안 넘어오고 카운트만 온다.
 */
export const fetchFriendCount = async (): Promise<number> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from('friends')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (error) return 0;
  return count ?? 0;
};

export const fetchFriends = async (): Promise<Friend[]> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('friends')
    .select('id, friend_id, users!friends_friend_id_fkey(username, display_name, avatar_url)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((row) => {
    const u = row.users as unknown as {
      username: string;
      display_name: string;
      avatar_url: string | null;
    } | null;
    return {
      rowId: row.id as string,
      friendId: row.friend_id as string,
      username: u?.username ?? '',
      displayName: u?.display_name ?? '',
      avatarUrl: u?.avatar_url ?? null,
    };
  });
};

export const deleteFriend = async (friendUserId: string): Promise<void> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요해요.');

  // 양방향 행을 함께 지운다
  const { error } = await supabase
    .from('friends')
    .delete()
    .or(
      `and(user_id.eq.${user.id},friend_id.eq.${friendUserId}),and(user_id.eq.${friendUserId},friend_id.eq.${user.id})`,
    );

  if (error) throw error;
};

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

/**
 * 알림 행은 여기서 만들지 않는다.
 * friend_requests INSERT 에 붙은 trg_notify_friend_request 트리거가 만든다
 * (20260830000001). 클라이언트는 타인에게 알림을 넣을 권한이 없다.
 */
export const sendFriendRequest = async (params: {
  receiverId: string;
  receiverDisplayName: string;
  existingStatus: string | null;
}): Promise<void> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요해요.');

  if (params.existingStatus !== null) {
    await supabase
      .from('friend_requests')
      .delete()
      .eq('sender_id', user.id)
      .eq('receiver_id', params.receiverId);
  }

  const { error } = await supabase
    .from('friend_requests')
    .insert({ sender_id: user.id, receiver_id: params.receiverId });

  if (error) throw error;
};

// ─── Respond to Friend Request ────────────────────────────────

export const respondToFriendRequest = async (requestId: string, accept: boolean): Promise<void> => {
  const { error } = await supabase
    .from('friend_requests')
    .update({ status: accept ? 'accepted' : 'rejected' })
    .eq('id', requestId);

  if (error) throw error;
};
