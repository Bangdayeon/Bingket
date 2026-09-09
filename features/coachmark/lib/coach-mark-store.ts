import { useSyncExternalStore } from 'react';
import { COACH_MARK_STEPS, type CoachMarkStep, type CoachMarkTargetId } from './coach-mark-steps';
import type { Rect } from './spotlight-path';

export type CoachMarkPhase = 'idle' | 'running' | 'done';

export interface CoachMarkState {
  phase: CoachMarkPhase;
  stepIndex: number;
  /** 지금 재야 하는 대상. 이거 하나만 둔다 — 이유는 아래 주석. */
  activeTargetId: CoachMarkTargetId | null;
  /** activeTargetId를 잰 결과. 아직 못 쟀으면 null. */
  rect: Rect | null;
  /** 올라갈 때마다 활성 대상이 자기를 다시 잰다. */
  remeasureNonce: number;
}

/**
 * 코치마크 진행 상태. features/team/lib/friend-selection.ts와 같은 모양의 외부 스토어다.
 *
 * 측정값을 id별 Map으로 들고 있지 않고 활성 대상 하나만 두는 게 핵심이다.
 * 탭바는 /bingo/add 위에서도 (tabs) 아래에 그대로 마운트돼 있어서, Map을 쓰면
 * 5단계 중에도 탭 좌표가 '등록된 유효한 값'처럼 남는다. 그 낡은 값이 어떤 단계의
 * 것인지 매번 따져야 하고, 측정이 일어날 때마다 오버레이 전체가 다시 그려진다.
 * 활성 대상만 재게 하면 그 문제군이 통째로 사라진다.
 */
let state: CoachMarkState = {
  phase: 'idle',
  stepIndex: 0,
  activeTargetId: null,
  rect: null,
  remeasureNonce: 0,
};

const listeners = new Set<() => void>();

/**
 * 스냅샷은 바뀔 때만 새 객체가 된다.
 *
 * getSnapshot이 호출마다 새 객체를 돌려주면 useSyncExternalStore가 무한 렌더에 빠진다
 * (React가 "getSnapshot should be cached"로 경고하는 그것). lib/portal-store.ts가
 * entries를 바뀔 때만 재대입하는 것과 같은 이유다.
 */
function setState(patch: Partial<CoachMarkState>): void {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

export function subscribeCoachMark(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getCoachMarkState(): CoachMarkState {
  return state;
}

export function startTour(): void {
  if (state.phase === 'running') return;
  setState({
    phase: 'running',
    stepIndex: 0,
    activeTargetId: COACH_MARK_STEPS[0].targetId,
    rect: null,
  });
}

export function advanceTour(): void {
  if (state.phase !== 'running') return;

  const next = state.stepIndex + 1;
  if (next >= COACH_MARK_STEPS.length) {
    finishTour();
    return;
  }

  // rect를 null로 되돌려야 다음 대상을 재기 전 한 프레임 동안 옛 구멍이 남지 않는다.
  setState({ stepIndex: next, activeTargetId: COACH_MARK_STEPS[next].targetId, rect: null });
}

/** 한 단계 뒤로. 화면 이동이 필요한 경우는 호출부(CoachMarkHost)가 함께 처리한다. */
export function goBackTour(): void {
  if (state.phase !== 'running' || state.stepIndex === 0) return;

  const prev = state.stepIndex - 1;
  setState({ stepIndex: prev, activeTargetId: COACH_MARK_STEPS[prev].targetId, rect: null });
}

export function finishTour(): void {
  if (state.phase === 'done') return;
  setState({ phase: 'done', activeTargetId: null, rect: null });
}

/** 테스트에서 모듈 상태를 되돌리기 위한 것. 앱 코드에서는 쓰지 않는다. */
export function resetTourForTest(): void {
  state = { phase: 'idle', stepIndex: 0, activeTargetId: null, rect: null, remeasureNonce: 0 };
  listeners.forEach((listener) => listener());
}

function sameRect(a: Rect | null, b: Rect | null): boolean {
  if (a === null || b === null) return a === b;
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

/**
 * 활성 대상이 자기 위치를 알려온다.
 *
 * id를 확인하는 이유: 단계가 넘어가는 찰나에 이전 대상의 measureInWindow 콜백이
 * 뒤늦게 도착할 수 있다. 그대로 받으면 새 단계의 구멍이 옛 자리에 뚫린다.
 * 값이 같으면 아무것도 안 하는 이유: onLayout이 스크롤·리렌더마다 불려도
 * 구독자를 깨우지 않게 한다.
 */
export function setActiveRect(id: CoachMarkTargetId, rect: Rect): void {
  if (state.activeTargetId !== id || sameRect(state.rect, rect)) return;
  setState({ rect });
}

export function clearActiveRect(id: CoachMarkTargetId): void {
  if (state.activeTargetId !== id || state.rect === null) return;
  setState({ rect: null });
}

export function requestCoachMarkRemeasure(): void {
  if (state.phase !== 'running') return;
  setState({ remeasureNonce: state.remeasureNonce + 1 });
}

/** 진행 상태 전체. 오버레이를 지휘하는 CoachMarkHost만 쓴다. */
export function useCoachMarkState(): CoachMarkState {
  return useSyncExternalStore(subscribeCoachMark, getCoachMarkState, getCoachMarkState);
}

/**
 * 이 대상이 지금 재야 할 차례인지. 불리언이라 다른 단계의 상태 변화에는 리렌더되지 않는다.
 */
export function useIsActiveTarget(id: CoachMarkTargetId | undefined): boolean {
  const read = () => id !== undefined && state.activeTargetId === id;
  return useSyncExternalStore(subscribeCoachMark, read, read);
}

/** 지금 재야 할 대상. 스크롤로 대상을 끌어오는 쪽이 쓴다. */
export function useActiveTargetId(): CoachMarkTargetId | null {
  const read = () => state.activeTargetId;
  return useSyncExternalStore(subscribeCoachMark, read, read);
}

/** 재측정 요청 카운터. 값 자체는 의미가 없고 바뀌었다는 사실만 쓴다. */
export function useRemeasureNonce(): number {
  const read = () => state.remeasureNonce;
  return useSyncExternalStore(subscribeCoachMark, read, read);
}

export function currentStep(): CoachMarkStep | null {
  return state.phase === 'running' ? COACH_MARK_STEPS[state.stepIndex] : null;
}
