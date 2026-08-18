import { router } from 'expo-router';

/**
 * 알림 타입/타겟에 따라 해당 화면으로 이동한다.
 * 인앱 알림 목록 탭과 푸시 알림 탭(터치) 양쪽에서 동일한 매핑을 쓰기 위해 분리했다.
 *
 * @returns 이동한 경우 true, 대응하는 화면이 없어 아무 것도 하지 않은 경우 false
 */
export const navigateToNotification = (type: string, targetId: string | null): boolean => {
  if (type === 'friend_request') {
    router.push('/mypage/friend-list');
    return true;
  }

  if (type === 'team_invite' && targetId) {
    router.push({ pathname: '/bingo/team-invite', params: { teamId: targetId } });
    return true;
  }

  if (
    (type === 'team_joined' || type === 'team_finished' || type === 'team_cell_checked') &&
    targetId
  ) {
    router.push({ pathname: '/bingo/team-status', params: { teamId: targetId } });
    return true;
  }

  if (
    (type === 'comment' || type === 'reply' || type === 'like' || type === 'popular') &&
    targetId
  ) {
    router.push(`/community/${targetId}`);
    return true;
  }

  if ((type === 'bingo_reminder' || type === 'bingo_dday') && targetId) {
    router.push({ pathname: '/bingo/view', params: { bingoId: targetId } });
    return true;
  }

  return false;
};
