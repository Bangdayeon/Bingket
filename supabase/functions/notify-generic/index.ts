import { createClient } from 'npm:@supabase/supabase-js@2';
import { sendExpoPush } from '../_shared/expo-push.ts';

/**
 * public.notifications INSERT 웹훅을 받아 푸시를 전송한다.
 *
 * 친구 요청 / 대결 요청·수락 / 뱃지는 지금까지 notifications 행만 INSERT 하고
 * 푸시를 전혀 보내지 않았다. 이 함수가 그 구멍을 메운다.
 *
 * 댓글·좋아요는 notify-comment / notify-like 웹훅이 이미 처리하므로 여기서 제외한다.
 * (두 웹훅을 걷어내고 이 함수 하나로 통합하고 싶다면 SKIPPED_TYPES 를 비우고
 *  notify-comment / notify-like 웹훅을 대시보드에서 삭제할 것. 둘 다 살아 있으면 중복 발송된다.)
 */
const SKIPPED_TYPES = new Set(['comment', 'reply', 'like', 'popular']);

interface NotificationRecord {
  id: string;
  user_id: string;
  type: string;
  message: string;
  target_id: string | null;
  target_type: string | null;
}

interface WebhookPayload {
  type: 'INSERT';
  table: string;
  record: NotificationRecord;
}

const TITLES: Record<string, string> = {
  friend_request: '👋 친구 요청',
  team_invite: '🤝 팀 빙고 초대',
  team_joined: '🤝 팀에 합류했어요',
  team_finished: '🏁 팀 빙고 종료',
  team_cell_checked: '✅ 팀원이 칸을 채웠어요',
  badge: '🏅 새 뱃지 획득!',
  bingo_reminder: '⏰ 빙고 기간 임박',
  bingo_dday: '⏰ 빙고 마감일',
  comment: '💬 새 댓글',
  reply: '💬 새 대댓글',
  like: '❤️ 좋아요',
  popular: '🔥 인기글 달성!',
};

/** 알림 타입별로 확인해야 할 notification_settings 컬럼 (없으면 항상 전송) */
const SETTING_COLUMNS: Record<string, string> = {
  bingo_reminder: 'bingo_deadline',
  bingo_dday: 'bingo_deadline',
  comment: 'community_comment',
  reply: 'community_comment',
  like: 'community_like',
  popular: 'community_popular',
  // 초대/종료는 놓치면 안 되는 알림이라 토글에 걸지 않는다
  team_joined: 'team_activity',
  team_cell_checked: 'team_activity',
};

Deno.serve(async (req) => {
  // Supabase Database Webhook은 Authorization: Bearer {service_role_key} 로 호출
  const authHeader = req.headers.get('Authorization');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!authHeader || authHeader !== `Bearer ${serviceKey}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const payload = (await req.json()) as WebhookPayload;
  if (payload.type !== 'INSERT') return new Response('ok');

  const notification = payload.record;
  if (SKIPPED_TYPES.has(notification.type)) return new Response('ok');

  const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', serviceKey);

  // 알림 설정 확인 (해당 타입에 대응하는 설정이 있을 때만)
  const settingColumn = SETTING_COLUMNS[notification.type];
  if (settingColumn) {
    const { data: settings } = await supabase
      .from('notification_settings')
      .select(settingColumn)
      .eq('user_id', notification.user_id)
      .single();

    // 설정 행이 없으면 허용 (다른 notify-* 함수와 동일한 정책)
    if (settings && !(settings as Record<string, boolean>)[settingColumn]) {
      return new Response('ok');
    }
  }

  const { data: tokenRow } = await supabase
    .from('push_tokens')
    .select('token')
    .eq('user_id', notification.user_id)
    .single();

  if (!tokenRow?.token) return new Response('ok');

  const title = TITLES[notification.type] ?? '빙킷';
  const sent = await sendExpoPush(tokenRow.token, title, notification.message, {
    type: notification.type,
    targetId: notification.target_id ?? '',
  });

  return new Response(JSON.stringify({ ok: true, sent }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
