import * as Sentry from '@sentry/react-native';
import { supabase } from '@/lib/supabase';
import { calcBingoCount } from '@/features/bingo/lib/bingo';
import {
  calcBattleScore,
  isBattleOver,
  laterDate,
  resolveOutcome,
  type BattleOutcome,
} from '@/features/battle/lib/battle-result';
import type { BingoTheme } from '@/types/bingo';

// ============================================================
// Types
// ============================================================

export interface Friend {
  rowId: string;
  friendId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface BattleBoardSummary {
  id: string;
  title: string;
  grid: string;
  theme: BingoTheme;
  cells: string[];
  completedCells: boolean[];
  checkedCount: number;
  totalCells: number;
  bingoCount: number;
  targetDate: string | null;
}

export interface BattleRequestDetail {
  id: string;
  senderId: string;
  senderUsername: string;
  senderDisplayName: string;
  senderAvatarUrl: string | null;
  senderBoard: BattleBoardSummary;
  title: string | null;
  betText: string | null;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface BattleStatusDetail {
  id: string;
  myBoard: BattleBoardSummary & { userId: string; displayName: string; avatarUrl: string | null };
  friendBoard: BattleBoardSummary & {
    userId: string;
    displayName: string;
    avatarUrl: string | null;
  };
  myScore: number;
  friendScore: number;
  title: string | null;
  betText: string | null;
  status: 'in_progress' | 'completed';
  endDate: string | null;
  /** DB status가 completed 이거나, end_date(KST)가 지났으면 true */
  isFinished: boolean;
  /** isFinished일 때만. 점수를 확정하지 못했으면 null */
  outcome: BattleOutcome | null;
  /** true면 myScore/friendScore가 DB에 확정 저장된 값이다 */
  isScoreFrozen: boolean;
}

export interface BattleNotificationItem {
  type: 'sent' | 'rejected' | 'received';
  requestId: string;
  bingoTitle: string;
  friendName: string;
  friendUsername: string;
  avatarUrl: string | null;
}

export interface BattleListEntry {
  battleId: string;
  title: string | null;
  betText: string | null;
  myBoardId: string;
  myBoardTitle: string;
  opponentBoardTitle: string;
  variant: 'ongoing' | 'finished';
  /** finished일 때만. 점수를 확정하지 못했으면 null */
  outcome: BattleOutcome | null;
  startDate: string | null;
  endDate: string | null;
  completedAt: string | null;
  me: { name: string; avatarUrl: string | null; isWinner?: boolean };
  opponent: { name: string; avatarUrl: string | null; isWinner?: boolean };
}

// ============================================================
// Internal helpers
// ============================================================

type BattleBoardRow = {
  id: string;
  user_id: string;
  title: string;
  grid: string;
  theme: string;
  status: string;
  target_date: string | null;
  display_name: string;
  avatar_url: string | null;
  cells: { is_checked: boolean; position: number; content: string }[];
};

/**
 * 대결에 걸린 빙고판 조회.
 * 상대 빙고판은 테이블 직접 조회가 막혀 있어 RPC를 거친다.
 * soft-delete된 보드도 함께 반환되므로 종료된 대결 기록이 유지된다.
 */
const fetchBattleBoards = async (boardIds: string[]): Promise<Map<string, BattleBoardRow>> => {
  const ids = [...new Set(boardIds)].filter(Boolean);
  if (ids.length === 0) return new Map();

  const { data, error } = await supabase.rpc('get_battle_boards', { p_board_ids: ids });
  if (error || !data) {
    if (error) Sentry.captureException(error);
    return new Map();
  }

  return new Map((data as BattleBoardRow[]).map((b) => [b.id, b]));
};

function buildBoardSummary(board: BattleBoardRow): BattleBoardSummary {
  const [cols, rows] = board.grid.split('x').map(Number);
  const sorted = [...(board.cells ?? [])].sort((a, b) => a.position - b.position);
  const checked = sorted.map((c) => c.is_checked);
  return {
    id: board.id,
    title: board.title,
    grid: board.grid,
    theme: board.theme as BingoTheme,
    cells: sorted.map((c) => c.content),
    completedCells: checked,
    checkedCount: checked.filter(Boolean).length,
    totalCells: cols * rows,
    bingoCount: calcBingoCount(checked, cols, rows),
    targetDate: board.target_date,
  };
}

// ============================================================
// Friends
// ============================================================

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
      rowId: row.id,
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
  if (!user) throw new Error('로그인이 필요합니다.');

