import { supabase } from '@/lib/supabase';
import { calcBingoCount } from '@/features/bingo/lib/bingo';
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
  betText: string | null;
  status: 'in_progress' | 'completed';
  endDate: string | null;
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
  betText: string | null;
  myBoardId: string;
  myBoardTitle: string;
  opponentBoardTitle: string;
  variant: 'ongoing' | 'finished';
  me: { name: string; avatarUrl: string | null; isWinner?: boolean };
  opponent: { name: string; avatarUrl: string | null; isWinner?: boolean };
}

// ============================================================
// Internal helpers
// ============================================================

type RawBoard = {
  id: string;
  title: string;
  grid: string;
  theme: string;
  target_date: string | null;
  bingo_cells: { is_checked: boolean; position: number; content: string }[];
};

function buildBoardSummary(board: RawBoard): BattleBoardSummary {
  const [cols, rows] = board.grid.split('x').map(Number);
  const sorted = [...board.bingo_cells].sort((a, b) => a.position - b.position);
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
      `id, sender_id, status, bet_text,
       sender:users!battle_requests_sender_id_fkey(username, display_name, avatar_url),
       sender_board:bingo_boards!battle_requests_sender_board_id_fkey(
         id, title, grid, theme, target_date,
         bingo_cells(is_checked, position, content)
       )`,
    )
    .eq('id', requestId)
    .single();

  if (error || !data) return null;

  const sender = data.sender as unknown as {
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
  const board = data.sender_board as unknown as RawBoard | null;

  if (!board || !sender) return null;

  return {
    id: data.id,
    senderId: data.sender_id as string,
    senderUsername: sender.username,
    senderDisplayName: sender.display_name,
    senderAvatarUrl: sender.avatar_url,
    senderBoard: buildBoardSummary(board),
    betText: data.bet_text as string | null,
    status: data.status as 'pending' | 'accepted' | 'rejected',
  };
};

