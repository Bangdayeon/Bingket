import { createClient } from 'npm:@supabase/supabase-js@2';

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

async function sendExpoPush(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ to: token, title, body, data, sound: 'default' }),
  });
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

  // 자기 글에 자기 댓글 → 알림 없음
  if (post.user_id === comment.user_id) return new Response('ok');

  // 알림 설정 확인 (없으면 기본값 true 적용)
  const { data: settings } = await supabase
    .from('notification_settings')
    .select('community_comment')
    .eq('user_id', post.user_id)
    .single();

  if (settings && !settings.community_comment) return new Response('ok');

  // 푸시 토큰 조회
  const { data: tokenRow } = await supabase
    .from('push_tokens')
    .select('token')
    .eq('user_id', post.user_id)
    .single();

  if (!tokenRow?.token) return new Response('ok');

  // 댓글 작성자 이름 (익명이면 '익명')
  let authorName = '익명';
  if (!comment.is_anonymous) {
    const { data: commenter } = await supabase
      .from('users')
      .select('username')
      .eq('id', comment.user_id)
      .single();
    authorName = commenter?.username ?? '누군가';
  }

  const isReply = !!comment.parent_id;
  const title = isReply ? '💬 새 대댓글' : '💬 새 댓글';
  const body = `${authorName}: ${comment.content.slice(0, 60)}`;

  // 알림 DB 삽입은 DB 트리거(trg_notify_comment)가 처리 — 여기서는 푸시만 전송
  await sendExpoPush(tokenRow.token, title, body, { postId: comment.post_id });

  return new Response('ok');
});
