import * as Sentry from '@sentry/react-native';
import { supabase } from '@/lib/supabase';
import i18n from '@/i18n';

export type BadgeType = 'cell' | 'like' | 'comment' | 'post';
export type BadgeLevel = 1 | 2 | 3 | 4;
export type BadgeKey = `${BadgeType}_${BadgeLevel}`;

async function getCount(userId: string, type: BadgeType): Promise<number> {
  if (type === 'cell') {
    const { data } = await supabase
      .from('user_stats')
      .select('total_cell_checks')
      .eq('user_id', userId)
      .single();

    return (data?.total_cell_checks as number | undefined) ?? 0;
  }

  if (type === 'like') {
    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    return count ?? 0;
  }

  if (type === 'comment') {
    const { count } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_deleted', false);

    return count ?? 0;
  }

  const { count } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_deleted', false);

  return count ?? 0;
}

export const checkAndAwardBadges = async (type: BadgeType, knownCount?: number): Promise<void> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: badges, error: badgesError } = await supabase
    .from('badges')
    .select('id, name, icon_url, threshold')
    .eq('category', type)
    .order('threshold', { ascending: true });

  if (badgesError) {
    Sentry.captureException(badgesError);
    return;
  }

  if (!badges || badges.length === 0) return;

  const badgeIds = badges.map((badge) => badge.id as string);

  const { data: earned, error: earnedError } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', user.id)
    .in('badge_id', badgeIds);

  if (earnedError) {
    Sentry.captureException(earnedError);
    return;
  }

  const earnedIds = new Set((earned ?? []).map((badge) => badge.badge_id as string));

  const count = knownCount ?? (await getCount(user.id, type));

  const toAward = badges.filter(
    (badge) => (badge.threshold as number) <= count && !earnedIds.has(badge.id as string),
  );

  if (toAward.length === 0) return;

  const { error: awardError } = await supabase.from('user_badges').insert(
    toAward.map((badge) => ({
      user_id: user.id,
      badge_id: badge.id,
    })),
  );

  if (awardError) {
    Sentry.captureException(awardError);
    return;
  }

  // 여러 뱃지를 동시에 획득하면 가장 높은 단계만 알림
  const topBadge = toAward[toAward.length - 1];
  const badgeKey = topBadge.name as BadgeKey;

  const name = i18n.t(`badge.${badgeKey}.name`);
  const message = i18n.t(`badge.${badgeKey}.message`);

  const notificationMessage = i18n.t('badge.notification', {
    name,
    message,
  });

  const { error: notificationError } = await supabase.from('notifications').insert({
    user_id: user.id,
    type: 'badge',
    message: notificationMessage,
    target_id: topBadge.id,
    target_type: 'badge',
  });

  if (notificationError) {
    console.warn('[push] 뱃지 알림 INSERT 실패', notificationError);

    Sentry.captureException(notificationError, {
      tags: { feature: 'push-notifications' },
    });
  }
};
