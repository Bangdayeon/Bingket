const NICKNAME_WORDS = {
  ko: {
    adjectives: [
      '말랑한',
      '졸린',
      '신나는',
      '느긋한',
      '용감한',
      '수상한',
      '씩씩한',
      '조용한',
      '행복한',
      '엉뚱한',
      '포근한',
      '반짝이는',
    ],
    nouns: [
      '감자',
      '토끼',
      '해파리',
      '고양이',
      '병아리',
      '오리',
      '복숭아',
      '두부',
      '펭귄',
      '버섯',
      '수달',
      '다람쥐',
    ],
  },
  en: {
    adjectives: [
      'Squishy',
      'Sleepy',
      'Cheerful',
      'Chill',
      'Brave',
      'Curious',
      'Jolly',
      'Quiet',
      'Happy',
      'Silly',
      'Cozy',
      'Sparkly',
    ],
    nouns: [
      'Potato',
      'Bunny',
      'Jellyfish',
      'Kitten',
      'Chick',
      'Duck',
      'Peach',
      'Tofu',
      'Penguin',
      'Mushroom',
      'Otter',
      'Squirrel',
    ],
  },
} as const;

type NicknameLocale = keyof typeof NICKNAME_WORDS;

export function generateUsername(language: string): string {
  const locale: NicknameLocale = language.startsWith('ko') ? 'ko' : 'en';
  const { adjectives, nouns } = NICKNAME_WORDS[locale];

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];

  const noun = nouns[Math.floor(Math.random() * nouns.length)];

  return `${adjective} ${noun}`;
}
