const DAY_MS = 24 * 60 * 60 * 1000;

export interface BingoPeriod {
  /** 시작일부터 오늘까지 지난 일수. 0 이상 total 이하로 자른다 */
  elapsed: number;
  /** 시작일~종료일 전체 일수. 날짜가 없으면 0 */
  total: number;
  /** 'YY.MM.DD - YY.MM.DD'. 한쪽만 있으면 있는 쪽만, 둘 다 없으면 빈 문자열 */
  formatted: string;
}

const formatDate = (date: string | null): string => {
  if (!date) return '';
  const [y, m, d] = date.split('-');
  return `${y.slice(2)}.${m}.${d}`;
};

/**
 * 빙고 진행 기간. 내 빙고판(BingoCard)과 친구 빙고 상세가 같은 계산을 쓴다.
 * 제작 중인 빙고는 날짜가 비어 있을 수 있어 전부 없는 경우를 정상으로 다룬다.
 */
export function getBingoPeriod(startDate: string | null, targetDate: string | null): BingoPeriod {
  const formatted = [formatDate(startDate), formatDate(targetDate)].filter(Boolean).join(' - ');

  if (!startDate || !targetDate) return { elapsed: 0, total: 0, formatted };

  const start = new Date(startDate).getTime();
  const end = new Date(targetDate).getTime();
  const total = Math.max(Math.round((end - start) / DAY_MS), 1);
  const elapsed = Math.min(Math.max(Math.round((Date.now() - start) / DAY_MS), 0), total);

  return { elapsed, total, formatted };
}
