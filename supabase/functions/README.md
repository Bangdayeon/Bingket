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

`friend_request`, `badge`, `popular`,
`team_invite` / `team_joined` / `team_finished` / `team_cell_checked`,
`bingo_reminder` / `bingo_dday`.

`comment` / `reply` / `like` 만 `notify-comment` · `notify-like` 웹훅이 처리하므로
`notify-generic/index.ts` 의 `SKIPPED_TYPES` 에서 제외된다.

`popular` 은 예전에 제외 목록에 있었다. 그때는 `notify-like` 가 `posts.like_count` 로,
DB 트리거는 `COUNT(*)` 로 각각 인기글을 판정해 같은 사건을 두 기준으로 다뤘다.
지금은 트리거가 넣은 행 하나를 이 함수가 푸시로 옮기는 단일 경로다.

`bingo_reminder` / `bingo_dday` 도 마찬가지다. `notify-bingo-deadline` 은 이제 푸시를
직접 보내지 않고 `notifications` 행만 INSERT 하며, 실제 전송은 이 함수가 한다.
(예전에는 푸시만 보내고 행을 남기지 않아 마감 알림만 벨 목록에 뜨지 않았다)

> **웹훅 하나로 통합하고 싶다면**: `SKIPPED_TYPES` 를 빈 Set 으로 바꾸고
> `notify_comment` · `notify_like` 웹훅을 대시보드에서 삭제한다.
> 둘 다 살아 있으면 댓글/좋아요 푸시가 **두 번** 간다.

## 3. Cron 연결 (`notify-bingo-deadline`)

Dashboard → Integrations → Cron 에서 매일 1회(예: `0 0 * * *`) `notify-bingo-deadline` 호출.
헤더에 `Authorization: Bearer <service_role key>` 필요.

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

## 5. 디버깅

전 구간이 로그를 남기도록 고쳐두었다.

- 클라이언트 토큰 발급/저장 실패 → `console.warn('[push] ...')` + Sentry (`feature: push-notifications` 태그)
- 엣지 함수 전송 실패 → `console.error('[push] ...')`, Dashboard → Edge Functions → Logs 에서 확인.
  `DeviceNotRegistered` 는 앱 삭제/재설치로 죽은 토큰, `InvalidCredentials` 는 APNs/FCM 자격증명 문제다.

문제가 어디서 끊겼는지 확인하는 순서:

1. `push_tokens` 테이블에 행이 있는가 → 없으면 클라이언트/자격증명 문제
2. [Expo Push Tool](https://expo.dev/notifications) 로 그 토큰에 직접 전송했을 때 오는가 → 오면 백엔드 경로 문제
3. Edge Functions 로그에 401 이 찍히는가 → 웹훅 Authorization 헤더 누락
