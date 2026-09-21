import i18n from '@/i18n';

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);

  if (m < 1) return i18n.t('board.timeAgo.justNow');
  if (m < 60) return i18n.t('board.timeAgo.minutesAgo', { count: m });
  const h = Math.floor(m / 60);
  if (h < 24) return i18n.t('board.timeAgo.hoursAgo', { count: h });
  const d = Math.floor(h / 24);
  if (d < 30) return i18n.t('board.timeAgo.daysAgo', { count: d });
  return i18n.t('board.timeAgo.monthsAgo', { count: Math.floor(d / 30) });
}
