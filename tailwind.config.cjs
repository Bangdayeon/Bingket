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
    textColor: ({ theme }) => ({
      ...theme('colors'),
      DEFAULT: '#181C1C',
    }),
    extend: {
      colors: {
        gray: {
          100: '#F6F7F7',
          200: '#E8EAEA',
          300: '#D2D6D6',
          400: '#B4BBBB',
          500: '#929898',
          600: '#6E7575',
          700: '#4C5252',
          800: '#2E3333',
          900: '#181C1C',
        },
        green: {
          100: '#F2FDE8',
          200: '#D6F9B8',
          300: '#B8F28A',
          400: '#8EF275',
          500: '#6ADE50',
          600: '#48BE30',
          700: '#2E9018',
          800: '#1A6208',
          900: '#0C3803',
        },
        sky: {
          100: '#E8FAFE',
          200: '#BCF0FA',
          300: '#86E4F5',
          400: '#54DBED',
          500: '#28C8DE',
          600: '#0EAABE',
          700: '#088094',
          800: '#045A68',
          900: '#023540',
        },
        red: {
          100: '#FEF0F0',
          200: '#FAC4C4',
          300: '#F49090',
          400: '#EC5858',
          500: '#E02828',
          600: '#B81414',
          700: '#8C0808',
          800: '#600404',
          900: '#360000',
        },
        lavender: {
          100: '#F4F0FE',
          200: '#DDD4FA',
          300: '#C0B0F5',
          400: '#A088EE',
          500: '#7E60E4',
          600: '#5E40C4',
          700: '#422898',
          800: '#281468',
          900: '#140840',
        },
        yellow: {
          100: '#FEFBE8',
          200: '#FAF0A0',
          300: '#F5E060',
          400: '#EED020',
          500: '#D4B000',
          600: '#A88800',
          700: '#7C6200',
          800: '#504000',
          900: '#282000',
        },
        peach: {
          100: '#FEF3EE',
          200: '#FDDBC8',
          300: '#FABF9E',
          400: '#F79A6E',
          500: '#F07840',
          600: '#C85A28',
          700: '#9A3E14',
          800: '#6C2608',
          900: '#3E1202',
        },
        kakao: '#FEE500',
      },
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
        'body-md': ['16px', { lineHeight: '18px', fontWeight: '400' }],
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
