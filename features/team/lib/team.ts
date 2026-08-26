import * as Sentry from '@sentry/react-native';
import { supabase } from '@/lib/supabase';
import {
  calcBingoCount,
  createBingo,
  toProgressBingo,
  PROGRESS_BOARD_SELECT,
  type FetchedBingo,
} from '@/features/bingo/lib/bingo';
import { isTeamOver, isTeamStarted, rankMembers } from '@/features/team/lib/team-result';
import type { BingoTheme } from '@/types/bingo';
import type { TeamMemberStatus, TeamMode, TeamStatus } from '@/types/team';

// ============================================================
// Types
// ============================================================

export interface TeamBoardSummary {
  id: string;
  title: string;
  grid: string;
  theme: BingoTheme;
  cells: string[];
  completedCells: boolean[];
  /** 칸별 완료자. 같이 채우기에서만 의미가 있다 */
  completedBy: (string | null)[];
  checkedCount: number;
  totalCells: number;
  bingoCount: number;
  firstCheckedAt: string | null;
}

export interface TeamMemberEntry {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  status: TeamMemberStatus;
  boardId: string | null;
  /** 같이 채우기에서는 개인 기여 칸 수, 각자 채우기에서는 본인 달성 칸 수 */
  achievedCount: number;
  totalCount: number;
  bingoCount: number;
  /** 달성률 기준 순위. 같이 채우기는 순위가 없으므로 null */
  rank: number | null;
  isOwner: boolean;
  isMe: boolean;
}

export interface TeamListEntry {
  teamId: string;
  title: string;
  mode: TeamMode;
  status: TeamStatus;
  startDate: string;
  endDate: string;
  completedAt: string | null;
  myBoardId: string | null;
  /** 내가 아직 수락하지 않은 초대 */
  isInvite: boolean;
  isFinished: boolean;
  isStarted: boolean;
  members: {
    userId: string;
    displayName: string;
    avatarUrl: string | null;
    isWinner: boolean;
  }[];
}

export interface TeamDetail {
  teamId: string;
  title: string;
  mode: TeamMode;
  status: TeamStatus;
  startDate: string;
  endDate: string;
  betText: string | null;
  ownerId: string;
  isOwner: boolean;
  isFinished: boolean;
  isStarted: boolean;
  /** true면 순위·달성 수치가 DB에 확정 저장된 값이다 */
  isResultFrozen: boolean;
  members: TeamMemberEntry[];
  /** 멤버별 판. 같이 채우기는 전원이 같은 판을 가리킨다 */
  boards: Record<string, TeamBoardSummary | undefined>;
  /** 같이 채우기 전용. 팀 전체 진행률 */
  sharedBoard: TeamBoardSummary | null;
}

export interface TeamInviteItem {
  teamId: string;
  title: string;
  mode: TeamMode;
  startDate: string;
  endDate: string;
  betText: string | null;
  ownerId: string;
  ownerDisplayName: string;
  ownerAvatarUrl: string | null;
  ownerBoard: TeamBoardSummary | null;
  ownerBoardMaxEdits: number;
  memberCount: number;
}

// ============================================================
// Internal helpers
// ============================================================

type RawCell = {
  is_checked: boolean;
  position: number;
  content: string;
  completed_by: string | null;
  first_checked_at: string | null;
};

type RawBoard = {
  id: string;
  title: string;
  grid: string;
  theme: string;
  max_edits: number;
  bingo_cells: RawCell[];
};

function buildBoardSummary(board: RawBoard): TeamBoardSummary {
  const [cols, rows] = board.grid.split('x').map(Number);
  const sorted = [...(board.bingo_cells ?? [])].sort((a, b) => a.position - b.position);
  const checked = sorted.map((c) => c.is_checked);
  const firstCheckedAt = sorted
    .map((c) => c.first_checked_at)
    .filter((v): v is string => v !== null)
    .sort()[0];

  return {
    id: board.id,
    title: board.title,
    grid: board.grid,
    theme: board.theme as BingoTheme,
    cells: sorted.map((c) => c.content),
    completedCells: checked,
    completedBy: sorted.map((c) => c.completed_by),
    checkedCount: checked.filter(Boolean).length,
    totalCells: cols * rows,
    bingoCount: calcBingoCount(checked, cols, rows),
    firstCheckedAt: firstCheckedAt ?? null,
  };
}

