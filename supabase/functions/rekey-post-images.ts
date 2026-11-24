// Server-side Deno script. Dry run by default; --apply copies and updates URLs.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { S3Client, CopyObjectCommand } from 'npm:@aws-sdk/client-s3@3';
const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);
const base = Deno.env.get('R2_PUBLIC_URL')!.replace(/\/$/, '');
const bucket = Deno.env.get('R2_BUCKET_NAME')!;
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${Deno.env.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID')!,
    secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY')!,
  },
});
for (let offset = 0; ; offset += 100) {
  const { data, error } = await admin
    .from('posts')
    .select('id,image_urls')
    .order('id')
    .range(offset, offset + 99);
  if (error) throw error;
  if (!data?.length) break;
  for (const post of data) {
    const original = post.image_urls as string[] | null;
    if (!original) continue;
    const urls = [...original];
    let changed = false;
    for (let index = 0; index < urls.length; index++) {
      const url = urls[index];
      if (!url.startsWith(base + '/posts/')) continue;
      const key = url.slice(base.length + 1);
      if (!/^posts\/[0-9a-f-]{36}\//i.test(key)) continue;
      changed = true;
      if (!Deno.args.includes('--apply')) continue;
      const next = `posts/${crypto.randomUUID()}.${key.split('.').pop()}`;
      await r2.send(
        new CopyObjectCommand({ Bucket: bucket, Key: next, CopySource: `${bucket}/${key}` }),
      );
      urls[index] = `${base}/${next}`;
    }
    if (changed && Deno.args.includes('--apply')) {
      const { data: updated, error } = await admin
        .from('posts')
        .update({ image_urls: urls })
        .eq('id', post.id)
        .eq('image_urls', JSON.stringify(original))
        .select('id');
      if (error || !updated?.length)
        throw new Error(`Concurrent change or update failure: ${post.id}`);
    }
    if (changed) console.log(post.id, Deno.args.includes('--apply') ? 'updated' : 'needs rekey');
  }
}
