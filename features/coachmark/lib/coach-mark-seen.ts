import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 첫 실행 안내를 봤는지. lib/app-theme.ts와 같은 모양으로 키 상수 + load/save만 둔다.
 */
export const COACH_MARK_SEEN_KEY = '@bingket/coachmark-seen';

/**
 * 읽기가 실패하면 '봤다'로 친다.
 *
 * 반대로 하면 저장소가 고장난 기기에서 앱을 켤 때마다 안내가 다시 뜬다.
 * 안 본 사람이 한 번 놓치는 쪽이, 본 사람이 매번 시달리는 쪽보다 낫다.
 */
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
