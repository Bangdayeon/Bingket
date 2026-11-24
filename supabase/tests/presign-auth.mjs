// node supabase/tests/presign-auth.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';
(async () => {
  for (const endpoint of ['post-presign', 'r2-presign']) {
    let handler;
    let signed = 0;
    const code = ts.transpileModule(
      fs.readFileSync(`supabase/functions/${endpoint}/index.ts`, 'utf8'),
      {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
      },
    ).outputText;
    const context = {
      exports: {},
      Response,
      crypto: globalThis.crypto,
      Deno: {
        env: { get: () => 'test' },
        serve: (fn) => {
          handler = fn;
        },
      },
      require: (name) =>
        name.includes('supabase')
          ? {
              createClient: () => ({
                auth: {
                  getUser: async (token) => ({
                    data: { user: token === 'valid' ? { id: 'verified-user' } : null },
                    error: token === 'valid' ? null : new Error('Invalid token'),
                  }),
                },
              }),
            }
          : name.includes('presigner')
            ? {
                getSignedUrl: async () => {
                  signed++;
                  return 'signed';
                },
              }
            : {
                S3Client: class {},
                PutObjectCommand: class {
                  constructor(input) {
                    assert.ok(
                      input.Key.startsWith(endpoint === 'post-presign' ? 'posts/' : 'profiles/'),
                    );
                    if (endpoint === 'post-presign')
                      assert.ok(!input.Key.includes('verified-user'));
                  }
                },
              },
    };
    vm.runInNewContext(code, context);
    const invoke = (token) =>
      handler({
        method: 'POST',
        headers: new Headers(token ? { Authorization: `Bearer ${token}` } : {}),
        json: async () => ({ filename: 'test.jpg', contentType: 'image/jpeg' }),
      });
    for (const token of [null, 'forged', 'expired'])
      assert.equal((await invoke(token)).status, 401);
    assert.equal(signed, 0);
    assert.equal((await invoke('valid')).status, 200);
    assert.equal(signed, 1);
    console.log(`${endpoint}: auth checks passed`);
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