type RawTeamBoardRow = {
  member_id: string;
  board_id: string;
  title: string;
  grid: string;
  theme: string;
  max_edits: number;
  cells: RawCell[];
};

interface TeamBoards {
  /** 멤버 id → 그 멤버의 판. 같이 채우기에서는 전원이 같은 판을 가리킨다 */
  byMember: Map<string, TeamBoardSummary>;
  /** 판 id → 판. 같은 판을 여러 멤버가 공유해도 한 번만 담긴다 */
  byBoard: Map<string, TeamBoardSummary>;
  maxEditsByBoard: Map<string, number>;
}

/**
 * 팀원들의 빙고판을 한 번에 가져온다.
 *
 * bingo_boards 를 직접 조인하지 않는 이유는 RLS가 행 단위라서다.
 * 조인이 열리는 순간 memo / retrospective 컬럼까지 같이 열려버려서,
 * 반환 컬럼을 통제할 수 있는 security definer RPC로 모았다.
 */
const fetchTeamBoards = async (teamId: string): Promise<TeamBoards> => {
  const byMember = new Map<string, TeamBoardSummary>();
  const byBoard = new Map<string, TeamBoardSummary>();
  const maxEditsByBoard = new Map<string, number>();

  const { data, error } = await supabase.rpc('get_team_boards', { p_team_id: teamId });
  if (error || !data) return { byMember, byBoard, maxEditsByBoard };

  for (const row of data as RawTeamBoardRow[]) {
    const summary =
      byBoard.get(row.board_id) ??
      buildBoardSummary({
        id: row.board_id,
        title: row.title,
        grid: row.grid,
        theme: row.theme,
        max_edits: row.max_edits,
        bingo_cells: row.cells ?? [],
      });

    byBoard.set(row.board_id, summary);
    byMember.set(row.member_id, summary);
    maxEditsByBoard.set(row.board_id, row.max_edits);
  }

  return { byMember, byBoard, maxEditsByBoard };
};

const currentUserId = async (): Promise<string | null> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
};

const notify = async (
  rows: { userId: string; type: string; message: string; targetId: string }[],
): Promise<void> => {
  if (rows.length === 0) return;
  await supabase.from('notifications').insert(
    rows.map((r) => ({
      user_id: r.userId,
      type: r.type,
      message: r.message,
      target_id: r.targetId,
      target_type: null,
    })),
  );
};

const displayNameOf = async (userId: string): Promise<string> => {
  const { data } = await supabase.from('users').select('display_name').eq('id', userId).single();
  return (data?.display_name as string | undefined) ?? '누군가';
};

// ============================================================
// 생성 · 초대
// ============================================================

export interface CreateTeamParams {
  title: string;
  mode: TeamMode;
  startDate: string;
  endDate: string;
  betText: string | null;
  friendIds: string[];
  /** 방장이 만들 빙고판 */
  board: { title: string; grid: string; theme: string; editCount: string; cells: string[] };
}

export const createTeam = async (params: CreateTeamParams): Promise<{ teamId: string }> => {
  const userId = await currentUserId();
  if (!userId) throw new Error('로그인이 필요합니다.');

  const boardId = await createBingo({
    title: params.board.title,
    duration: '',
    startDate: params.startDate,
    endDate: params.endDate,
    grid: params.board.grid,
    editCount: params.board.editCount,
    theme: params.board.theme,
    cells: params.board.cells,
    // 팀원은 서로 친구여야 초대되므로 팀 빙고판은 친구공개로 만든다
    visibility: 'friends',
  });

  const { data: team, error: teamError } = await supabase
    .from('team_bingos')
    .insert({
      owner_id: userId,
      title: params.title,
      mode: params.mode,
      start_date: params.startDate.split('T')[0],
      end_date: params.endDate.split('T')[0],
      bet_text: params.mode === 'own' ? params.betText : null,
      status: isTeamStarted(params.startDate.split('T')[0]) ? 'in_progress' : 'waiting',
    })
    .select('id')
    .single();

  if (teamError || !team) throw new Error(teamError?.message ?? '팀 빙고 생성 실패');
  const teamId = team.id as string;

  const { error: ownerError } = await supabase.from('team_members').insert({
    team_id: teamId,
    user_id: userId,
    board_id: boardId,
    status: 'joined',
    joined_at: new Date().toISOString(),
  });
  if (ownerError) throw new Error(ownerError.message);

  if (params.friendIds.length > 0) {
    const { error: inviteError } = await supabase.from('team_members').insert(
      params.friendIds.map((friendId) => ({
        team_id: teamId,
        user_id: friendId,
        status: 'invited',
      })),
    );
    if (inviteError) throw new Error(inviteError.message);

    const name = await displayNameOf(userId);
    await notify(
      params.friendIds.map((friendId) => ({
        userId: friendId,
        type: 'team_invite',
        message: `${name}님이 팀 빙고에 초대했어요`,
        targetId: teamId,
      })),
    );
  }

  return { teamId };
};

