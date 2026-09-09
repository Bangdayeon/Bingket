import type { CoachMarkShape } from './coach-mark-steps';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Hole {
  rect: Rect;
  radius: number;
}

/** 원형 구멍이 아이콘 바깥으로 숨 쉴 여백. */
const CIRCLE_PADDING = 10;
/** 사각 구멍이 버튼 바깥으로 숨 쉴 여백. */
const ROUNDED_PADDING = 8;
/** Button md가 rounded-2xl(16)이라, 여백만큼 키워야 링이 버튼과 동심으로 보인다. */
const ROUNDED_RADIUS = 24;
/**
 * 바깥 사각형을 화면보다 이만큼 키운다. 측정이 몇 px 어긋나도 가장자리에
 * 딤이 안 칠해진 띠가 드러나지 않는다.
 */
const OVERSCAN = 200;

/** 측정된 대상 사각형에서 실제로 뚫을 구멍을 만든다. */
export function spotlightHole(target: Rect, shape: CoachMarkShape): Hole {
  if (shape === 'circle') {
    // 아이콘+라벨 바운딩 박스를 정사각형으로 펴서 감싼다.
    const size = Math.max(target.width, target.height) + CIRCLE_PADDING * 2;
    const centerX = target.x + target.width / 2;
    const centerY = target.y + target.height / 2;

    return {
      rect: { x: centerX - size / 2, y: centerY - size / 2, width: size, height: size },
      // 정사각형에 반경이 변의 절반이면 그게 곧 원이다. Circle 도형이 따로 필요 없다.
      radius: size / 2,
    };
  }

  const rect = {
    x: target.x - ROUNDED_PADDING,
    y: target.y - ROUNDED_PADDING,
    width: target.width + ROUNDED_PADDING * 2,
    height: target.height + ROUNDED_PADDING * 2,
  };

  return { rect, radius: clampRadius(ROUNDED_RADIUS, rect) };
}

/** 반경이 짧은 변의 절반을 넘으면 호가 서로를 파고들어 모양이 뒤집힌다. */
function clampRadius(radius: number, rect: Rect): number {
  return Math.max(0, Math.min(radius, rect.width / 2, rect.height / 2));
}

/**
 * 화면 전체를 덮되 구멍 하나가 뚫린 SVG 경로.
 *
 * 서브패스 두 개(바깥 사각형 + 안쪽 라운드 사각형)를 한 Path에 넣고 fillRule="evenodd"로
 * 겹치는 안쪽을 비운다. View 네 장으로 딤을 만드는 방법은 쓸 수 없다 — 원형 구멍을
 * 표현할 수 없고, 반투명이라 사각형 이음매에 밝은 실선이나 진한 띠가 남는다.
 */
export function spotlightPath(hole: Hole, screenWidth: number, screenHeight: number): string {
  const { rect } = hole;
  const r = clampRadius(hole.radius, rect);

  const left = rect.x;
  const top = rect.y;
  const right = rect.x + rect.width;
  const bottom = rect.y + rect.height;

  const outer =
    `M${-OVERSCAN},${-OVERSCAN}` +
    `H${screenWidth + OVERSCAN}` +
    `V${screenHeight + OVERSCAN}` +
    `H${-OVERSCAN}` +
    `Z`;

  const inner =
    `M${left + r},${top}` +
    `H${right - r}` +
    `A${r},${r} 0 0 1 ${right},${top + r}` +
    `V${bottom - r}` +
    `A${r},${r} 0 0 1 ${right - r},${bottom}` +
    `H${left + r}` +
    `A${r},${r} 0 0 1 ${left},${bottom - r}` +
    `V${top + r}` +
    `A${r},${r} 0 0 1 ${left + r},${top}` +
    `Z`;

  return `${outer} ${inner}`;
}
