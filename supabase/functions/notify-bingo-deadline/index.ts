import { createClient } from 'npm:@supabase/supabase-js@2';

/**
 * 빙고 마감 임박 알림 (Cron, 하루 1회).
 *
 * 푸시를 직접 보내지 않고 public.notifications 행만 INSERT 한다.
 * 그 INSERT 를 notify-generic 웹훅이 받아 푸시로 옮긴다.
 *
 * 예전에는 이 함수가 sendExpoPush 만 호출하고 행을 남기지 않아서,
 * 마감 알림만 유일하게 벨 목록과 안읽음 뱃지에 잡히지 않았다.
 * 알림 설정(bingo_deadline) 게이팅도 notify-generic 이 담당한다 --
 * 인앱 기록은 푸시 설정과 무관하게 남는 것이 맞다.
 */
interface BoardRow {
  id: string;
  user_id: string;
  title: string;
  target_date: string;
}

interface NotificationInsert {
  user_id: string;
  type: 'bingo_reminder' | 'bingo_dday';
  message: string;
  target_id: string;
  target_type: 'bingo_board';
}

const DAY_MS = 86_400_000;

Deno.serve(async (req) => {
  // Supabase Cron은 Authorization: Bearer {service_role_key} 로 호출
  const authHeader = req.headers.get('Authorization');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!authHeader || authHeader !== `Bearer ${serviceKey}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', serviceKey);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // D-10 / D-5 는 임박 알림, D-0 은 마감일 알림
  const checkPoints = [10, 5, 0];
  const dateToDaysLeft = new Map<string, number>();
  for (const daysLeft of checkPoints) {
    const dateStr = new Date(today.getTime() + daysLeft * DAY_MS).toISOString().split('T')[0];
    dateToDaysLeft.set(dateStr, daysLeft);
  }

  // 진행 중인 판만. 예전에는 'done' 도 포함돼 이미 끝낸 빙고에 "N일 남았어요" 가 갔다.
  const { data: boards, error: boardsError } = await supabase
    .from('bingo_boards')
    .select('id, user_id, title, target_date')
    .in('target_date', [...dateToDaysLeft.keys()])
    .eq('status', 'progress')
    .is('deleted_at', null)
    .returns<BoardRow[]>();

  if (boardsError) {
    console.error('[push] bingo_boards 조회 실패:', boardsError.message);
    return new Response(JSON.stringify({ ok: false }), { status: 500 });
  }

  if (!boards || boards.length === 0) {
    return new Response(JSON.stringify({ ok: true, inserted: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 크론이 하루에 두 번 돌아도 중복되지 않도록 오늘 이미 만든 행을 걸러낸다.
  // (D-10과 D-5는 5일 간격이라 날짜 범위로 구분된다)
  const { data: existing } = await supabase
    .from('notifications')
    .select('user_id, type, target_id')
    .in('type', ['bingo_reminder', 'bingo_dday'])
    .in(
      'target_id',
      boards.map((b) => b.id),
    )
    .gte('created_at', today.toISOString());

  const alreadySent = new Set((existing ?? []).map((n) => `${n.user_id}|${n.type}|${n.target_id}`));

  const rows: NotificationInsert[] = [];
  for (const board of boards) {
    const daysLeft = dateToDaysLeft.get(board.target_date);
    if (daysLeft === undefined) continue;

    const type = daysLeft === 0 ? 'bingo_dday' : 'bingo_reminder';
    if (alreadySent.has(`${board.user_id}|${type}|${board.id}`)) continue;

    const title = board.title.slice(0, 20);
    rows.push({
      user_id: board.user_id,
      type,
      message:
        daysLeft === 0
          ? `'${title}' 빙고의 마지막 날이에요!`
          : `'${title}' 빙고의 기간이 ${daysLeft}일 남았어요!`,
      target_id: board.id,
      target_type: 'bingo_board',
    });
  }

  if (rows.length === 0) {
    return new Response(JSON.stringify({ ok: true, inserted: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { error: insertError } = await supabase.from('notifications').insert(rows);

  if (insertError) {
    console.error('[push] 마감 알림 INSERT 실패:', insertError.message);
    return new Response(JSON.stringify({ ok: false }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true, inserted: rows.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
