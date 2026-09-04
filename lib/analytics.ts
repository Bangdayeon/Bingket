import {
  getAnalytics,
  logScreenView as logScreenViewEvent,
} from '@react-native-firebase/analytics';

/**
 * async로 두어 getAnalytics()가 동기로 던지는 오류(네이티브 Firebase 앱 미초기화 등)도
 * rejected promise로 흘러가게 한다. 분석 실패가 앱을 멈추게 해서는 안 된다.
 */
export const logScreenView = async (screenName: string): Promise<void> => {
  await logScreenViewEvent(getAnalytics(), {
    screen_name: screenName,
    screen_class: screenName,
  });
};
