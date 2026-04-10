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

function decodeJwtPayload(token: string): Record<string, unknown> {
  const part = token.split('.')[1];
  if (!part) throw new Error('JWT 형식 오류');
  // base64url → base64 변환 후 디코딩
  const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  return JSON.parse(atob(padded));
}

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

  const token = authHeader.slice(7);

  let userId: string;
  try {
    const payload = decodeJwtPayload(token);
    if (typeof payload.sub !== 'string' || !payload.sub) {
      throw new Error('sub claim 없음');
    }
    userId = payload.sub;
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid token', detail: String(e) }), {
      status: 401,
    });
  }

  const body = (await req.json()) as { filename: string; contentType: string };

  const { filename, contentType } = body;

  const ext = filename.split('.').pop();
  const key = `profiles/${userId}/${crypto.randomUUID()}.${ext}`;

  const presignedUrl = await getSignedUrl(
    r2,
    new PutObjectCommand({
      Bucket: Deno.env.get('R2_BUCKET_NAME'),
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 60 },
  );

  return Response.json({ presignedUrl, key });
});
