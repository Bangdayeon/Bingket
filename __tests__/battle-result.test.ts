import {
  calcBattleDday,
  calcBattleScore,
  isBattleOver,
  laterDate,
  resolveOutcome,
} from '@/features/battle/lib/battle-result';

describe('isBattleOver', () => {
  it('종료일 당일 23:59:59 KST 에는 아직 끝나지 않았다', () => {
    expect(isBattleOver('2026-08-12', Date.parse('2026-08-12T14:59:59Z'))).toBe(false);
  });

  it('종료일 다음날 00:00 KST 부터 끝난 것으로 본다', () => {
    expect(isBattleOver('2026-08-12', Date.parse('2026-08-12T15:00:00Z'))).toBe(true);
  });

  // 회귀 가드: new Date('2026-08-12') 는 UTC 자정으로 파싱되어
  // KST 사용자에게 대결이 9시간 일찍 끝난 것처럼 보이게 만들었다.
  it('종료일 당일 오전(KST)에는 끝나지 않았다 - UTC 파싱 버그 회귀 가드', () => {
    expect(isBattleOver('2026-08-12', Date.parse('2026-08-12T01:00:00Z'))).toBe(false);
  });

  it('종료일이 없거나 형식이 잘못되면 진행 중으로 본다', () => {
    expect(isBattleOver(null)).toBe(false);
    expect(isBattleOver('not-a-date')).toBe(false);
  });
});

describe('calcBattleDday', () => {
  it('종료일 당일이면 0', () => {
    expect(calcBattleDday('2026-08-12', Date.parse('2026-08-12T01:00:00Z'))).toBe(0);
  });

  it('종료 전날이면 1', () => {
    expect(calcBattleDday('2026-08-12', Date.parse('2026-08-11T01:00:00Z'))).toBe(1);
  });

  it('이미 지난 날짜면 0으로 고정된다', () => {
    expect(calcBattleDday('2026-08-12', Date.parse('2026-08-20T01:00:00Z'))).toBe(0);
  });

  it('종료일이 없거나 형식이 잘못되면 0', () => {
    expect(calcBattleDday(null)).toBe(0);
    expect(calcBattleDday('not-a-date')).toBe(0);
  });
});

describe('calcBattleScore', () => {
  it('체크 칸 수 + 빙고 줄 수 x 2', () => {
    expect(calcBattleScore(5, 2)).toBe(9);
    expect(calcBattleScore(0, 0)).toBe(0);
  });
});

describe('resolveOutcome', () => {
  it('점수 비교로 승패를 정한다', () => {
    expect(resolveOutcome(9, 5)).toBe('win');
    expect(resolveOutcome(5, 9)).toBe('lose');
  });

  it('동점은 무승부 (0-0 포함)', () => {
    expect(resolveOutcome(0, 0)).toBe('draw');
    expect(resolveOutcome(3, 3)).toBe('draw');
  });

  // 기존 코드가 위반하던 불변식:
  // me 는 `myScore >= friendScore && myScore > 0`, opponent 는 `friendScore > myScore` 였다.
  it('양쪽에서 본 결과가 항상 거울상이다', () => {
    const mirror = { win: 'lose', lose: 'win', draw: 'draw' } as const;
    for (let a = 0; a <= 4; a++) {
      for (let b = 0; b <= 4; b++) {
        expect(resolveOutcome(b, a)).toBe(mirror[resolveOutcome(a, b)]);
      }
    }
  });
});

describe('laterDate', () => {
  it('더 늦은 날짜를 고른다', () => {
    expect(laterDate('2026-08-01', '2026-08-31')).toBe('2026-08-31');
    expect(laterDate('2026-08-31', '2026-08-01')).toBe('2026-08-31');
  });

  it('null 은 건너뛴다', () => {
    expect(laterDate(null, '2026-08-01')).toBe('2026-08-01');
    expect(laterDate('2026-08-01', null)).toBe('2026-08-01');
    expect(laterDate(null, null)).toBeNull();
  });
});
