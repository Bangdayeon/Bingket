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
  textKey: string;
  shape: CoachMarkShape;
  route: CoachMarkRoute;
  passThrough?: boolean;
  fullScreen?: boolean;
}

export const COACH_MARK_STEPS: readonly CoachMarkStep[] = [
  {
    targetId: 'tab-home',
    textKey: 'coachmark.home',
    shape: 'circle',
    route: '/',
  },
  {
    targetId: 'tab-community',
    textKey: 'coachmark.community',
    shape: 'circle',
    route: '/',
  },
  {
    targetId: 'tab-mypage',
    textKey: 'coachmark.mypage',
    shape: 'circle',
    route: '/',
  },
  {
    targetId: 'home-create-bingo',
    textKey: 'coachmark.create',
    shape: 'rounded',
    route: '/',
    passThrough: true,
  },
  {
    targetId: 'add-info',
    textKey: 'coachmark.info',
    shape: 'rounded',
    route: '/bingo/add',
    fullScreen: true,
  },
  {
    targetId: 'add-temp-save',
    textKey: 'coachmark.tempSave',
    shape: 'rounded',
    route: '/bingo/add',
  },
];
