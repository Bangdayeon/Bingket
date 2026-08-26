const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

interface ExpoPushResponse {
  data?: ExpoPushTicket | ExpoPushTicket[];
  errors?: { code: string; message: string }[];
}

/**
 * Expo Push API 로 알림 1건을 전송한다.
 *
 * 응답을 반드시 확인한다 -- 예전 구현은 fetch 결과를 버려서
 * DeviceNotRegistered / InvalidCredentials 같은 실패가 전혀 드러나지 않았다.
 * 실패는 console.error 로 남기며, Supabase Dashboard > Edge Functions > Logs 에서 확인할 수 있다.
 *
 * @returns 전송이 수락됐으면 true
 */
export async function sendExpoPush(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<boolean> {
  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ to: token, title, body, data, sound: 'default' }),
    });

    if (!res.ok) {
      console.error(`[push] Expo API ${res.status}: ${await res.text()}`);
      return false;
    }

    const json = (await res.json()) as ExpoPushResponse;

    if (json.errors?.length) {
      console.error('[push] Expo API errors:', JSON.stringify(json.errors));
      return false;
    }

    const tickets = Array.isArray(json.data) ? json.data : json.data ? [json.data] : [];
    const failed = tickets.filter((t) => t.status === 'error');

    if (failed.length > 0) {
      // details.error 값: DeviceNotRegistered | MessageTooBig | MessageRateExceeded | MismatchSenderId | InvalidCredentials
      console.error(`[push] ticket error for token ${token}:`, JSON.stringify(failed));
      return false;
    }

    return true;
  } catch (error) {
    console.error('[push] Expo API 요청 실패:', error);
    return false;
  }
}