export const fetchTeamInvite = async (teamId: string): Promise<TeamInviteItem | null> => {
  const { data: team, error } = await supabase
    .from('team_bingos')
    .select('id, owner_id, title, mode, start_date, end_date, bet_text')
    .eq('id', teamId)
    .single();

  if (error || !team) return null;

  const ownerId = team.owner_id as string;

  const [{ data: owner }, boards, { count }] = await Promise.all([
    supabase.from('users').select('display_name, avatar_url').eq('id', ownerId).single(),
    fetchTeamBoards(teamId),
    supabase
      .from('team_members')
      .select('id', { count: 'exact', head: true })
      .eq('team_id', teamId)
      .in('status', ['invited', 'joined']),
  ]);

  const ownerBoard = boards.byMember.get(ownerId) ?? null;

  return {
    teamId: team.id as string,
    title: team.title as string,
    mode: team.mode as TeamMode,
    startDate: team.start_date as string,
    endDate: team.end_date as string,
    betText: team.bet_text as string | null,
    ownerId,
    ownerDisplayName: (owner?.display_name as string | undefined) ?? '',
    ownerAvatarUrl: (owner?.avatar_url as string | null | undefined) ?? null,
    ownerBoard,
    ownerBoardMaxEdits: ownerBoard ? (boards.maxEditsByBoard.get(ownerBoard.id) ?? 0) : 0,
    memberCount: count ?? 0,
  };
};

/**
 * 초대 수락.
 *
 * shared는 방장의 판을 그대로 쓰고, copied/own은 본인 판을 새로 만든다.
 * 판 생성이 곧 수락이므로 "판 없는 멤버" 상태는 존재하지 않는다.
 */
export const acceptTeamInvite = async (params: {
  teamId: string;
  /** copied/own 전용. 내가 채울 판의 내용 */
  board?: { title: string; grid: string; theme: string; editCount: string; cells: string[] };
}): Promise<void> => {
  const userId = await currentUserId();
  if (!userId) throw new Error('로그인이 필요합니다.');

  const invite = await fetchTeamInvite(params.teamId);
  if (!invite) throw new Error('초대를 찾을 수 없습니다.');

  let boardId: string;

  if (invite.mode === 'shared') {
    if (!invite.ownerBoard) throw new Error('빙고판을 찾을 수 없습니다.');
    boardId = invite.ownerBoard.id;
  } else {
    if (!params.board) throw new Error('참여할 빙고판이 필요합니다.');
    boardId = await createBingo({
      title: params.board.title,
      duration: '',
      startDate: invite.startDate,
      endDate: invite.endDate,
      grid: params.board.grid,
      editCount: params.board.editCount,
      theme: params.board.theme,
      cells: params.board.cells,
      // 팀원은 서로 친구여야 초대되므로 팀 빙고판은 친구공개로 만든다
      visibility: 'friends',
    });
  }

  const { error } = await supabase
    .from('team_members')
    .update({ board_id: boardId, status: 'joined', joined_at: new Date().toISOString() })
    .eq('team_id', params.teamId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);

  const name = await displayNameOf(userId);
  await notify([
    {
      userId: invite.ownerId,
      type: 'team_joined',
      message: `${name}님이 팀에 합류했어요`,
      targetId: params.teamId,
    },
  ]);
};

export const rejectTeamInvite = async (teamId: string): Promise<void> => {
  const userId = await currentUserId();
  if (!userId) throw new Error('로그인이 필요합니다.');

  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
};

/**
 * 팀 나가기.
 *
 * 채운 칸은 그대로 남고(completed_by 유지), 각자 판은 개인 빙고로 남는다.
 * 방장이 나가면 DB 트리거가 아이디순 다음 멤버에게 이양한다.
 */
