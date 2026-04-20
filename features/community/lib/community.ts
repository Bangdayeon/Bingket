import AsyncStorage from '@react-native-async-storage/async-storage';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { supabase } from '@/lib/supabase';
import type {
  CommunityPost,
  PostCategory,
  Comment,
  CommentReply,
  EditorBlock,
  StoredBlock,
} from '@/types/community';
import type { BingoData, BingoState, BingoTheme } from '@/types/bingo';
import { calcBingoCount } from '@/features/bingo/lib/bingo';

export const PAGE_SIZE = 15;

const R2_PUBLIC_URL = 'https://pub-ce1a524f861f4062a6ec96dd100c4aec.r2.dev';

const THEME_DISPLAY_TO_KEY: Record<string, BingoTheme> = {
  기본: 'default',
  토끼: 'rabbit',
  붉은말: 'red_horse',
  고먐미: 'square_cat',
  돼지: 'pig',
  미드나잇: 'midnight',
};

function calcDdayLocal(targetDate: string | null): number {
  if (!targetDate) return 0;
  const diff = new Date(targetDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ── 시간 포맷 ─────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '방금 전';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}일 전`;
  return `${Math.floor(d / 30)}달 전`;
}

// ── 빙고 셀 배열 → flat string[] 변환 ────────────────────────
function sortedCells(cells: Array<{ position: number; content: string }>): string[] {
  return [...cells].sort((a, b) => a.position - b.position).map((c) => c.content);
}

type RawBoard = {
  id: string;
  title: string;
  grid: string;
  theme: string;
  bingo_cells: Array<{ position: number; content: string }>;
} | null;

type RawUser = { display_name: string; avatar_url: string | null } | null;

type RawSnapshot = { title?: string; cells: string[]; grid: string; theme: string } | null;

async function fetchLikedSet(postIds: string[]): Promise<Set<string>> {
  if (postIds.length === 0) return new Set();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();
  const { data } = await supabase
    .from('likes')
    .select('post_id')
    .eq('user_id', user.id)
    .in('post_id', postIds);
  return new Set((data ?? []).map((l) => l.post_id as string));
}

function mapPost(
  p: {
    id: string;
    title: string;
    content: string;
    category: string;
    like_count: number;
    comment_count: number;
    created_at: string;
    user_id: string;
    image_urls: unknown;
    is_anonymous: boolean;
    bingo_boards: unknown;
    bingo_snapshot: unknown;
    users: unknown;
  },
  likedByMe: boolean,
): CommunityPost {
  const board = p.bingo_boards as RawBoard;
  const snapshot = p.bingo_snapshot as RawSnapshot;
  const user = p.users as RawUser;
  const isAnonymous = p.is_anonymous;

  return {
    id: p.id,
    title: p.title,
    userId: p.user_id,
    author: isAnonymous ? '익명' : (user?.display_name ?? '(알 수 없음)'),
    isAnonymous,
    avatarUrl: isAnonymous ? null : (user?.avatar_url ?? null),
    timeAgo: timeAgo(p.created_at),
    body: p.content,
    likeCount: p.like_count,
    likedByMe,
    commentCount: p.comment_count,
    category: p.category as PostCategory,
    imageUrls: (p.image_urls as string[] | null) ?? [],
    bingo: board
      ? {
          id: board.id,
          title: board.title,
          cells: sortedCells(board.bingo_cells),
          grid: board.grid,
          theme: board.theme as BingoTheme,
        }
      : snapshot
        ? {
            title: snapshot.title,
            cells: snapshot.cells,
            grid: snapshot.grid,
            theme: snapshot.theme as BingoTheme,
          }
        : undefined,
  };
}

const POST_SELECT = `
  id, title, content, category, like_count, comment_count, created_at, user_id, image_urls, is_anonymous, bingo_snapshot,
  users ( display_name, avatar_url ),
  bingo_boards ( id, title, grid, theme, bingo_cells ( position, content ) )
`;

// ── 게시글 목록 조회 (페이지네이션) ──────────────────────────
export const fetchPosts = async (
  page: number,
  category: PostCategory | null,
): Promise<CommunityPost[]> => {
  const blockedIds = await fetchBlockedUserIds();

  let query = supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  if (category) query = query.eq('category', category);
  if (blockedIds.length > 0) query = query.not('user_id', 'in', `(${blockedIds.join(',')})`);

  const { data, error } = await query;
  if (error || !data) return [];

  const likedSet = await fetchLikedSet(data.map((p) => p.id as string));
  return data.map((p) => mapPost(p as Parameters<typeof mapPost>[0], likedSet.has(p.id as string)));
};

// ── 게시글 단건 조회 ──────────────────────────────────────────────
export const fetchPost = async (id: string): Promise<CommunityPost | null> => {
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('id', id)
    .eq('is_deleted', false)
    .single();

  if (error || !data) return null;
  const likedSet = await fetchLikedSet([data.id as string]);
  return mapPost(data as Parameters<typeof mapPost>[0], likedSet.has(data.id as string));
};

// ── 게시글 작성용 내 빙고 전체 조회 (제작중 + 진행중 + 완료) ──────
export const fetchMyBingosForPost = async (): Promise<BingoData[]> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: boards } = await supabase
    .from('bingo_boards')
    .select(
      `id, title, grid, theme, max_edits, start_date, target_date, status,
       bingo_cells (position, content, is_checked)`,
    )
    .eq('user_id', user.id)
    .in('status', ['progress', 'done'])
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  const dbBingos: BingoData[] = (boards ?? []).map((board) => {
    const cells = [...(board.bingo_cells ?? [])].sort(
      (a: { position: number }, b: { position: number }) => a.position - b.position,
    );
    const [cols, rows] = board.grid.split('x').map(Number);
    const checked = cells.map((c: { is_checked: boolean }) => c.is_checked);
    return {
      id: board.id,
      title: board.title,
      grid: board.grid,
      cells: cells.map((c: { content: string }) => c.content),
      maxEdits: board.max_edits,
      achievedCount: checked.filter(Boolean).length,
      bingoCount: calcBingoCount(checked, cols, rows),
      dday: calcDdayLocal(board.target_date),
      startDate: board.start_date ?? null,
      targetDate: board.target_date ?? null,
      state: board.status as BingoState,
      theme: board.theme as BingoTheme,
      retrospective: null,
    };
  });

  // 로컬 제작 중 빙고 (AsyncStorage)
  try {
    const raw = await AsyncStorage.getItem('@bingket/draft-bingo');
    if (raw) {
      const d: Record<string, unknown> = JSON.parse(raw);
      const grid = (d.selectedGrid as string | undefined) ?? '3x3';
      const [cols, rows] = grid.split('x').map(Number);
      const draftCells: string[] = (d.cells as string[] | undefined) ?? Array(cols * rows).fill('');
      const draftBingo: BingoData = {
        id: 'draft',
        title: (d.title as string | undefined) || '제작 중인 빙고',
        grid,
        cells: draftCells,
        maxEdits: 0,
        achievedCount: 0,
        bingoCount: 0,
        dday: 0,
        startDate: null,
        targetDate: null,
        state: 'draft',
        theme: THEME_DISPLAY_TO_KEY[d.selectedTheme as string] ?? 'default',
        retrospective: null,
      };
      return [draftBingo, ...dbBingos];
    }
  } catch {
    // AsyncStorage 오류 시 DB 빙고만 반환
  }

  return dbBingos;
};

// ── 게시글 이미지 R2 업로드 ──────────────────────────────────────
export const uploadPostImage = async (uri: string): Promise<string> => {
  // 포스트 이미지: 최대 1080px로 리사이즈 후 JPEG 압축
  const imageRef = await ImageManipulator.manipulate(uri).resize({ width: 1080 }).renderAsync();
  const resized = await imageRef.saveAsync({ compress: 0.75, format: SaveFormat.JPEG });
  const ext = 'jpg';

  // getUser() triggers token refresh — required for Kakao sessions with expired access tokens
  await supabase.auth.getUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) throw new Error('로그인이 필요합니다.');

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const presignRes = await fetch(`${supabaseUrl}/functions/v1/post-presign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      filename: `${Date.now()}_${Math.random()}.${ext}`,
      contentType: 'image/jpeg',
    }),
  });

  if (!presignRes.ok) {
    const body = await presignRes.text();
    throw new Error(body || `presign failed: ${presignRes.status}`);
  }

  const data = (await presignRes.json()) as { presignedUrl: string; key: string } | null;

  if (!data) {
    throw new Error('presign data is null');
  }

  const file = await fetch(resized.uri);
  const blob = await file.blob();

  const uploadRes = await fetch(data.presignedUrl as string, {
    method: 'PUT',
    body: blob,
    headers: { 'Content-Type': 'image/jpeg' },
  });
  if (!uploadRes.ok) throw new Error('이미지 업로드에 실패했습니다.');

  return `${R2_PUBLIC_URL}/${data.key as string}`;
};

