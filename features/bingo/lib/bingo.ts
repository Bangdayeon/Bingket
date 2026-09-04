import { supabase } from '@/lib/supabase';
import type { BoardVisibility } from '@/features/profile/lib/profile';
import { withNetworkRetry } from '@/lib/network-retry';
import type { BingoData, BingoTheme } from '@/types/bingo';
import type { BingoCellDetail } from '@/types/bingo-cell';

const EDIT_COUNT: Record<string, number> = {
  '0': 0,
  '1': 1,
  '2': 2,
  '3': 3,
  무제한: 9999,
};

export interface CreateBingoRequest {
  title: string;
  duration: string;
  startDate: string | null;
  endDate: string | null;
  grid: string;
  editCount: string;
  theme: string;
  cells: string[];
  visibility: BoardVisibility;
}

/**
 * 판과 칸을 한 트랜잭션에서 만든다.
 *
 * 예전에는 board를 넣고 cells를 넣은 뒤 실패 시 board를 지워 롤백했는데,
 * bingo_boards에 DELETE 정책이 없어 그 롤백이 조용히 실패하고 고아 판이 남았다.
 * 개수 제한이 살아 있는 지금은 그 고아가 칸을 영구히 차지하므로 RPC로 묶었다.
 */
export const createBingo = async (data: CreateBingoRequest): Promise<string> => {
  const { data: boardId, error } = await supabase.rpc('create_bingo_with_cells', {
    p_title: data.title,
    p_grid: data.grid,
    p_theme: data.theme,
    p_max_edits: EDIT_COUNT[data.editCount] ?? 0,
    p_start_date: data.startDate ? data.startDate.split('T')[0] : null,
    p_target_date: data.endDate ? data.endDate.split('T')[0] : null,
    p_cells: data.cells,
    p_visibility: data.visibility,
  });

  if (error || !boardId) throw new Error(error?.message ?? '빙고 생성 실패');

  return boardId as string;
};

// 셀 완료 여부 / 완료일 / 메모 저장
export const updateCell = async (
  cellId: string,
  updates: { completed?: boolean; completedAt?: string | null; memo?: string },
  /**
   * onlyIfUnchecked: 아직 비어 있을 때만 쓴다.
   * 같이 채우기에서 두 사람이 같은 칸을 동시에 누르면 먼저 누른 쪽만 반영된다.
   */
  options?: { onlyIfUnchecked?: boolean },
): Promise<{ applied: boolean }> =>
  // 칸 저장은 사용자가 다시 누를 수 없는(모달을 닫아버리는) 요청이라
  // 순간적인 연결 끊김은 조용히 재시도해서 넘긴다.
  withNetworkRetry(async () => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.completed !== undefined) dbUpdates.is_checked = updates.completed;
    if ('completedAt' in updates) dbUpdates.checked_at = updates.completedAt;
    if (updates.memo !== undefined) dbUpdates.memo = updates.memo;

    let query = supabase.from('bingo_cells').update(dbUpdates).eq('id', cellId);
    if (options?.onlyIfUnchecked) query = query.eq('is_checked', false);

    const { data, error } = await query.select('id');
    if (error) throw new Error(error.message);

    return { applied: (data?.length ?? 0) > 0 };
  });

// ────────────────────────────────────────────────────────────
// 조회
// ────────────────────────────────────────────────────────────

export interface FetchedBingo {
  bingo: BingoData;
  cellDetails: BingoCellDetail[];
}

