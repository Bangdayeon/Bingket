# 푸시 알림 작업 인수인계

> 2026-08-13 작업분. 다른 컴퓨터에서 이어서 작업할 때 이 문서부터 읽을 것.
> 관련 문서: [`supabase/functions/README.md`](../supabase/functions/README.md) (배포·연결 절차)

## 한 줄 요약

iOS(TestFlight)에서 푸시 알림이 전혀 오지 않는 문제를 조사해 **코드 수정은 끝냈다.**
남은 것은 **배포 + 실기기 검증**이고, 아직 아무것도 검증되지 않았다.

## 현재 상태 (2026-08-28 갱신)

아래 세 줄은 2026-08-13 시점 기록이었고 그 뒤 전부 완료됐다. 확인 방법도 함께 적어둔다.

- Supabase 마이그레이션 적용: **완료** (`supabase migration list --linked`)
- 엣지 함수 배포: **완료** — 4종 모두 2026-08-18 (`supabase functions list`)
- Database Webhook 3개 + Cron: **완료** (대시보드)
- 실기기 검증: **아직 안 됨**

**그런데도 푸시가 오지 않는 진짜 이유는 따로 있었다.**
`eas build:list` 로 확인해 보면 **마지막 iOS 빌드가 2026-04-19 (v1.0.1 build 26, 커밋
`13f80f7`)** 다. 아래 수정이 담긴 커밋 `2def094` 는 2026-08-13 이므로,
**TestFlight 에 올라가 있는 앱에는 이 문서의 수정이 하나도 들어있지 않다.**
`app.config.ts` 조차 없으니 `aps-environment` 는 `development` 로 박혀 있고,
층위 1 가설(sandbox 토큰 → `BadDeviceToken`)이 그대로 성립한다.

8월 이후 빌드는 전부 **Android preview** 인데, Android 는 `google-services.json` 이 없어
`getExpoPushTokenAsync` 자체가 실패한다. 즉 **수정된 클라이언트가 담긴 빌드가 어느
플랫폼에도 존재한 적이 없다.** 검증의 첫 단계는 `eas build --profile production
--platform ios` 다.

---

## 무엇이 왜 안 됐나 (진단)

단일 버그가 아니라 여러 층이 겹쳐 있었고, 그 위에 **전 구간이 무음이라 원인 추적 자체가
불가능한** 구조가 얹혀 있었다.

### 층위 0 — 전 구간 무음 (가장 근본 문제)

| 위치                        | 문제                                                                    |
| --------------------------- | ----------------------------------------------------------------------- |
| `lib/push-notifications.ts` | `getExpoPushTokenAsync` 실패를 `catch { return null }` 로 완전히 삼켰다 |
| 〃                          | `savePushToken` 의 upsert `error` 를 확인하지 않았다                    |
| `app/_layout.tsx`           | `.then()` 만 있고 `.catch()` 가 없었다                                  |
| 엣지 함수 3종               | `sendExpoPush` 가 `fetch` 응답을 아예 읽지 않았다                       |

→ 어디서 끊겼는지 알 수 없었다. **이걸 먼저 뚫는 게 이번 작업의 핵심.**

### 층위 1 — iOS 최유력 원인: `aps-environment`

`expo-notifications` 플러그인의 `mode` 기본값이 `development` 이고, 이 값이 그대로 iOS
entitlements 의 `aps-environment` 가 된다
(`node_modules/expo-notifications/plugin/build/withNotificationsIOS.js` 에서 확인).

그 상태로 TestFlight 빌드를 올리면 앱이 **APNs sandbox 토큰**을 받는데, Expo 푸시 서비스는
production APNs 로 전송하므로 전량 `BadDeviceToken` 으로 실패한다. 층위 0 때문에 이 실패가
전혀 드러나지 않았다.

**이것이 TestFlight 증상을 가장 정확히 설명하는 가설이다. 아직 검증되지 않았다.**

두 번째 후보는 EAS 에 APNs Push Key(.p8) 가 아예 등록되지 않은 경우. 이 경우
`getExpoPushTokenAsync` 가 throw 해서 `push_tokens` 행이 생기지 않는다.

### 층위 2 — 토큰이 있어도 막히던 것들

1. **알림 설정 DB 기본값이 대부분 `false`**
   `bingo_deadline` / `community_popular` / `community_like` 의 DEFAULT 가 `false` 였다.
   알림 설정 화면에서 토글을 한 번만 건드려도 6개 값이 통째로 upsert 되므로, 사용자가 끈 적이
   없어도 이 3종은 OFF 로 고정 저장됐다.