  // Delete both directions
  const { error } = await supabase
    .from('friends')
    .delete()
    .or(
      `and(user_id.eq.${user.id},friend_id.eq.${friendUserId}),and(user_id.eq.${friendUserId},friend_id.eq.${user.id})`,
    );

  if (error) throw error;
};

// ============================================================
// Battle requests
// ============================================================

export const sendBattleRequest = async (params: {
  senderBoardId: string;
  receiverId: string;
  title: string;
  betText: string;
}): Promise<void> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  const { data: requestData, error } = await supabase
    .from('battle_requests')
    .insert({
      sender_id: user.id,
      receiver_id: params.receiverId,
      sender_board_id: params.senderBoardId,
      title: params.title.trim() || null,
      bet_text: params.betText.trim() || null,
    })
    .select('id')
    .single();

  if (error || !requestData) throw error;

  const { data: sender } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', user.id)
    .single();

  await supabase.from('notifications').insert({
    user_id: params.receiverId,
    type: 'battle_request',
    message: `${sender?.display_name ?? '누군가'}님이 대결을 신청했어요`,
    target_id: requestData.id,
    target_type: null,
  });
};

export const fetchBattleRequestDetail = async (
  requestId: string,
): Promise<BattleRequestDetail | null> => {
  const { data, error } = await supabase
    .from('battle_requests')
    .select(
      `id, sender_id, sender_board_id, status, title, bet_text,
       sender:users!battle_requests_sender_id_fkey(username, display_name, avatar_url)`,
    )
    .eq('id', requestId)
    .single();

  if (error || !data) return null;

  const sender = data.sender as unknown as {
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;

  const boards = await fetchBattleBoards([data.sender_board_id as string]);
  const board = boards.get(data.sender_board_id as string) ?? null;

  if (!board || !sender) return null;

  return {
    id: data.id,
    senderId: data.sender_id as string,
    senderUsername: sender.username,
    senderDisplayName: sender.display_name,
    senderAvatarUrl: sender.avatar_url,
    senderBoard: buildBoardSummary(board),
    title: data.title as string | null,
    betText: data.bet_text as string | null,
    status: data.status as 'pending' | 'accepted' | 'rejected',
  };
};

export const acceptBattleRequest = async (params: {
  requestId: string;
  receiverBoardId: string;
}): Promise<{ battleId: string }> => {
  // Step 1: set receiver board
  const { error: boardError } = await supabase
    .from('battle_requests')
    .update({ receiver_board_id: params.receiverBoardId })
    .eq('id', params.requestId);

  if (boardError) throw boardError;

  // Step 2: fetch request data for battle creation
  const { data: req, error: fetchError } = await supabase
    .from('battle_requests')
    .select('sender_id, receiver_id, sender_board_id, title, bet_text')
    .eq('id', params.requestId)
    .single();

  if (fetchError || !req) throw fetchError ?? new Error('요청을 찾을 수 없습니다.');

  // Step 3: mark accepted
  const { error: acceptError } = await supabase
    .from('battle_requests')
    .update({ status: 'accepted' })
    .eq('id', params.requestId);

  if (acceptError) throw acceptError;

  // Step 4: create battle
  const { data: battleData, error: battleError } = await supabase
    .from('battles')
    .insert({
      user1_id: req.sender_id,
      user2_id: req.receiver_id,
      board1_id: req.sender_board_id,
      board2_id: params.receiverBoardId,
      title: req.title,
      bet_text: req.bet_text,
    })
    .select('id')
    .single();

  if (battleError || !battleData) throw battleError;

  const { data: receiver } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', req.receiver_id)
    .single();

  await supabase.from('notifications').insert({
    user_id: req.sender_id,
    type: 'battle_accepted',
    message: `${receiver?.display_name ?? '상대방'}님이 대결을 수락했어요`,
    target_id: battleData.id,
    target_type: null,
  });

  return { battleId: battleData.id as string };
};

export const cancelBattleRequest = async (requestId: string): Promise<void> => {
  const { error } = await supabase.from('battle_requests').delete().eq('id', requestId);
  if (error) throw error;
};

export const rejectBattleRequest = async (requestId: string): Promise<void> => {
  const { error } = await supabase
    .from('battle_requests')
    .update({ status: 'rejected' })
    .eq('id', requestId);
  if (error) throw error;
};

export const dismissRejectedRequest = async (requestId: string): Promise<void> => {
  const { error } = await supabase.from('battle_requests').delete().eq('id', requestId);
  if (error) throw error;
};

// ============================================================
// Notifications
// ============================================================

export const fetchMyBattleNotifications = async (): Promise<BattleNotificationItem[]> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const [{ data: sentData }, { data: receivedData }] = await Promise.all([
    supabase
      .from('battle_requests')
      .select(
        `id, status, sender_board_id,
         receiver:users!battle_requests_receiver_id_fkey(username, display_name, avatar_url)`,
      )
      .eq('sender_id', user.id)
      .in('status', ['pending', 'rejected']),
    supabase
      .from('battle_requests')
      .select(
        `id, sender_board_id,
         sender:users!battle_requests_sender_id_fkey(username, display_name, avatar_url)`,
      )
      .eq('receiver_id', user.id)
      .eq('status', 'pending'),
  ]);

  // 받은 요청의 sender_board는 상대 소유라 테이블 직접 조회가 되지 않는다
  const boards = await fetchBattleBoards(
    [...(sentData ?? []), ...(receivedData ?? [])].map((r) => r.sender_board_id as string),
  );

  const notifications: BattleNotificationItem[] = [];

  for (const row of sentData ?? []) {
    const friend = row.receiver as unknown as {
      username: string;
      display_name: string;
      avatar_url: string | null;
    } | null;
    const board = boards.get(row.sender_board_id as string) ?? null;
    notifications.push({
      type: (row.status as string) === 'rejected' ? 'rejected' : 'sent',
      requestId: row.id as string,
      bingoTitle: board?.title ?? '',
      friendName: friend?.display_name ?? '',
      friendUsername: friend?.username ?? '',
      avatarUrl: friend?.avatar_url ?? null,
    });
  }

  for (const row of receivedData ?? []) {
    const friend = row.sender as unknown as {
      username: string;
      display_name: string;
      avatar_url: string | null;
    } | null;
    const board = boards.get(row.sender_board_id as string) ?? null;
    notifications.push({
      type: 'received',
      requestId: row.id as string,
      bingoTitle: board?.title ?? '',
      friendName: friend?.display_name ?? '',
      friendUsername: friend?.username ?? '',
      avatarUrl: friend?.avatar_url ?? null,
    });
  }

  return notifications;
};

