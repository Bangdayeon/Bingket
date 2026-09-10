/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');
const { LIGHT, DARK, FIXED } = require('./constants/color-tokens.cjs');

const toChannels = (hex) =>
  `${parseInt(hex.slice(1, 3), 16)} ${parseInt(hex.slice(3, 5), 16)} ${parseInt(hex.slice(5, 7), 16)}`;

/**
 * 색을 CSS 변수로 한 단계 돌려서 참조한다. Tailwind가 <alpha-value> 자리에 1이나
 * /50 같은 수식어 값을 채우고, NativeWind 런타임이 var를 현재 테마 값으로 푼다.
 * 덕분에 화면에 흩어진 bg-surface / text-gray-900 300여 곳을 한 줄도 안 고치고
 * 테마가 바뀐다.
 */
const ref = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

const varsFor = (palette) => ({
  '--c-surface': toChannels(palette.surface),
  '--c-white': toChannels(palette.white),
  '--c-black': toChannels(palette.black),
  '--c-scrim': toChannels(palette.scrim),
  '--c-danger': toChannels(palette.danger),
  '--c-danger-light': toChannels(palette.dangerLight),
  ...Object.fromEntries(
    Object.entries(palette.gray).map(([k, v]) => [`--c-gray-${k}`, toChannels(v)]),
  ),
  ...Object.fromEntries(
    Object.entries(palette.green).map(([k, v]) => [`--c-green-${k}`, toChannels(v)]),
  ),
});

const rampRefs = (ramp, prefix) =>
  Object.fromEntries(Object.keys(ramp).map((k) => [k, ref(`${prefix}-${k}`)]));

module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './features/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  // 'media'로 두면 .dark:root 블록이 조용히 무시되고 colorScheme.set이 throw한다.
  // RN에서는 .dark 클래스를 어디에도 붙일 필요가 없다.
  darkMode: 'class',
  theme: {
    fontFamily: {
      pretendard: ['Pretendard-Regular'],
      'pretendard-medium': ['Pretendard-Medium'],
      'pretendard-semibold': ['Pretendard-SemiBold'],
      'pretendard-bold': ['Pretendard-Bold'],
    },
    // extend가 아니라 theme.colors로 둬서 tailwind 기본 팔레트를 통째로 대체한다.
    // 시안 COLOR SYSTEM에 없는 색(blue-500 같은)은 아예 존재하지 않게 된다.
    colors: {
      transparent: 'transparent',
      surface: ref('surface'),
      white: ref('white'),
      black: ref('black'),
      // 모달·시트 딤. 투명도는 bg-scrim/70 처럼 수식어로 준다.
      scrim: ref('scrim'),
      danger: ref('danger'),
      'danger-light': ref('danger-light'),
      gray: rampRefs(LIGHT.gray, 'gray'),
      green: rampRefs(LIGHT.green, 'green'),
      // 테마 무관 고정색 — 변수를 거치지 않고 값을 그대로 쓴다.
      kakao: FIXED.kakao,
      'on-brand': FIXED.onBrand,
      'on-danger': FIXED.onDanger,
      'on-brand-dark': FIXED.onBrandDark,
      'on-social': FIXED.onSocial,
      'social-border': FIXED.socialBorder,
      'fixed-white': FIXED.fixedWhite,
      'fixed-black': FIXED.fixedBlack,
      'overlay-media': FIXED.overlayMedia,
    },
    textColor: ({ theme }) => ({
      ...theme('colors'),
      DEFAULT: theme('colors.gray.900'),
    }),
    extend: {
      // 자간은 제목에만 준다. 시안이 % (폰트 크기 대비)로 정의하지만 React Native는
      // pt 단위만 받으므로 `크기 × 0.07`로 환산해 적는다. 본문·라벨·캡션은 0 —
      // 한글은 음절마다 좌우 여백이 내장돼 있어 자간을 더 주면 한 단어 안에서
      // 글자가 밀려 보인다.
      fontSize: {
        // title
        'title-lg': ['24px', { lineHeight: '30px', letterSpacing: '1.68px', fontWeight: '500' }], // 7%
        'title-md': ['20px', { lineHeight: '24px', letterSpacing: '1.4px', fontWeight: '500' }], // 7%
        'title-sm': ['18px', { lineHeight: '24px', letterSpacing: '1.26px', fontWeight: '500' }], // 7%
        // body
        'body-md': ['16px', { lineHeight: '20px', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '18px', fontWeight: '400' }],
        // caption
        'caption-md': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'caption-sm': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        // label
        'label-sm': ['14px', { lineHeight: '18px', fontWeight: '600' }],
        'label-md': ['16px', { lineHeight: '20px', fontWeight: '600' }],
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({ ':root': varsFor(LIGHT), '.dark:root': varsFor(DARK) });
    }),
  ],
};
