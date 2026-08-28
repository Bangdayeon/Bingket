# TODO — 푸시 알림 복구

> 2026-08-29 기준.
> 배경과 진단 근거는 [`docs/push-notification-handoff.md`](docs/push-notification-handoff.md),
> 배포·연결 절차는 [`supabase/functions/README.md`](supabase/functions/README.md) 참고.

## 지금 상태

| 항목                        | 상태                                          |
| --------------------------- | --------------------------------------------- |
| DB 마이그레이션             | ✅ `20260828000001` 까지 적용 완료            |
| 엣지 함수 4종               | ✅ 2026-08-28 재배포 완료                     |
| Database Webhook 3개 + Cron | ✅ 등록됨                                     |
| `push_tokens` 행            | ✅ 있음 — 토큰 발급까지는 정상                |
| **배포된 iOS 앱**           | ❌ 2026-05-29 아카이브 — 푸시 수정 **미포함** |
| **배포된 Android 앱**       | ❌ 2026-05-11 AAB — 푸시 수정 **미포함**      |
| Android FCM                 | ❌ 미설정 — 한 번도 동작한 적 없음            |

**서버는 끝났다. 남은 것은 진단 1건과 앱 빌드 배포다.**

---

## 1. 진단 — 왜 아직도 안 오는지 (2분, 빌드 불필요)

`push_tokens` 에 행이 있는데도 안 온다면 후보는 셋뿐이다. 아래 한 번으로 갈린다.

