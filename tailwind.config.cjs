/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './features/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  darkMode: 'media',
  theme: {
    fontFamily: {
      pretendard: ['Pretendard-Regular'],
      'pretendard-medium': ['Pretendard-Medium'],
      'pretendard-semibold': ['Pretendard-SemiBold'],
      'pretendard-bold': ['Pretendard-Bold'],
      'pretendard-extrabold': ['Pretendard-ExtraBold'],
    },
    // extend가 아니라 theme.colors로 둬서 tailwind 기본 팔레트를 통째로 대체한다.
    // 시안 COLOR SYSTEM에 없는 색(blue-500 같은)은 아예 존재하지 않게 된다.
    colors: {
      transparent: 'transparent',
      black: '#000000',
      white: '#FDFDFD',
      surface: '#FAFAFA',
      danger: '#CD5353',
      'danger-light': '#FFCCCC',
      // 카카오 로그인 버튼 전용 브랜드 색. 카카오 가이드라인이 색을 강제하므로
      // 색상 시스템 밖이지만 남겨 둔다.
      kakao: '#FEE500',
      gray: {
        50: '#FBFBFB',
        100: '#F6F7F7',
        200: '#EFEFEF',
        300: '#D2D6D6',
        400: '#B4BBBB',
        500: '#929898',
        600: '#6E7575',
        700: '#4C5252',
        800: '#2E3333',
        900: '#181C1C',
      },
      green: {
        50: '#F5F8ED',
        100: '#ECF1D5',
        200: '#DCE5B0',
        300: '#C6D47A',
        400: '#94BD52', // main
        500: '#759E38',
        600: '#628C2F',
        700: '#517627',
        800: '#3F5C1D',
        900: '#2A4114',
      },
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
        'caption-md': ['12px', { lineHeight: '20px', fontWeight: '400' }],
        'caption-sm': ['10px', { lineHeight: '12px', fontWeight: '400' }],
        // label
        'label-sm': ['14px', { lineHeight: '18px', fontWeight: '600' }],
        'label-md': ['16px', { lineHeight: '20px', fontWeight: '600' }],
      },
    },
  },
  plugins: [],
};
