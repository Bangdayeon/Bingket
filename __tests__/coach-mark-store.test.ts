import { COACH_MARK_STEPS } from '@/features/coachmark/lib/coach-mark-steps';
import {
  advanceTour,
  clearActiveRect,
  finishTour,
  getCoachMarkState,
  requestCoachMarkRemeasure,
  resetTourForTest,
  setActiveRect,
  startTour,
  subscribeCoachMark,
} from '@/features/coachmark/lib/coach-mark-store';

const RECT = { x: 10, y: 20, width: 30, height: 40 };

beforeEach(resetTourForTest);

describe('진행', () => {
  it('시작하면 첫 단계의 대상을 잰다', () => {
    startTour();

    expect(getCoachMarkState().phase).toBe('running');
    expect(getCoachMarkState().activeTargetId).toBe(COACH_MARK_STEPS[0].targetId);
  });

  it('단계를 넘기면 rect가 비워진다', () => {
    startTour();
    setActiveRect(COACH_MARK_STEPS[0].targetId, RECT);
    advanceTour();

    // 새 대상을 재기 전 한 프레임 동안 옛 자리에 구멍이 남으면 안 된다
    expect(getCoachMarkState().rect).toBeNull();
    expect(getCoachMarkState().activeTargetId).toBe(COACH_MARK_STEPS[1].targetId);
  });

  it('마지막 단계에서 더 넘기면 끝난다', () => {
    startTour();
    for (let i = 0; i < COACH_MARK_STEPS.length; i += 1) advanceTour();

    expect(getCoachMarkState().phase).toBe('done');
    expect(getCoachMarkState().activeTargetId).toBeNull();
  });
});

describe('측정값', () => {
  it('활성이 아닌 대상의 뒤늦은 콜백은 무시한다', () => {
    startTour();
    advanceTour();

    // 1단계 대상이 언마운트되며 뒤늦게 도착한 측정값
    setActiveRect(COACH_MARK_STEPS[0].targetId, RECT);

    expect(getCoachMarkState().rect).toBeNull();
  });

  it('같은 값을 다시 써도 구독자를 깨우지 않는다', () => {
    startTour();
    setActiveRect(COACH_MARK_STEPS[0].targetId, RECT);

    let calls = 0;
    const unsubscribe = subscribeCoachMark(() => {
      calls += 1;
    });
    // onLayout은 스크롤·리렌더마다 불린다
    setActiveRect(COACH_MARK_STEPS[0].targetId, { ...RECT });

    expect(calls).toBe(0);
    unsubscribe();
  });

  it('활성이 아닌 대상은 rect를 지우지 못한다', () => {
    startTour();
    setActiveRect(COACH_MARK_STEPS[0].targetId, RECT);
    clearActiveRect(COACH_MARK_STEPS[1].targetId);

    expect(getCoachMarkState().rect).toEqual(RECT);
  });
});

describe('스냅샷 신원', () => {
  it('바뀌지 않으면 같은 객체를 돌려준다', () => {
    // 호출마다 새 객체를 주면 useSyncExternalStore가 무한 렌더에 빠진다
    expect(getCoachMarkState()).toBe(getCoachMarkState());
  });

  it('바뀌면 새 객체를 돌려준다', () => {
    const before = getCoachMarkState();
    startTour();

    expect(getCoachMarkState()).not.toBe(before);
  });

  it('투어가 안 돌 때는 재측정 요청이 아무 일도 하지 않는다', () => {
    const before = getCoachMarkState();
    requestCoachMarkRemeasure();

    expect(getCoachMarkState()).toBe(before);
  });

  it('끝난 뒤 다시 끝내도 상태가 흔들리지 않는다', () => {
    startTour();
    finishTour();
    const done = getCoachMarkState();
    finishTour();

    expect(getCoachMarkState()).toBe(done);
  });
});
