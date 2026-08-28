import { createClient } from 'npm:@supabase/supabase-js@2';
import { sendExpoPush } from '../_shared/expo-push.ts';

/**
 * public.comments INSERT 웹훅을 받아 댓글/대댓글 푸시를 전송한다.
 * 알림 DB 행은 DB 트리거(trg_notify_comment)가 넣는다 — 여기서는 푸시만 보낸다.
 *
 * 수신자 계산은 트리거와 반드시 동일해야 한다. 어긋나면 인앱 알림과 푸시가
 * 서로 다른 사람에게 간다. (supabase/migrations/20260828000001_notification_fixes.sql)
 */
interface CommentRecord {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  is_anonymous: boolean;
  parent_id: string | null;
  is_deleted: boolean;
}

interface WebhookPayload {
  type: 'INSERT';
  table: string;
  record: CommentRecord;
}

Deno.serve(async (req) => {
  // Supabase Database Webhook은 Authorization: Bearer {service_role_key} 로 호출
  const authHeader = req.headers.get('Authorization');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!authHeader || authHeader !== `Bearer ${serviceKey}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const payload = (await req.json()) as WebhookPayload;
  const comment = payload.record;

  // 삭제된 댓글이거나 타입이 INSERT가 아닌 경우 무시
  if (payload.type !== 'INSERT' || comment.is_deleted) {
    return new Response('ok');
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', serviceKey);

  // 게시글 작성자 조회
  const { data: post } = await supabase
    .from('posts')
    .select('user_id, title')
    .eq('id', comment.post_id)
    .single();

  if (!post) return new Response('ok');

  const isReply = !!comment.parent_id;

  // 대댓글은 부모 댓글 작성자에게 간다.
  // 부모 댓글이 이미 사라졌으면 글쓴이로 폴백 (트리거와 동일한 규칙)
  let notifyUserId = post.user_id as string;
  if (isReply) {
    const { data: parent } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', comment.parent_id as string)
      .single();
    notifyUserId = (parent?.user_id as string | undefined) ?? (post.user_id as string);
  }

  // 자기 글/자기 댓글에 스스로 단 것은 알림 없음
  if (notifyUserId === comment.user_id) return new Response('ok');

  // 알림 설정 확인 (없으면 기본값 true 적용)
  const { data: settings } = await supabase
    .from('notification_settings')
    .select('community_comment')
    .eq('user_id', notifyUserId)
    .single();

  if (settings && !settings.community_comment) return new Response('ok');

  // 푸시 토큰 조회
  const { data: tokenRow } = await supabase
    .from('push_tokens')
    .select('token')
    .eq('user_id', notifyUserId)
    .single();

  if (!tokenRow?.token) return new Response('ok');

  // 댓글 작성자 이름 (익명이면 '익명')
  // 트리거가 display_name 을 쓰므로 여기서도 display_name 이어야 한다
  // (예전에는 username 을 읽어 배너와 알림 목록에 다른 이름이 떴다)
  let authorName = '익명';
  if (!comment.is_anonymous) {
    const { data: commenter } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', comment.user_id)
      .single();
    authorName = (commenter?.display_name as string | undefined) ?? '누군가';
  }

  const title = isReply ? '💬 새 대댓글' : '💬 새 댓글';
  const body = `${authorName}: ${comment.content.slice(0, 60)}`;

  const sent = await sendExpoPush(tokenRow.token, title, body, {
    type: isReply ? 'reply' : 'comment',
    targetId: comment.post_id,
    postId: comment.post_id,
  });

  return new Response(JSON.stringify({ ok: true, sent }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