export const leaveTeam = async (teamId: string): Promise<void> => {
  const userId = await currentUserId();
  if (!userId) throw new Error('로그인이 필요합니다.');

  const { error } = await supabase
    .from('team_members')
    .update({ status: 'left', left_at: new Date().toISOString() })
    .eq('team_id', teamId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
};

// ============================================================
// 종료 확정
// ============================================================

/** 같은 세션에서 여러 화면이 동시에 확정하는 것을 막는다 */
const finalizingIds = new Set<string>();

type MemberResult = {
  userId: string;
  achievedCount: number;
  totalCount: number;
  bingoCount: number;
  firstCheckedAt: string | null;
};

const computeMemberResults = (
  mode: TeamMode,
  members: { userId: string; boardId: string | null }[],
  boards: Map<string, TeamBoardSummary>,
): MemberResult[] =>
  members.map((m) => {
    const board = m.boardId ? boards.get(m.boardId) : undefined;
    if (!board) {
      return {
        userId: m.userId,
        achievedCount: 0,
        totalCount: 0,
        bingoCount: 0,
        firstCheckedAt: null,
      };
    }

    // 같이 채우기는 개인 기여 칸 수를 센다. 판 전체 성과는 별도로 표시한다.
    const achievedCount =
      mode === 'shared'
        ? board.completedBy.filter((by) => by === m.userId).length
        : board.checkedCount;

    return {
      userId: m.userId,
      achievedCount,
      totalCount: board.totalCells,
      bingoCount: board.bingoCount,
      firstCheckedAt: board.firstCheckedAt,
    };
  });

/**
 * 기간이 끝났는데 아직 확정되지 않은 팀을 확정한다.
 *
 * 표시는 end_date에서 파생되므로 이 함수가 실패해도 화면은 정상이다.
 * 여러 참가자가 같은 순위를 보도록 쓰기 후 DB 값을 다시 읽는다.
 */
const finalizeTeam = async (teamId: string): Promise<boolean> => {
  if (finalizingIds.has(teamId)) return false;
  finalizingIds.add(teamId);

  try {
    const { data: team } = await supabase
      .from('team_bingos')
      .select('id, mode, status, end_date')
      .eq('id', teamId)
      .single();

    if (!team || team.status === 'completed') return false;

    const [{ data: rows }, boards] = await Promise.all([
      supabase
        .from('team_members')
        .select('user_id, board_id')
        .eq('team_id', teamId)
        .eq('status', 'joined'),
      fetchTeamBoards(teamId),
    ]);

    if (!rows) return false;

    const mode = team.mode as TeamMode;
    const results = computeMemberResults(
      mode,
      rows.map((r) => ({ userId: r.user_id as string, boardId: r.board_id as string | null })),
      boards.byBoard,
    );

    // 같이 채우기는 순위가 없다
    const ranks =
      mode === 'shared'
        ? new Map<string, number | null>()
        : new Map(rankMembers(results).map((m) => [m.userId, m.rank as number | null]));

    // 멤버 결과를 먼저 쓴다 -- 팀을 completed로 바꾸는 순간 동결되기 때문
    await Promise.all(
      results.map((r) =>
        supabase
          .from('team_members')
          .update({
            achieved_count: r.achievedCount,
            total_count: r.totalCount,
            bingo_count: r.bingoCount,
            final_rank: ranks.get(r.userId) ?? null,
          })
          .eq('team_id', teamId)
          .eq('user_id', r.userId),
      ),
    );

    // 조건부 UPDATE -- 먼저 쓴 쪽만 반영된다
    const { data: updated, error } = await supabase
      .from('team_bingos')
      .update({ status: 'completed' })
      .eq('id', teamId)
      .neq('status', 'completed')
      .select('id');

    if (error) {
      // 기기 시계 오차로 트리거가 거부하는 경우 등 -- 다음 조회에서 재시도된다
      Sentry.captureException(error);
      return false;
    }

    if (updated && updated.length > 0) {
      await notify(
        results.map((r) => ({
          userId: r.userId,
          type: 'team_finished',
          message: '팀 빙고가 끝났어요. 결과를 확인해 보세요',
          targetId: teamId,
        })),
      );
      return true;
    }

    return false;
  } finally {
    finalizingIds.delete(teamId);
  }
};

// ============================================================
// 조회
// ============================================================

export const fetchMyTeams = async (): Promise<TeamListEntry[]> => {
  const userId = await currentUserId();
  if (!userId) return [];

  const { data: myRows, error } = await supabase
    .from('team_members')
    .select(
      `status, board_id,
       team:team_bingos!team_members_team_id_fkey(
         id, owner_id, title, mode, start_date, end_date, status, completed_at, created_at
       )`,
    )
    .eq('user_id', userId)
    .in('status', ['invited', 'joined']);

  if (error || !myRows) return [];

  type RawTeam = {
    id: string;
    owner_id: string;
    title: string;
    mode: TeamMode;
    start_date: string;
    end_date: string;
    status: TeamStatus;
    completed_at: string | null;
    created_at: string;
  };

  const entries = myRows
    .map((row) => ({
      myStatus: row.status as TeamMemberStatus,
      myBoardId: row.board_id as string | null,
      team: row.team as unknown as RawTeam | null,
    }))
    .filter((e): e is { myStatus: TeamMemberStatus; myBoardId: string | null; team: RawTeam } =>
      Boolean(e.team),
    );

  if (entries.length === 0) return [];

  const now = Date.now();

  // 기간이 끝났는데 아직 확정되지 않은 팀만 확정한다 -- 평시엔 추가 쿼리가 없다
  const stale = entries.filter(
    (e) =>
      e.myStatus === 'joined' && e.team.status !== 'completed' && isTeamOver(e.team.end_date, now),
  );
  if (stale.length > 0) {
    await Promise.all(stale.map((e) => finalizeTeam(e.team.id)));
  }

  const teamIds = entries.map((e) => e.team.id);
  const { data: memberRows } = await supabase
    .from('team_members')
    .select(
      `team_id, user_id, status, final_rank,
       users!team_members_user_id_fkey(display_name, avatar_url)`,
    )
    .in('team_id', teamIds)
    .in('status', ['invited', 'joined']);

  const membersByTeam = new Map<
    string,
    { userId: string; displayName: string; avatarUrl: string | null; isWinner: boolean }[]
  >();

  for (const row of memberRows ?? []) {
    const u = row.users as unknown as { display_name: string; avatar_url: string | null } | null;
    const list = membersByTeam.get(row.team_id as string) ?? [];
    list.push({
      userId: row.user_id as string,
      displayName: u?.display_name ?? '',
      avatarUrl: u?.avatar_url ?? null,
      isWinner: (row.final_rank as number | null) === 1,
    });
    membersByTeam.set(row.team_id as string, list);
  }

  return (
    entries
      .map<TeamListEntry>((e) => ({
        teamId: e.team.id,
        title: e.team.title,
        mode: e.team.mode,
        status: e.team.status,
        startDate: e.team.start_date,
        endDate: e.team.end_date,
        completedAt: e.team.completed_at,
        myBoardId: e.myBoardId,
        isInvite: e.myStatus === 'invited',
        isFinished: e.team.status === 'completed' || isTeamOver(e.team.end_date, now),
        isStarted: isTeamStarted(e.team.start_date, now),
        members: membersByTeam.get(e.team.id) ?? [],
      }))
      // 초대 → 진행 중 → 기록 순. 같은 묶음 안에서는 최근 것이 위로.
      .sort((a, b) => {
        if (a.isInvite !== b.isInvite) return a.isInvite ? -1 : 1;
        if (a.isFinished !== b.isFinished) return a.isFinished ? 1 : -1;
        const aKey = a.completedAt ?? a.endDate;
        const bKey = b.completedAt ?? b.endDate;
        return aKey > bKey ? -1 : aKey < bKey ? 1 : 0;
      })
  );
};

export const fetchTeamDetail = async (teamId: string): Promise<TeamDetail | null> => {
  const userId = await currentUserId();
  if (!userId) return null;

  const { data: team, error } = await supabase
    .from('team_bingos')
    .select('id, owner_id, title, mode, start_date, end_date, bet_text, status')
    .eq('id', teamId)
    .single();

  if (error || !team) return null;

  const mode = team.mode as TeamMode;
  const endDate = team.end_date as string;
  const persistedStatus = team.status as TeamStatus;
  const isFinished = persistedStatus === 'completed' || isTeamOver(endDate);

  if (isFinished && persistedStatus !== 'completed') {
    await finalizeTeam(teamId);
  }

  const [{ data: rows }, teamBoards] = await Promise.all([
    supabase
      .from('team_members')
      .select(
        `user_id, status, board_id, achieved_count, total_count, bingo_count, final_rank,
         users!team_members_user_id_fkey(display_name, avatar_url)`,
      )
      .eq('team_id', teamId)
      .in('status', ['invited', 'joined']),
    fetchTeamBoards(teamId),
  ]);

  if (!rows) return null;

  const boardById = teamBoards.byBoard;
  const boards: Record<string, TeamBoardSummary | undefined> = {};

  for (const row of rows) {
    const summary = teamBoards.byMember.get(row.user_id as string);
    if (summary) boards[row.user_id as string] = summary;
  }

  const joined = rows.filter((r) => r.status === 'joined');
  const live = computeMemberResults(
    mode,
    joined.map((r) => ({ userId: r.user_id as string, boardId: r.board_id as string | null })),
    boardById,
  );

  // 확정된 팀은 DB 값을 진실로 삼는다 -- 이후 판을 수정해도 결과가 바뀌지 않는다
  const isResultFrozen = persistedStatus === 'completed';
  const liveRanks =
    mode === 'shared'
      ? new Map<string, number>()
      : new Map(rankMembers(live).map((m) => [m.userId, m.rank]));
  const liveById = new Map(live.map((r) => [r.userId, r]));

  const members: TeamMemberEntry[] = rows.map((row) => {
    const uid = row.user_id as string;
    const u = row.users as unknown as { display_name: string; avatar_url: string | null } | null;
    const liveResult = liveById.get(uid);

    return {
      userId: uid,
      displayName: u?.display_name ?? '',
      avatarUrl: u?.avatar_url ?? null,
      status: row.status as TeamMemberStatus,
      boardId: row.board_id as string | null,
      achievedCount: isResultFrozen
        ? ((row.achieved_count as number | null) ?? 0)
        : (liveResult?.achievedCount ?? 0),
      totalCount: isResultFrozen
        ? ((row.total_count as number | null) ?? 0)
        : (liveResult?.totalCount ?? 0),
      bingoCount: isResultFrozen
        ? ((row.bingo_count as number | null) ?? 0)
        : (liveResult?.bingoCount ?? 0),
      rank: isResultFrozen ? (row.final_rank as number | null) : (liveRanks.get(uid) ?? null),
      isOwner: uid === (team.owner_id as string),
      isMe: uid === userId,
    };
  });

  // 순위대로 나열한다 (1등이 왼쪽). 수락 대기 중인 사람은 뒤로 보낸다.
  members.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'joined' ? -1 : 1;
    if (a.rank !== null && b.rank !== null && a.rank !== b.rank) return a.rank - b.rank;
    return b.achievedCount - a.achievedCount;
  });

  const sharedBoard = mode === 'shared' ? ([...boardById.values()][0] ?? null) : null;

  return {
    teamId: team.id as string,
    title: team.title as string,
    mode,
    status: persistedStatus,
    startDate: team.start_date as string,
    endDate,
    betText: team.bet_text as string | null,
    ownerId: team.owner_id as string,
    isOwner: (team.owner_id as string) === userId,
    isFinished,
    isStarted: isTeamStarted(team.start_date as string),
    isResultFrozen,
    members,
    boards,
    sharedBoard,
  };
};

