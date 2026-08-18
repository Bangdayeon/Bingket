export interface BingoCellDetail {
  id: string;
  title: string;
  completed: boolean;
  completedAt: string | null;
  memo: string;
  /** 이 칸을 채운 사람. 팀 빙고에서만 채워진다 */
  completedBy: string | null;
  /** 메모를 마지막으로 고친 사람. 메모는 팀 전원이 편집할 수 있어 추적이 필요하다 */
  memoUpdatedBy: string | null;
}

export type GridType = '3x3' | '4x3' | '4x4' | 'check';