// ============================================================
// Battles
// ============================================================

/**
 * 기간이 끝났는데 아직 in_progress인 대결을 확정한다.
 *
 * 표시는 end_date에서 파생되므로 이 함수가 실패해도 화면은 정상이다.
 * 반환값은 battleId -> 확정 점수. 두 참가자가 같은 승자를 보도록
 * 쓰기 후 DB 값을 다시 읽어 그것을 진실로 삼는다.
 */
type FinalizeTarget = { battleId: string; board1Id: string; board2Id: string };
type FinalScores = { score1: number; score2: number };

/** 같은 세션에서 동시에 여러 화면이 확정을 시도하는 것을 막는다 */
const finalizingIds = new Set<string>();

const finalizeBattles = async (targets: FinalizeTarget[]): Promise<Map<string, FinalScores>> => {
  const result = new Map<string, FinalScores>();
  const pending = targets.filter((t) => !finalizingIds.has(t.battleId));
  if (pending.length === 0) return result;
  pending.forEach((t) => finalizingIds.add(t.battleId));

  try {
    // 1) 확정이 필요한 보드의 셀만 한 번에 조회한다.
    //    soft-delete된 보드도 포함 -- 기록은 남아야 한다.
    const boardIds = pending.flatMap((t) => [t.board1Id, t.board2Id]);
    const boards = await fetchBattleBoards(boardIds);
    if (boards.size === 0) return result;

    const scoreByBoard = new Map<string, number>();
    for (const board of boards.values()) {
      const [cols, rows] = board.grid.split('x').map(Number);
      const checked = [...(board.cells ?? [])]
        .sort((a, b) => a.position - b.position)
        .map((c) => c.is_checked);
      scoreByBoard.set(
        board.id,
        calcBattleScore(checked.filter(Boolean).length, calcBingoCount(checked, cols, rows)),
      );
    }

    // 2) 조건부 UPDATE -- 먼저 쓴 쪽만 반영된다.
    await Promise.all(
      pending.map(async (target) => {
        const score1 = scoreByBoard.get(target.board1Id);
        const score2 = scoreByBoard.get(target.board2Id);
        if (score1 === undefined || score2 === undefined) return;

        // 쓰기가 실패해도 표시용으로는 이 값을 쓴다
        result.set(target.battleId, { score1, score2 });

        const { error: updateError } = await supabase
          .from('battles')
          .update({ status: 'completed', score1, score2 })
          .eq('id', target.battleId)
          .eq('status', 'in_progress');

        // 기기 시계 오차로 DB 트리거가 거부하는 경우 등 -- 다음 조회에서 재시도된다
        if (updateError) Sentry.captureException(updateError);
      }),
    );

    // 3) 확정값 재조회 -- 두 참가자가 같은 승자를 보도록 DB 값을 진실로 삼는다
    const { data: settled } = await supabase
      .from('battles')
      .select('id, score1, score2')
      .in(
        'id',
        pending.map((t) => t.battleId),
      )
      .eq('status', 'completed');

    for (const row of settled ?? []) {
      result.set(row.id as string, {
        score1: row.score1 as number,
        score2: row.score2 as number,
      });
    }
  } finally {
    pending.forEach((t) => finalizingIds.delete(t.battleId));
  }

  return result;
};