export const acceptBattleRequest = async (params: {
  requestId: string;
  receiverBoardId: string;
}): Promise<void> => {
  // Step 1: set receiver board
  const { error: boardError } = await supabase
    .from('battle_requests')
    .update({ receiver_board_id: params.receiverBoardId })
    .eq('id', params.requestId);

  if (boardError) throw boardError;

  // Step 2: fetch request data for battle creation
  const { data: req, error: fetchError } = await supabase
    .from('battle_requests')
    .select('sender_id, receiver_id, sender_board_id, bet_text')
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
        `id, status,
         receiver:users!battle_requests_receiver_id_fkey(username, display_name, avatar_url),
         sender_board:bingo_boards!battle_requests_sender_board_id_fkey(title)`,
      )
      .eq('sender_id', user.id)
      .in('status', ['pending', 'rejected']),
    supabase
      .from('battle_requests')
      .select(
        `id,
         sender:users!battle_requests_sender_id_fkey(username, display_name, avatar_url),
         sender_board:bingo_boards!battle_requests_sender_board_id_fkey(title)`,
      )
      .eq('receiver_id', user.id)
      .eq('status', 'pending'),
  ]);

  const notifications: BattleNotificationItem[] = [];

  for (const row of sentData ?? []) {
    const friend = row.receiver as unknown as {
      username: string;
      display_name: string;
      avatar_url: string | null;
    } | null;
    const board = row.sender_board as unknown as { title: string } | null;
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
    const board = row.sender_board as unknown as { title: string } | null;
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

export const fetchBattleByBoardId = async (
  boardId: string,
): Promise<{ battleId: string } | null> => {
  const { data, error } = await supabase
    .from('battles')
    .select('id')
    .or(`board1_id.eq.${boardId},board2_id.eq.${boardId}`)
    .maybeSingle();

  if (error || !data) return null;
  return { battleId: data.id as string };
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
      `id, user1_id, user2_id, board1_id, board2_id, score1, score2, bet_text, status,
        board1:bingo_boards!battles_board1_id_fkey(
          title,
          users!bingo_boards_user_id_fkey(display_name, avatar_url)
        ),
        board2:bingo_boards!battles_board2_id_fkey(
          title,
          users!bingo_boards_user_id_fkey(display_name, avatar_url)
        )`,
    )
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((row) => {
    const myIsUser1 = (row.user1_id as string) === user.id;
    type BoardWithUser = {
      title: string;
      users: { display_name: string; avatar_url: string | null } | null;
    };
    const myBoard = (myIsUser1 ? row.board1 : row.board2) as unknown as BoardWithUser | null;
    const opponentBoard = (myIsUser1 ? row.board2 : row.board1) as unknown as BoardWithUser | null;
    const isCompleted = (row.status as string) === 'completed';
    const myScore = myIsUser1 ? (row.score1 as number) : (row.score2 as number);
    const friendScore = myIsUser1 ? (row.score2 as number) : (row.score1 as number);

    return {
      battleId: row.id as string,
      betText: row.bet_text as string | null,
      myBoardId: (myIsUser1 ? row.board1_id : row.board2_id) as string,
      myBoardTitle: myBoard?.title ?? '',
      opponentBoardTitle: opponentBoard?.title ?? '',
      variant: isCompleted ? 'finished' : 'ongoing',
      me: {
        name: myBoard?.users?.display_name ?? '',
        avatarUrl: myBoard?.users?.avatar_url ?? null,
        isWinner: isCompleted ? myScore >= friendScore && myScore > 0 : undefined,
      },
      opponent: {
        name: opponentBoard?.users?.display_name ?? '',
        avatarUrl: opponentBoard?.users?.avatar_url ?? null,
        isWinner: isCompleted ? friendScore > myScore : undefined,
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
      `id, user1_id, user2_id, score1, score2, bet_text, status, end_date,
       board1:bingo_boards!battles_board1_id_fkey(
         id, title, grid, theme, target_date,
         bingo_cells(is_checked, position, content),
         users!bingo_boards_user_id_fkey(display_name, avatar_url)
       ),
       board2:bingo_boards!battles_board2_id_fkey(
         id, title, grid, theme, target_date,
         bingo_cells(is_checked, position, content),
         users!bingo_boards_user_id_fkey(display_name, avatar_url)
       )`,
    )
    .eq('id', battleId)
    .single();

  if (error || !data) return null;

  type RawBoardWithUser = RawBoard & {
    users: { display_name: string; avatar_url: string | null } | null;
  };
  const board1 = data.board1 as unknown as RawBoardWithUser | null;
  const board2 = data.board2 as unknown as RawBoardWithUser | null;

  if (!board1 || !board2) return null;

  const myIsUser1 = (data.user1_id as string) === user.id;
  const myBoard = myIsUser1 ? board1 : board2;
  const friendBoard = myIsUser1 ? board2 : board1;
  const myUserId = myIsUser1 ? (data.user1_id as string) : (data.user2_id as string);
  const friendUserId = myIsUser1 ? (data.user2_id as string) : (data.user1_id as string);

  const myBoardSummary = buildBoardSummary(myBoard);
  const friendBoardSummary = buildBoardSummary(friendBoard);
  const calcScore = (s: ReturnType<typeof buildBoardSummary>) => s.checkedCount + s.bingoCount * 2;

  return {
    id: data.id as string,
    myBoard: {
      ...myBoardSummary,
      userId: myUserId,
      displayName: myBoard.users?.display_name ?? '',
      avatarUrl: myBoard.users?.avatar_url ?? null,
    },
    friendBoard: {
      ...friendBoardSummary,
      userId: friendUserId,
      displayName: friendBoard.users?.display_name ?? '',
      avatarUrl: friendBoard.users?.avatar_url ?? null,
    },
    myScore: calcScore(myBoardSummary),
    friendScore: calcScore(friendBoardSummary),
    betText: data.bet_text as string | null,
    status: data.status as 'in_progress' | 'completed',
    endDate: data.end_date as string | null,
  };
};
