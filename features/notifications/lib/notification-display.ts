/**
 * 알림 목록의 제목과 시각 표기.
 *
 * 시안은 한 줄에 제목, 그 아래 본문을 그린다. 그런데 `notifications` 테이블에는
 * `message` 한 컬럼뿐이라 제목을 서버에서 받아올 수 없다. 기존 `message`를 본문으로 두고
 * 제목은 여기서 타입으로 만든다 (푸시 제목은 `supabase/functions/notify-generic`이 따로 갖고 있다).
 */
const TITLES: Record<string, string> = {
  bingo_reminder: '마감이 얼마 남지 않았어요',
  bingo_dday: '마감이 내일이에요',
  team_invite: '빙고 초대가 왔어요',
  team_finished: '빙고가 종료되었어요',
  comment: '게시글에 새로운 댓글이 달렸어요',
  reply: '게시글에 새로운 댓글이 달렸어요',
  like: '게시글에 좋아요가 달렸어요',
  // 아래 여섯 개는 시안에 없어 서버 푸시 제목을 문장으로 다듬어 썼다
  friend_request: '친구 요청이 왔어요',
  team_joined: '팀에 새로 합류했어요',
  team_invite_declined: '함께하기를 거절했어요',
  team_cell_checked: '팀원이 칸을 채웠어요',
  badge: '새 뱃지를 획득했어요',
  popular: '인기글이 되었어요',
};

export const notificationTitle = (type: string): string => TITLES[type] ?? '새 알림';

/** 시안: '좋아요'처럼 덧붙일 말이 없는 알림은 본문 없이 제목만 그린다. */
const TITLE_ONLY_TYPES = new Set(['like']);

export const hasNotificationBody = (type: string, message: string): boolean =>
  Boolean(message?.trim()) && !TITLE_ONLY_TYPES.has(type);

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * 시안: 최근이면 '3분 전' / '7일 전', 일주일이 넘으면 '26/09/03'.
 */
export function formatNotificationTime(iso: string, now: number = Date.now()): string {
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return '';

  const elapsed = now - time;
  if (elapsed < MINUTE) return '방금 전';
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}분 전`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}시간 전`;
  if (elapsed < 7 * DAY) return `${Math.floor(elapsed / DAY)}일 전`;

  const d = new Date(time);
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}/${mm}/${dd}`;
}
