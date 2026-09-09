/**
 * className과 useColors()가 같은 값을 보는지 고정한다.
 *
 * 이 둘은 극성이 반대였다 — className은 `!== 'light'`면 다크, useColors()는
 * `=== 'dark'`일 때만 다크. 그래서 'unspecified' 같은 값이 들어오면 화면은 다크인데
 * 색 값은 라이트가 되어, 어두운 시트 위에 검은 글씨가 깔렸다.
 *
 * jest는 NODE_ENV=test라 라이브러리의 colorScheme.set이 프로덕션과 다르게 동작한다.
 * 그래서 라이브러리 동작이 아니라 **우리 스토어와 systemColorScheme의 일치**를 본다.
 * systemColorScheme이 className이 실제로 읽는 값이다.
 */

/** RN의 JS 캐시를 흉내낸다. setColorScheme이 여기에 그대로 적히고 이벤트는 안 나간다. */
const mockAppearance = { cache: 'light' as string | null };
const mockAppearanceListeners: ((p: { colorScheme: string | null }) => void)[] = [];
const mockAppStateListeners: ((s: string) => void)[] = [];

jest.mock('react-native', () => ({
  Appearance: {
    getColorScheme: () => mockAppearance.cache,
    // 실제 RN도 캐시만 덮어쓰고 change 이벤트를 쏘지 않는다. 그게 버그의 출처였다.
    setColorScheme: (v: string | null) => {
      mockAppearance.cache = v;
    },
    addChangeListener: (cb: (p: { colorScheme: string | null }) => void) => {
      mockAppearanceListeners.push(cb);
      return { remove: () => {} };
    },
  },
  AppState: {
    currentState: 'active',
    addEventListener: (_type: string, cb: (s: string) => void) => {
      mockAppStateListeners.push(cb);
      return { remove: () => {} };
    },
  },
  Platform: { OS: 'ios', constants: { reactNativeVersion: { major: 0, minor: 83 } } },
  AccessibilityInfo: {
    isReduceMotionEnabled: () => Promise.resolve(false),
    addEventListener: () => ({ remove: () => {} }),
  },
}));

type Scheme = 'light' | 'dark';

interface Harness {
  applyAppTheme: (t: 'system' | 'light' | 'dark') => void;
  getResolvedScheme: () => Scheme;
  /** className이 CSS 변수를 고를 때 읽는 값 */
  classNameScheme: () => Scheme;
  /** 네이티브가 appearanceChanged를 쏜 상황. 등록 순서대로 리스너를 돌린다. */
  emitOsChange: (scheme: Scheme) => void;
  /** 백그라운드 → 포그라운드 복귀 */
  foreground: () => void;
}

function setup(osScheme: Scheme): Harness {
  jest.resetModules();
  mockAppearanceListeners.length = 0;
  mockAppStateListeners.length = 0;
  mockAppearance.cache = osScheme;

  // 딥 임포트한 모듈이 먼저 평가되면서 라이브러리 리스너가 우리보다 앞에 등록된다.
  // 실제 앱에서의 순서와 같다.
  const { applyAppTheme, getResolvedScheme } =
    require('@/lib/color-scheme') as typeof import('@/lib/color-scheme');
  const { systemColorScheme } =
    require('react-native-css-interop/dist/runtime/native/appearance-observables') as typeof import('react-native-css-interop/dist/runtime/native/appearance-observables');

  return {
    applyAppTheme,
    getResolvedScheme,
    classNameScheme: () => systemColorScheme.get(),
    emitOsChange: (scheme) => {
      mockAppearance.cache = scheme;
      mockAppearanceListeners.forEach((l) => l({ colorScheme: scheme }));
    },
    foreground: () => {
      mockAppStateListeners.forEach((l) => l('active'));
    },
  };
}

/** className과 useColors()가 같은 값을 보는가. 이 파일의 핵심 단언. */
function expectAgreement(h: Harness) {
  expect(h.classNameScheme()).toBe(h.getResolvedScheme());
}

describe('테마 극성 — className과 useColors()가 갈라지지 않는다', () => {
  const preferences = ['system', 'light', 'dark'] as const;
  const osSchemes: Scheme[] = ['light', 'dark'];

  for (const os of osSchemes) {
    for (const pref of preferences) {
      it(`OS=${os} / 선택=${pref}`, () => {
        const h = setup(os);
        h.applyAppTheme(pref);

        expectAgreement(h);
        expect(h.getResolvedScheme()).toBe(pref === 'system' ? os : pref);
      });
    }
  }
});

describe("'unspecified' 오염 방어", () => {
  it('시스템 모드에서 포그라운드로 복귀해도 다크로 뒤집히지 않는다', () => {
    const h = setup('light');
    h.applyAppTheme('system');

    // applyAppTheme('system')이 override를 풀면서 캐시에 'unspecified'를 적어 넣는다.
    expect(mockAppearance.cache).toBe('unspecified');

    // 여기가 화면 전체가 다크로 굳던 지점이다. 라이브러리 리스너는 이 순간
    // systemColorScheme에 'unspecified'를 넣지만, 우리 리스너가 뒤에서 바로잡는다.
    h.foreground();

    expect(h.getResolvedScheme()).toBe('light');
    expect(h.classNameScheme()).toBe('light');
    expectAgreement(h);
  });

  it('복귀를 세 번 반복해도 유지된다', () => {
    const h = setup('light');
    h.applyAppTheme('system');

    for (let i = 0; i < 3; i++) h.foreground();

    expect(h.getResolvedScheme()).toBe('light');
    expectAgreement(h);
  });
});

describe('네이티브 이벤트가 안 오는 경로', () => {
  it("OS=라이트에서 '다크' 뒤 '라이트'를 골라도 라이트가 된다", () => {
    // 이벤트가 없어도 화면이 따라와야 한다. 네이티브는 해상값이 실제로 바뀔 때만
    // appearanceChanged를 쏘는데, light→light면 안 쏜다. 그래서 예전에는 다크로 남았다.
    const h = setup('light');
    h.applyAppTheme('dark');
    expect(h.getResolvedScheme()).toBe('dark');

    h.applyAppTheme('light');

    expect(h.getResolvedScheme()).toBe('light');
    expectAgreement(h);
  });

  it("override에서 '시스템'으로 돌아올 때 직전 override를 OS 값으로 삼는다", () => {
    // 이벤트가 안 온다 = 해상값이 안 바뀌었다 = OS가 곧 직전 override 값이다.
    const h = setup('light');
    h.applyAppTheme('dark');
    h.applyAppTheme('system');

    expect(h.getResolvedScheme()).toBe('dark');
    expectAgreement(h);
  });
});

describe('OS 테마 변경 추종', () => {
  it('시스템 모드면 따라간다', () => {
    const h = setup('light');
    h.applyAppTheme('system');

    h.emitOsChange('dark');
    expect(h.getResolvedScheme()).toBe('dark');
    expectAgreement(h);

    h.emitOsChange('light');
    expect(h.getResolvedScheme()).toBe('light');
    expectAgreement(h);
  });

  it('라이트/다크를 고정했으면 따라가지 않는다', () => {
    const h = setup('light');
    h.applyAppTheme('light');

    h.emitOsChange('dark');

    expect(h.getResolvedScheme()).toBe('light');
    expectAgreement(h);
  });
});
