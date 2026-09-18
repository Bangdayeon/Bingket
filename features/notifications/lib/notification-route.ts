import { router } from 'expo-router';

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
    (type === 'team_joined' ||
      type === 'team_finished' ||
      type === 'team_cell_checked' ||
      type === 'team_invite_declined') &&
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
