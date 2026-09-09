# Project Context

이 expo, react-native 기반의 Self-care/wellness 모바일 어플리케이션입니다.
iOS, Android를 동시 지원합니다.
빙고형태로 일정 기간 동안 이룰 목표를 세우고, 커뮤니티에서 공유하며 목표를 이뤄갑니다.

- 팀 규모: 1명의 개발자.
- 디자인: https://www.figma.com/design/5mrk9YdQvH6ADvCurvyVlg/%EB%B9%99%EA%B3%A0%EC%95%B1?node-id=2-767&t=ltV9ihEvXzOPZluT-1

## Tech Stack

### Frontend

- Framework: Expo ~55.0.6, React Native 0.83.2
- Language: TypeScript (strict mode)
- Styling: NativeWind 4.x (Tailwind CSS 3.x for React Native)
- State: Zustand (미도입, 예정)
- Navigation: Expo Router (file-based routing)
- Monitoring: Sentry (미도입, 예정)

### Backend

- Runtime: Node.js
- API: (추가 예정)
- Database: (추가 예정)
- Auth: (추가 예정)

### DevOps

- Package Manager: pnpm (`node-linker=hoisted` — RN 오토링킹이 flat한 node_modules를 가정한다)
- CI/CD: GitHub Actions
- Distribution: EAS (Expo Application Services)

## Code Convention

### TypeScript

- `strict: true` 모드 필수
- `any` 타입 사용 금지 — `unknown` 또는 명시적 타입 사용
- 색상 토큰 아닌 색상값 사용 시, 해당 줄에 주석으로 토큰명 명시

### Naming

- Component: `PascalCase`
- Function / Hook: `camelCase`
- Constant: `UPPER_SNAKE_CASE`
- 파일명: 컴포넌트 파일은 컴포넌트명과 동일하게 `PascalCase.tsx`, 비컴포넌트 파일(hook, lib, types, utils)은 `kebab-case.ts`
- Hook 파일: `use-` prefix (e.g. `use-bingo-board.ts`)

### File Structure

- 파일당 하나의 주요 export
- Named export 선호 (`export default`는 Expo Router 페이지에서만 허용)
  - `components/`, `features/` 내부 컴포넌트도 반드시 named export 사용
- 관련 타입은 같은 파일에 정의
  - 특정 feature에서만 쓰이는 타입 → 해당 feature 폴더 내 파일에 정의
  - 여러 feature에서 공유되는 타입 → `types/` 폴더에 정의

### Styling

- Tailwind 유틸리티 클래스 사용 (`className` prop)
- `StyleSheet.create()` 또는 인라인 스타일 지양
- 플랫폼별 분기가 필요한 경우 `Platform.select()` 사용

### Import

- SVG 아이콘 import 패턴:
  ```ts
  import IconName from '@/assets/icons/icon-name.svg';
  ```
- 경로 alias: `@/` → 프로젝트 루트 (e.g. `@/components/Button`)

### 환경 변수

- `EXPO_PUBLIC_` prefix: 클라이언트에서 접근 가능한 변수 (번들에 포함됨)
- prefix 없음: 빌드/서버 전용 (클라이언트 코드에서 사용 금지)
- 예: `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SENTRY_DSN`

### AsyncStorage 키 네이밍

- `@bingket/key-name` 형태 사용
- 예: `@bingket/draft-bingo`, `@bingket/app-theme`

## Project Structure

```
/                         # 프로젝트 루트 (src/ 폴더 없음)
├── app/                  # Expo Router (페이지 & 레이아웃)
│   ├── (auth)/           # 로그인/회원가입 등 인증 관련 화면 그룹
│   ├── (tabs)/           # 탭 기반 메인 화면 그룹
│   ├── bingo/            # 홈화면 파생 화면 그룹
│   ├── mypage/           # 마이페이지 파생 화면 그룹
│   └── _layout.tsx       # 루트 레이아웃
├── assets/               # 아이콘, 이미지 등의 애셋
│   └── icons/            # SVG 아이콘 파일
├── components/           # 재사용 가능한 공용 UI 컴포넌트
├── constants/            # 색 토큰, 길이 상한, 캐시 키 등 상수
├── features/             # 기능별 모듈 (Vertical Slice)
│   ├── app-update/       # 강제 업데이트 게이트
│   ├── auth/             # 인증 관련 로직 (OAuth, 세션 등)
│   ├── bingo/            # 빙고 기능
│   │   ├── components/   # bingo feature 전용 컴포넌트
│   │   ├── bingo-edit/   # 추가·수정 화면이 함께 쓰는 컴포넌트
│   │   └── lib/          # bingo feature API 호출
│   ├── coachmark/        # 첫 사용 안내
│   ├── community/        # 커뮤니티 기능
│   ├── friend/           # 친구 검색·요청·목록
│   ├── mypage/           # 마이페이지 기능
│   ├── notifications/    # 알림 목록·안읽음 컨텍스트
│   ├── onboarding/       # 온보딩 기능
│   ├── profile/          # 내·타인 프로필과 피드
│   └── team/             # 같이하기(팀 빙고)
├── lib/                  # 공용 유틸리티 (HTTP 클라이언트, 날짜 포맷터 등)
├── mocks/                # 개발용 mock 데이터 (API 연동 후 제거)
├── store/                # Zustand 전역 상태 (미도입, 예정)
└── types/                # 여러 feature에서 공유하는 TypeScript 타입
```

