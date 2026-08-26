# 푸시 알림 배포 · 연결 가이드

레포에 코드만 있고 **배포·연결은 Supabase 대시보드에서 수동으로** 해야 하는 부분이 있어 여기에 정리한다.

## 1. 엣지 함수 배포

```bash
supabase functions deploy notify-comment
supabase functions deploy notify-like
supabase functions deploy notify-bingo-deadline
supabase functions deploy notify-generic
```

네 함수 모두 `Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}` 를 직접 검증하므로
`supabase/config.toml` 에서 `verify_jwt = false` 로 두었다.

## 2. Database Webhook 연결

Dashboard → Database → Webhooks

| 이름             | 테이블                 | 이벤트 | 대상 함수        |
| ---------------- | ---------------------- | ------ | ---------------- |
| `notify_comment` | `public.comments`      | INSERT | `notify-comment` |
| `notify_like`    | `public.likes`         | INSERT | `notify-like`    |
| `notify_generic` | `public.notifications` | INSERT | `notify-generic` |

HTTP Headers 에 반드시 `Authorization: Bearer <service_role key>` 를 넣어야 한다.
빠지면 함수가 401 을 반환하고 알림이 조용히 사라진다.

### notify-generic 이 담당하는 것

`friend_request`, `battle_request`, `battle_accepted`, `badge`, `bingo_reminder`, `bingo_dday`.
이 타입들은 지금까지 `notifications` 행만 INSERT 되고 푸시가 전혀 나가지 않았다.

`comment` / `reply` / `like` / `popular` 은 `notify-comment` · `notify-like` 웹훅이 이미
처리하므로 `notify-generic/index.ts` 의 `SKIPPED_TYPES` 에서 제외된다.

> **웹훅 하나로 통합하고 싶다면**: `SKIPPED_TYPES` 를 빈 Set 으로 바꾸고
> `notify_comment` · `notify_like` 웹훅을 대시보드에서 삭제한다.
> 둘 다 살아 있으면 댓글/좋아요 푸시가 **두 번** 간다.

## 3. Cron 연결 (`notify-bingo-deadline`)

Dashboard → Integrations → Cron 에서 매일 1회(예: `0 0 * * *`) `notify-bingo-deadline` 호출.
헤더에 `Authorization: Bearer <service_role key>` 필요.

## 4. 클라이언트 자격증명 (코드 밖)

- **iOS APNs 환경 (`aps-environment`)** — TestFlight 에서 알림이 안 오는 가장 유력한 원인.
  `expo-notifications` 플러그인의 `mode` 기본값이 `development` 라서, 그대로 TestFlight 빌드를
  올리면 앱이 APNs **sandbox** 토큰을 받는다. Expo 푸시 서비스는 production APNs 로 보내므로
  전부 `BadDeviceToken` 으로 실패한다. `app.config.ts` 에서 `EAS_BUILD_PROFILE === 'production'`
  일 때 `mode: 'production'` 을 주입하도록 고쳐두었다.
  **TestFlight 빌드는 반드시 `eas build --profile production` 으로 만들 것.**
- **iOS 자격증명**: `eas credentials --platform ios` → Push Notifications Key(.p8) 가 등록되어 있어야 한다.
  없으면 `getExpoPushTokenAsync` 가 throw 하고 `push_tokens` 행이 아예 생기지 않는다.
- **Android**: `google-services.json` 을 레포에 추가하고 `app.json` 에
  `"android": { "googleServicesFile": "./google-services.json" }` 를 설정한 뒤,
  EAS 에 FCM v1 서비스 계정 키를 업로드해야 한다. **현재 둘 다 없어 안드로이드 푸시는 동작하지 않는다.**

## 5. 디버깅

전 구간이 로그를 남기도록 고쳐두었다.

- 클라이언트 토큰 발급/저장 실패 → `console.warn('[push] ...')` + Sentry (`feature: push-notifications` 태그)
- 엣지 함수 전송 실패 → `console.error('[push] ...')`, Dashboard → Edge Functions → Logs 에서 확인.
  `DeviceNotRegistered` 는 앱 삭제/재설치로 죽은 토큰, `InvalidCredentials` 는 APNs/FCM 자격증명 문제다.

문제가 어디서 끊겼는지 확인하는 순서:

1. `push_tokens` 테이블에 행이 있는가 → 없으면 클라이언트/자격증명 문제
2. [Expo Push Tool](https://expo.dev/notifications) 로 그 토큰에 직접 전송했을 때 오는가 → 오면 백엔드 경로 문제
3. Edge Functions 로그에 401 이 찍히는가 → 웹훅 Authorization 헤더 누락
