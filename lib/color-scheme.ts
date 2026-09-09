import { useSyncExternalStore } from 'react';
import { Appearance, AppState } from 'react-native';
// className이 CSS 변수를 고를 때 읽는 바로 그 관찰값이다. nativewind가 재수출하지 않아
// 딥 임포트한다. react-native-css-interop은 package.json에 exports 필드가 없어 metro가
// 그대로 해석하고, 같은 경로에 .d.ts가 있어 타입도 붙는다.
import { systemColorScheme } from 'react-native-css-interop/dist/runtime/native/appearance-observables';

export type AppTheme = 'system' | 'light' | 'dark';
export type ResolvedScheme = 'light' | 'dark';

/**
 * 앱 전체에서 테마 값이 나오는 유일한 곳.
 *
 * 왜 nativewind의 colorScheme.set을 안 쓰는가 —
 *
 * 1. 극성이 갈린다. className은 CSS 변수를 고를 때 `colorScheme.get() === 'light'`가
 *    아니면 전부 DARK로 판정한다(appearance-observables.js의 cssVariableObservable).
 *    반면 useColors()는 `=== 'dark'`일 때만 DARK였다. 그래서 값이 'light'/'dark'가
 *    아닌 무언가면 화면은 다크인데 값은 라이트가 되어, 어두운 시트 위에 검은 글씨가
 *    깔렸다.
 *
 * 2. 'system'이 캐시를 오염시킨다. colorScheme.set('system')은 RN 0.83에서
 *    Appearance.setColorScheme('unspecified')를 부르는데, RN은 이 값을 JS 로컬 캐시에
 *    그대로 적어 넣고 change 이벤트는 쏘지 않는다(Appearance.js). 네이티브는 절대
 *    'unspecified'를 돌려주지 않으므로(RCTAppearance.mm / AppearanceModule.kt) 이
 *    캐시 쓰기가 오염의 유일한 출처다. 이후 포그라운드 복귀 때 라이브러리가
 *    `Appearance.getColorScheme()`을 다시 읽어 'unspecified'를 관찰값에 넣고,
 *    그 순간부터 화면 전체가 다크로 굳었다.
 *
 * 3. colorScheme.set은 자기 관찰값을 갱신하지 않는다 — 그 코드가
 *    `process.env.NODE_ENV === 'test'` 안에만 있다. 그래서 className 반영은 오직
 *    네이티브 appearanceChanged 이벤트에만 의존하는데, 그 이벤트는 해상값이 실제로
 *    바뀔 때만 발화한다. 오염으로 다크에 굳은 상태에서 OS가 라이트인 채 '라이트'를
 *    고르면 light→light라 이벤트가 없고, 화면은 다크로 남았다.
 *
 * 그래서 resolved scheme을 여기서 직접 소유하고, className과 useColors()가 같은 값
 * 하나에서 파생되게 한다. 극성이라는 개념 자체가 없어진다.
 */

/**
 * 'unspecified'와 null을 여기서 끊는다. 이 경계를 넘어가는 값은 'light' | 'dark'뿐이라
 * 오염값이 앱 코드에 타입상 존재할 수 없다.
 */
const asScheme = (value: unknown): ResolvedScheme | null =>
  value === 'light' || value === 'dark' ? value : null;

/** 사용자가 고른 것. 저장되는 값. */
let preference: AppTheme = 'system';
/** OS가 실제로 어느 쪽인지. preference가 'system'일 때만 갱신한다. */
let osScheme: ResolvedScheme = asScheme(Appearance.getColorScheme()) ?? 'light';
/** 우리가 네이티브에 마지막으로 건 override. 'system'이면 null. */
let override: ResolvedScheme | null = null;
let resolved: ResolvedScheme = osScheme;

const listeners = new Set<() => void>();

function publish(): void {
  const next: ResolvedScheme = preference === 'system' ? osScheme : preference;

  // resolved가 안 바뀌어도 매번 눌러준다. 라이브러리 리스너가 방금 'unspecified'로
  // 덮어썼을 수 있기 때문이다. observable.set에는 Object.is 가드가 있어서 값이 같으면
  // 그냥 no-op이라 비용도 없다.
  systemColorScheme.set(next);

  if (next === resolved) return;
  resolved = next;
  listeners.forEach((l) => l());
}

// 아래 두 리스너는 라이브러리(appearance-observables 모듈 본문)가 등록한 것보다 뒤에
// 붙는다 — 위 import가 그 모듈을 먼저 평가시키기 때문이다. RN의 EventEmitter는 등록
// 순서대로 호출하므로 마지막 값은 우리가 정한다.
Appearance.addChangeListener(({ colorScheme }) => {
  const next = asScheme(colorScheme);
  // override가 걸린 동안 오는 이벤트는 OS 값이 아니라 우리가 건 값이다. 버린다.
  if (next && preference === 'system') osScheme = next;
  publish();
});

AppState.addEventListener('change', (state) => {
  if (state !== 'active') return;
  // 오염된 캐시면 asScheme이 null로 걸러낸다. 여기가 화면이 다크로 굳던 지점이었다.
  const next = asScheme(Appearance.getColorScheme());
  if (next && preference === 'system') osScheme = next;
  publish();
  // 라이브러리 리스너가 어떤 이유로든 우리 뒤에 돌더라도 마지막은 우리가 이긴다.
  queueMicrotask(publish);
});

/**
 * 테마를 적용한다. 저장은 lib/app-theme.ts가 따로 한다.
 *
 * 'light'/'dark'에서는 네이티브에 override를 걸어 iOS 키보드·UIDatePicker 크롬,
 * Android AppCompat DatePickerDialog 같은 네이티브 위젯까지 앱 선택을 따라오게 한다.
 * 이때 OS 추종을 잃지만 어차피 안 쓴다.
 *
 * 'system'에서는 override를 반드시 풀어야 한다. override가 걸린 동안에는 OS가 바뀌어도
 * 네이티브가 override 값을 그대로 돌려줘서, JS에서 OS 값을 관측할 창구가 사라진다.
 */
export function applyAppTheme(theme: AppTheme): void {
  preference = theme;

  if (theme === 'system') {
    // override를 푸는 순간의 해상값이 곧 OS 값이다. 값이 달라지면 appearanceChanged가
    // 와서 osScheme을 정확히 덮어쓰고, 이벤트가 안 오면 "안 바뀌었다"는 뜻이므로 직전
    // override가 곧 OS 값이다(네이티브의 동등성 가드). 그래서 미리 넣어 둔다.
    if (override) osScheme = override;
    override = null;
    // JS 캐시가 'unspecified'로 오염되지만 asScheme이 걸러내므로 아래로 새지 않는다.
    Appearance.setColorScheme('unspecified');
  } else {
    override = theme;
    Appearance.setColorScheme(theme);
  }

  publish();
}

/** 훅을 쓸 수 없는 자리(모듈 스코프, 이벤트 핸들러)에서 쓴다. */
export function getResolvedScheme(): ResolvedScheme {
  return resolved;
}

/** 지금 화면이 실제로 어느 쪽인지. className이 보는 값과 항상 같다. */
export function useResolvedScheme(): ResolvedScheme {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => resolved,
    () => resolved,
  );
}
