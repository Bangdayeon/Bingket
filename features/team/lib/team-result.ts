/**
 * 팀 빙고 기간 판정 · 순위 계산.
 *
 * 모든 날짜 판정은 KST(Asia/Seoul) 고정 기준이다.
 * 기기 로컬 타임존을 쓰면 DB 트리거(Asia/Seoul 기준)와 어긋나
 * "화면은 종료인데 DB는 in_progress" 상태가 생긴다.
 */

const DAY_MS = 86_400_000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

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

/** 종료일(KST)이 지났는가. 종료일 당일은 아직 진행 중이다. */
export const isTeamOver = (endDate: string | null, now: number = Date.now()): boolean => {
  if (!endDate) return false;
  const end = dayIndexOfDate(endDate);
  return end !== null && kstDayIndex(now) > end;
};

/** 시작일(KST)이 되었는가. 시작일 당일부터 채울 수 있다. */
export const isTeamStarted = (startDate: string | null, now: number = Date.now()): boolean => {
  if (!startDate) return true;
  const start = dayIndexOfDate(startDate);
  return start === null || kstDayIndex(now) >= start;
};

/** 종료까지 남은 일수 (KST 달력 기준). 종료일 당일이면 0 */
export const calcTeamDday = (endDate: string | null, now: number = Date.now()): number => {
  if (!endDate) return 0;
  const end = dayIndexOfDate(endDate);
  if (end === null) return 0;
  return Math.max(0, end - kstDayIndex(now));
};

/** 시작까지 남은 일수. 이미 시작했으면 0 */
export const calcDaysUntilStart = (startDate: string | null, now: number = Date.now()): number => {
  if (!startDate) return 0;
  const start = dayIndexOfDate(startDate);
  if (start === null) return 0;
  return Math.max(0, start - kstDayIndex(now));
};

/**
 * 달성률 (0 ~ 1).
 *
 * 판 크기가 서로 달라도 비교할 수 있어야 하므로 절대 점수가 아닌 비율을 쓴다.
 * 9칸을 다 채운 사람이 16칸 중 10칸 채운 사람에게 지면 안 된다.
 */
export const calcAchievementRate = (achievedCount: number, totalCount: number): number =>
  totalCount > 0 ? achievedCount / totalCount : 0;

export interface RankableMember {
  userId: string;
  achievedCount: number;
  totalCount: number;
  bingoCount: number;
  /** 가장 먼저 채운 칸의 시각. 동률 정렬에만 쓴다 */
  firstCheckedAt: string | null;
}

export interface RankedMember extends RankableMember {
  rate: number;
  /** 1부터. 달성률이 같으면 같은 순위(공동 1등) */
  rank: number;
}

/**
 * 달성률 기준 순위.
 *
 * 순위는 달성률로만 가른다 -- 6명이 다 목표를 이뤘는데 초 단위 차이로
 * 5명을 밀어내지 않기 위해서다. 빙고 줄 수와 최초 달성 시각은
 * 화면에 나열하는 순서를 정하는 데만 쓴다.
 */
export const rankMembers = (members: RankableMember[]): RankedMember[] => {
  const withRate = members.map((m) => ({
    ...m,
    rate: calcAchievementRate(m.achievedCount, m.totalCount),
  }));

  const sorted = [...withRate].sort((a, b) => {
    if (b.rate !== a.rate) return b.rate - a.rate;
    if (b.bingoCount !== a.bingoCount) return b.bingoCount - a.bingoCount;
    if (a.firstCheckedAt && b.firstCheckedAt && a.firstCheckedAt !== b.firstCheckedAt) {
      return a.firstCheckedAt < b.firstCheckedAt ? -1 : 1;
    }
    if (a.firstCheckedAt !== b.firstCheckedAt) return a.firstCheckedAt ? -1 : 1;
    return 0;
  });

  const ranked: RankedMember[] = [];
  let lastRate = Number.NaN;
  let lastRank = 0;

  sorted.forEach((m, index) => {
    // 달성률이 같으면 앞사람과 같은 순위를 준다 (공동 1등)
    const rank = m.rate === lastRate ? lastRank : index + 1;
    lastRate = m.rate;
    lastRank = rank;
    ranked.push({ ...m, rank });
  });

  return ranked;
};

/** 팀 전체 진행률 (같이 채우기 모드의 주인공 지표) */
export const calcTeamProgress = (
  achievedCount: number,
  totalCount: number,
): { achieved: number; total: number; rate: number } => ({
  achieved: achievedCount,
  total: totalCount,
  rate: calcAchievementRate(achievedCount, totalCount),
});
