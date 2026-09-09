import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { InteractionManager, useWindowDimensions, View } from 'react-native';
import type { CoachMarkTargetId } from './lib/coach-mark-steps';
import {
  clearActiveRect,
  setActiveRect,
  useIsActiveTarget,
  useRemeasureNonce,
} from './lib/coach-mark-store';

/** 못 쓸 값이 나왔을 때 다시 재기까지. */
const RETRY_MS = 50;
/** 이만큼 시도해도 못 재면 포기한다. 호스트가 타임아웃으로 투어를 정리한다. */
const MAX_ATTEMPTS = 6;

interface CoachMarkTargetProps {
  /**
   * 안내 대상 id. undefined면 감싸기만 한다 —
   * 탭바처럼 형제끼리 래퍼가 있고 없고로 레이아웃이 갈리면 안 되는 자리에 쓴다.
   */
  id?: CoachMarkTargetId;
  className?: string;
  children: ReactNode;
}

/**
 * 자식을 첫 실행 안내의 하이라이트 대상으로 등록한다.
 *
 * Button과 IconButton은 ref를 넘겨받지 않으므로, 위치를 알아내려면 이렇게 감싸는 수밖에 없다.
 * 그래서 className을 그대로 통과시킨다 — 감싼 자리의 flex-1이나 w-full을 래퍼가
 * 이어받지 않으면 레이아웃이 어긋난다.
 */
export function CoachMarkTarget({ id, className, children }: CoachMarkTargetProps) {
  const ref = useRef<View>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isActive = useIsActiveTarget(id);
  const nonce = useRemeasureNonce();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const measure = useCallback(() => {
    if (id === undefined) return;

    // 이전 재시도 사슬이 남아 있으면 끊는다. onLayout이 연달아 불릴 때 사슬이 겹치면
    // 같은 값을 여러 번 쓰게 된다.
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    let attempts = 0;

    const attempt = () => {
      const node = ref.current;
      if (node === null) return;

      node.measureInWindow((x, y, width, height) => {
        /**
         * 아직 쓸 수 없는 값을 걸러낸다.
         * - width/height가 0: Yoga 레이아웃은 끝났지만 네이티브 뷰가 아직 안 앉았다.
         * - 화면 밖: 화면 전환 중이거나(옆으로 밀린 좌표), 스크롤 아래에 접혀 있다.
         */
        const usable =
          width > 0 && height > 0 && y + height > 0 && y < screenHeight && x < screenWidth;

        if (usable) {
          setActiveRect(id, { x, y, width, height });
          return;
        }

        attempts += 1;
        if (attempts < MAX_ATTEMPTS) {
          timerRef.current = setTimeout(attempt, RETRY_MS);
        }
      });
    };

    attempt();
  }, [id, screenHeight, screenWidth]);

  useEffect(() => {
    if (!isActive) return;

    // 화면 전환 애니메이션이 끝난 뒤에 잰다. /bingo/add가 오른쪽에서 밀려들어오는
    // 동안 재면 화면 밖 좌표가 나와 구멍이 엉뚱한 데 뚫린다.
    // 레포에서 같은 이유로 쓰는 자리: BingoAll.tsx:249, BingoCard.tsx:103.
    const task = InteractionManager.runAfterInteractions(measure);

    return () => {
      task.cancel();
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    // nonce가 오르면(스크롤 종료·회전 등) 다시 잰다.
  }, [isActive, measure, nonce]);

  useEffect(() => {
    if (id === undefined) return;
    return () => clearActiveRect(id);
  }, [id]);

  return (
    <View
      ref={ref}
      className={className}
      // 안드로이드는 레이아웃만 하는 View를 네이티브 트리에서 걷어낸다. 그러면 ref가
      // 가리킬 게 없어 measureInWindow 콜백이 조용히 안 불린다.
      // (같은 이유로 쓰는 자리: features/bingo/components/BingoCard.tsx:121)
      collapsable={false}
      onLayout={isActive ? measure : undefined}
    >
      {children}
    </View>
  );
}
