import {
  calcAchievementRate,
  calcDaysUntilStart,
  calcTeamDday,
  isTeamOver,
  isTeamStarted,
  rankMembers,
  type RankableMember,
} from '@/features/team/lib/team-result';

const member = (over: Partial<RankableMember> & { userId: string }): RankableMember => ({
  achievedCount: 0,
  totalCount: 9,
  bingoCount: 0,
  firstCheckedAt: null,
  ...over,
});

describe('isTeamOver', () => {
  it('종료일 당일 23:59:59 KST 에는 아직 끝나지 않았다', () => {
    expect(isTeamOver('2026-08-12', Date.parse('2026-08-12T14:59:59Z'))).toBe(false);
  });

  it('종료일 다음날 00:00 KST 부터 끝난 것으로 본다', () => {
    expect(isTeamOver('2026-08-12', Date.parse('2026-08-12T15:00:00Z'))).toBe(true);
  });

  // 회귀 가드: new Date('2026-08-12') 는 UTC 자정으로 파싱되어
  // KST 사용자에게 9시간 일찍 끝난 것처럼 보이게 만든다.
  it('종료일 당일 오전(KST)에는 끝나지 않았다', () => {
    expect(isTeamOver('2026-08-12', Date.parse('2026-08-12T01:00:00Z'))).toBe(false);
  });

  it('종료일이 없거나 형식이 잘못되면 진행 중으로 본다', () => {
    expect(isTeamOver(null)).toBe(false);
    expect(isTeamOver('not-a-date')).toBe(false);
  });
});

describe('isTeamStarted', () => {
  it('시작일 당일 00:00 KST 부터 채울 수 있다', () => {
    expect(isTeamStarted('2026-08-12', Date.parse('2026-08-11T15:00:00Z'))).toBe(true);
  });

  it('시작일 전날 23:59 KST 에는 아직 시작하지 않았다', () => {
    expect(isTeamStarted('2026-08-12', Date.parse('2026-08-11T14:59:59Z'))).toBe(false);
  });

  it('시작일이 없으면 시작한 것으로 본다', () => {
    expect(isTeamStarted(null)).toBe(true);
  });
});

describe('calcTeamDday / calcDaysUntilStart', () => {
  it('종료일 당일이면 D-0, 전날이면 D-1', () => {
    expect(calcTeamDday('2026-08-12', Date.parse('2026-08-12T01:00:00Z'))).toBe(0);
    expect(calcTeamDday('2026-08-12', Date.parse('2026-08-11T01:00:00Z'))).toBe(1);
  });

  it('이미 지난 날짜는 0으로 고정된다', () => {
    expect(calcTeamDday('2026-08-12', Date.parse('2026-08-20T01:00:00Z'))).toBe(0);
    expect(calcDaysUntilStart('2026-08-12', Date.parse('2026-08-20T01:00:00Z'))).toBe(0);
  });

  it('시작까지 남은 일수', () => {
    expect(calcDaysUntilStart('2026-08-12', Date.parse('2026-08-09T01:00:00Z'))).toBe(3);
  });
});

describe('calcAchievementRate', () => {
  it('채운 칸 / 전체 칸', () => {
    expect(calcAchievementRate(9, 9)).toBe(1);
    expect(calcAchievementRate(3, 12)).toBe(0.25);
  });

  it('빈 판은 0으로 처리한다 (0 나누기 방지)', () => {
    expect(calcAchievementRate(0, 0)).toBe(0);
  });
});

describe('rankMembers', () => {
  it('달성률이 높은 순으로 순위를 매긴다', () => {
    const ranked = rankMembers([
      member({ userId: 'a', achievedCount: 3, totalCount: 9 }),
      member({ userId: 'b', achievedCount: 7, totalCount: 9 }),
      member({ userId: 'c', achievedCount: 5, totalCount: 9 }),
    ]);
    expect(ranked.map((m) => m.userId)).toEqual(['b', 'c', 'a']);
    expect(ranked.map((m) => m.rank)).toEqual([1, 2, 3]);
  });

  // 판 크기가 다를 때 절대 점수를 쓰면 9칸을 다 채운 사람이 진다.
  it('판 크기가 달라도 달성률로 비교한다', () => {
    const ranked = rankMembers([
      member({ userId: 'small', achievedCount: 9, totalCount: 9 }),
      member({ userId: 'big', achievedCount: 10, totalCount: 16 }),
    ]);
    expect(ranked[0].userId).toBe('small');
    expect(ranked[0].rank).toBe(1);
  });

  it('달성률이 같으면 공동 순위를 준다', () => {
    const ranked = rankMembers([
      member({ userId: 'a', achievedCount: 9, totalCount: 9, bingoCount: 8 }),
      member({ userId: 'b', achievedCount: 9, totalCount: 9, bingoCount: 3 }),
      member({ userId: 'c', achievedCount: 1, totalCount: 9 }),
    ]);
    expect(ranked.map((m) => m.rank)).toEqual([1, 1, 3]);
  });

  it('동률은 빙고 줄 수가 많은 쪽을 먼저 보여준다 (순위는 같다)', () => {
    const ranked = rankMembers([
      member({ userId: 'few', achievedCount: 9, totalCount: 9, bingoCount: 3 }),
      member({ userId: 'many', achievedCount: 9, totalCount: 9, bingoCount: 8 }),
    ]);
    expect(ranked.map((m) => m.userId)).toEqual(['many', 'few']);
    expect(ranked.map((m) => m.rank)).toEqual([1, 1]);
  });

  it('빙고 줄 수까지 같으면 먼저 달성한 쪽을 먼저 보여준다', () => {
    const ranked = rankMembers([
      member({
        userId: 'late',
        achievedCount: 9,
        totalCount: 9,
        firstCheckedAt: '2026-08-10T00:00:00Z',
      }),
      member({
        userId: 'early',
        achievedCount: 9,
        totalCount: 9,
        firstCheckedAt: '2026-08-01T00:00:00Z',
      }),
    ]);
    expect(ranked.map((m) => m.userId)).toEqual(['early', 'late']);
  });

  it('아무도 채우지 않았으면 전원 공동 1등이다', () => {
    const ranked = rankMembers([member({ userId: 'a' }), member({ userId: 'b' })]);
    expect(ranked.map((m) => m.rank)).toEqual([1, 1]);
  });

  it('빈 배열도 처리한다', () => {
    expect(rankMembers([])).toEqual([]);
  });
});