/** 홈 카드의 팀 아이콘용. 이 빙고판이 속한 팀이 있으면 반환한다 */
export const fetchTeamByBoardId = async (
  boardId: string,
): Promise<{ teamId: string; mode: TeamMode; isFinished: boolean } | null> => {
  const userId = await currentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('team_members')
    .select('team:team_bingos!team_members_team_id_fkey(id, mode, status, end_date)')
    .eq('board_id', boardId)
    .eq('user_id', userId)
    .eq('status', 'joined')
    .maybeSingle();

  if (error || !data?.team) return null;

  const team = data.team as unknown as {
    id: string;
    mode: TeamMode;
    status: TeamStatus;
    end_date: string;
  };

  return {
    teamId: team.id,
    mode: team.mode,
    isFinished: team.status === 'completed' || isTeamOver(team.end_date),
  };
};

// ============================================================
// 회고
// ============================================================

export interface TeamRetrospective {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  content: string;
  isMe: boolean;
}

/**
 * 멤버별 회고.
 *
 * 회고는 "나에게 이 기간이 어땠나"라는 1인칭 기록이라 판이 아니라 사람에 붙는다.
 * (같이 채우기는 판이 하나뿐이라 판에 붙이면 아무도 쓰지 않는다)
 */
export const fetchTeamRetrospectives = async (teamId: string): Promise<TeamRetrospective[]> => {
  const userId = await currentUserId();

  const { data, error } = await supabase
    .from('team_retrospectives')
    .select('user_id, content, users!team_retrospectives_user_id_fkey(display_name, avatar_url)')
    .eq('team_id', teamId);

  if (error || !data) return [];

  return data.map((row) => {
    const u = row.users as unknown as { display_name: string; avatar_url: string | null } | null;
    return {
      userId: row.user_id as string,
      displayName: u?.display_name ?? '',
      avatarUrl: u?.avatar_url ?? null,
      content: row.content as string,
      isMe: (row.user_id as string) === userId,
    };
  });
};

