import { spotlightHole, spotlightPath } from '@/features/coachmark/lib/spotlight-path';

describe('spotlightHole', () => {
  it('원형은 정사각형 + 변의 절반 반경이라 그대로 원이 된다', () => {
    // 탭 아이콘처럼 가로가 넓은 대상
    const { rect, radius } = spotlightHole({ x: 20, y: 100, width: 44, height: 28 }, 'circle');

    expect(rect.width).toBe(rect.height);
    expect(radius).toBe(rect.width / 2);
  });

  it('원형은 대상의 중심을 유지한다', () => {
    const target = { x: 20, y: 100, width: 44, height: 28 };
    const { rect } = spotlightHole(target, 'circle');

    expect(rect.x + rect.width / 2).toBe(target.x + target.width / 2);
    expect(rect.y + rect.height / 2).toBe(target.y + target.height / 2);
  });

  it('사각형은 대상보다 사방으로 커진다', () => {
    const target = { x: 16, y: 600, width: 160, height: 48 };
    const { rect } = spotlightHole(target, 'rounded');

    expect(rect.x).toBeLessThan(target.x);
    expect(rect.y).toBeLessThan(target.y);
    expect(rect.width).toBeGreaterThan(target.width);
    expect(rect.height).toBeGreaterThan(target.height);
  });

  it('납작한 대상에서도 반경이 짧은 변의 절반을 넘지 않는다', () => {
    // 반경이 변의 절반을 넘으면 호가 서로를 파고들어 모양이 뒤집힌다
    const { rect, radius } = spotlightHole({ x: 0, y: 0, width: 300, height: 2 }, 'rounded');

    expect(radius).toBeLessThanOrEqual(rect.height / 2);
  });
});

describe('spotlightPath', () => {
  const hole = spotlightHole({ x: 100, y: 300, width: 60, height: 40 }, 'rounded');

  it('서브패스가 둘이다 — 바깥 사각형과 안쪽 구멍', () => {
    const d = spotlightPath(hole, 390, 844);

    expect(d.match(/M/g)).toHaveLength(2);
    expect(d.match(/Z/g)).toHaveLength(2);
  });

  it('바깥 사각형이 화면 밖까지 넉넉히 덮는다', () => {
    // 측정이 몇 px 어긋나도 가장자리에 안 칠해진 띠가 남으면 안 된다
    const d = spotlightPath(hole, 390, 844);
    const [firstX] = d.slice(1).split(',');

    expect(Number(firstX)).toBeLessThan(0);
    expect(d).toContain('H590');
  });

  it('NaN을 만들지 않는다', () => {
    const d = spotlightPath(hole, 390, 844);

    expect(d).not.toContain('NaN');
    expect(d).not.toContain('undefined');
  });
});
