import AsyncStorage from '@react-native-async-storage/async-storage';

export const COACH_MARK_SEEN_KEY = '@bingket/coachmark-seen';

export async function loadCoachMarkSeen(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(COACH_MARK_SEEN_KEY)) !== null;
  } catch {
    return true;
  }
}

export async function saveCoachMarkSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(COACH_MARK_SEEN_KEY, '1');
  } catch {
    // 못 써도 안내는 이미 끝났다. 다음 실행에 한 번 더 뜨는 게 전부라 삼킨다.
  }
}
