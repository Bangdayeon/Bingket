import AsyncStorage from '@react-native-async-storage/async-storage';

const CONSENT_KEY = '@bingket/terms-agreed';

/**
 * 개인정보 수집·이용 동의 여부의 메모리 사본.
 *
 * Sentry의 `beforeSend`와 화면 조회 로깅은 동기 컨텍스트에서 호출되므로 그때그때
 * AsyncStorage를 읽을 수 없다. 앱 시작 시 `loadConsent()`로 한 번 읽어 여기에 담아두고
 * 이후에는 이 값만 본다.
 *
 * 기본값이 false이므로 "아직 모르면 수집하지 않는다"가 된다. 동의 화면
 * (features/auth/components/AgreementModal)이 뜨기 전에 Sentry와 Firebase Analytics가
 * 먼저 수집을 시작하던 문제를 막기 위한 것이다.
 */
let granted = false;

export const hasConsent = (): boolean => granted;

/** 저장된 동의 여부를 읽어 메모리 사본을 갱신한다. 실패하면 미동의로 취급한다. */
export const loadConsent = async (): Promise<boolean> => {
  try {
    granted = (await AsyncStorage.getItem(CONSENT_KEY)) === 'true';
  } catch {
    granted = false;
  }
  return granted;
};

export const grantConsent = async (): Promise<void> => {
  await AsyncStorage.setItem(CONSENT_KEY, 'true');
  granted = true;
};

export const revokeConsent = async (): Promise<void> => {
  await AsyncStorage.removeItem(CONSENT_KEY);
  granted = false;
};
