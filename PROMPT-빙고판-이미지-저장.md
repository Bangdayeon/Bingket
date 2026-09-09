# 작업 지시: 홈 빙고 카드에 "빙고판 이미지로 내보내기" 버튼 추가

> 다른 세션에서 이 파일 하나만 읽고 바로 착수할 수 있게 쓴 지시서다.
> 네이티브 의존성이 추가되므로 **개발 클라이언트 리빌드가 필요하다.**

---

## 무엇을 만드나

홈 화면 빙고 카드의 빙고판 우측 상단에 지금 **편집 아이콘** 하나가 있다.
그 **왼쪽에 저장 아이콘 버튼**을 하나 더 붙여서, 누르면 빙고판을 이미지로 캡처해
**시스템 공유 시트**를 띄운다. 사용자가 거기서 "이미지 저장"을 골라 갤러리에 넣는다.

결과적으로 판 우측 상단은 `[저장] [편집]` 두 개가 나란히 놓인다.

### 캡처 범위 (중요)

**빙고판 프레임만** 담는다:

- 빙고판 배경 이미지 (테마)
- 제목
- 각 칸의 텍스트
- 완료된 칸의 체크 오버레이 이미지 (있을 경우)

**빼야 하는 것**: 판 아래의 `달성 / 빙고 / 종료일` 스탯 행, 기간 텍스트(`26.08.29 - 27.08.29`),
팀 아바타, 그리고 **저장·편집 버튼 자신**.

---

## 왜 `expo-media-library`를 쓰면 안 되나

이 저장소는 Google Play 심사 때문에 사진 권한을 **의도적으로 걷어낸 이력**이 있다.

- 커밋 `b6d1fcc` "fix(android): 시스템 사진 선택 도구만 쓰도록 고쳐 Google Play 정책 위반 해소"
- 커밋 `754ed3c` "fix(android): 재심사 전 불필요한 민감 권한 차단하고 버전 올림"
- `app.json`의 `android.blockedPermissions`에 `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO`,
  `READ_MEDIA_AUDIO`, `READ_MEDIA_VISUAL_USER_SELECTED`가 명시돼 있다
- `lib/photo-library.ts`의 주석이 이 정책을 자세히 설명한다

`expo-media-library`는 매니페스트에 바로 그 권한들을 다시 선언한다.
**절대 추가하지 말 것.** 공유 시트 방식은 민감 권한이 전혀 필요 없어서 이 문제를 피한다.

---

## 의존성

```bash
npx expo install react-native-view-shot expo-sharing
```

- `react-native-view-shot` — 뷰를 PNG로 캡처 (`captureRef`)
- `expo-sharing` — 시스템 공유 시트 (`shareAsync`)

둘 다 네이티브 모듈이라 설치 후 **`npx expo run:android` / `run:ios`로 리빌드**해야 동작한다.
`app.json`의 `plugins` 배열에는 둘 다 등록이 **불필요**하다 (자동 링크됨).

---

## 손댈 파일

### 1. `features/bingo/components/BingoCard.tsx` — 버튼 추가 + 캡처 대상 지정

현재 구조 (2026-09 기준 줄 번호):

- `104`: `<View style={{ width: screenWidth, height: cardHeight }}>` ← **이게 캡처 대상**.
  여기에 `ref`를 단다.
- `119~122`: 편집 버튼

```text
{onEditPress && (
  <TouchableOpacity onPress={onEditPress} hitSlop={8}>
    <EditIcon width={18} height={18} color={fgColor} />
  </TouchableOpacity>
)}
```

할 일:

1. `const boardRef = useRef<View>(null);` 를 만들고 위 `104`번 `View`에 `ref={boardRef}` 를 단다.
2. 편집 버튼을 감싸는 자리에 **저장 버튼을 편집 버튼 왼쪽에** 넣는다.
   두 버튼은 `flex-row gap-3` 정도로 묶는다. 아이콘은 이미 있는 `@/assets/icons/ic_save.svg`
   를 쓰고, 크기·색은 편집 아이콘과 동일하게 (`width={18} height={18} color={fgColor}`).
3. 캡처 중에는 두 버튼을 숨겨야 이미지에 안 찍힌다.
   `const [capturing, setCapturing] = useState(false);` 를 두고 버튼 묶음에
   `style={{ opacity: capturing ? 0 : 1 }}` 를 준다.
   (`display:none`으로 지우면 레이아웃이 흔들리므로 opacity로 감춘다.)

