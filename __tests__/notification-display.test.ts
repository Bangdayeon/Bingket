import {
  formatNotificationTime,
  hasNotificationBody,
  notificationTitle,
} from '@/features/notifications/lib/notification-display';

const NOW = new Date('2026-09-09T12:00:00Z').getTime();
const ago = (ms: number) => new Date(NOW - ms).toISOString();

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe('formatNotificationTime', () => {
  it('일주일 안쪽은 상대 시각으로 쓴다', () => {
    expect(formatNotificationTime(ago(30 * 1000), NOW)).toBe('방금 전');
    expect(formatNotificationTime(ago(3 * MINUTE), NOW)).toBe('3분 전');
    expect(formatNotificationTime(ago(5 * HOUR), NOW)).toBe('5시간 전');
    expect(formatNotificationTime(ago(3 * DAY), NOW)).toBe('3일 전');
    expect(formatNotificationTime(ago(6 * DAY), NOW)).toBe('6일 전');
  });

  it('일주일이 넘으면 YY/MM/DD로 쓴다', () => {
    expect(formatNotificationTime(ago(8 * DAY), NOW)).toBe('26/09/01');
    expect(formatNotificationTime('2026-08-20T09:00:00', NOW)).toBe('26/08/20');
  });

  it('날짜가 아니면 빈 문자열', () => {
    expect(formatNotificationTime('nonsense', NOW)).toBe('');
  });
});

describe('notificationTitle', () => {
  it('타입마다 제목을 붙인다', () => {
    expect(notificationTitle('team_invite')).toBe('빙고 초대가 왔어요');
    expect(notificationTitle('like')).toBe('게시글에 좋아요가 달렸어요');
  });

  it('모르는 타입도 빈 화면이 되지 않는다', () => {
    expect(notificationTitle('나중에_생길_타입')).toBe('새 알림');
  });
});

describe('hasNotificationBody', () => {
  it('좋아요 알림은 제목만 그린다', () => {
    expect(hasNotificationBody('like', '누가 좋아요를 눌렀어요')).toBe(false);
    expect(hasNotificationBody('comment', '댓글이 달렸어요')).toBe(true);
    expect(hasNotificationBody('comment', '   ')).toBe(false);
  });
});
