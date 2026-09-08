import { createClient } from 'npm:@supabase/supabase-js@2';
import { serviceKey, verifyServiceRole } from '../_shared/auth.ts';
import { sendExpoPushToUser } from '../_shared/expo-push.ts';

/**
 * public.notifications INSERT 웹훅을 받아 푸시를 전송한다.
 *
 * 친구 요청 / 팀 빙고 / 뱃지 / 빙고 마감은 notifications 행만 INSERT 되고 푸시가
 * 전혀 나가지 않던 구멍을 이 함수가 메운다.
 *
 * 댓글·좋아요는 notify-comment / notify-like 가 보내므로 여기서 제외한다.
 * 통합하지 않는 이유는 **푸시 본문 때문**이다. notify-comment 는 댓글 내용을 배너에 싣지만
 * 이 함수는 notifications.message("OO님이 댓글을 달았어요") 밖에 모른다.
 *
 * popular 는 제외하지 않는다 -- notify-like 가 posts.like_count 로, DB 트리거가
 * COUNT(*) 로 각각 판정하던 이중 경로를 없애고, 트리거가 넣은 행 하나가 곧 푸시 하나가
 * 되도록 이쪽으로 일원화했다.
 *
 * 호출 경로는 대시보드 웹훅이 아니라 zz_dispatch_notification_push 트리거다
 * (20260830000003). 굳이 통합한다면 SKIPPED_TYPES 를 비우고 comments/likes 의
 * zz_dispatch_* 트리거를 지울 것. 둘 다 살아 있으면 중복 발송된다.
 */
const SKIPPED_TYPES = new Set(['comment', 'reply', 'like']);

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
  team_invite_declined: '🤝 함께하기 거절',
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
  // 호출자는 DB 트리거(pg_net) 또는 Cron 이다. 검증은 _shared/auth.ts 로 일원화했다
  const denied = verifyServiceRole(req);
  if (denied) return denied;

  const payload = (await req.json()) as WebhookPayload;
  if (payload.type !== 'INSERT') return new Response('ok');

  const notification = payload.record;
  if (SKIPPED_TYPES.has(notification.type)) return new Response('ok');

  const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', serviceKey());

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

  const title = TITLES[notification.type] ?? '빙킷';

  // 구버전 앱은 type/targetId 를 모르고 postId/boardId 로만 목적지를 판별한다.
  // (lib/push-notifications.ts 의 하위 호환 분기) 스토어 배포가 충분히 퍼질 때까지 함께 싣는다.
  const targetId = notification.target_id ?? '';
  const legacy: Record<string, string> = {};
  if (targetId) {
    if (notification.target_type === 'post') legacy.postId = targetId;
    if (notification.type === 'bingo_reminder' || notification.type === 'bingo_dday') {
      legacy.boardId = targetId;
    }
  }

  const sent = await sendExpoPushToUser(
    supabase,
    notification.user_id,
    title,
    notification.message,
    {
      type: notification.type,
      targetId,
      ...legacy,
    },
  );

  return new Response(JSON.stringify({ ok: true, sent }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
