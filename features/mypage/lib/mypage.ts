import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

const R2_PUBLIC_URL = 'https://pub-ce1a524f861f4062a6ec96dd100c4aec.r2.dev';

export interface MyProfile {
  displayName: string;
  username: string;
  bio: string;
  avatarUrl: string | null;
  feedCount: number;
  friendCount: number;
  followerCount: number;
  followingCount: number;
}

export const fetchMyProfile = async (): Promise<MyProfile | null> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('display_name, username, bio, avatar_url')
    .eq('id', user.id)
    .single();

  if (!profile) {
    // public.users 행이 없는 경우 (trigger 미작동 등) — auth 메타데이터로 폴백
    const rawName = (user.user_metadata?.name as string | undefined) ?? '';
    const displayName =
      rawName.replace(/[^\u{AC00}-\u{D7A3}a-zA-Z0-9]/gu, '').slice(0, 20) || '빙고유저';
    return {
      displayName,
      username: `user_${user.id.replace(/-/g, '').slice(0, 15)}`,
      bio: '',
      avatarUrl: null,
      feedCount: 0,
      friendCount: 0,
      followerCount: 0,
      followingCount: 0,
    };
  }

  const [{ count: feedCount }, { count: friendCount }] = await Promise.all([
    supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_deleted', false),
    supabase.from('friends').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
  ]);

  return {
    displayName: profile.display_name,
    username: profile.username,
    bio: profile.bio ?? '',
    avatarUrl: profile.avatar_url ?? null,
    feedCount: feedCount ?? 0,
    friendCount: friendCount ?? 0,
    followerCount: 0,
    followingCount: 0,
  };
};

export const updateMyProfile = async (data: {
  displayName: string;
  username: string;
  bio: string;
  avatarUrl?: string;
}): Promise<void> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  const updates: Record<string, string> = {
    display_name: data.displayName,
    username: data.username,
    bio: data.bio,
  };
  if (data.avatarUrl !== undefined) updates.avatar_url = data.avatarUrl;

  const { error } = await supabase.from('users').update(updates).eq('id', user.id);
  if (error) throw error;
};

export const uploadProfileImage = async (uri: string, filename: string): Promise<string> => {
  const ext = filename.split('.').pop() ?? 'jpg';
  const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';

  // getUser() refreshes token if needed — important for Kakao sessions
  await supabase.auth.getUser();

  const { data, error } = await supabase.functions.invoke('r2-presign', {
    body: { filename, contentType },
  });
  if (error) throw error;

  const file = await fetch(uri);
  const blob = await file.blob();

  const uploadRes = await fetch(data.presignedUrl as string, {
    method: 'PUT',
    body: blob,
    headers: { 'Content-Type': contentType },
  });
  if (!uploadRes.ok) throw new Error('이미지 업로드에 실패했습니다.');

  return `${R2_PUBLIC_URL}/${data.key as string}`;
};

export interface LinkedAccount {
  provider: string;
  email: string | null;
}

export const fetchLinkedAccounts = async (): Promise<LinkedAccount[]> => {
  const {
    data: { user },
  } = await supabase.auth.getUser(); // getSession().user는 JWT에 identities 미포함 → getUser() 필수
  if (!user) return [];

  return (user.identities ?? []).map((identity) => {
    // admin.createUser로 생성된 카카오 유저는 provider가 "email"로 저장됨
    // user_metadata.kakao_id 유무로 실제 provider 판별
    const isKakao =
      identity.provider === 'kakao' ||
      (identity.provider === 'email' && !!user.user_metadata?.kakao_id);
    const provider = isKakao ? 'kakao' : identity.provider;
    const email = isKakao
      ? ((user.user_metadata?.kakao_email as string | undefined) ??
        (identity.identity_data?.email as string | undefined) ??
        null)
      : ((identity.identity_data?.email as string | undefined) ?? null);
    return { provider, email };
  });
};

export const resetMyBingos = async (): Promise<void> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  const { error } = await supabase
    .from('bingo_boards')
    .update({ deleted_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('deleted_at', null);
  if (error) throw error;
};

export interface MyPost {
  id: string;
  title: string;
  content: string;
  category: 'bingo_board' | 'bingo_achieve' | 'free';
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  const months = Math.floor(days / 30);
  return `${months}달 전`;
}

export { timeAgo };

function extractTextPreview(content: string): string {
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0].type === 'string') {
      return parsed
        .filter((b: { type: string; value?: string }) => b.type === 'text' && b.value)
        .map((b: { value: string }) => b.value)
        .join(' ');
    }
  } catch {
    /* 구형 plain text */
  }
  return content;
}

export const fetchMyPosts = async (): Promise<MyPost[]> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('posts')
    .select('id, title, content, category, like_count, comment_count, created_at')
    .eq('user_id', user.id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((p) => ({
    id: p.id,
    title: p.title,
    content: extractTextPreview(p.content as string),
    category: p.category as MyPost['category'],
    likeCount: p.like_count,
    commentCount: p.comment_count,
    createdAt: timeAgo(p.created_at),
  }));
};

export const deleteAccount = async (): Promise<void> => {
  // getUser() triggers token refresh before getSession() — needed for Kakao
  await supabase.auth.getUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('로그인이 필요합니다.');

  const { error } = await supabase.functions.invoke('delete-account', {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) {
    // FunctionsHttpError.message는 항상 generic — context.text()로 실제 서버 응답 추출
    const body = await (error as { context?: Response }).context?.text?.();
    throw new Error(body ?? error.message);
  }

  // 탈퇴 시 모든 로컬 캐시 제거
  await AsyncStorage.multiRemove(['@bingket/cache-my-profile', '@bingket/draft-bingo']);

  await supabase.auth.signOut();
};