2. **신규 유저에게 `notification_settings` 행을 만드는 곳이 없었다**
   `notify-bingo-deadline` 은 행이 없으면 스킵하는 정책이라 마감 알림이 전 유저 비활성이었다.
   (`notify-comment` / `notify-like` 는 반대로 "행 없으면 허용" 이라 정책도 불일치했다)

3. **친구 요청 / 대결 요청·수락 / 뱃지는 푸시 전송 코드가 아예 없었다**
   `notifications` 테이블에 행만 INSERT 하고 끝이었다.

4. **푸시를 탭해도 이동하지 않았다**
   `addNotificationResponseReceivedListener` 가 레포 어디에도 없어서
   `{ postId }` / `{ boardId }` 페이로드가 전부 버려졌다.

5. **로그아웃 시 토큰을 지우지 않았다**
   같은 기기에 다른 계정이 로그인하면 이전 계정 알림이 그 기기로 갔다.

### 정상 동작인데 오해하기 쉬운 것 ⚠️

`notify-comment` 와 `notify-like` 는 **자기 글에 자기가 단 댓글/좋아요를 의도적으로 스킵**한다.
혼자 테스트하면 모든 게 정상이어도 아무것도 오지 않는다. **반드시 계정 2개로 테스트할 것.**

---

## 이번에 수정한 것

### 클라이언트