// ── blocks → DB 저장용 변환 + 이미지 업로드 ─────────────────────
async function processBlocks(blocks: EditorBlock[]): Promise<{
  storedBlocks: StoredBlock[];
  imageUrls: string[];
  bingoBoardId: string | null;
  bingoSnapshot: { title: string; cells: string[]; grid: string; theme: string } | null;
}> {
  const storedBlocks: StoredBlock[] = [];
  const imageUrls: string[] = [];
  let bingoBoardId: string | null = null;
  let bingoSnapshot: { title: string; cells: string[]; grid: string; theme: string } | null = null;

  for (const block of blocks) {
    if (block.type === 'text') {
      storedBlocks.push({ type: 'text', value: block.value });
    } else if (block.type === 'image') {
      const url = await uploadPostImage(block.uri);
      storedBlocks.push({ type: 'image', index: imageUrls.length });
      imageUrls.push(url);
    } else if (block.type === 'existing-image') {
      storedBlocks.push({ type: 'image', index: imageUrls.length });
      imageUrls.push(block.url);
    } else if (block.type === 'bingo') {
      const isDraft = block.bingo.id === 'draft';
      if (isDraft) {
        bingoSnapshot = {
          title: block.bingo.title,
          cells: block.bingo.cells,
          grid: block.bingo.grid,
          theme: block.bingo.theme,
        };
      } else {
        bingoBoardId = block.bingo.id;
      }
      storedBlocks.push({ type: 'bingo' });
    }
  }

  return { storedBlocks, imageUrls, bingoBoardId, bingoSnapshot };
}

