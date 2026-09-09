import { supabase } from '@/lib/supabase';
import type { BingoTheme } from '@/types/bingo';

// ============================================================
// Types
// ============================================================

export type BoardVisibility = 'private' | 'friends' | 'public';

/**
 * 계정 공개 범위. 빙고 축(BoardVisibility)과 값이 같지만 축이 다르다 —
 * 둘 중 더 엄격한 쪽이 적용된다.
 */
export type AccountVisibility = 'private' | 'friends' | 'public';

export interface ProfileSummary {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  /** @deprecated accountVisibility에서 파생된다. 기존 화면 호환용. */
  isPrivate: boolean;
  accountVisibility: AccountVisibility;
  isMe: boolean;
  isFriend: boolean;
  hasPendingRequest: boolean;
  friendCount: number;
  /** 본인 프로필일 때만 채워진다. 타인에게는 익명 게시글 역산을 막기 위해 노출하지 않는다 */
  feedCount: number | null;
}

export interface FeedCell {
  position: number;
  content: string;
  isChecked: boolean;
}

export interface FeedItem {
  id: string;
  title: string;
  grid: string;
  theme: BingoTheme;
  status: 'progress' | 'done';
  /** 본인 피드일 때만 채워진다 */
  visibility: BoardVisibility | null;
  cells: FeedCell[];
  createdAt: string;
}

export interface BoardDetail {
  id: string;
  userId: string;
  title: string;
  grid: string;
  theme: BingoTheme;
  status: 'progress' | 'done';
  /** 진행 기간. 제작 중 빙고는 비어 있을 수 있다 */
  startDate: string | null;
  targetDate: string | null;
  cells: FeedCell[];
}

// ============================================================
// Internal
// ============================================================

type RawCell = { position: number; content: string; is_checked: boolean };

const mapCells = (raw: unknown): FeedCell[] =>
  ((raw ?? []) as RawCell[])
    .map((c) => ({ position: c.position, content: c.content, isChecked: c.is_checked }))
    .sort((a, b) => a.position - b.position);

// ============================================================
// API
// ============================================================

/** 프로필 헤더. 차단 관계이거나 탈퇴한 유저면 null */
export const fetchProfile = async (userId: string): Promise<ProfileSummary | null> => {
  const { data, error } = await supabase.rpc('get_user_profile', { p_user_id: userId });
  if (error) throw error;

  const row = (data ?? [])[0];
  if (!row) return null;

  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    isPrivate: row.is_private,
    accountVisibility: (row.account_visibility as AccountVisibility) ?? 'friends',
    isMe: row.is_me,
    isFriend: row.is_friend,
    hasPendingRequest: row.has_pending_request,
    friendCount: Number(row.friend_count ?? 0),
    feedCount: row.feed_count === null ? null : Number(row.feed_count),
  };
};

/** 내 프로필. 타인 프로필과 같은 RPC를 써서 표시 로직을 한 벌로 유지한다 */
export const fetchMyProfileSummary = async (): Promise<ProfileSummary | null> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return fetchProfile(user.id);
};

/**
 * 프로필 피드. 공개범위 판정은 전부 DB에서 끝나므로
 * 여기서 걸러야 할 것은 없다 — 볼 수 있는 것만 내려온다.
 */
export const fetchUserFeed = async (userId: string): Promise<FeedItem[]> => {
  const { data, error } = await supabase.rpc('get_user_feed', { p_user_id: userId });
  if (error) throw error;

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    title: row.title as string,
    grid: row.grid as string,
    theme: row.theme as BingoTheme,
    status: row.status as 'progress' | 'done',
    visibility: (row.visibility as BoardVisibility | null) ?? null,
    cells: mapCells(row.cells),
    createdAt: row.created_at as string,
  }));
};

/** 타인 빙고 상세. 진행 기간까지 내려오고, 메모와 회고는 애초에 내려오지 않는다 */
export const fetchBoardDetail = async (boardId: string): Promise<BoardDetail | null> => {
  const { data, error } = await supabase.rpc('get_board_detail', { p_board_id: boardId });
  if (error) throw error;

  const row = (data ?? [])[0];
  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    grid: row.grid,
    theme: row.theme as BingoTheme,
    status: row.status as 'progress' | 'done',
    startDate: row.start_date ?? null,
    targetDate: row.target_date ?? null,
    cells: mapCells(row.cells),
  };
};

/** 빙고판 공개범위 변경 */
export const updateBoardVisibility = async (
  boardId: string,
  visibility: BoardVisibility,
): Promise<void> => {
  const { error } = await supabase.from('bingo_boards').update({ visibility }).eq('id', boardId);
  if (error) throw error;
};

/** 계정 공개 범위 변경. is_private는 DB 트리거가 맞춰 준다. */
export const updateAccountVisibility = async (visibility: AccountVisibility): Promise<void> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요해요.');

  const { error } = await supabase
    .from('users')
    .update({ account_visibility: visibility })
    .eq('id', user.id);
  if (error) throw error;
};
