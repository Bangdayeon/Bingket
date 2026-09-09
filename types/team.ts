/**
 * 팀 빙고 모드.
 *
 * 시안은 모드를 `함께하기`(shared) / `경쟁하기`(competition) 둘로 줄였다. 그래서 새로 만들 때는
 * `SELECTABLE_TEAM_MODES` 두 가지만 고를 수 있다. `copied`는 이미 만들어진 팀이 DB에
 * 남아 있어(`team_bingos.mode` 체크 제약에도 들어 있다) 표시용으로만 남겨 둔다.
 */
export type TeamMode =
  /** 한 판을 전원이 같이 채운다 */
  | 'shared'
  /** 각자 다른 내용을 채우고 겨룬다 */
  | 'competition'
  /** @deprecated 새로 만들 수 없다. 기존 팀을 그리기 위해서만 남아 있다. */
  | 'copied';

/** 새 팀을 만들 때 고를 수 있는 모드 */
export const SELECTABLE_TEAM_MODES = [
  'competition',
  'shared',
] as const satisfies readonly TeamMode[];

export type TeamStatus = 'waiting' | 'in_progress' | 'completed';

/** invited는 아직 팀원이 아니다. 순위·진행률 계산에서 제외된다. */
export type TeamMemberStatus = 'invited' | 'joined' | 'left';

export const TEAM_MAX_MEMBERS = 6;

/** 모드별 화면 문구 */
export const TEAM_MODE_LABEL: Record<TeamMode, string> = {
  shared: '함께하기',
  competition: '경쟁하기',
  copied: '같은 목표로',
};

export const TEAM_MODE_DESCRIPTION: Record<TeamMode, string> = {
  shared: '하나의 빙고판을 같이 채워요',
  competition: '각자 빙고를 작성하고 경쟁해요',
  copied: '같은 목표로 시작해 각자 자기 판을 채워요',
};

/** 제작·수락 화면 상단에 두 줄로 붙는 안내 */
export const TEAM_MODE_GUIDE: Record<TeamMode, string> = {
  shared:
    '빙고판 하나를 작성해서 친구들과 함께 완성해요\n칸 내용과 테마는 방장인 나만 수정할 수 있어요.',
  competition: '각자 빙고판을 작성해서 경쟁해요\n초대를 보내면 친구들도 각자 빙고를 작성해요',
  copied: '같은 목표로 시작해 각자 자기 판을 채워요',
};