// ── 게시글 작성 ──────────────────────────────────────────────────
export interface CreatePostRequest {
  category: PostCategory;
  title: string;
  isAnonymous: boolean;
  blocks: EditorBlock[];
}

export const createPost = async (req: CreatePostRequest): Promise<string> => {
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData?.user) throw new Error('로그인이 필요합니다.');

  const { storedBlocks, imageUrls, bingoBoardId, bingoSnapshot } = await processBlocks(req.blocks);

  const { data, error } = await supabase
    .from('posts')
    .insert({
      category: req.category,
      title: req.title.trim(),
      content: JSON.stringify(storedBlocks),
      is_anonymous: req.isAnonymous,
      user_id: userData.user.id,
      image_urls: imageUrls,
      bingo_board_id: bingoBoardId,
      bingo_snapshot: bingoSnapshot,
    })
    .select('id')
    .single();

  if (error || !data) throw new Error(error?.message ?? '게시글 작성에 실패했습니다.');
  return data.id as string;
};

// ── 게시글 수정 ──────────────────────────────────────────────────
export interface UpdatePostRequest {
  postId: string;
  category: PostCategory;
  title: string;
  isAnonymous: boolean;
  blocks: EditorBlock[];
}

export const updatePost = async (req: UpdatePostRequest): Promise<void> => {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('로그인이 필요합니다.');

  const { storedBlocks, imageUrls, bingoBoardId, bingoSnapshot } = await processBlocks(req.blocks);

  const { error } = await supabase
    .from('posts')
    .update({
      category: req.category,
      title: req.title.trim(),
      content: JSON.stringify(storedBlocks),
      is_anonymous: req.isAnonymous,
      image_urls: imageUrls,
      bingo_board_id: bingoBoardId,
      bingo_snapshot: bingoSnapshot,
    })
    .eq('id', req.postId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message ?? '게시글 수정에 실패했습니다.');
};

