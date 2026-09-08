import { createClient } from 'npm:@supabase/supabase-js@2';
import { serviceKey, verifyServiceRole } from '../_shared/auth.ts';

/**
 * Expo push receipt 를 훑어 죽은 토큰을 정리한다. (Cron)
 *
 * 전송 직후에 나오는 **티켓**이 ok 여도 실제 배달은 실패할 수 있다. 그 결과는 몇 분 뒤
 * **receipt** 에만 나타난다. 티켓 단계에서 잡히는 DeviceNotRegistered 는
 * _shared/expo-push.ts 가 즉시 지우지만, 나머지 절반은 여기서만 잡힌다.
 *
 * 정리하지 않으면 앱을 지운 기기의 토큰이 계속 쌓이고, 매 알림마다 헛된 전송이 늘어난다.
 *
 * Expo 는 receipt 를 생성 후 약 24시간만 보관한다. 그보다 오래된 티켓 행은
 * 조회해봐야 결과가 없으므로 그냥 지운다.
 */
const RECEIPTS_URL = 'https://exp.host/--/api/v2/push/getReceipts';

/** Expo 가 한 번에 받는 최대 티켓 수 */
const CHUNK = 1000;

/** 한 번 실행에서 처리할 최대 티켓 수. Cron 이 30분마다 도므로 나머지는 다음 회차에 처리된다 */
const MAX_PER_RUN = 5000;

interface ExpoReceipt {
  status: 'ok' | 'error';
  message?: string;
  details?: { error?: string };
}

const chunked = <T>(items: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
};

Deno.serve(async (req) => {
  // 호출자는 DB 트리거(pg_net) 또는 Cron 이다. 검증은 _shared/auth.ts 로 일원화했다
  const denied = verifyServiceRole(req);
  if (denied) return denied;

  const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', serviceKey());

  // 24시간 지난 티켓은 Expo 에 receipt 가 남아 있지 않다. 조회 없이 정리한다.
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await supabase.from('push_receipts').delete().lt('created_at', cutoff);

  const { data: rows, error } = await supabase
    .from('push_receipts')
    .select('ticket_id, token')
    .order('created_at', { ascending: true })
    .limit(MAX_PER_RUN);

  if (error) {
    console.error('[push] push_receipts 조회 실패:', error);
    return new Response('error', { status: 500 });
  }

  const pending = (rows ?? []) as { ticket_id: string; token: string }[];
  if (pending.length === 0) {
    return new Response(JSON.stringify({ ok: true, checked: 0, removed: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const tokenOf = new Map(pending.map((r) => [r.ticket_id, r.token]));
  const deadTokens = new Set<string>();
  const settled: string[] = [];

  for (const batch of chunked(pending, CHUNK)) {
    const ids = batch.map((r) => r.ticket_id);

    const res = await fetch(RECEIPTS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ ids }),
    });

    if (!res.ok) {
      // 이번 회차만 건너뛴다. 행을 지우지 않으므로 다음 Cron 에서 재시도된다.
      console.error(`[push] getReceipts ${res.status}: ${await res.text()}`);
      continue;
    }

    const json = (await res.json()) as {
      data?: Record<string, ExpoReceipt>;
      errors?: { code: string; message: string }[];
    };

    if (json.errors?.length) {
      console.error('[push] getReceipts errors:', JSON.stringify(json.errors));
      continue;
    }

    // 아직 준비되지 않은 티켓은 응답에 없다. 그 행은 남겨두고 다음 회차에 다시 본다.
    for (const [ticketId, receipt] of Object.entries(json.data ?? {})) {
      settled.push(ticketId);
      if (receipt.status !== 'error') continue;

      const code = receipt.details?.error;
      console.error(`[push] receipt error ${ticketId}: ${code ?? receipt.message}`);
      if (code === 'DeviceNotRegistered') {
        const token = tokenOf.get(ticketId);
        if (token) deadTokens.add(token);
      }
    }
  }

  if (deadTokens.size > 0) {
    const { error: deleteError } = await supabase
      .from('push_tokens')
      .delete()
      .in('token', [...deadTokens]);
    if (deleteError) console.error('[push] 죽은 토큰 삭제 실패:', deleteError);
  }

  if (settled.length > 0) {
    for (const batch of chunked(settled, CHUNK)) {
      await supabase.from('push_receipts').delete().in('ticket_id', batch);
    }
  }

  console.log(
    `[push] receipts 확인 ${settled.length}건, DeviceNotRegistered 토큰 ${deadTokens.size}건 삭제`,
  );

  return new Response(
    JSON.stringify({ ok: true, checked: settled.length, removed: deadTokens.size }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});
