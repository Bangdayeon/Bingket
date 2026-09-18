export type CoachMarkTargetId =
  | 'tab-home'
  | 'tab-community'
  | 'tab-mypage'
  | 'home-create-bingo'
  | 'add-info'
  | 'add-temp-save';

export type CoachMarkShape = 'circle' | 'rounded';

export type CoachMarkRoute = '/' | '/bingo/add';

export interface CoachMarkStep {
  targetId: CoachMarkTargetId;
  text: string;
  shape: CoachMarkShape;
  route: CoachMarkRoute;
  passThrough?: boolean;
  fullScreen?: boolean;
}

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
