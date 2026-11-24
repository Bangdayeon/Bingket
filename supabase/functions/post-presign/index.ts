import { createClient } from 'npm:@supabase/supabase-js@2';
import { S3Client, PutObjectCommand } from 'npm:@aws-sdk/client-s3@3';
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner@3';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${Deno.env.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID') ?? '',
    secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY') ?? '',
  },
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401 });
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const {
    data: { user },
    error,
  } = await admin.auth.getUser(authHeader.slice(7));
  if (error || !user) return new Response('Unauthorized', { status: 401 });

  const body = (await req.json()) as { filename: string; contentType: string };

  const { filename, contentType } = body;

  const ext = filename.split('.').pop();
  const key = `posts/${crypto.randomUUID()}.${ext ?? 'jpg'}`;

  const presignedUrl = await getSignedUrl(
    r2,
    new PutObjectCommand({
      Bucket: Deno.env.get('R2_BUCKET_NAME'),
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 120 },
  );

  return Response.json({ presignedUrl, key });
});