export const saveMyRetrospective = async (teamId: string, content: string): Promise<void> => {
  const userId = await currentUserId();
  if (!userId) throw new Error('로그인이 필요합니다.');

  const { error } = await supabase.from('team_retrospectives').upsert(
    {
      team_id: teamId,
      user_id: userId,
      content: content.slice(0, 500),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'team_id,user_id' },
  );

  if (error) throw new Error(error.message);
};

// ============================================================
// 활동 알림
// ============================================================

/**
 * 칸을 채웠을 때 같은 팀의 다른 멤버에게 알린다.
 * 자극이 동기부여가 되도록 전 모드에서 보낸다. 설정에서 끌 수 있다.
 */
export const notifyTeamCellChecked = async (
  boardId: string,
  cellContent: string,
): Promise<void> => {
  const userId = await currentUserId();
  if (!userId) return;

  const { data: myRow } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('board_id', boardId)
    .eq('user_id', userId)
    .eq('status', 'joined')
    .maybeSingle();

  const teamId = myRow?.team_id as string | undefined;
  if (!teamId) return;

  const { data: others } = await supabase
    .from('team_members')
    .select('user_id')
    .eq('team_id', teamId)
    .eq('status', 'joined')
    .neq('user_id', userId);

  if (!others || others.length === 0) return;

  const name = await displayNameOf(userId);
  const trimmed = cellContent.length > 12 ? `${cellContent.slice(0, 12)}…` : cellContent;

  await notify(
    others.map((row) => ({
      userId: row.user_id as string,
      type: 'team_cell_checked',
      message: `${name}님이 '${trimmed}'을(를) 달성했어요`,
      targetId: teamId,
    })),
  );
};

