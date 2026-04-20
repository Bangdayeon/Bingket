import { supabase } from '@/lib/supabase';
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
}

export const createBingo = async (data: CreateBingoRequest): Promise<string> => {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('로그인이 필요합니다.');

  const { data: board, error: boardError } = await supabase
    .from('bingo_boards')
    .insert({
      user_id: user.id,
      title: data.title,
      grid: data.grid,
      theme: data.theme,
      max_edits: EDIT_COUNT[data.editCount] ?? 0,
      start_date: data.startDate ? data.startDate.split('T')[0] : null,
      target_date: data.endDate ? data.endDate.split('T')[0] : null,
      status: 'progress',
    })
    .select('id')
    .single();

  if (boardError || !board) throw boardError ?? new Error('빙고 생성 실패');

  const cells = data.cells.map((content, position) => ({
    board_id: board.id,
    position,
    content,
  }));

  const { error: cellsError } = await supabase.from('bingo_cells').insert(cells);
  if (cellsError) throw cellsError;

  return board.id as string;
};

// 셀 완료 여부 / 완료일 / 메모 저장
export const updateCell = async (
  cellId: string,
  updates: { completed?: boolean; completedAt?: string | null; memo?: string },
): Promise<void> => {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.completed !== undefined) dbUpdates.is_checked = updates.completed;
  if ('completedAt' in updates) dbUpdates.checked_at = updates.completedAt;
  if (updates.memo !== undefined) dbUpdates.memo = updates.memo;
  const { error } = await supabase.from('bingo_cells').update(dbUpdates).eq('id', cellId);
  if (error) throw error;
};

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
}

export const fetchBingoForEdit = async (boardId: string): Promise<FetchedBingoForEdit | null> => {
  const { data: board, error } = await supabase
    .from('bingo_boards')
    .select(
      `title, grid, theme, max_edits,
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
): Promise<void> => {
  const { error: boardError } = await supabase
    .from('bingo_boards')
    .update({ title, theme })
    .eq('id', boardId);
  if (boardError) throw boardError;

  for (const cell of changedCells) {
    const { error } = await supabase
      .from('bingo_cells')
      .update({ content: cell.content, edit_count: cell.newEditCount })
      .eq('id', cell.id);
    if (error) throw error;
  }
};

// 빙고 완료 처리
export const markBingoDone = async (boardId: string): Promise<void> => {
  const { error } = await supabase
    .from('bingo_boards')
    .update({ status: 'done' })
    .eq('id', boardId);
  if (error) throw error;
};

// 빙고 삭제 (소프트 딜리트)
export const deleteBingo = async (boardId: string): Promise<void> => {
  const { error } = await supabase
    .from('bingo_boards')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', boardId);
  if (error) throw error;
};

// 회고 저장
export const updateRetrospective = async (boardId: string, text: string): Promise<void> => {
  const { error } = await supabase
    .from('bingo_boards')
    .update({ retrospective: text || null })
    .eq('id', boardId);
  if (error) throw error;
};

// 단건 조회 (뷰 화면용)
export const fetchBingoForView = async (boardId: string): Promise<FetchedBingo | null> => {
  const { data: board, error } = await supabase
    .from('bingo_boards')
    .select(
      `id, title, grid, theme, max_edits, start_date, target_date, status, retrospective,
       bingo_cells (id, position, content, memo, is_checked, checked_at)`,
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
       bingo_cells (id, position, content, memo, is_checked, checked_at)`,
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
        memo: c.memo ?? '',
      })),
    };
  });
};

export const fetchMyBingos = async (): Promise<FetchedBingo[]> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: boards, error } = await supabase
    .from('bingo_boards')
    .select(
      `id, title, grid, theme, max_edits, start_date, target_date,
       bingo_cells (id, position, content, memo, is_checked, checked_at)`,
    )
    .eq('user_id', user.id)
    .eq('status', 'progress')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

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
        state: 'progress',
        theme: board.theme as BingoTheme,
        retrospective: null,
      },
      cellDetails: cells.map((c) => ({
        id: c.id,
        title: c.content,
        completed: c.is_checked,
        completedAt: c.checked_at ?? null,
        memo: c.memo ?? '',
      })),
    };
  });
};