export const fetchBattleByBoardId = async (
  boardId: string,
): Promise<{ battleId: string; isFinished: boolean } | null> => {
  const { data, error } = await supabase
    .from('battles')
    .select('id, status, end_date')
    .or(`board1_id.eq.${boardId},board2_id.eq.${boardId}`)
    .maybeSingle();

  if (error || !data) return null;
  return {
    battleId: data.id as string,
    isFinished:
      data.status === 'completed' || isBattleOver((data.end_date as string | null) ?? null),
  };
};

export const quitBattle = async (battleId: string): Promise<void> => {
  const { error } = await supabase.from('battles').delete().eq('id', battleId);
  if (error) throw error;
};

export const fetchMyBattles = async (): Promise<BattleListEntry[]> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('battles')
    .select(
      `id, user1_id, user2_id, board1_id, board2_id, score1, score2, title, bet_text, status, created_at, end_date, completed_at`,
    )
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  const boards = await fetchBattleBoards(
    data.flatMap((row) => [row.board1_id as string, row.board2_id as string]),
  );

  const now = Date.now();

  /** end_date가 null이면 두 보드의 target_date 중 늦은 쪽으로 폴백 */
  const effectiveEnd = (row: (typeof data)[number]): string | null =>
    (row.end_date as string | null) ??
    laterDate(
      boards.get(row.board1_id as string)?.target_date ?? null,
      boards.get(row.board2_id as string)?.target_date ?? null,
    );

  // 기간이 끝났는데 아직 in_progress인 대결만 확정한다 -- 평시엔 빈 배열이라 추가 쿼리가 없다.
  const targets: FinalizeTarget[] = data
    .filter((row) => row.status === 'in_progress' && isBattleOver(effectiveEnd(row), now))
    .map((row) => ({
      battleId: row.id as string,
      board1Id: row.board1_id as string,
      board2Id: row.board2_id as string,
    }));

  const finalized =
    targets.length > 0 ? await finalizeBattles(targets) : new Map<string, FinalScores>();

  return data.map((row) => {
    const myIsUser1 = (row.user1_id as string) === user.id;
    const myBoard = boards.get((myIsUser1 ? row.board1_id : row.board2_id) as string) ?? null;
    const opponentBoard = boards.get((myIsUser1 ? row.board2_id : row.board1_id) as string) ?? null;

    const endDate = effectiveEnd(row);
    const isFinished = row.status === 'completed' || isBattleOver(endDate, now);

    // 점수 출처: 방금 확정한 값 > DB 저장값
    const settled = finalized.get(row.id as string);
    const hasScores = settled !== undefined || row.status === 'completed';
    const score1 = settled?.score1 ?? (row.score1 as number);
    const score2 = settled?.score2 ?? (row.score2 as number);
    const myScore = myIsUser1 ? score1 : score2;
    const opponentScore = myIsUser1 ? score2 : score1;

    const outcome = isFinished && hasScores ? resolveOutcome(myScore, opponentScore) : null;

    return {
      battleId: row.id as string,
      title: row.title as string | null,
      betText: row.bet_text as string | null,
      myBoardId: (myIsUser1 ? row.board1_id : row.board2_id) as string,
      myBoardTitle: myBoard?.title ?? '',
      opponentBoardTitle: opponentBoard?.title ?? '',
      variant: isFinished ? 'finished' : 'ongoing',
      outcome,
      startDate: row.created_at as string | null,
      endDate,
      completedAt: row.completed_at as string | null,
      me: {
        name: myBoard?.display_name ?? '',
        avatarUrl: myBoard?.avatar_url ?? null,
        // 무승부는 양쪽 모두 승자로 표시한다
        isWinner: outcome === 'win' || outcome === 'draw',
      },
      opponent: {
        name: opponentBoard?.display_name ?? '',
        avatarUrl: opponentBoard?.avatar_url ?? null,
        isWinner: outcome === 'lose' || outcome === 'draw',
      },
    };
  });
};

