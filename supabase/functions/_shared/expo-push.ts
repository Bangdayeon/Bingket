import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

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

export interface SendResult {
  /** Expo 가 전송을 수락했으면 true */
  sent: boolean;
  /** 성공 티켓 id. receipt 조회용으로 보관한다 */
  ticketId: string | null;
  /** 실패 티켓의 details.error (DeviceNotRegistered | InvalidCredentials | ...) */
  errorCode: string | null;
}

/**
 * Expo Push API 로 알림 1건을 전송한다.
 *
 * 응답을 반드시 확인한다 -- 예전 구현은 fetch 결과를 버려서
 * DeviceNotRegistered / InvalidCredentials 같은 실패가 전혀 드러나지 않았다.
 * 실패는 console.error 로 남기며, Supabase Dashboard > Edge Functions > Logs 에서 확인할 수 있다.
 *
 * 호출부가 죽은 토큰을 지울 수 있도록 실패 코드와 티켓 id 를 함께 돌려준다.
 * 보통은 아래 sendExpoPushToUser 를 쓰면 되고, 이 함수를 직접 부를 일은 드물다.
 */
export async function sendExpoPush(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<SendResult> {
  const failure = (errorCode: string | null): SendResult => ({
    sent: false,
    ticketId: null,
    errorCode,
  });

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ to: token, title, body, data, sound: 'default' }),
    });

    if (!res.ok) {
      console.error(`[push] Expo API ${res.status}: ${await res.text()}`);
      return failure(null);
    }

    const json = (await res.json()) as ExpoPushResponse;

    if (json.errors?.length) {
      console.error('[push] Expo API errors:', JSON.stringify(json.errors));
      return failure(null);
    }

    const tickets = Array.isArray(json.data) ? json.data : json.data ? [json.data] : [];
    const failed = tickets.find((t) => t.status === 'error');

    if (failed) {
      // details.error 값: DeviceNotRegistered | MessageTooBig | MessageRateExceeded | MismatchSenderId | InvalidCredentials
      console.error(`[push] ticket error for token ${token}:`, JSON.stringify(failed));
      return failure(failed.details?.error ?? null);
    }

    return { sent: true, ticketId: tickets[0]?.id ?? null, errorCode: null };
  } catch (error) {
    console.error('[push] Expo API 요청 실패:', error);
    return failure(null);
  }
}

/**
 * 한 유저의 **모든 기기**로 보낸다.
 *
 * push_tokens 는 (user_id, token) 복합 PK 라 행이 여러 개일 수 있다 (20260830000002).
 * 예전 구현은 .single() 로 한 행만 읽어서, 기기가 둘이면 한쪽만 받았다.
 *
 * 겸사겸사 위생 처리도 여기서 한다.
 * - DeviceNotRegistered 티켓 → 그 토큰 행을 즉시 삭제 (앱 삭제/재설치로 죽은 토큰)
 * - 성공 티켓 → push_receipts 에 기록. 티켓이 ok 여도 실제 배달은 실패할 수 있고,
 *   그건 몇 분 뒤 receipt 에만 나온다. check-push-receipts 가 훑는다.
 *
 * @returns 한 대라도 전송에 성공했으면 true
 */
export async function sendExpoPushToUser(
  db: SupabaseClient,
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<boolean> {
  const { data: rows } = await db.from('push_tokens').select('token').eq('user_id', userId);
  const tokens = ((rows ?? []) as { token?: string }[])
    .map((r) => r.token)
    .filter((t): t is string => !!t);

  if (tokens.length === 0) return false;

  const results = await Promise.all(
    tokens.map(async (token) => ({ token, result: await sendExpoPush(token, title, body, data) })),
  );

  const dead = results.filter((r) => r.result.errorCode === 'DeviceNotRegistered');
  await Promise.all(
    dead.map(({ token }) =>
      db.from('push_tokens').delete().eq('user_id', userId).eq('token', token),
    ),
  );
  if (dead.length > 0) {
    console.error(`[push] DeviceNotRegistered 토큰 ${dead.length}건 삭제 (user ${userId})`);
  }

  const tickets = results
    .filter((r) => r.result.ticketId)
    .map((r) => ({ ticket_id: r.result.ticketId as string, token: r.token }));

  if (tickets.length > 0) {
    // 기록에 실패해도 푸시 자체는 이미 나갔다. 막지 않는다.
    await db.from('push_receipts').insert(tickets);
  }

  return results.some((r) => r.result.sent);
}
