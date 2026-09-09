import { router, usePathname } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, useWindowDimensions } from 'react-native';
import { CoachMarkOverlay } from './CoachMarkOverlay';
import { COACH_MARK_STEPS } from './lib/coach-mark-steps';
import { loadCoachMarkSeen, saveCoachMarkSeen } from './lib/coach-mark-seen';
import {
  advanceTour,
  finishTour,
  goBackTour,
  startTour,
  useCoachMarkState,
} from './lib/coach-mark-store';

/** 홈이 자리를 잡을 틈. 바로 띄우면 로딩 스피너 위에 안내가 얹힌다. */
const START_DELAY_MS = 900;
/** 안내와 상관없는 화면으로 갔을 때 접기까지. */
const ABANDON_MS = 1500;
/** 맞는 화면인데도 대상이 안 나타날 때 접기까지. */
const TARGET_TIMEOUT_MS = 4000;

/**
 * 첫 실행 안내를 지휘한다. features/app-update/ForceUpdateGate.tsx와 같은 자리에 두는
 * 루트 게이트로, 화면을 차지하지 않고 조건이 맞을 때만 오버레이를 띄운다.
 *
 * 진행 신호로 usePathname()을 쓴다. "대상이 등록되면 넘어간다"로 하지 않는 이유:
 * BingoAll의 CreateBingoButtons는 loadData가 끝나 빈 화면 분기에서 목록 분기로
 * 넘어갈 때 실제로 리마운트되고, /bingo/add는 홈의 임시저장 카드로도 들어올 수 있다
 * (BingoAll.tsx:286). 등록은 여러 번, 엉뚱한 경로로도 일어난다. 라우트 전환은
 * 한 방향으로 정확히 한 번이다.
 */
export function CoachMarkHost() {
  const pathname = usePathname();
  const { width, height } = useWindowDimensions();
  const { phase, stepIndex, rect } = useCoachMarkState();
  const [seen, setSeen] = useState<boolean | null>(null);

  const step = phase === 'running' ? COACH_MARK_STEPS[stepIndex] : null;
  /**
   * 화면 전체를 비추는 단계는 잴 대상이 없다. 화면 크기를 그대로 구멍으로 쓴다.
   * 아래 '대상이 안 나타나면 접는다' 타임아웃도 이 값 덕에 걸리지 않는다.
   */
  // useMemo가 없으면 매 렌더 새 객체가 되어 아래 타임아웃 효과가 계속 다시 걸린다.
  const holeRect = useMemo(
    () => (step?.fullScreen ? { x: 0, y: 0, width, height } : rect),
    [step?.fullScreen, width, height, rect],
  );
  const nextRoute = COACH_MARK_STEPS[stepIndex + 1]?.route;

  useEffect(() => {
    void loadCoachMarkSeen().then(setSeen);
  }, []);

  const finish = useCallback(() => {
    finishTour();
    void saveCoachMarkSeen();
  }, []);

  useEffect(() => {
    if (seen !== false || phase !== 'idle') return;
    if (pathname !== COACH_MARK_STEPS[0].route) return;

    const timer = setTimeout(startTour, START_DELAY_MS);
    return () => clearTimeout(timer);
  }, [seen, phase, pathname]);

  /**
   * 이 단계의 화면을 실제로 밟은 적이 있는지. 아래 자동 전진의 전제다.
   *
   * 「이전」으로 5단계에서 4단계로 돌아올 때, 화면은 아직 /bingo/add다. 이 기록이
   * 없으면 그 찰나에 "통과 단계인데 다음 화면에 와 있다"로 읽혀 곧장 5단계로 튕겨
   * 돌아가 버린다.
   */
  const arrivedAtStepRef = useRef<number | null>(null);

  useEffect(() => {
    if (step !== null && pathname === step.route) arrivedAtStepRef.current = stepIndex;
  }, [step, stepIndex, pathname]);

  // 통과 단계에서 사용자가 진짜 버튼을 눌러 화면이 바뀌면 다음 단계로.
  useEffect(() => {
    if (step === null || !step.passThrough) return;
    if (arrivedAtStepRef.current !== stepIndex) return;
    if (nextRoute !== undefined && pathname === nextRoute) advanceTour();
  }, [step, stepIndex, nextRoute, pathname]);

  /**
   * 안내와 무관한 화면으로 갔으면 접는다. 사용자가 일부러 나간 것이므로
   * 나중에 돌아왔을 때 불쑥 다시 뜨면 안 된다.
   */
  useEffect(() => {
    if (step === null || pathname === step.route) return;
    // 통과 단계가 기다리던 그 이동이면 위 효과가 처리한다.
    if (step.passThrough && pathname === nextRoute) return;

    const timer = setTimeout(finish, ABANDON_MS);
    return () => clearTimeout(timer);
  }, [step, nextRoute, pathname, finish]);

  /**
   * 맞는 화면인데 대상이 끝내 안 나타나면 접는다.
   *
   * 빙고가 상한(MAX_BINGOS)에 닿은 사용자는 홈에 「빙고 추가하기」가 아예 렌더되지
   * 않는다(BingoAll.tsx의 상한 분기). 이 타임아웃이 없으면 투어가 보이지 않는 채
   * 멈추고 '봤음' 플래그도 못 써서 실행할 때마다 되살아난다.
   */
  useEffect(() => {
    if (step === null || holeRect !== null || pathname !== step.route) return;

    const timer = setTimeout(finish, TARGET_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [step, holeRect, pathname, finish]);

  /**
   * 마지막 단계의 '시작하기'는 advanceTour가 아니라 finish로 보낸다.
   * 스토어의 advanceTour는 끝에 닿으면 finishTour만 부르고 '봤음' 플래그는 모른다.
   */
  const handleNext = useCallback(() => {
    if (stepIndex + 1 >= COACH_MARK_STEPS.length) {
      finish();
      // 마지막 단계는 /bingo/add 에서 끝난다. 안내만 걷으면 사용자가 빈 작성
      // 화면에 남으므로 홈으로 되돌린다. push 로 들어온 화면이라 replace 로 지운다.
      router.replace('/(tabs)');
      return;
    }
    advanceTour();
  }, [stepIndex, finish]);

  /**
   * 한 단계 뒤로. 이전 단계가 다른 화면에 있으면 화면도 함께 되돌린다
   * (6단계 → 5단계는 같은 화면이라 스크롤만 올라가고, 5단계 → 4단계는 홈으로 나간다).
   */
  const handlePrev = useCallback(() => {
    const prev = COACH_MARK_STEPS[stepIndex - 1];
    if (prev === undefined) return;

    goBackTour();
    if (prev.route !== pathname) router.back();
  }, [stepIndex, pathname]);

  // 안드로이드 하드웨어 백은 X와 같게 다룬다. components/Modal.tsx:105와 같은 방식.
  useEffect(() => {
    if (step === null) return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      finish();
      return true;
    });
    return () => subscription.remove();
  }, [step, finish]);

  // 아직 못 쟀거나 화면이 어긋나 있으면 아무것도 그리지 않는다.
  // 전환 중에 옛 좌표로 구멍을 뚫느니 한 박자 늦게 나타나는 편이 낫다.
  if (step === null || holeRect === null || pathname !== step.route) return null;

  return (
    <CoachMarkOverlay
      step={step}
      rect={holeRect}
      stepNumber={stepIndex + 1}
      total={COACH_MARK_STEPS.length}
      onNext={handleNext}
      onPrev={handlePrev}
      onClose={finish}
    />
  );
}