export const fetchBattleStatusDetail = async (
  battleId: string,
): Promise<BattleStatusDetail | null> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('battles')
    .select(
      `id, user1_id, user2_id, board1_id, board2_id, score1, score2, title, bet_text, status, end_date, completed_at`,
    )
    .eq('id', battleId)
    .single();

  if (error || !data) return null;

  const boards = await fetchBattleBoards([data.board1_id as string, data.board2_id as string]);
  const board1 = boards.get(data.board1_id as string) ?? null;
  const board2 = boards.get(data.board2_id as string) ?? null;

  if (!board1 || !board2) return null;

  const myIsUser1 = (data.user1_id as string) === user.id;
  const myBoard = myIsUser1 ? board1 : board2;
  const friendBoard = myIsUser1 ? board2 : board1;
  const myUserId = myIsUser1 ? (data.user1_id as string) : (data.user2_id as string);
  const friendUserId = myIsUser1 ? (data.user2_id as string) : (data.user1_id as string);

  const myBoardSummary = buildBoardSummary(myBoard);
  const friendBoardSummary = buildBoardSummary(friendBoard);
  const scoreOf = (s: BattleBoardSummary) => calcBattleScore(s.checkedCount, s.bingoCount);

  const persistedStatus = data.status as 'in_progress' | 'completed';
  const endDate =
    (data.end_date as string | null) ?? laterDate(myBoard.target_date, friendBoard.target_date);
  const isFinished = persistedStatus === 'completed' || isBattleOver(endDate);

  let myScore = scoreOf(myBoardSummary);
  let friendScore = scoreOf(friendBoardSummary);
  let isScoreFrozen = false;

  if (persistedStatus === 'completed') {
    // 확정된 대결은 DB 점수를 쓴다 -- 이후 빙고판을 수정해도 결과가 바뀌지 않는다
    myScore = myIsUser1 ? (data.score1 as number) : (data.score2 as number);
    friendScore = myIsUser1 ? (data.score2 as number) : (data.score1 as number);
    isScoreFrozen = true;
  } else if (isFinished) {
    const settled = await finalizeBattles([
      {
        battleId: data.id as string,
        board1Id: data.board1_id as string,
        board2Id: data.board2_id as string,
      },
    ]);
    const scores = settled.get(data.id as string);
    if (scores) {
      myScore = myIsUser1 ? scores.score1 : scores.score2;
      friendScore = myIsUser1 ? scores.score2 : scores.score1;
      isScoreFrozen = true;
    }
  }

  return {
    id: data.id as string,
    myBoard: {
      ...myBoardSummary,
      userId: myUserId,
      displayName: myBoard.display_name ?? '',
      avatarUrl: myBoard.avatar_url ?? null,
    },
    friendBoard: {
      ...friendBoardSummary,
      userId: friendUserId,
      displayName: friendBoard.display_name ?? '',
      avatarUrl: friendBoard.avatar_url ?? null,
    },
    myScore,
    friendScore,
    title: data.title as string | null,
    betText: data.bet_text as string | null,
    status: persistedStatus,
    endDate,
    isFinished,
    outcome: isFinished && isScoreFrozen ? resolveOutcome(myScore, friendScore) : null,
    isScoreFrozen,
  };
};