## 아키텍처 패턴

### Vertical Slice Architecture

- 기능별로 `features/` 폴더 구성
- 각 기능은 독립적인 모듈 (컴포넌트, 훅, API 로직 함께 관리)
- API 호출은 `features/*/lib/*.ts`에 위치

### API 레이어

- HTTP 클라이언트: `lib/api.ts` (get/post/put/patch/delete)
- Feature별 API wrapper: `features/*/lib/*.ts`에서 `lib/api.ts`를 사용해 작성
- 예:
  ```ts
  // features/bingo/lib/bingo.ts
  import { api } from '@/lib/api';
  export const createBingo = (data: CreateBingoRequest) =>
    api.post<CreateBingoResponse>('/bingo', data);
  ```

### 상태 관리

- 로컬 상태: `useState`
- 전역 상태: Zustand (`store/`) — 미도입, 추후 도입 예정
  - draft 상태, auth 상태, theme 상태 등을 관리할 예정
  - 현재는 AsyncStorage + useState 혼용
- 서버 상태: React Query — 미도입, 추후 도입 예정
  - 현재는 화면마다 `useEffect` + `setLoading(true)`로 직접 조회한다.
    `react-hooks/set-state-in-effect` 경고 11건이 이 패턴이며, 도입 시 함께 사라진다.
- 네비게이션 상태: Expo Router (`useLocalSearchParams`)

### 네비게이션

- Expo Router 파일 기반 라우팅 사용
- 그룹 라우트: `(auth)`, `(tabs)` 등
- 동적 라우트: `[id].tsx` 패턴

## 보안 요구사항

### 인증 및 권한

- 모든 API 요청에 인증 토큰 포함
- JWT 토큰 유효성 검사 필수
- 민감 정보(토큰, 자격증명)는 `expo-secure-store` 사용 (`AsyncStorage` 금지)
- 비민감 정보(draft, theme 등)는 `AsyncStorage` 사용 가능

### RLS 정책과 함수 권한

- **RLS 정책 식에서 EXECUTE가 회수된 함수를 호출하지 말 것.**
  정책 식은 함수 본문과 달리 질의를 던진 롤 권한으로 평가된다. `is_friend_with`,
  `is_blocked_between`, `can_view_board`는 anon·authenticated에 EXECUTE가 없으므로
  (`20260812000002`) 정책에서 부르면 그 테이블 조회가 통째로 42501로 실패한다.
  SECURITY DEFINER 함수 _본문_ 안에서만 호출한다.
- 정책에 친구/차단 판정이 필요하면 헬퍼 대신 원본 테이블 인라인 서브쿼리를 쓴다.
  해당 테이블의 RLS가 이미 조회자 본인 행을 허용하므로 새 권한을 열지 않아도 된다
  (`20260909000004` 참고).

### 데이터 보호

- `.env` 파일 절대 커밋 금지
- API 키는 환경 변수 (`EXPO_PUBLIC_` prefix) 로만 관리
- 민감 데이터 로그 출력 금지
- 사용자 입력 항상 검증 (Zod 스키마 사용)

- `pnpm audit` 주기적 실행
- 의존성 자동 업데이트 (Dependabot 또는 Renovate)

## 플랫폼별 유의사항

### iOS

- Safe Area 처리: `react-native-safe-area-context` 필수
- 키보드 처리: `KeyboardAvoidingView` + `behavior="padding"`

### Android

- 키보드 처리: `KeyboardAvoidingView` + `behavior="height"`
- 상태바: `StatusBar` 컴포넌트로 명시적 제어
- Back 버튼: Expo Router가 자동 처리, 커스텀 필요 시 `useNavigation` 사용

## MCP (Model Context Protocol) 통합

우리 프로젝트는 다음 MCP 서버를 사용합니다:

- **github**: 이슈, PR, 커밋 관리
- **figma**: 디자인 파일 읽기 (design-to-code)

불필요하거나 기능 구현에 필요성이 불확실한 MCP 서버는 로드하지 마세요 (컨텍스트 낭비).