/**
 * 같이 채우기 공유판 중 내가 만들지 않은 판.
 *
 * 공유판의 주인은 방장 한 명이라 fetchMyBingos(user_id = 나)에는 잡히지 않는다.
 * 그래서 방장이 아닌 팀원은 홈에서 공유판을 볼 수도, 채울 수도 없었다.
 * 칸을 채우는 권한과 충돌 처리는 이미 DB에 있으므로 목록에 올려주기만 하면 된다.
 */
export const fetchJoinedSharedBoards = async (): Promise<FetchedBingo[]> => {
  const userId = await currentUserId();
  if (!userId) return [];

  const { data: rows } = await supabase
    .from('team_members')
    .select('board_id, team:team_bingos!team_members_team_id_fkey(mode, status)')
    .eq('user_id', userId)
    .eq('status', 'joined')
    .not('board_id', 'is', null);

  if (!rows) return [];

  const boardIds = rows
    .filter((row) => {
      const team = row.team as unknown as { mode: TeamMode; status: TeamStatus } | null;
      return team?.mode === 'shared' && team.status !== 'completed';
    })
    .map((row) => row.board_id as string);

  if (boardIds.length === 0) return [];

  // user_id 조건으로 내가 만든 판을 걸러낸다. 그건 이미 fetchMyBingos 가 가져온다.
  const { data: boards, error } = await supabase
    .from('bingo_boards')
    .select(PROGRESS_BOARD_SELECT)
    .in('id', boardIds)
    .neq('user_id', userId)
    .eq('status', 'progress')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error || !boards) return [];

  return boards.map((board) => toProgressBingo(board, { isGuestSharedBoard: true }));
};