function calcDday(targetDate: string | null): number {
  if (!targetDate) return 0;
  const diff = new Date(targetDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function calcBingoCount(checked: boolean[], cols: number, rows: number): number {
  let count = 0;

  // 가로 빙고
  for (let r = 0; r < rows; r++) {
    if (Array.from({ length: cols }, (_, c) => checked[r * cols + c]).every(Boolean)) count++;
  }

  // 세로 빙고
  for (let c = 0; c < cols; c++) {
    if (Array.from({ length: rows }, (_, r) => checked[r * cols + c]).every(Boolean)) count++;
  }

  const diagLength = Math.min(cols, rows);

  // 왼쪽 위 → 오른쪽 아래 대각선 (슬라이딩)
  for (let startCol = 0; startCol <= cols - diagLength; startCol++) {
    if (
      Array.from({ length: diagLength }, (_, i) => checked[i * cols + (startCol + i)]).every(
        Boolean,
      )
    )
      count++;
  }

  // 오른쪽 위 → 왼쪽 아래 대각선 (슬라이딩)
  for (let startCol = diagLength - 1; startCol < cols; startCol++) {
    if (
      Array.from({ length: diagLength }, (_, i) => checked[i * cols + (startCol - i)]).every(
        Boolean,
      )
    )
      count++;
  }

  return count;
}

// 수정 화면용 단건 조회
export interface FetchedBingoForEdit {
  title: string;
  grid: string;
  theme: string; // DB 키 (default, rabbit …)
  maxEdits: number;
  cells: string[];
  cellIds: string[];
  cellEditCounts: number[];
  visibility: BoardVisibility;
}

export const fetchBingoForEdit = async (boardId: string): Promise<FetchedBingoForEdit | null> => {
  const { data: board, error } = await supabase
    .from('bingo_boards')
    .select(
      `title, grid, theme, max_edits, visibility,
       bingo_cells (id, position, content, edit_count)`,
    )
    .eq('id', boardId)
    .is('deleted_at', null)
    .single();

  if (error || !board) return null;

  const cells = [...(board.bingo_cells ?? [])].sort((a, b) => a.position - b.position);
  return {
    title: board.title,
    grid: board.grid,
    theme: board.theme,
    maxEdits: board.max_edits,
    visibility: (board.visibility ?? 'friends') as BoardVisibility,
    cells: cells.map((c) => c.content),
    cellIds: cells.map((c) => c.id),
    cellEditCounts: cells.map((c) => c.edit_count),
  };
};

// 빙고 수정 저장
export const updateBingo = async (
  boardId: string,
  title: string,
  theme: string,
  changedCells: Array<{ id: string; content: string; newEditCount: number }>,
  visibility: BoardVisibility,
): Promise<void> => {
  const { error: boardError } = await supabase
    .from('bingo_boards')
    .update({ title, theme, visibility })
    .eq('id', boardId);
  if (boardError) throw new Error(boardError.message);

  for (const cell of changedCells) {
    const { error } = await supabase
      .from('bingo_cells')
      .update({ content: cell.content, edit_count: cell.newEditCount })
      .eq('id', cell.id);
    if (error) throw new Error(error.message);
  }
};

// 빙고 완료 처리
export const markBingoDone = async (boardId: string): Promise<void> => {
  const { error } = await supabase
    .from('bingo_boards')
    .update({ status: 'done' })
    .eq('id', boardId);
  if (error) throw new Error(error.message);
};

// 빙고 삭제 (소프트 딜리트)
export const deleteBingo = async (boardId: string): Promise<void> => {
  const { error } = await supabase
    .from('bingo_boards')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', boardId);
  if (error) throw new Error(error.message);
};

// 회고 저장
export const updateRetrospective = async (boardId: string, text: string): Promise<void> =>
  withNetworkRetry(async () => {
    const { error } = await supabase
      .from('bingo_boards')
      .update({ retrospective: text || null })
      .eq('id', boardId);
    if (error) throw new Error(error.message);
  });

// 단건 조회 (뷰 화면용)
export const fetchBingoForView = async (boardId: string): Promise<FetchedBingo | null> => {
  const { data: board, error } = await supabase
    .from('bingo_boards')
    .select(
      `id, title, grid, theme, max_edits, start_date, target_date, status, retrospective,
       bingo_cells (id, position, content, memo, is_checked, checked_at, completed_by, memo_updated_by)`,
    )
    .eq('id', boardId)
    .is('deleted_at', null)
    .single();

  if (error || !board) return null;

  const cells = [...(board.bingo_cells ?? [])].sort((a, b) => a.position - b.position);
  const [cols, rows] = board.grid.split('x').map(Number);
  const checked = cells.map((c) => c.is_checked);

  return {
    bingo: {
      id: board.id,
      title: board.title,
      grid: board.grid,
      cells: cells.map((c) => c.content),
      maxEdits: board.max_edits,
      achievedCount: checked.filter(Boolean).length,
      bingoCount: calcBingoCount(checked, cols, rows),
      dday: calcDday(board.target_date),
      startDate: board.start_date ?? null,
      targetDate: board.target_date ?? null,
      state: board.status as 'progress' | 'done',
      theme: board.theme as BingoTheme,
      retrospective: (board.retrospective as string | null) ?? null,
    },
    cellDetails: cells.map((c) => ({
      id: c.id,
      title: c.content,
      completed: c.is_checked,
      completedAt: c.checked_at ?? null,
      completedBy: c.completed_by ?? null,
      memoUpdatedBy: c.memo_updated_by ?? null,
      memo: c.memo ?? '',
    })),
  };
};

// 완료된 빙고 목록
export const fetchMyCompletedBingos = async (): Promise<FetchedBingo[]> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: boards, error } = await supabase
    .from('bingo_boards')
    .select(
      `id, title, grid, theme, max_edits, start_date, target_date, retrospective,
       bingo_cells (id, position, content, memo, is_checked, checked_at, completed_by, memo_updated_by)`,
    )
    .eq('user_id', user.id)
    .eq('status', 'done')
    .is('deleted_at', null)
    .order('completed_at', { ascending: false });

  if (error || !boards) return [];

  return boards.map((board) => {
    const cells = [...(board.bingo_cells ?? [])].sort((a, b) => a.position - b.position);
    const [cols, rows] = board.grid.split('x').map(Number);
    const checked = cells.map((c) => c.is_checked);

    return {
      bingo: {
        id: board.id,
        title: board.title,
        grid: board.grid,
        cells: cells.map((c) => c.content),
        maxEdits: board.max_edits,
        achievedCount: checked.filter(Boolean).length,
        bingoCount: calcBingoCount(checked, cols, rows),
        dday: calcDday(board.target_date),
        startDate: board.start_date ?? null,
        targetDate: board.target_date ?? null,
        state: 'done',
        theme: board.theme as BingoTheme,
        retrospective: (board.retrospective as string | null) ?? null,
      },
      cellDetails: cells.map((c) => ({
        id: c.id,
        title: c.content,
        completed: c.is_checked,
        completedAt: c.checked_at ?? null,
        completedBy: c.completed_by ?? null,
        memoUpdatedBy: c.memo_updated_by ?? null,
        memo: c.memo ?? '',
      })),
    };
  });
};

