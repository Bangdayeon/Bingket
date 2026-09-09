import type { ReactNode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PortalHost } from '@/components/PortalHost';
import { CoachMarkHost } from '@/features/coachmark/CoachMarkHost';
import { COACH_MARK_STEPS } from '@/features/coachmark/lib/coach-mark-steps';
import {
  advanceTour,
  getCoachMarkState,
  resetTourForTest,
  setActiveRect,
} from '@/features/coachmark/lib/coach-mark-store';

let mockPathname = '/';
const mockSave = jest.fn();
const mockBack = jest.fn();

/**
 * IconButton과 GlowRing이 Reanimated를 끌고 들어오는데 테스트에는 worklets 네이티브
 * 파트가 없다. 라이브러리가 주는 mock은 자기 index를 다시 import해서 소용이 없으므로
 * 쓰는 것만 직접 세운다. useReducedMotion을 true로 두면 맥동 자체가 꺼진다.
 */
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: { View },
    useSharedValue: (value: number) => ({ value }),
    useAnimatedStyle: () => ({}),
    useReducedMotion: () => true,
    withTiming: (value: number) => value,
    withSpring: (value: number) => value,
    withRepeat: (value: number) => value,
    cancelAnimation: () => {},
    Easing: { inOut: () => () => 0, quad: () => 0 },
  };
});

// jest에는 svg transformer가 없어 아이콘 import가 컴포넌트가 아닌 객체로 온다.
jest.mock('@/assets/icons/ic_close.svg', () => 'IcClose');

jest.mock('expo-router', () => ({
  usePathname: () => mockPathname,
  router: { back: () => mockBack() },
}));

jest.mock('@/features/coachmark/lib/coach-mark-seen', () => ({
  loadCoachMarkSeen: () => Promise.resolve(false),
  saveCoachMarkSeen: () => {
    mockSave();
    return Promise.resolve();
  },
}));

const RECT = { x: 100, y: 700, width: 60, height: 40 };

beforeEach(() => {
  jest.useFakeTimers();
  mockPathname = '/';
  mockSave.mockReset();
  mockBack.mockReset();
  resetTourForTest();
});

afterEach(() => {
  jest.useRealTimers();
});

/**
 * '봤음' 플래그 읽기는 프라미스라 가짜 타이머와 무관하게 마이크로태스크로 풀린다.
 * 그걸 먼저 흘려보내야 시작 타이머가 걸린다.
 */
const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

/**
 * 오버레이는 Portal로 나가므로 PortalHost가 있어야 그려지고,
 * X 버튼이 safe area 인셋을 읽으므로 SafeAreaProvider도 필요하다.
 */
function Wrapper({ children }: { children: ReactNode }) {
  return (
    <SafeAreaProvider initialMetrics={METRICS}>
      {children}
      <PortalHost />
    </SafeAreaProvider>
  );
}

async function mount() {
  const view = render(<CoachMarkHost />, { wrapper: Wrapper });
  await act(async () => {});
  act(() => {
    jest.advanceTimersByTime(1000);
  });
  return view;
}

