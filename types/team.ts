/** 팀 빙고 모드 */
export type TeamMode =
  /** 한 판을 전원이 같이 채운다 */
  | 'shared'
  /** 같은 내용을 각자 복사해서 채운다 */
  | 'copied'
  /** 각자 다른 내용을 채운다 */
  | 'own';

export type TeamStatus = 'waiting' | 'in_progress' | 'completed';

/** invited는 아직 팀원이 아니다. 순위·진행률 계산에서 제외된다. */
export type TeamMemberStatus = 'invited' | 'joined' | 'left';

export const TEAM_MAX_MEMBERS = 6;

/** 모드별 화면 문구 */
export const TEAM_MODE_LABEL: Record<TeamMode, string> = {
  shared: '같이 채우기',
  copied: '같은 목표로',
  own: '다른 목표로',
};

export const TEAM_MODE_DESCRIPTION: Record<TeamMode, string> = {
  shared: '빙고판 하나를 친구들과 나눠서 완성해요',
  copied: '같은 목표로 시작해 각자 자기 판을 채워요',
  own: '서로 다른 목표를 세우고 대결해요',
};
