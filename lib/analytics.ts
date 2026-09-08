import {
  getAnalytics,
  logScreenView as logScreenViewEvent,
  setAnalyticsCollectionEnabled,
} from '@react-native-firebase/analytics';
import { hasConsent } from '@/lib/consent';

/**
 * async로 두어 getAnalytics()가 동기로 던지는 오류(네이티브 Firebase 앱 미초기화 등)도
 * rejected promise로 흘러가게 한다. 분석 실패가 앱을 멈추게 해서는 안 된다.
 *
 * 개인정보 수집·이용에 동의하기 전에는 아무것도 보내지 않는다.
 */
export const logScreenView = async (screenName: string): Promise<void> => {
  if (!hasConsent()) return;

  await logScreenViewEvent(getAnalytics(), {
    screen_name: screenName,
    screen_class: screenName,
  });
};

/**
 * 현재 동의 상태를 네이티브 SDK에 반영한다.
 *
 * logScreenView의 early return만으로는 부족하다. Firebase는 앱 시작·세션·화면 체류 등
 * 자동 수집 이벤트를 우리 코드를 거치지 않고 자체적으로 보내기 때문에, 수집 자체를
 * 네이티브 레벨에서 꺼야 한다.
 */
export const applyAnalyticsConsent = async (): Promise<void> => {
  await setAnalyticsCollectionEnabled(getAnalytics(), hasConsent());
};
