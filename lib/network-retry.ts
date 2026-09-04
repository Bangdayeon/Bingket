/**
 * fetch가 던지는 "Network request failed"는 서버가 거절한 게 아니라
 * 대개 잠깐의 연결 끊김(백그라운드 전환, 셀룰러↔와이파이 전환, 지하철)이다.
 * 서버 응답을 받은 오류와 구분해서, 이런 오류만 짧게 재시도한다.
 */
export function isNetworkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /network request failed|failed to fetch|network error|aborted|timeout/i.test(message);
}

const RETRY_DELAYS_MS = [400, 1200];

/** 네트워크 오류일 때만 재시도한다. 그 외 오류는 즉시 그대로 던진다. */
export async function withNetworkRetry<T>(run: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await run();
    } catch (error) {
      if (attempt >= RETRY_DELAYS_MS.length || !isNetworkError(error)) throw error;
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
    }
  }
}