describe('CoachMarkHost', () => {
  it('안 본 사용자가 홈에 있으면 잠시 뒤 1단계가 뜬다', async () => {
    await mount();
    expect(getCoachMarkState().phase).toBe('running');

    act(() => setActiveRect(COACH_MARK_STEPS[0].targetId, RECT));

    expect(screen.getByText(COACH_MARK_STEPS[0].text)).toBeTruthy();
    expect(screen.getByText(`1 / ${COACH_MARK_STEPS.length}`)).toBeTruthy();
  });

  it('대상을 재기 전에는 아무것도 그리지 않는다', async () => {
    await mount();

    // 전환 중에 옛 좌표로 구멍을 뚫느니 한 박자 늦게 나타나는 편이 낫다
    expect(screen.queryByText(COACH_MARK_STEPS[0].text)).toBeNull();
  });

  it('마지막 단계에서만 시작하기가 뜬다', async () => {
    await mount();
    act(() => {
      for (let i = 0; i < COACH_MARK_STEPS.length - 1; i += 1) advanceTour();
    });
    mockPathname = COACH_MARK_STEPS[COACH_MARK_STEPS.length - 1].route;
    act(() => setActiveRect(COACH_MARK_STEPS[COACH_MARK_STEPS.length - 1].targetId, RECT));

    expect(screen.getByText('시작하기')).toBeTruthy();
  });

  it('통과 단계에서 화면이 바뀌면 다음 단계로 넘어간다', async () => {
    const { rerender } = await mount();

    const passIndex = COACH_MARK_STEPS.findIndex((s) => s.passThrough);
    act(() => {
      for (let i = 0; i < passIndex; i += 1) advanceTour();
    });
    expect(getCoachMarkState().stepIndex).toBe(passIndex);

    mockPathname = '/bingo/add';
    await act(async () => {
      rerender(<CoachMarkHost />);
    });

    expect(getCoachMarkState().stepIndex).toBe(passIndex + 1);
  });

  it('대상이 끝내 안 나타나면 투어를 접고 봤음으로 기록한다', async () => {
    // 빙고가 상한이라 「빙고 추가하기」가 아예 렌더되지 않는 사용자가 여기 걸린다.
    // 접지 않으면 실행할 때마다 보이지 않는 투어가 되살아난다.
    await mount();
    expect(getCoachMarkState().phase).toBe('running');

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(getCoachMarkState().phase).toBe('done');
    expect(mockSave).toHaveBeenCalled();
  });

  it('첫 단계에는 이전이 없다', async () => {
    await mount();
    act(() => setActiveRect(COACH_MARK_STEPS[0].targetId, RECT));

    expect(screen.queryByText('이전')).toBeNull();
  });

  it('이전은 같은 화면 안에서는 화면을 되돌리지 않는다', async () => {
    await mount();
    act(() => advanceTour());
    act(() => setActiveRect(COACH_MARK_STEPS[1].targetId, RECT));

    act(() => fireEvent.press(screen.getByText('이전')));

    expect(getCoachMarkState().stepIndex).toBe(0);
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('이전 단계가 다른 화면이면 화면도 함께 되돌린다', async () => {
    const { rerender } = await mount();
    // 통과 단계 바로 다음(= 빙고 추가 화면의 첫 단계)까지 간다
    const addIndex = COACH_MARK_STEPS.findIndex((s) => s.passThrough) + 1;
    act(() => {
      for (let i = 0; i < addIndex; i += 1) advanceTour();
    });

    mockPathname = '/bingo/add';
    await act(async () => {
      rerender(<CoachMarkHost />);
    });
    act(() => setActiveRect(COACH_MARK_STEPS[addIndex].targetId, RECT));

    act(() => fireEvent.press(screen.getByText('이전')));

    expect(getCoachMarkState().stepIndex).toBe(addIndex - 1);
    expect(mockBack).toHaveBeenCalled();
  });

  it('되돌아온 통과 단계가 곧장 앞으로 튕기지 않는다', async () => {
    const { rerender } = await mount();
    const passIndex = COACH_MARK_STEPS.findIndex((s) => s.passThrough);
    act(() => {
      for (let i = 0; i <= passIndex; i += 1) advanceTour();
    });

    mockPathname = '/bingo/add';
    await act(async () => {
      rerender(<CoachMarkHost />);
    });
    act(() => setActiveRect(COACH_MARK_STEPS[passIndex + 1].targetId, RECT));

    // 화면은 아직 /bingo/add인 채로 통과 단계로 돌아간다
    act(() => fireEvent.press(screen.getByText('이전')));
    await act(async () => {
      rerender(<CoachMarkHost />);
    });

    expect(getCoachMarkState().stepIndex).toBe(passIndex);
  });

  it('안내와 무관한 화면으로 가면 접는다', async () => {
    const { rerender } = await mount();
    act(() => setActiveRect(COACH_MARK_STEPS[0].targetId, RECT));

    mockPathname = '/community';
    await act(async () => {
      rerender(<CoachMarkHost />);
    });
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(getCoachMarkState().phase).toBe('done');
    expect(mockSave).toHaveBeenCalled();
  });
});
