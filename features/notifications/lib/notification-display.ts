import { t } from 'i18next';

const TITLE_KEYS = {
  bingo_reminder: 'notifications.title.bingoReminder',
  bingo_dday: 'notifications.title.bingoDday',
  team_invite: 'notifications.title.teamInvite',
  team_finished: 'notifications.title.teamFinished',
  comment: 'notifications.title.comment',
  reply: 'notifications.title.reply',
  like: 'notifications.title.like',
  friend_request: 'notifications.title.friendRequest',
  team_joined: 'notifications.title.teamJoined',
  team_invite_declined: 'notifications.title.teamInviteDeclined',
  team_cell_checked: 'notifications.title.teamCellChecked',
  badge: 'notifications.title.badge',
  popular: 'notifications.title.popular',
} as const;

type NotificationTitleType = keyof typeof TITLE_KEYS;

export const notificationTitle = (type: string): string => {
  const key = TITLE_KEYS[type as NotificationTitleType];

  return key ? t(key) : t('notifications.title.default');
};

const TITLE_ONLY_TYPES = new Set(['like']);

export const hasNotificationBody = (type: string, message: string): boolean =>
  Boolean(message?.trim()) && !TITLE_ONLY_TYPES.has(type);

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatNotificationTime(iso: string, now: number = Date.now()): string {
  const time = new Date(iso).getTime();

  if (Number.isNaN(time)) return '';

  const elapsed = now - time;

  if (elapsed < MINUTE) {
    return t('notifications.time.justNow');
  }

  if (elapsed < HOUR) {
    return t('notifications.time.minutesAgo', {
      count: Math.floor(elapsed / MINUTE),
    });
  }

  if (elapsed < DAY) {
    return t('notifications.time.hoursAgo', {
      count: Math.floor(elapsed / HOUR),
    });
  }

  if (elapsed < 7 * DAY) {
    return t('notifications.time.daysAgo', {
      count: Math.floor(elapsed / DAY),
    });
  }

  const date = new Date(time);
  const year = String(date.getFullYear()).slice(2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}/${month}/${day}`;
}
