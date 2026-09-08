# 푸시 알림 배포 · 연결 가이드

> 2026-08-30 갱신. 웹훅 3개와 Cron 은 **더 이상 대시보드에 있지 않다.**
> `supabase/migrations/20260830000003_push_pipeline_in_db.sql` 이 pg_net 트리거와
> pg_cron 잡으로 코드화했다. 이 문서에서 "대시보드에서 수동" 이라고 적혀 있던 절은 사라졌다.

## 1. 엣지 함수 배포

```bash
supabase functions deploy notify-comment
supabase functions deploy notify-like
supabase functions deploy notify-bingo-deadline
supabase functions deploy notify-generic
supabase functions deploy check-push-receipts
```

다섯 함수 모두 `Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}` 를 직접 검증하므로
`supabase/config.toml` 에서 `verify_jwt = false` 로 두었다.

## 2. 디스패치 키 (한 번만)

DB 트리거(pg_net)가 엣지 함수를 부를 때 실을 Bearer 다. **service_role 키가 아니다.**

> **왜 전용 키인가.** 예전에는 각 함수가 `SUPABASE_SERVICE_ROLE_KEY` 환경변수와
> 문자열 비교를 했다. 그런데 2026-08-30 확인 결과 이 프로젝트 런타임에 주입된 값이
> Management API 가 돌려주는 service_role 키와 **일치하지 않아서**, 올바른 키로 호출해도
> 전부 401 이었다. 호출자가 DB 트리거라 그 401 은 어디에도 드러나지 않는다.
> 플랫폼이 주입하는 이름에 기대지 않도록 우리가 발급한 키를 양쪽에 둔다.

같은 값이 **두 곳**에 있어야 한다. 어긋나면 함수가 401 을 낸다.

```bash
REF=$(cat supabase/.temp/project-ref)
DKEY=$(openssl rand -hex 32)

# 1) 엣지 함수 쪽
supabase secrets set PUSH_DISPATCH_KEY="$DKEY"

# 2) DB(Vault) 쪽 -- service_role 키로 RPC 1회
SRV=<Settings → API 의 service_role 키>
curl -sS -X POST "https://$REF.supabase.co/rest/v1/rpc/set_push_config" \
  -H "apikey: $SRV" -H "Authorization: Bearer $SRV" -H 'Content-Type: application/json' \
  -d "{\"p_url\":\"https://$REF.supabase.co\",\"p_key\":\"$DKEY\"}"
```

키 교체도 같은 순서로 하면 된다 (`set_push_config` 는 upsert).

확인 — 200 이면 인증과 DB 접근이 모두 정상이다:

```bash
curl -sS -X POST "https://$REF.supabase.co/functions/v1/check-push-receipts" \
  -H "Authorization: Bearer $DKEY" -d '{}'
# {"ok":true,"checked":0,"removed":0}
```

401 본문이 사유를 구분해 알려준다 -- `missing bearer token` / `no dispatch key configured` /
`key mismatch`. 예전처럼 무조건 `Unauthorized` 만 나오지 않는다.

## 3. 파이프라인 구조 (전부 마이그레이션 안에 있다)

```
comments      INSERT ─┬─ trg_notify_comment          → notifications 행
                      └─ zz_dispatch_comment_push    → notify-comment  (푸시)
likes         INSERT ─┬─ trg_notify_like             → notifications 행 (like / popular)
                      └─ zz_dispatch_like_push       → notify-like     (푸시)
notifications INSERT ── zz_dispatch_notification_push → notify-generic (푸시)
```

트리거 이름이 `zz_` 로 시작하는 이유는 Postgres 가 같은 이벤트의 트리거를 **이름 순서로**
실행하기 때문이다. 알림 행을 만드는 트리거가 먼저 돌아야 한다.

`notify-generic` 의 `SKIPPED_TYPES` 는 `comment` / `reply` / `like` 다. 이 셋은
`notify-comment` / `notify-like` 가 보낸다. 두 함수를 남겨둔 이유는 **푸시 본문 때문**이다.
`notify-comment` 는 `"홍길동: 오늘도 화이팅"` 처럼 댓글 내용을 배너에 싣는데,
`notify-generic` 은 `notifications.message`("홍길동님이 댓글을 달았어요") 밖에 모른다.
통합하면 이 정보가 사라진다.

### notify-generic 이 담당하는 것

`friend_request`, `badge`, `popular`,
`team_invite` / `team_joined` / `team_finished` / `team_cell_checked`,
`bingo_reminder` / `bingo_dday`.

`notify-bingo-deadline` 은 푸시를 직접 보내지 않고 `notifications` 행만 INSERT 하며,
실제 전송은 위 트리거를 통해 `notify-generic` 이 한다.
(예전에는 푸시만 보내고 행을 남기지 않아 마감 알림만 벨 목록에 뜨지 않았다)

## 3-1. Cron

`pg_cron` 잡 두 개도 같은 마이그레이션에 있다. `select * from cron.job;` 으로 확인한다.

| jobname                 | 스케줄 (UTC)   | 하는 일                                 |
| ----------------------- | -------------- | --------------------------------------- |
| `notify-bingo-deadline` | `0 15 * * *`   | KST 자정. D-10 / D-5 / D-0 알림 행 생성 |
| `check-push-receipts`   | `*/30 * * * *` | Expo receipt 조회 → 죽은 토큰 삭제      |

## 3-2. 적용 순서