### 2. `features/bingo/lib/share-board.ts` — 신규, 캡처 + 공유 로직

프로젝트 규칙상 API·부수효과 로직은 `features/*/lib/*.ts`에 둔다. 파일명은 kebab-case.

```ts
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import type { View } from 'react-native';
import type { RefObject } from 'react';

/**
 * 빙고판 영역만 PNG로 캡처해 시스템 공유 시트를 띄운다.
 * 갤러리 저장은 사용자가 공유 시트에서 직접 고른다 — 사진 권한을 요구하지 않기 위해서다.
 */
export async function shareBingoBoard(ref: RefObject<View | null>, title: string): Promise<void> {
  // 구현:
  // 1. await Sharing.isAvailableAsync() 확인, 안 되면 던진다
  // 2. captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' })
  // 3. Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: `${title} 빙고판` })
}
```

호출부(`BingoCard.tsx`)에서:

- 누르면 `setCapturing(true)` → 한 프레임 뒤 캡처 → `setCapturing(false)`
  (`requestAnimationFrame` 또는 `InteractionManager.runAfterInteractions`로 한 틱 미룰 것.
  안 미루면 버튼이 그대로 찍힌다.)
- 실패하면 `Sentry.captureException` 하고 사용자에게 `Toast`로 알린다
  (`components/Toast.tsx`가 이미 있다. 이 저장소는 실패를 조용히 삼키지 않는다).

---

## 주의할 점

- **빙고판 배경과 체크 오버레이가 원격 이미지**다 (`expo-image`, Supabase `bingo_themes`).
  아직 로딩 중이면 빈 판이 찍힌다. `image`/`checkImage` state가 `null`이면 저장 버튼을
  비활성(`disabled`)하거나 아예 그리지 않는다.
- `expo-image`는 `captureRef`와 궁합 문제가 보고된 적이 있다. 캡처 결과에 배경 이미지가
  안 나오면 해당 `Image`만 `react-native`의 기본 `Image`로 바꿔 보고, 그래도 안 되면
  `captureRef`의 `snapshotContentContainer: false`와 `result: 'tmpfile'` 조합을 확인한다.
- 캡처 크기는 화면 폭 기준이라 저해상도가 될 수 있다. `captureRef`에 `width`/`height`를
  넘겨 2배로 뽑는 것을 검토할 것 (예: `width: screenWidth * 2`).
- Android에서 `tmpfile`은 앱 캐시에 남는다. 공유 후 정리는 하지 않아도 OS가 회수하지만,
  신경 쓰인다면 `expo-file-system`으로 지운다 (새 의존성 추가 없이 이미 전이 의존성으로 있음).

---

## 이 저장소 규칙 (`.claude/rules/CLAUDE.md` 요약)

- TypeScript `strict`, **`any` 금지** — `unknown`이나 명시적 타입을 쓴다
- 컴포넌트는 **named export** (`export default`는 Expo Router 페이지 전용)
- 스타일은 NativeWind `className`. `StyleSheet.create()`와 인라인 스타일은 지양
  (동적 값·애니메이션 등 불가피한 경우만 `style`)
- **색은 토큰만 쓴다.** 현재 팔레트는 `gray-50~900`, `green-50~900`, `white(#FDFDFD)`,
  `surface(#FAFAFA)`, `danger(#CD5353)`, `danger-light(#FFCCCC)`, `black`, `kakao`가 전부다.
  토큰 아닌 값을 부득이 쓰면 그 줄에 주석으로 토큰명을 남긴다
- SVG 아이콘: `import SaveIcon from '@/assets/icons/ic_save.svg';`
- 주석은 한국어로, **무엇을 하는지가 아니라 왜 그렇게 했는지**를 쓴다

---

## 검증

```bash
npx tsc --noEmit && npm run lint && npx prettier --check . && npx jest
```

그리고 리빌드 후 실기기/에뮬레이터에서:

1. 홈에서 빙고 카드의 저장 버튼을 누른다
2. 공유 시트가 뜨고, 미리보기에 **제목 + 판 + 칸 텍스트 + 체크 이미지**가 보인다
3. 미리보기에 저장·편집 버튼이 **안 찍혀 있다**
4. 스탯 행·기간·팀 아바타가 **안 들어가 있다**
5. "이미지 저장"으로 갤러리에 들어간다
6. 완료된 칸이 있는 빙고와 없는 빙고 둘 다 확인한다