/** 진행 중 빙고판 조회에 쓰는 select 목록. 같이 채우기 공유판 조회와 공유한다 */
export const PROGRESS_BOARD_SELECT = `id, title, grid, theme, max_edits, start_date, target_date,
       bingo_cells (id, position, content, memo, is_checked, checked_at, completed_by, memo_updated_by)`;

type ProgressBoardRow = {
  id: string;
  title: string;
  grid: string;
  theme: string;
  max_edits: number;
  start_date: string | null;
  target_date: string | null;
  bingo_cells: {
    id: string;
    position: number;
    content: string;
    memo: string | null;
    is_checked: boolean;
    checked_at: string | null;
    completed_by: string | null;
    memo_updated_by: string | null;
  }[];
};

/** 진행 중 빙고판 행을 화면용 형태로 바꾼다 */
export const toProgressBingo = (
  board: ProgressBoardRow,
  options?: { isGuestSharedBoard?: boolean },
): FetchedBingo => {
  const cells = [...(board.bingo_cells ?? [])].sort((a, b) => a.position - b.position);
  const [cols, rows] = board.grid.split('x').map(Number);
  const checked = cells.map((c) => c.is_checked);

  return {
    bingo: {
      id: board.id,
      title: board.title,
      grid: board.grid,
      cells: cells.map((c) => c.content),
      maxEdits: board.max_edits,
      achievedCount: checked.filter(Boolean).length,
      bingoCount: calcBingoCount(checked, cols, rows),
      dday: calcDday(board.target_date),
      startDate: board.start_date ?? null,
      targetDate: board.target_date ?? null,
      state: 'progress',
      theme: board.theme as BingoTheme,
      retrospective: null,
      isGuestSharedBoard: options?.isGuestSharedBoard,
    },
    cellDetails: cells.map((c) => ({
      id: c.id,
      title: c.content,
      completed: c.is_checked,
      completedAt: c.checked_at ?? null,
      completedBy: c.completed_by ?? null,
      memoUpdatedBy: c.memo_updated_by ?? null,
      memo: c.memo ?? '',
    })),
  };
};

export const fetchMyBingos = async (): Promise<FetchedBingo[]> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: boards, error } = await supabase
    .from('bingo_boards')
    .select(PROGRESS_BOARD_SELECT)
    .eq('user_id', user.id)
    .eq('status', 'progress')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error || !boards) return [];

  return boards.map((board) => toProgressBingo(board));
};
