export interface ColorRamp {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

export interface Palette {
  surface: string;
  white: string;
  black: string;
  scrim: string;
  danger: string;
  dangerLight: string;
  gray: ColorRamp;
  green: ColorRamp;
}

export interface FixedColors {
  kakao: string;
  onBrand: string;
  onDanger: string;
  onSocial: string;
  socialBorder: string;
  fixedWhite: string;
  fixedBlack: string;
  overlayMedia: string;
  boardForeground: string;
  avatar: readonly string[];
  avatarNeutral: string;
  particle: readonly string[];
  preview: { light: string; dark: string };
}

export declare const LIGHT: Palette;
export declare const DARK: Palette;
export declare const FIXED: FixedColors;