| 파일                                               | 내용                                                                                                                                                                                                                                                                                      |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/push-notifications.ts`                        | 전면 개편. 실패를 `console.warn` + Sentry(`feature: push-notifications` 태그)로 기록. 반환 타입을 `ok`/`unsupported`/`denied`/`error` 로 구분. `EAS_PROJECT_ID` 하드코딩 제거하고 `expo-constants` 에서 읽음. `syncPushToken()`, `deletePushToken()`, `addNotificationTapListener()` 추가 |
| `app/_layout.tsx`                                  | 중복된 토큰 등록 블록을 `syncPushToken()` 으로 통합 + `.catch()`. 푸시 탭 리스너 등록 `useEffect` 추가                                                                                                                                                                                    |
| `features/notifications/lib/notification-route.ts` | **신규.** 알림 타입 → 화면 이동 매핑. 인앱 목록과 푸시 탭이 같은 코드를 쓴다                                                                                                                                                                                                              |
| `app/(tabs)/notifications.tsx`                     | 인라인 라우팅 로직을 위 모듈로 교체                                                                                                                                                                                                                                                       |
| `features/mypage/Setting.tsx`                      | 로그아웃 시 `deletePushToken()` 을 `signOut()` **전에** 호출 (RLS 가 `auth.uid()` 기반이라 세션이 끊긴 뒤엔 0행만 지워진다)                                                                                                                                                               |
| `features/mypage/lib/notification-settings.ts`     | 기본값을 전부 `true` 로(DB DEFAULT 와 일치). `fetch` 결과를 AsyncStorage 캐시에도 기록. upsert 에러를 throw                                                                                                                                                                               |
| `app/mypage/alert-setting.tsx`                     | 저장 실패 시 토글 롤백 + Toast                                                                                                                                                                                                                                                            |
| `lib/badge-checker.ts`                             | 클라이언트에서 직접 Expo API 호출하던 블록 제거 (서버가 처리)                                                                                                                                                                                                                             |
| `app.config.ts`                                    | **신규.** `EAS_BUILD_PROFILE === 'production'` 일 때 `mode: 'production'` 주입. `app.json` 은 그대로 단일 출처                                                                                                                                                                            |
| `app.json`                                         | 무효 키 `iosDisplayInForeground` 제거 → `defaultChannel`. `POST_NOTIFICATIONS` 권한 추가                                                                                                                                                                                                  |

### 백엔드

| 파일                                                                    | 내용                                                                                                    |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `supabase/functions/_shared/expo-push.ts`                               | **신규.** 3곳에 중복돼 있던 `sendExpoPush` 통합. Expo 티켓 응답을 검사해 실패를 `console.error` 로 기록 |
| `supabase/functions/notify-generic/index.ts`                            | **신규.** `notifications` INSERT 웹훅 → 친구 요청·대결·뱃지 푸시 전송                                   |
| `supabase/functions/notify-comment/index.ts`                            | 공용 헬퍼 사용. data 페이로드에 `type`/`targetId` 추가                                                  |
| `supabase/functions/notify-like/index.ts`                               | 〃                                                                                                      |
| `supabase/functions/notify-bingo-deadline/index.ts`                     | 〃 + 게이팅을 "행 없으면 허용" 으로 통일                                                                |
| `supabase/migrations/20260813000001_notification_settings_defaults.sql` | **신규.** DEFAULT 를 `true` 로, `public.users` INSERT 트리거로 설정 행 자동 생성, 기존 유저 백필        |
| `supabase/config.toml`                                                  | `notify-*` 4개 함수 항목 추가 (`verify_jwt = false`)                                                    |
| `supabase/functions/README.md`                                          | **신규.** 배포·웹훅·Cron 연결 절차                                                                      |

### 의도적으로 계획과 다르게 한 판단

원래 계획은 "웹훅을 `notify-generic` 하나로 통합" 이었으나, **이미 연결해둔
`notify-comment`/`notify-like` 웹훅을 살려두고 `notify-generic` 이 나머지 타입만 처리하는
추가 방식**을 택했다. 통합하려면 기존 웹훅 2개를 먼저 지워야 하는데, 순서가 틀리면 댓글/좋아요
알림이 두 번 간다.

`notify-generic/index.ts` 의 `SKIPPED_TYPES` 를 빈 Set 으로 바꾸고 대시보드에서 웹훅 2개를
지우면 통합 모드가 된다.

---

## 다음에 할 일 (순서대로)

### 0. 환경 준비

```bash
npm ci   # 다른 컴퓨터에는 node_modules 가 없다
```

### 1. 마이그레이션 적용 — ✅ 완료 (2026-08-28 재확인)

```bash
supabase db push
```

### 2. 엣지 함수 배포 — ✅ 완료 (재배포는 여전히 필요)

```bash
supabase functions deploy notify-comment
supabase functions deploy notify-like
supabase functions deploy notify-bingo-deadline
supabase functions deploy notify-generic
```

> 2026-08-28 의 로직 수정(`20260828000001_notification_fixes.sql` 과 함께)이 반영되려면
> **네 함수를 모두 다시 배포해야 한다.**

### 3. Database Webhook 추가 (대시보드) — ✅ 완료

`public.notifications` 의 INSERT → `notify-generic`.
HTTP Headers 에 `Authorization: Bearer <service_role key>` 필수. 빠지면 401 로 조용히 사라진다.

기존 `notify_comment` / `notify_like` 웹훅은 **그대로 둔다.**

### 4. iOS 자격증명 확인

```bash
eas credentials --platform ios
```

Push Notifications Key(.p8) 가 등록돼 있는지 본다. 없으면 이것이 단독 원인일 수 있다.

### 5. TestFlight 빌드

```bash
eas build --profile production --platform ios
```

`app.config.ts` 가 `EAS_BUILD_PROFILE=production` 일 때만 `aps-environment: production` 을
넣으므로 **반드시 `production` 프로파일로 빌드해야 한다.**

---

## 검증 순서

각 단계가 다음 단계의 전제다. 순서대로 할 것.

1. **`push_tokens` 에 행이 생기는가** ← 가장 중요한 분기점
   실기기 로그인 후 Supabase 대시보드에서 확인.
   - 없으면 → 클라이언트/자격증명 문제. Sentry 또는 Metro 콘솔의 `[push]` 로그에 실제 에러가
     찍혀 있다. `getExpoPushTokenAsync` 에러 문구로 APNs 문제인지 판별
   - 이 단계를 통과 못 하면 이후 검증은 무의미하다

2. **[Expo Push Tool](https://expo.dev/notifications) 로 그 토큰에 직접 전송**
   배너가 뜨면 클라이언트·자격증명은 정상이고 문제는 백엔드 경로에 있다.
   `BadDeviceToken` 이 나오면 `aps-environment` 가설이 맞은 것

3. **댓글 푸시** — 계정 A로 글 → 계정 B로 댓글 → A 기기 도달 (**계정 2개 필수**)
   안 오면 Dashboard → Edge Functions → `notify-comment` 로그 확인

4. **좋아요 푸시** — 계정 B로 좋아요 → A 기기 도달

5. **친구 요청 푸시** — `notify-generic` 이 동작하는지 확인

6. **알림 설정 반영** — 댓글 알림 OFF → 댓글 → 안 와야 함 → ON → 도달

7. **탭 이동** — 댓글 푸시 탭 → `/community/[id]` 진입.
   앱 백그라운드 상태와 **완전 종료 상태** 양쪽에서 확인

8. **로그아웃 정리** — 로그아웃 후 `push_tokens` 행이 지워졌는지 확인

9. **회귀** — `npm run lint`, `npx tsc --noEmit`, `npm test`

---

## 2026-08-30 후속 작업

이 문서에 "아직 손대지 않은 것" 으로 적어뒀던 항목 대부분을 처리했다. **코드만 됐고 아직
DB 에 적용하지 않았다** — 절차는 [`../supabase/functions/README.md`](../supabase/functions/README.md)
의 "3-2. 최초 적용 순서".

| 항목                            | 처리                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `notifications` INSERT RLS 구멍 | `20260830000001` — 타인 알림을 SECURITY DEFINER 트리거로 이관하고 정책을 `auth.uid() = user_id` 로 조임 |
| 유저당 기기 1대                 | `20260830000002` — `(user_id, token)` 복합 PK                                                           |
| 죽은 토큰 미정리                | 티켓의 `DeviceNotRegistered` 즉시 삭제 + `check-push-receipts` Cron 이 receipt 조회                     |
| 웹훅·Cron 이 대시보드에만 있음  | `20260830000003` — pg_net 트리거 3개 + pg_cron 잡 2개                                                   |
| `event_push`                    | 클라이언트 모델·UI 에서 제거 (DB 컬럼은 DEFAULT 로 유지)                                                |
| `types/notifications.ts`        | 삭제                                                                                                    |

### 서버 쪽 진짜 원인 2가지 (배포하면서 드러났다)

이 문서는 "배포된 앱이 낡아서" 를 단독 원인으로 지목했지만, 서버에도 두 개가 더 있었다.
둘 다 배포 과정에서 처음 드러났다.

**(1) `notify_generic` 웹훅은 등록된 적이 없다.**
`20260830000003` 의 정리 로직이 실제로 찾아 지운 것은 `notify-comment`, `notify-like`
둘뿐이었다. `public.notifications` 위의 웹훅은 존재하지 않았다.
이 문서와 `supabase/functions/README.md` 에 "✅ 완료" 로 적혀 있던 것이 사실이 아니었다.
→ **친구 요청 · 뱃지 · 팀 알림 · 빙고 마감 · 인기글은 전송 경로 자체가 없었다.**

**(2) 엣지 함수가 올바른 키로 호출해도 401 을 냈다.**
각 함수가 `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')` 와 문자열 비교를 했는데,
이 프로젝트 런타임에 주입된 값이 Management API 가 돌려주는 service_role 키와
**일치하지 않는다.** (2026-08-30 실측: 올바른 service_role 키로 호출 → 401)
웹훅이 제대로 걸려 있었더라도 댓글·좋아요 푸시는 401 로 끝났을 것이다.
호출자가 DB 트리거라 이 401 은 어디에도 드러나지 않는다 -- 이 문서가 "층위 0: 전 구간 무음"
이라고 부른 것과 정확히 같은 병이 인증 계층에도 있었다.

