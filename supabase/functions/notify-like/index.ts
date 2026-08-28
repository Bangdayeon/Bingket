import { createClient } from 'npm:@supabase/supabase-js@2';
import { sendExpoPush } from '../_shared/expo-push.ts';

/**
 * public.likes INSERT 웹훅을 받아 "좋아요" 푸시만 전송한다.
 *
 * 인기글(popular)은 여기서 보내지 않는다.
 * 예전에는 이 함수가 posts.like_count 를, DB 트리거는 COUNT(*) 를 각각 따로 판정해서
 * 같은 사건을 두 기준으로 다루고 있었다. 지금은 trg_notify_like 가 넣은
 * popular 행 하나를 notify-generic 웹훅이 푸시로 옮기는 단일 경로다.
 */
interface LikeRecord {
  post_id: string;
  user_id: string;
}

interface WebhookPayload {
  type: 'INSERT';
  table: string;
  record: LikeRecord;
}

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!authHeader || authHeader !== `Bearer ${serviceKey}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const payload = (await req.json()) as WebhookPayload;
  if (payload.type !== 'INSERT') return new Response('ok');

  const like = payload.record;

  const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', serviceKey);

  const { data: post } = await supabase
    .from('posts')
    .select('user_id, title')
    .eq('id', like.post_id)
    .single();

  if (!post) return new Response('ok');

  // 자기 글에 자기 좋아요 → 알림 없음
  if (post.user_id === like.user_id) return new Response('ok');

  // 알림 설정 + 푸시 토큰 병렬 조회
  const [{ data: settings }, { data: tokenRow }] = await Promise.all([
    supabase
      .from('notification_settings')
      .select('community_like')
      .eq('user_id', post.user_id)
      .single(),
    supabase.from('push_tokens').select('token').eq('user_id', post.user_id).single(),
  ]);

  if (!tokenRow?.token) return new Response('ok');

  // 설정 행이 없으면 허용 (다른 notify-* 함수와 동일한 정책)
  if (settings && !settings.community_like) return new Response('ok');

  // 알림 DB 삽입은 DB 트리거(trg_notify_like)가 처리 — 여기서는 푸시만 전송
  const sent = await sendExpoPush(
    tokenRow.token,
    '❤️ 좋아요',
    `내 게시글에 좋아요가 달렸어요: ${(post.title as string).slice(0, 40)}`,
    { type: 'like', targetId: like.post_id, postId: like.post_id },
  );

  return new Response(JSON.stringify({ ok: true, sent }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
