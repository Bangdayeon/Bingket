/**
 * 색상 토큰의 단일 진실 원천. tailwind.config.cjs(빌드)와 lib/use-colors.ts(런타임)가
 * 이 파일 하나를 함께 읽는다.
 *
 * package.json이 "type":"module"이라 .js는 ESM이 되어 tailwind.config.cjs에서
 * require할 수 없다. 그래서 .cjs다.
 *
 * 다크 값은 대비비 계산으로 뒷받침한 출발점이다. Figma에 다크 시안이 생기면
 * DARK 객체만 갈아끼우면 되고 다른 코드는 손대지 않는다.
 */

/** 라이트 팔레트. 시안 COLOR SYSTEM 그대로. */
const LIGHT = {
  surface: '#FAFAFA',
  white: '#FDFDFD',
  black: '#000000',
  scrim: '#585858',
  danger: '#CD5353',
  dangerLight: '#FFCCCC',
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
};

/**
 * 다크 팔레트.
 *
 * gray는 단순 반전이 아니다. 그냥 뒤집으면 white(카드)가 surface(페이지)보다
 * 어두워져 카드가 파여 보인다. 면 계열(surface·white·50~300)은 어두움에서
 * 밝음으로 가는 elevation 사다리로 다시 배치했다:
 *   surface #131717 < white #1D2222 < 50 #212626 < 100 #252A2A < 200 #2C3232 < 300 #3D4444
 * 덕분에 "카드 위 입력창은 카드보다 어둡다"가 다크에서 정확히 뒤집힌다.
 *
 * green은 한 스케일이 배경 틴트·브랜드 채움·텍스트 세 용도를 겸해서 단순 반전이
 * 불가능하다. 명도 중간대인 400/500을 양쪽 모드에서 동결하고 양 끝만 뒤집는다.
 * danger도 같은 이유로 동결한다(다크 배경 위 4.26, 흰 전경 위 4.16 둘 다 성립).
 */
const DARK = {
  surface: '#131717',
  white: '#1D2222',
  black: '#000000',
  scrim: '#0A0C0C',
  danger: '#CD5353',
  dangerLight: '#4A2222',
  gray: {
    50: '#212626',
    100: '#252A2A',
    200: '#2C3232',
    300: '#3D4444',
    400: '#656C6C',
    500: '#8A9191',
    600: '#A3AAAA',
    700: '#C7CDCD',
    800: '#E3E7E7',
    900: '#F5F7F7',
  },
  green: {
    50: '#1A2412',
    100: '#203016',
    200: '#2B401C',
    300: '#3C5626',
    400: '#94BD52', // 동결
    500: '#759E38', // 동결
    600: '#86B345',
    700: '#A0C968',
    800: '#C0DE94',
    900: '#DCEBBF',
  },
};

/**
 * 테마와 무관하게 고정되는 색.
 *
 * 브랜드 가이드라인이 강제하는 색, DB에 저장돼 있어 바꾸면 값이 달라지는 색,
 * 이미지나 딤 위에 얹혀 배경이 테마를 따르지 않는 전경색이 여기 모인다.
 */
const FIXED = {
  kakao: '#FEE500',
  /** green 채움 위 전경. green-400/500이 동결이라 이것도 고정이어야 한다. */
  onBrand: '#FDFDFD',
  /** danger 채움 위 전경. */
  onDanger: '#FDFDFD',
  /** green 채움 위 어두운 전경. 시안이 흰색이 아니라 진한 글자를 쓴 자리. */
  onBrandDark: '#181C1C',
  /** 소셜 로그인 버튼 라벨. 카카오 가이드가 강제한다. */
  onSocial: 'rgba(0,0,0,0.85)',
  /** Apple/Google 버튼 테두리. */
  socialBorder: '#C9CCCF',
  /** 딤이나 사진 위에 얹혀 항상 밝아야 하는 전경. */
  fixedWhite: '#FDFDFD',
  /** Apple 브랜드 검정. */
  fixedBlack: '#000000',
  /** 사진 위 컨트롤 배경. 배경이 사진이라 테마와 무관하다. */
  overlayMedia: 'rgba(0,0,0,0.45)',
  /** 빙고판 서버 테마의 전경색 fallback. 배경이 서버 이미지라 다크 대응 대상이 아니다. */
  boardForeground: '#181C1C',
  /** 익명/기본 프로필 색. users.avatar_url에 저장되는 값이라 절대 바꾸면 안 된다. */
  avatar: ['#F79A6E', '#54DBED', '#6ADE50', '#EC5858', '#C0B0F5', '#F5E060'],
  /** 시드가 없을 때의 아바타 색. */
  avatarNeutral: '#D2D6D6',
  /** 좋아요 파티클. 축하 효과라 테마를 따르지 않는다. */
  particle: ['#E02828', '#FF6B00', '#FFB800', '#FF4444', '#FF8C00'],
  /** 앱 테마 설정의 미리보기 반원. 라이트/다크 견본을 동시에 보여야 해서 고정이다. */
  preview: { light: '#FDFDFD', dark: '#181C1C' },
};

module.exports = { LIGHT, DARK, FIXED };