// ── 게시글 삭제 (소프트 딜리트) ──────────────────────────────────
export const deletePost = async (postId: string): Promise<void> => {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('로그인이 필요합니다.');

  const { error } = await supabase
    .from('posts')
    .update({ is_deleted: true })
    .eq('id', postId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
};

// ── 댓글 날짜 포맷 ────────────────────────────────────────────
function formatCommentDate(dateStr: string): string {
  const d = new Date(dateStr);
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yy}/${mm}/${dd}  ${hh}:${min}`;
}

type RawCommentRow = {
  id: string;
  content: string;
  user_id: string;
  parent_id: string | null;
  is_anonymous: boolean;
  created_at: string;
  like_count: number;
  users: unknown;
};

// 내가 좋아요 누른 댓글 ID 조회
async function fetchLikedCommentSet(commentIds: string[]): Promise<Set<string>> {
  if (commentIds.length === 0) return new Set();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();
  const { data } = await supabase
    .from('comment_likes')
    .select('comment_id')
    .eq('user_id', user.id)
    .in('comment_id', commentIds);
  return new Set((data ?? []).map((l) => l.comment_id as string));
}

// ── 댓글 목록 조회 ────────────────────────────────────────────
export const fetchComments = async (postId: string): Promise<Comment[]> => {
  const { data, error } = await supabase
    .from('comments')
    .select(
      'id, content, user_id, parent_id, is_anonymous, created_at, like_count, users ( display_name, avatar_url )',
    )
    .eq('post_id', postId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  const blockedIds = await fetchBlockedUserIds();
  const rows = (data as RawCommentRow[]).filter(
    (c) => blockedIds.length === 0 || !blockedIds.includes(c.user_id),
  );

  // 익명 번호 맵: user_id → 익명N (등장 순서)
  const anonymousMap = new Map<string, number>();
  let counter = 1;
  for (const c of rows) {
    if (c.is_anonymous && !anonymousMap.has(c.user_id)) {
      anonymousMap.set(c.user_id, counter++);
    }
  }

  // 내가 좋아요 누른 댓글 ID 세트
  const likedCommentSet = await fetchLikedCommentSet(rows.map((c) => c.id));

  const mapRow = (c: RawCommentRow): Omit<Comment, 'replies'> & Omit<CommentReply, never> => {
    const user = c.users as RawUser;
    const isAnon = c.is_anonymous;
    const anonNum = anonymousMap.get(c.user_id);
    return {
      id: c.id,
      userId: c.user_id,
      author: isAnon ? `익명${anonNum}` : (user?.display_name ?? '알 수 없음'),
      isAnonymous: isAnon,
      avatarUrl: isAnon ? null : (user?.avatar_url ?? null),
      body: c.content,
      createdAt: formatCommentDate(c.created_at),
      likeCount: c.like_count,
      likedByMe: likedCommentSet.has(c.id),
    };
  };

  const topLevel = rows.filter((c) => !c.parent_id);
  const replies = rows.filter((c) => c.parent_id);

  // 부모가 삭제된 경우 → placeholder 생성
  const topLevelIds = new Set(topLevel.map((c) => c.id));
  const orphanGroups = new Map<string, RawCommentRow[]>();
  for (const r of replies) {
    if (r.parent_id && !topLevelIds.has(r.parent_id)) {
      if (!orphanGroups.has(r.parent_id)) orphanGroups.set(r.parent_id, []);
      orphanGroups.get(r.parent_id)!.push(r);
    }
  }

  const realComments: Comment[] = topLevel.map((c) => ({
    ...mapRow(c),
    replies: replies.filter((r) => r.parent_id === c.id).map(mapRow),
  }));

  const deletedPlaceholders: Comment[] = Array.from(orphanGroups.entries()).map(
    ([parentId, childReplies]) => ({
      id: parentId,
      userId: '',
      author: '',
      isAnonymous: false,
      body: '',
      createdAt: formatCommentDate(
        childReplies.reduce(
          (min, r) => (r.created_at < min ? r.created_at : min),
          childReplies[0].created_at,
        ),
      ),
      likeCount: 0,
      likedByMe: false,
      isDeleted: true,
      replies: childReplies.map(mapRow),
    }),
  );

  return [...realComments, ...deletedPlaceholders].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
};

// ── 댓글 작성 ────────────────────────────────────────────────
export const addComment = async (
  postId: string,
  content: string,
  isAnonymous: boolean,
  parentId?: string,
): Promise<void> => {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('로그인이 필요합니다.');

  const { error } = await supabase.from('comments').insert({
    post_id: postId,
    user_id: user.id,
    content: content.trim(),
    is_anonymous: isAnonymous,
    parent_id: parentId ?? null,
  });

  if (error) throw new Error(error.message);
};

// ── 댓글 삭제 (소프트 딜리트) ────────────────────────────────
export const deleteComment = async (commentId: string): Promise<void> => {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('로그인이 필요합니다.');

  const { error } = await supabase
    .from('comments')
    .update({ is_deleted: true })
    .eq('id', commentId)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
};

// ── 댓글 좋아요 토글 ─────────────────────────────────────────
export const toggleCommentLike = async (commentId: string, like: boolean): Promise<void> => {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('로그인이 필요합니다.');

  if (like) {
    const { error } = await supabase
      .from('comment_likes')
      .insert({ user_id: user.id, comment_id: commentId });
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from('comment_likes')
      .delete()
      .eq('user_id', user.id)
      .eq('comment_id', commentId);
    if (error) throw new Error(error.message);
  }
};

// ── 차단된 유저 ID 목록 ───────────────────────────────────────
export const fetchBlockedUserIds = async (): Promise<string[]> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase.from('blocks').select('blocked_id').eq('blocker_id', user.id);
  return (data ?? []).map((b) => b.blocked_id as string);
};

// ── 유저 차단 ─────────────────────────────────────────────────
export const blockUser = async (userId: string): Promise<void> => {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('로그인이 필요합니다.');
  const { error } = await supabase
    .from('blocks')
    .insert({ blocker_id: user.id, blocked_id: userId });
  if (error) throw new Error(error.message);
};

// ── 신고 ──────────────────────────────────────────────────────
export const submitReport = async (
  targetType: 'post' | 'comment',
  targetId: string,
  reason: string,
): Promise<void> => {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('로그인이 필요합니다.');
  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    target_type: targetType,
    target_id: targetId,
    reason,
  });
  if (error) throw new Error(error.message);
};

// ── 게시글 검색 ───────────────────────────────────────────────
export const searchPosts = async (query: string): Promise<CommunityPost[]> => {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const blockedIds = await fetchBlockedUserIds();

  const { data: idRows, error: rpcError } = await supabase.rpc('search_post_ids', {
    query_text: trimmed,
  });
  if (rpcError || !idRows || idRows.length === 0) return [];

  const ids = (idRows as Array<{ id: string }>).map((r) => r.id);

  let q = supabase
    .from('posts')
    .select(POST_SELECT)
    .in('id', ids)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (blockedIds.length > 0) q = q.not('user_id', 'in', `(${blockedIds.join(',')})`);

  const { data, error } = await q;
  if (error || !data) return [];

  const likedSet = await fetchLikedSet(data.map((p) => p.id as string));
  return data.map((p) => mapPost(p as Parameters<typeof mapPost>[0], likedSet.has(p.id as string)));
};

// ── 게시글 좋아요 토글 ────────────────────────────────────────
export const togglePostLike = async (postId: string, like: boolean): Promise<void> => {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('로그인이 필요합니다.');

  if (like) {
    const { error } = await supabase.from('likes').insert({ user_id: user.id, post_id: postId });
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', user.id)
      .eq('post_id', postId);
    if (error) throw new Error(error.message);
  }
};
