export const CACHE_KEY_ALL = '@bingket/cache-bingo-all';

export const CACHE_KEY_PROFILE = '@bingket/cache-my-profile';
export const PROFILE_TTL = 1000 * 60 * 30; // 30분

/** 알림 설정 화면의 초기 렌더 깜빡임을 없애기 위한 캐시. 로그아웃/탈퇴 시 반드시 지운다 */
export const CACHE_KEY_ALERT_SETTINGS = '@bingket/alert-settings';
