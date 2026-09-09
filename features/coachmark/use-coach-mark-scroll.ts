import { useEffect, useMemo, type RefObject } from 'react';
import { InteractionManager, type ScrollView, type ScrollViewProps } from 'react-native';
import type { CoachMarkTargetId } from './lib/coach-mark-steps';
import { requestCoachMarkRemeasure, useActiveTargetId } from './lib/coach-mark-store';

/** scrollTo 애니메이션이 멎기까지. 끝나기 전에 재면 흐르는 좌표가 잡힌다. */
const SETTLE_MS = 450;

/** 대상이 화면의 어느 쪽 끝에 있는지. */
export type CoachMarkScrollPosition = 'top' | 'end';

type ScrollEndHandlers = Pick<ScrollViewProps, 'onScrollEndDrag' | 'onMomentumScrollEnd'>;

/**
 * 화면 밖에 있는 안내 대상을 스크롤로 끌어온다.
 *
 * 한 화면에 안내 대상이 둘 이상일 수 있어서 id마다 방향을 받는다. 빙고 추가 화면이
 * 그렇다 — 빙고 정보는 맨 위, 임시 저장 버튼은 맨 아래다. 「이전」으로 아래 단계에서
 * 위 단계로 되돌아올 때 화면이 아래에 머물러 있으면 대상을 영영 못 재기 때문에,
 * 내려가는 쪽만이 아니라 올라오는 쪽도 필요하다.
 *
 * 돌려주는 핸들러를 ScrollView에 펼쳐 줘야 하는 이유: 통과 단계는 구멍으로 터치가
 * 지나가므로 구멍 안에서 시작한 드래그가 그대로 스크롤이 된다. 스크롤이 멎을 때마다
 * 다시 재야 구멍이 대상을 따라간다.
 */
export function useCoachMarkScrollIntoView(
  scrollRef: RefObject<ScrollView | null>,
  positions: Partial<Record<CoachMarkTargetId, CoachMarkScrollPosition>>,
): ScrollEndHandlers {
  const activeTargetId = useActiveTargetId();
  // 문자열로 좁혀 두면 positions 객체가 매 렌더 새로 만들어져도 효과가 다시 돌지 않는다.
  const position = activeTargetId === null ? undefined : positions[activeTargetId];

  useEffect(() => {
    if (position === undefined) return;

    let settleTimer: ReturnType<typeof setTimeout> | null = null;

    const task = InteractionManager.runAfterInteractions(() => {
      if (position === 'end') {
        scrollRef.current?.scrollToEnd({ animated: true });
      } else {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      }
      settleTimer = setTimeout(requestCoachMarkRemeasure, SETTLE_MS);
    });

    return () => {
      task.cancel();
      if (settleTimer !== null) clearTimeout(settleTimer);
    };
  }, [position, scrollRef]);

  return useMemo(
    () => ({
      onScrollEndDrag: requestCoachMarkRemeasure,
      onMomentumScrollEnd: requestCoachMarkRemeasure,
    }),
    [],
  );
}