→ 전용 `PUSH_DISPATCH_KEY` 로 바꿨다. 401 본문이 이제 사유를 구분한다
(`missing bearer token` / `no dispatch key configured` / `key mismatch`).
자세한 절차는 `supabase/functions/README.md` "2. 디스패치 키".

**아직 확인 안 된 것:** DB 트리거의 `pg_net` 호출이 실제로 함수에 도달하는지.
확인하려면 실제 사용자 기기로 푸시가 나가야 해서 보류했다.

### 왜 RPC 가 아니라 트리거였나

친구 요청·팀 알림을 새 RPC 로 옮기면 **구버전 앱이 그 RPC 를 모른다.** 그러면 스토어에 있는
1.0.7 사용자끼리는 친구 요청 알림이 통째로 사라진다. 트리거는 원본 테이블
(`friend_requests` / `team_members` / `team_bingos` / `bingo_cells`)에 대한 쓰기에 반응하므로
구버전 앱도 그대로 동작한다. 구버전의 중복 INSERT 는 RLS 위반으로 실패하지만 호출부가
`throw` 하지 않고 Sentry 로그만 남기므로 화면은 멀쩡하다.

### 아직 손대지 않은 것

- **안드로이드 푸시는 여전히 동작하지 않는다.** `google-services.json` 이 레포에 없다.
  (`app.json` 의 `android.googleServicesFile` 설정과 `POST_NOTIFICATIONS` 권한은 넣어뒀다)
  expo.dev 에 FCM v1 서비스 계정 키 업로드도 필요하다.
- `bingo_boards` 레거시 RLS 조이기 — 강제 업데이트 게이트가 이걸 위해 만들어졌다.
  1.1.0 스토어 배포 → `app_config.min_version` 상향 → 그 다음이다.
