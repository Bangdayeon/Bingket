# Bingket

<img width="200" height="200" alt="splash-icon" src="https://github.com/user-attachments/assets/e37eca1f-011c-4618-8349-bdaf36cf8ccd" />

> 빙고판으로 목표를 세우고 커뮤니티에서 함께 이뤄가는 앱

- [랜딩페이지>>](https://bingket-landing.vercel.app/)
- [앱스토어>>](https://apps.apple.com/kr/app/%EB%B9%99%ED%82%B7-bingket/id6761634987)
- 구글플레이스토어 (준비중)

## 소개

- Bingket은 "빙고"라는 친숙한 게임 형식을 활용한 목표 달성 모바일 애플리케이션이에요.
- 빙고판 위에 목표를 배치하고 하나씩 달성해나가는 과정을 즐길 수 있어요.
- 친구와 함께 내기를 걸고 같이 대결할 수 있어요
- 커뮤니티를 통해 목표를 이뤄가는 과정을 공유하며 동기부여를 얻을 수 있어요.

## 핵심 기능

- **🎲 빙고판 만들기** — 3×3, 4×4 등 크기를 선택하고 목표 항목을 직접 작성
- **⭐ 달성 기록** — 목표 달성 시 완료 처리 및 날짜·메모 기록
- **👊 대결** — 친구와 빙고판을 공유하며 점수 내기
- **📢 커뮤니티** — 빙고판, 달성 후기, 자유게시판 형식으로 다른 유저와 공유

### 누구에게 추천하나요?

- 목표 관리 앱을 사용해봤지만 지속하기 어려웠던 경험이 있는 사람
- 일상에 소소한 성취감과 재미를 원하는 사람
- 혼자보다 함께할 때 더 잘 되는 사람

## 스크린샷

<img alt="Group 210" src="https://github.com/user-attachments/assets/a5894c65-45c3-4684-a883-445d28811db7" />

---

## 개발 방식

이 프로젝트는 AI 도구(Claude Code)를 적극 활용해 1인 개발로 진행했습니다.
디자인부터 코드 구현까지 AI와 협업하는 방식으로, 빠른 이터레이션과 실제 출시 가능한 품질을 동시에 추구합니다.

- **디자인** — Figma로 직접 설계, MCP를 통해 코드로 변환
- **플랫폼** — iOS / Android (준비중)

## 기술 스택

| 분류           | 기술                              |
| -------------- | --------------------------------- |
| Framework      | Expo ~55.0.6, React Native 0.83.2 |
| Language       | TypeScript (strict mode)          |
| Styling        | NativeWind 4.x (Tailwind CSS 3.x) |
| Navigation     | Expo Router (file-based routing)  |
| Backend        | Supabase (Auth, Database)         |
| Notifications  | Expo Notifications                |
| Error Tracking | Sentry                            |
| CI/CD          | GitHub Actions + EAS Build        |
| Distribution   | EAS (Expo Application Services)   |

## 디렉토리 구조

```
/
├── app/                    # Expo Router 페이지 & 레이아웃
│   ├── (auth)/             # 로그인, 회원가입 등 인증 화면
│   ├── (tabs)/             # 탭 기반 메인 화면
│   ├── bingo/              # 빙고 관련 화면 (추가, 수정, 조회, 배틀)
│   ├── community/          # 커뮤니티 화면 (목록, 작성, 상세)
│   ├── mypage/             # 마이페이지 화면
│   └── _layout.tsx         # 루트 레이아웃
├── assets/                 # 아이콘, 이미지, 폰트 등 정적 파일
├── components/             # 재사용 가능한 공용 UI 컴포넌트
├── features/               # 기능별 Vertical Slice 모듈
│   ├── auth/               # 인증 (OAuth, 세션)
│   ├── bingo/              # 빙고 생성·수정·조회 로직 및 컴포넌트
│   ├── community/          # 커뮤니티 로직 및 컴포넌트
│   ├── mypage/             # 마이페이지 로직 및 컴포넌트
│   └── onboarding/         # 온보딩 로직 및 컴포넌트
├── lib/                    # 공용 유틸리티
│   ├── supabase.ts         # Supabase 클라이언트 (Auth, Database)
│   ├── api.ts              # HTTP 클라이언트
│   └── push-notifications.ts # 푸시 알림
└── types/                  # 공유 TypeScript 타입
```
