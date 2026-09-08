import { createClient } from 'npm:@supabase/supabase-js@2';
import { DeleteObjectsCommand, ListObjectsV2Command, S3Client } from 'npm:@aws-sdk/client-s3@3';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${Deno.env.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID') ?? '',
    secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY') ?? '',
  },
});

/**
 * 탈퇴한 사용자의 프로필 이미지를 R2에서 지운다.
 *
 * 키가 `profiles/{userId}/{uuid}.{ext}` 형태(r2-presign)라 프리픽스로 전부 열거된다.
 * 게시글 이미지(`posts/{userId}/...`)는 지우지 않는다 — 게시글은 삭제가 아니라
 * 익명화되어 남으므로, 이미지를 지우면 남은 글에 깨진 이미지만 생긴다.
 */
async function deleteProfileImages(userId: string): Promise<void> {
  const bucket = Deno.env.get('R2_BUCKET_NAME');
  if (!bucket) throw new Error('R2_BUCKET_NAME 미설정');

  let continuationToken: string | undefined;

  do {
    const listed = await r2.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: `profiles/${userId}/`,
        ContinuationToken: continuationToken,
      }),
    );

    const keys = (listed.Contents ?? [])
      .map((object) => object.Key)
      .filter((key): key is string => typeof key === 'string');

    if (keys.length > 0) {
      await r2.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: keys.map((Key) => ({ Key })) },
        }),
      );
    }

    continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined;
  } while (continuationToken);
}

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response('Unauthorized - no header', { status: 401 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const adminClient = createClient(supabaseUrl, serviceKey);

  const token = authHeader.replace('Bearer ', '');

  const {
    data: { user },
    error: userError,
  } = await adminClient.auth.getUser(token);

  if (userError || !user) {
    return new Response('Unauthorized - invalid token', { status: 401 });
  }

  // 1. R2의 프로필 이미지 정리
  //    계정 삭제가 핵심이므로, 스토리지 정리가 실패해도 탈퇴 자체는 진행한다.
  //    (실패분은 로그를 보고 수동 정리)
  try {
    await deleteProfileImages(user.id);
  } catch (e) {
    console.error('profile image delete error:', e);
  }

  // 2. FK 걸린 데이터 먼저 삭제/정리
  await adminClient.from('notifications').delete().eq('user_id', user.id);

  await adminClient.from('comments').update({ user_id: null }).eq('user_id', user.id);

  await adminClient.from('posts').update({ user_id: null }).eq('user_id', user.id);

  await adminClient.from('bingo_boards').delete().eq('user_id', user.id);

  // 3. users 테이블 삭제
  const { error: userDeleteError } = await adminClient.from('users').delete().eq('id', user.id);

  if (userDeleteError) {
    console.error('users delete error:', userDeleteError);
    return new Response(userDeleteError.message, { status: 500 });
  }

  // 4. auth.users 삭제 (핵심)
  const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(user.id);

  if (authDeleteError) {
    console.error('auth delete error:', authDeleteError);
    return new Response(authDeleteError.message, { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
