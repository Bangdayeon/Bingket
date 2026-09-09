/**
 * 첫 실행 안내(코치마크)의 단계 정의.
 *
 * 좌표는 여기 없다. 어떤 컴포넌트를 가리킬지만 id로 적고, 실제 위치는 런타임에
 * CoachMarkTarget이 measureInWindow로 잰다. 그래야 탭바 여백이 바뀌든 빙고 목록이
 * 늘어나든 태블릿이든 안내가 알아서 따라간다.
 */

/**
 * 안내 대상. 유니온으로 묶어 둬야 FloatingTabBar나 BingoAll에서 id를 오타 내면
 * 컴파일이 깨진다 — 조용히 안내가 안 뜨는 것보다 낫다.
 */
export type CoachMarkTargetId =
  | 'tab-home'
  | 'tab-community'
  | 'tab-mypage'
  | 'home-create-bingo'
  | 'add-info'
  | 'add-temp-save';

export type CoachMarkShape = 'circle' | 'rounded';

/** 코치마크가 붙는 라우트. expo-router의 usePathname() 값과 그대로 비교한다. */
export type CoachMarkRoute = '/' | '/bingo/add';

export interface CoachMarkStep {
  targetId: CoachMarkTargetId;
  text: string;
  shape: CoachMarkShape;
  route: CoachMarkRoute;
  /**
   * 구멍 안 터치를 실제 UI로 통과시키는 단계. 사용자가 진짜 버튼을 눌러야 다음으로 간다.
   * 이 단계에는 '다음' 버튼을 두지 않는다 — 누를 게 이미 화면에 있다.
   */
  passThrough?: boolean;
  /**
   * 특정 요소가 아니라 화면 전체를 비춘다. 딤이 걷히고 안내 카드만 남는다.
   * 이 단계는 measureInWindow 결과를 기다리지 않으므로 targetId 가 실제로 화면에
   * 있지 않아도 된다 — 화면 하나를 통째로 설명할 때 쓴다.
   */
  fullScreen?: boolean;
}

/**
 * 알림 탭은 의도적으로 뺐다. 탭 넷을 다 설명하면 길고, 알림은 빨간 점이 알아서 유도한다.
 */
export const COACH_MARK_STEPS: readonly CoachMarkStep[] = [
  {
    targetId: 'tab-home',
    text: '홈에서는 현재 진행 중인 빙고를 확인하고 빙고를 체크할 수 있어요',
    shape: 'circle',
    route: '/',
  },
  {
    targetId: 'tab-community',
    text: '게시판에서는 앱을 사용하는 다른 사람들과 소통하고 빙고도 공유할 수 있어요',
    shape: 'circle',
    route: '/',
  },
  {
    targetId: 'tab-mypage',
    text: '내 공간에서는 완료, 임시저장, 진행중 빙고와 친구 목록을 확인할 수 있어요',
    shape: 'circle',
    route: '/',
  },
  {
    targetId: 'home-create-bingo',
    text: '우선 첫 빙고를 만들어볼까요?',
    shape: 'rounded',
    route: '/',
    passThrough: true,
  },
  {
    targetId: 'add-info',
    text: '빙고 정보를 입력해주세요',
    shape: 'rounded',
    route: '/bingo/add',
    fullScreen: true,
  },
  {
    targetId: 'add-temp-save',
    text: '아직 뭘 쓸지 고민된다면 임시저장을 하고 다음에 이어서 작성해도 돼요',
    shape: 'rounded',
    route: '/bingo/add',
  },
];
