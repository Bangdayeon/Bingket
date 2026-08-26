export type BingoState = 'draft' | 'progress' | 'done';
export type BingoTheme = string;

export interface BingoData {
  id: string;
  title: string;
  grid: string;
  cells: string[];
  maxEdits: number;
  achievedCount: number;
  bingoCount: number;
  dday: number;
  startDate: string | null; // 'YYYY-MM-DD'
  targetDate: string | null; // 'YYYY-MM-DD'
  state: BingoState;
  theme: BingoTheme;
  retrospective: string | null;
  /**
   * 같이 채우기 공유판인데 내가 만든 판이 아닐 때 true.
   * 칸은 채울 수 있지만 판 자체(제목·내용·삭제)는 방장만 건드릴 수 있다.
   */
  isGuestSharedBoard?: boolean;
}
