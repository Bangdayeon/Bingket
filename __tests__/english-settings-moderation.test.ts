import i18next from 'i18next';
import en from '@/i18n/locales/en';
import ko from '@/i18n/locales/ko';

function leafKeys(value: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof child === 'string' ? [path] : leafKeys(child as Record<string, unknown>, path);
  });
}

describe('English settings and lounge translations', () => {
  const keys = [
    ...leafKeys(ko.settings, 'settings'),
    ...leafKeys(ko.board.moderation, 'board.moderation'),
    ...leafKeys(ko.board.post.attachment, 'board.post.attachment'),
    ...leafKeys(ko.board.post.bingo, 'board.post.bingo'),
  ];
  const translator = i18next.createInstance();

  beforeAll(async () => {
    await translator.init({ lng: 'en', resources: { en: { translation: en } } });
  });

  it.each(keys)('%s resolves to English', (key) => {
    const result = translator.t(key, key, { count: 12 });
    expect(result).not.toBe(key);
    expect(result).not.toMatch(/[가-힣]/);
    expect(result).not.toContain('{{');
  });

  it('uses the English labels at the reported call sites', () => {
    expect(translator.t('board.moderation.report.menu')).toBe('Report');
    expect(translator.t('board.moderation.block.menu')).toBe('Block');
    expect(translator.t('board.post.attachment.loadBingo')).toBe('Load bingo');
    expect(translator.t('settings.label')).toBe('Settings');
  });
});
