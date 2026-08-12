/**
 * 대결 결과 계산 · 기간 판정.
 *
 * 모든 날짜 판정은 KST(Asia/Seoul) 고정 기준이다.
 * 기기 로컬 타임존을 쓰면 DB 트리거(Asia/Seoul 기준)와 어긋나
 * "화면은 종료인데 DB는 in_progress" 상태가 생긴다.
 */

const DAY_MS = 86_400_000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 빙고 1줄당 보너스 점수 */
export const BINGO_LINE_BONUS = 2;

export type BattleOutcome = 'win' | 'lose' | 'draw';

/** 점수 = 체크 칸 수 + 빙고 줄 수 × 2 */
export const calcBattleScore = (checkedCount: number, bingoCount: number): number =>
  checkedCount + bingoCount * BINGO_LINE_BONUS;

/**
 * 'YYYY-MM-DD' → 1970-01-01 기준 일(day) 번호. 잘못된 값이면 null.
 * `new Date('2026-08-12')`는 UTC 자정으로 파싱되므로 직접 쓰면 안 된다.
 */
const dayIndexOfDate = (yyyyMmDd: string): number | null => {
  const ms = Date.parse(`${yyyyMmDd}T00:00:00Z`);
  return Number.isNaN(ms) ? null : ms / DAY_MS;
};

/** epoch(ms) → KST 기준 일(day) 번호 */
const kstDayIndex = (epochMs: number): number => Math.floor((epochMs + KST_OFFSET_MS) / DAY_MS);

/** 대결 종료일(KST 기준)이 지났는가. 종료일 당일은 아직 진행 중이다. */
export const isBattleOver = (endDate: string | null, now: number = Date.now()): boolean => {
  if (!endDate) return false;
  const end = dayIndexOfDate(endDate);
  return end !== null && kstDayIndex(now) > end;
};

/** 남은 일수 (KST 달력 기준). 종료일 당일이면 0 */
export const calcBattleDday = (endDate: string | null, now: number = Date.now()): number => {
  if (!endDate) return 0;
  const end = dayIndexOfDate(endDate);
  if (end === null) return 0;
  return Math.max(0, end - kstDayIndex(now));
};

/** 내 점수 기준 승패. 동점은 무승부. */
export const resolveOutcome = (myScore: number, opponentScore: number): BattleOutcome =>
  myScore > opponentScore ? 'win' : myScore < opponentScore ? 'lose' : 'draw';

/** null-safe max of 'YYYY-MM-DD' (고정 포맷이라 사전순 비교로 충분) */
export const laterDate = (a: string | null, b: string | null): string | null => {
  if (!a) return b;
  if (!b) return a;
  return a >= b ? a : b;
};
