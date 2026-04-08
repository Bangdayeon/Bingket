import { createClient } from 'npm:@supabase/supabase-js@2';

interface LikeRecord {
  post_id: string;
  user_id: string;
}

interface WebhookPayload {
  type: 'INSERT';
  table: string;
  record: LikeRecord;
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
  const authHeader = req.headers.get('Authorization');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!authHeader || authHeader !== `Bearer ${serviceKey}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const payload = (await req.json()) as WebhookPayload;
  if (payload.type !== 'INSERT') return new Response('ok');

  const like = payload.record;

  const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', serviceKey);

  // 게시글 + 좋아요 수 조회
  const { data: post } = await supabase
    .from('posts')
    .select('user_id, title, like_count')
    .eq('id', like.post_id)
    .single();

  if (!post) return new Response('ok');

  // 자기 글에 자기 좋아요 → 알림 없음
  if (post.user_id === like.user_id) return new Response('ok');

  // 알림 설정 + 푸시 토큰 병렬 조회
  const [{ data: settings }, { data: tokenRow }] = await Promise.all([
    supabase
      .from('notification_settings')
      .select('community_like, community_popular')
      .eq('user_id', post.user_id)
      .single(),
    supabase.from('push_tokens').select('token').eq('user_id', post.user_id).single(),
  ]);

  if (!tokenRow?.token) return new Response('ok');

  const inserts: Promise<unknown>[] = [];

  // 좋아요 알림 (매번)
  const likeEnabled = !settings || settings.community_like;
  if (likeEnabled) {
    inserts.push(
      sendExpoPush(
        tokenRow.token,
        '❤️ 좋아요',
        `내 게시글에 좋아요가 달렸어요: ${(post.title as string).slice(0, 40)}`,
        { postId: like.post_id },
      ),
    );
  }
  inserts.push(
    supabase.from('notifications').insert({
      user_id: post.user_id,
      type: 'like',
      message: `내 게시글에 좋아요가 달렸어요`,
      target_id: like.post_id,
      target_type: 'post',
    }),
  );

  // 인기글 알림 (정확히 10개 도달 시 1회)
  const popularEnabled = !settings || settings.community_popular;
  if (popularEnabled && (post.like_count as number) === 10) {
    inserts.push(
      sendExpoPush(tokenRow.token, '🔥 인기글 달성!', `내 게시글이 좋아요 10개를 받았어요 🎉`, {
        postId: like.post_id,
      }),
    );
  }
  if ((post.like_count as number) === 10) {
    inserts.push(
      supabase.from('notifications').insert({
        user_id: post.user_id,
        type: 'popular',
        message: `내 게시글이 인기글이 됐어요 🔥`,
        target_id: like.post_id,
        target_type: 'post',
      }),
    );
  }

  await Promise.all(inserts);

  return new Response('ok');
});