기존 대시보드 웹훅·Cron 제거는 **마이그레이션이 직접 한다.** 사람이 먼저 지울 필요가 없다.
`20260830000003` 이 `supabase_functions.http_request` 를 부르는 트리거를
`comments` / `likes` / `notifications` 에서 찾아 지우고, 같은 트랜잭션에서 새 트리거를 만든다.
그래서 **알림이 두 번 가는 구간이 존재하지 않는다.**

```bash
supabase db push                       # 1. 마이그레이션
# 2. 위 "Vault 시크릿" 의 curl 1회
supabase functions deploy notify-comment notify-like notify-bingo-deadline notify-generic check-push-receipts
```

1번과 2번 사이에는 푸시가 나가지 않는다(인앱 알림 행은 정상 생성). 바로 이어서 할 것.

적용 후 확인:

```sql
select tgname from pg_trigger where tgname like 'zz_dispatch%';   -- 3건
select jobname, schedule from cron.job;                            -- 2건
select * from net._http_response order by created desc limit 5;    -- status_code 200
```

## 4. 클라이언트 자격증명 (코드 밖)

- **iOS APNs 환경 (`aps-environment`)** — EAS 로 빌드할 때만 신경 쓰면 된다.
  `expo-notifications` 플러그인의 `mode` 기본값이 `development` 이고 이 값이 entitlements 의
  `aps-environment` 가 된다. sandbox 토큰을 받으면 Expo 는 production APNs 로 보내므로
  전부 `BadDeviceToken` 이 된다. `app.config.ts` 가 `EAS_BUILD_PROFILE=production` 또는
  `APS_ENV=production` 일 때 `mode: 'production'` 을 주입한다.

  > **Xcode 아카이브 → Organizer 배포 방식에서는 이 설정이 무의미하다.** Xcode 가 App Store
  > 배포 프로파일로 재서명하면서 entitlements 를 그 프로파일 것으로 교체하기 때문이다.
  > (2026-05-29 아카이브는 개발 프로파일·`aps-environment: development` 로 빌드됐는데도
  > App Store 업로드에 성공했다) `ios/app/app.entitlements` 를 손으로 `production` 으로
  > 바꾸면 오히려 개발 프로파일과 불일치해 로컬 기기 실행 서명이 깨진다. **건드리지 말 것.**

- **Android FCM 셋업** (2026-08-29 진행 중, 아직 완료되지 않음)

  `app.json` 의 `android.googleServicesFile` 설정과 `POST_NOTIFICATIONS` 권한은 넣어뒀다.
  **`google-services.json` 파일이 레포 루트에 없으면 `expo prebuild --platform android` 가
  실패한다.** 남은 것은 사람이 콘솔에서 해야 하는 두 가지다.
  1. [Firebase 콘솔](https://console.firebase.google.com) → 프로젝트 → Android 앱 추가
     (패키지명 `com.day.bingket.app`) → `google-services.json` 다운로드 → **레포 루트에 저장**.
     이 파일은 클라이언트 설정이라 비밀값이 아니다. 커밋해도 된다.
  2. Firebase 콘솔 → 프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성(JSON) →
     [expo.dev](https://expo.dev) 프로젝트 → Credentials → Android → **FCM V1 service account key** 업로드.
     Expo 푸시 서비스가 이 키로 FCM 에 전송한다. 빌드를 로컬 Xcode/Gradle 로 하더라도
     **이 업로드는 반드시 필요하다** (전송 주체가 Expo 서버이기 때문).

  그 뒤 `npx expo prebuild --platform android` 로 `android/` 를 갱신하고 다시 빌드한다.

- **iOS APNs 키도 같은 이유로 Expo 에 등록돼 있어야 한다.**
  로컬 Xcode 로만 빌드해 왔다면 등록할 계기가 없었을 수 있다. `eas credentials --platform ios`
  로 Push Notifications Key(.p8) 유무를 확인할 것. 없으면 `getExpoPushTokenAsync` 가 throw 하고
  `push_tokens` 행이 아예 생기지 않는다 -- **푸시가 하나도 안 오는 가장 유력한 원인이다.**

## 5. 죽은 토큰 정리

`_shared/expo-push.ts` 의 `sendExpoPushToUser` 가 한 유저의 **모든 기기**로 보내고,
티켓이 `DeviceNotRegistered` 인 토큰은 그 자리에서 지운다.
티켓 단계에서 안 잡히는 실패는 `push_receipts` 에 기록해 두었다가
`check-push-receipts` Cron 이 Expo receipt 를 조회해 정리한다.

## 6. 디버깅

전 구간이 로그를 남기도록 고쳐두었다.

- 클라이언트 토큰 발급/저장 실패 → `console.warn('[push] ...')` + Sentry (`feature: push-notifications` 태그)
- 엣지 함수 전송 실패 → `console.error('[push] ...')`, Dashboard → Edge Functions → Logs 에서 확인.
  `DeviceNotRegistered` 는 앱 삭제/재설치로 죽은 토큰(자동으로 지워진다),
  `InvalidCredentials` 는 APNs/FCM 자격증명 문제다.
- DB → 엣지 함수 호출 실패 → Postgres Logs 의 `[push]` 경고,
  그리고 `select * from net._http_response order by created desc limit 20;`

문제가 어디서 끊겼는지 확인하는 순서:

1. `push_tokens` 테이블에 행이 있는가 → 없으면 클라이언트/자격증명 문제
2. [Expo Push Tool](https://expo.dev/notifications) 로 그 토큰에 직접 전송했을 때 오는가 → 오면 백엔드 경로 문제
3. `select * from net._http_response order by created desc limit 20;` 의 `status_code`
   → 401 이면 Vault 의 `service_role_key` 가 틀렸다. 행이 아예 없으면 트리거가 안 돈 것
4. Edge Functions 로그 확인
