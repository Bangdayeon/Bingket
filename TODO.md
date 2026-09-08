# TODO — 푸시 알림 복구 + 1.1.0 릴리스

> 2026-08-30 기준.
> 배경과 진단 근거는 [`docs/push-notification-handoff.md`](docs/push-notification-handoff.md),
> 배포·연결 절차는 [`supabase/functions/README.md`](supabase/functions/README.md) 참고.

## 지금 상태

| 항목                  | 상태                                                       |
| --------------------- | ---------------------------------------------------------- |
| 앱 버전               | 🔸 `1.1.0` / android `versionCode 31` (아직 미배포)        |
| DB 마이그레이션       | ✅ `20260830000004` 까지 적용 완료 (2026-08-30)            |
| 엣지 함수 5종         | ✅ 재배포 완료 (`check-push-receipts` 신규)                |
| 웹훅 · Cron           | ✅ pg_net 트리거 3개 + pg_cron 잡 2개로 코드화·적용 완료   |
| 디스패치 키           | ✅ `PUSH_DISPATCH_KEY` + Vault 양쪽 등록, 인증 200 확인    |
| 서버 파이프라인 종단  | 🔸 트리거→pg_net 구간만 미확인 (실기기 푸시가 필요해 보류) |
| `push_tokens` 행      | ✅ 25건                                                    |
| **배포된 iOS 앱**     | ❌ 2026-05-29 아카이브 — 푸시 수정 **미포함**              |
| **배포된 Android 앱** | ❌ 2026-05-11 AAB — 푸시 수정 **미포함**                   |
| Android FCM           | ❌ 미설정 — 한 번도 동작한 적 없음                         |

---

## 0. 2026-08-30 에 밝혀진 진짜 원인 2가지

푸시가 안 오던 이유는 "앱 빌드가 낡아서" 하나가 아니었다. 서버 쪽에도 두 개가 있었다.

### (1) `notify_generic` 웹훅은 **등록된 적이 없다**

마이그레이션의 정리 로직이 실제로 찾아 지운 웹훅은 `notify-comment`, `notify-like`
**둘뿐**이었다. `public.notifications` 위의 웹훅은 존재하지 않았다.
README 와 인수인계 문서에 "✅ 등록됨" 으로 적혀 있었지만 사실이 아니었다.

즉 **친구 요청 · 뱃지 · 팀 알림 · 빙고 마감 · 인기글은 전송 경로 자체가 없었다.**
행만 쌓이고 아무도 푸시로 옮기지 않았다.

### (2) 엣지 함수가 올바른 키로 호출해도 401 을 냈다

각 함수가 `SUPABASE_SERVICE_ROLE_KEY` 환경변수와 문자열 비교를 했는데, 이 프로젝트
런타임에 주입된 값이 Management API 가 돌려주는 service_role 키와 **일치하지 않는다.**
그래서 웹훅이 제대로 설정돼 있었더라도 `notify-comment` / `notify-like` 는 401 로
끝났을 것이다. 호출자가 DB 트리거라 이 401 은 어디에도 드러나지 않는다.

→ 전용 `PUSH_DISPATCH_KEY` 로 바꾸고, 401 본문이 사유를 구분하도록 고쳤다.
(`missing bearer token` / `no dispatch key configured` / `key mismatch`)

---

## 0-1. 남은 서버 검증 — 트리거 → pg_net 구간

여기까지 개별 확인된 것:

- 디스패치 키로 엣지 함수 호출 → `{"ok":true,"checked":0,"removed":0}` (200).
  함수의 DB 클라이언트도 정상이라는 뜻이다 (`push_receipts` 를 실제로 조회했다)
- 틀린 키 → 401 `key mismatch`
- Vault 주입 → 204

확인 안 된 것: **DB 트리거의 `pg_net` 호출이 실제로 함수에 도달하는가.**
확인하려면 `notifications` 에 행을 넣어야 하는데, 토큰이 있는 25명 중 누구에게
실제 푸시가 날아간다. 계정 주인을 특정하지 못해 보류했다.

Dashboard → SQL Editor 에서 직접 볼 수도 있다:

```sql
select tgname from pg_trigger where tgname like 'zz_dispatch%';   -- 3건
select jobname, schedule from cron.job;                            -- 2건
select status_code, created from net._http_response order by created desc limit 10;
```

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

- [ ] `ios/` 의 버전을 **1.1.0** 으로 맞추기 (`npx expo prebuild --platform ios` 또는 Xcode 에서 직접).
      `app.json` 은 이미 1.1.0 인데 기존 `ios/Info.plist` 는 아직 1.0.7 이다
- [ ] build 번호는 **1 그대로 둬도 된다** — Apple 은 같은 버전 문자열 안에서만 유일성을 요구한다
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
- [ ] AAB 빌드 → Play Console 업로드.
      `versionCode` 는 `app.json` 에 **31** 로 박아뒀으므로 prebuild 가 알아서 넣는다.
      (예전에는 `app.json` 에 이 값이 없어서 prebuild 가 `1` 로 리셋했다 — Play 가 거부한다)

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
- [ ] 로그아웃 → **이 기기의** `push_tokens` 행만 삭제 + 다른 계정 로그인 시 알림 설정이 섞이지 않는가
- [ ] 친구 요청 / 팀 초대 / 팀 합류 / 팀 종료 / 팀원 칸 체크 푸시가 **각각 1회씩** (트리거 이관 확인)
- [ ] 기기 2대에 같은 알림이 **양쪽 다** 도달 (다기기)
- [ ] 앱 삭제 후 `check-push-receipts` 1회 실행 → 죽은 토큰 행이 사라지는가
- [ ] 임의 푸시 주입이 막혔는가 —
      `insert into notifications (user_id, type, message) values ('<타인 uuid>','badge','x');`
      가 `42501` 로 거부돼야 한다

---

## 나중에 (이번 범위 밖)

- **1.1.0 이 충분히 퍼진 뒤** `app_config.min_version` 을 `1.1.0` 으로 올리고,
  그 다음에야 `bingo_boards` 레거시 RLS 정책을 조인다.
  (`20260812000002_bingo_visibility.sql` 헤더에 예고돼 있고 아직 안 됨. 지금은 공개범위가
  RPC 안에서만 강제되고 `from('bingo_boards').select()` 직접 조회는 그대로 뚫려 있다)
- 팀원 빙고판 조회가 아직 `bingo_boards` 를 직접 읽는다 → `get_team_boards` 로 이관
  (`20260826000001` 마무리 코멘트)
- `features/profile/lib/profile.ts` 의 `updateBoardVisibility` 는 호출부가 없다.

### 2026-08-30 에 처리됨

- ~~`push_tokens` 단독 PK (유저당 기기 1대)~~ → `20260830000002` 복합 PK
- ~~push receipt 미조회 / `DeviceNotRegistered` 미정리~~ → `check-push-receipts` + 즉시 삭제
- ~~`notifications` INSERT RLS 구멍 (임의 푸시 주입)~~ → `20260830000001`
- ~~웹훅·Cron 이 대시보드에만 있음~~ → `20260830000003`
- ~~`notification_settings.event_push` 가 UI 만 있음~~ → 클라이언트 모델·UI 에서 제거 (DB 컬럼은 유지)
- ~~`types/notifications.ts` 미사용 낡은 타입~~ → 삭제
