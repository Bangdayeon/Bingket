# Community privacy rollout

Nothing in this directory runs automatically with migrations.

1. Deploy migration `20261124010000_community_privacy.sql` and the updated `post-presign` / `r2-presign` Edge Functions. JWT verification is performed inside both functions with Auth `getUser`; do not substitute payload decoding.
2. Release the app using `community_posts`, `community_comments`, and `community_block_author`. Update the separate web lounge to use the same read RPCs. Anonymous user IDs are opaque per-thread tokens, not profile IDs; never use them for profile links.
3. With server-only credentials, run the one-time image rekey script: `deno run --allow-env --allow-net supabase/functions/rekey-post-images.ts`. This defaults to a dry run. Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, and `R2_PUBLIC_URL`. Add `--apply` only after reviewing the dry run. It copies old `posts/{userId}/...` objects to random paths and updates image URL arrays with a concurrent-update check. On any failure, stop and rerun after inspection. Original objects are retained; previously disclosed URLs cannot be made secret retrospectively by changing the DB.
4. After both stores offer the release and web migration is verified, set each platform's `app_config.min_version` to that release's actual version. Do not guess or hard-code a release number in this SQL.
5. Apply `community_privacy.sql` in this directory. This removes other-user direct post/comment reads and blocks reads of resolved block identities. Owner reads remain for editing, own posts and badge counts. Do not restore public reads as a rollback: that reopens identity exposure.
6. Validate guest/authenticated listing, detail, searching, anonymous replies, own edits/deletes, blocking, reporting, bingo attachment previews and badge counts on the deployed services.

Until step 5, old raw read paths remain exposed for compatibility. Until step 3, old post image URLs still contain author IDs. Existing profile images and user-provided text are not anonymized by this change.

## Checks

- `node supabase/tests/presign-auth.mjs` exercises the real handlers with a mocked Auth service: missing/invalid/expired token rejection and authenticated signing only. It does not replace integration testing against deployed Supabase Auth.
- `psql -v ON_ERROR_STOP=1 -f supabase/tests/community_privacy.sql` uses a **disposable empty DB only**. It builds a minimal schema and tests RPC masking, blocking, search filtering and cutover RLS. Do not run it on production.
- Run type checking and ESLint for the app. Deno functions are excluded from the app TypeScript project; validate their deployment separately.
