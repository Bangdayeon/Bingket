export type TeamMode =
  | 'shared'
  | 'competition'
  /** @deprecated 새로 만들 수 없다. 기존 팀을 표시할 때만 사용한다. */
  | 'copied';

/** 새 팀을 만들 때 선택할 수 있는 모드 */
export const SELECTABLE_TEAM_MODES = [
  'competition',
  'shared',
] as const satisfies readonly TeamMode[];

export type TeamStatus = 'waiting' | 'in_progress' | 'completed';

/** invited는 아직 팀원이 아니다. 순위·진행률 계산에서 제외한다. */
export type TeamMemberStatus = 'invited' | 'joined' | 'left';

export const TEAM_MAX_MEMBERS = 6;

export const TEAM_MODE_LABEL_KEYS = {
  shared: 'team.mode.shared.label',
  competition: 'team.mode.competition.label',
  copied: 'team.mode.copied.label',
} as const satisfies Record<TeamMode, string>;

export const TEAM_MODE_DESCRIPTION_KEYS = {
  shared: 'team.mode.shared.description',
  competition: 'team.mode.competition.description',
  copied: 'team.mode.copied.description',
} as const satisfies Record<TeamMode, string>;

export const TEAM_MODE_GUIDE_KEYS = {
  shared: 'team.mode.shared.guide',
  competition: 'team.mode.competition.guide',
  copied: 'team.mode.copied.guide',
} as const satisfies Record<TeamMode, string>;