1. Supabase → `push_tokens` 에서 내 기기의 `token` 값을 복사
2. [expo.dev/notifications](https://expo.dev/notifications) 에 붙여넣고 전송
3. 응답 티켓을 본다

| 결과                  | 의미                           | 할 일                                                                        |
| --------------------- | ------------------------------ | ---------------------------------------------------------------------------- |
| 배너가 뜸             | 클라이언트·자격증명 정상       | 문제는 웹훅 경로 → **1-A** 로                                                |
| `InvalidCredentials`  | Expo 에 APNs 키가 없음         | expo.dev → 프로젝트 → Credentials → iOS → Push Notifications Key(.p8) 업로드 |
| `DeviceNotRegistered` | 저장된 토큰이 죽음 (재설치 등) | 앱에서 재로그인해 토큰을 다시 받고 재시도                                    |

> ⚠️ APNs 키 등록은 **빌드 방식과 무관하다.** 푸시를 Apple 에 실제로 보내는 주체가
> Expo 서버(`exp.host`)이기 때문이다. Xcode 로 빌드하든 EAS 로 빌드하든 똑같이 필요하다.
> `eas credentials` 는 빌드 명령이 아니라 자격증명 관리 도구일 뿐이고, expo.dev 웹에서도 된다.

### 1-A. 배너가 떴을 경우 — 웹훅 경로 확인

Supabase Dashboard → Edge Functions → `notify-generic` → Logs 에 **401** 이 찍히는지 본다.
찍힌다면 Database Webhook 의 HTTP Headers 에서 `Authorization: Bearer <service_role key>` 가
빠진 것이다. 빠지면 알림이 조용히 사라진다.

---

## 2. iOS 빌드 배포 (지금 바로 가능)

막혀 있는 것이 없다. `app.json` 의 `googleServicesFile` 은 Android 전용이라 iOS 에 영향 없고,
JS 수정은 빌드 시 번들되므로 prebuild 도 필요 없다. 기존 `ios/` 폴더 그대로 쓰면 된다.

- [ ] Xcode 에서 **build 번호 올리기** (1.0.7 build 1 이 이미 스토어에 있음)
- [ ] 평소대로 Archive → Organizer → App Store 업로드

> `ios/app/app.entitlements` 의 `aps-environment` 는 **건드리지 말 것.**
> Xcode Organizer 가 App Store 배포 프로파일로 재서명하며 entitlements 를 교체하므로
> 이 파일 값은 배포 결과에 영향이 없다. 손으로 `production` 으로 바꾸면 개발 프로파일과
> 불일치해 로컬 기기 실행 서명만 깨진다.

---

## 3. Android FCM 셋업 (사람이 콘솔에서 해야 함)

> ⚠️ **`google-services.json` 이 레포 루트에 없으면 `expo prebuild --platform android` 가 실패한다.**
> `app.json` 에 `android.googleServicesFile` 을 이미 넣어뒀기 때문이다.

- [ ] [Firebase 콘솔](https://console.firebase.google.com) → 프로젝트 → **Android 앱 추가**
      (패키지명 `com.day.bingket.app`) → `google-services.json` 다운로드 → **레포 루트에 저장** - 클라이언트 설정 파일이라 비밀값이 아니다. 커밋해도 된다.
- [ ] Firebase 콘솔 → 프로젝트 설정 → **서비스 계정** → 새 비공개 키 생성(JSON)
- [ ] [expo.dev](https://expo.dev) → 프로젝트 → Credentials → Android → **FCM V1 service account key** 업로드 - 이것 없이는 파일을 넣고 빌드해도 Android 푸시는 오지 않는다
- [ ] `npx expo prebuild --platform android` 로 `android/` 갱신 - `POST_NOTIFICATIONS` 권한도 이때 정식 반영된다 (지금은 로컬 매니페스트에 수동 추가해둔 상태)
- [ ] Android Studio 에서 versionCode 올리고 AAB 빌드 → Play Console 업로드

---

## 4. 검증 (새 빌드 설치 후)

**계정 2개 필수.** `notify-comment` / `notify-like` 는 자기 글에 자기가 단 댓글·좋아요를
의도적으로 스킵한다. 혼자 테스트하면 전부 정상이어도 아무것도 오지 않는다.

- [ ] 댓글 푸시 — A 글 → B 댓글 → **A** 도달
- [ ] **대댓글 푸시가 부모 댓글 작성자에게 가는가** (3인 필요: A 글, B 댓글, C 답글 → **B** 도달)
- [ ] 좋아요 푸시
- [ ] 인기글 푸시가 **정확히 1회** — 좋아요 취소 후 다시 눌러도 재발송 없어야 함
- [ ] 마감 알림이 **벨 목록에도 남는가** (`notify-bingo-deadline` 수동 호출로 확인)
- [ ] 알림 설정 OFF → 안 옴 → ON → 도달
- [ ] 푸시 탭 이동 — 백그라운드 / **완전 종료** 양쪽
- [ ] **푸시 없이 앱을 그냥 켰을 때 엉뚱한 화면으로 튀지 않는가**
- [ ] 로그아웃 → `push_tokens` 행 삭제 + 다른 계정 로그인 시 알림 설정이 섞이지 않는가

---

## 나중에 (이번 범위 밖)

- `push_tokens.user_id` 가 단독 PK → **유저당 기기 1대.** 두 번째 기기가 첫 기기를 조용히 밀어낸다.
  다기기 지원하려면 `(user_id, token)` 복합 PK 로 바꿔야 한다.
- Expo **push receipt** 미조회 + `DeviceNotRegistered` 토큰 미정리 → 죽은 토큰이 계속 쌓인다.
- `notifications` INSERT RLS 가 `auth.uid() is not null` 이라 **인증된 아무 유저나 타인에게
  임의 `type`/`message` 행을 넣을 수 있고**, `notify-generic` 웹훅이 그대로 푸시한다.
  (임의 푸시 주입 가능 — 보안 이슈)
- 웹훅 3개와 Cron 이 **대시보드에만 있다.** 레포에서 검증할 방법이 없으니
  `pg_cron` / `pg_net` 마이그레이션으로 코드화하는 게 낫다.
- `notification_settings.event_push` 는 UI 행만 있고 읽는 서버 코드가 없다.
- `types/notifications.ts` 는 DB·실제 코드와 맞지 않는 낡은 미사용 타입.
