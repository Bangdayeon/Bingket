import css from '@eslint/css';
import js from '@eslint/js';
import json from '@eslint/json';
import prettierConfig from 'eslint-config-prettier';
import pluginReact from 'eslint-plugin-react';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  {
    ignores: [
      '.expo/**',
      'node_modules/**',
      'ios/**',
      'android/**',
      'package-lock.json',
      'global.css',
      'supabase/functions/**', // Deno 런타임 — Node.js 규칙 적용 불가
      '.antigravitycli/**', // 외부 도구 임시 파일 — 실행 중 사라져 lint가 ENOENT로 죽는다
    ],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    plugins: { js },
    extends: ['js/recommended'],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  tseslint.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    ...pluginReact.configs.flat.recommended,
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...pluginReact.configs.flat.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/display-name': 'off',
    },
  },
  {
    // 색상 리터럴 금지. 화면에 하드코딩된 색이 하나라도 남으면 그 요소만 테마를
    // 따라가지 않는다. grep은 지금 한 번 확인할 뿐이라, 재발은 규칙으로 막는다.
    // 값이 필요한 자리(Animated.interpolate, RefreshControl 등)는
    // useColors() / FIXED (constants/color-tokens.cjs)에서 가져온다.
    files: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}', 'features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/^#[0-9A-Fa-f]{3,8}$/]',
          message:
            '색상 리터럴 금지 — tailwind 클래스나 useColors()/FIXED(@/lib/use-colors)를 쓰세요.',
        },
        {
          selector: 'Literal[value=/^rgba?[(]/]',
          message: '색상 리터럴 금지 — bg-scrim/70 같은 토큰 유틸리티를 쓰세요.',
        },
      ],
    },
  },
  {
    files: ['**/*.json'],
    plugins: { json },
    language: 'json/json',
    extends: ['json/recommended'],
  },
  {
    files: ['**/*.css'],
    plugins: { css },
    language: 'css/css',
    extends: ['css/recommended'],
  },
  {
    files: ['*.config.{js,cjs}', 'babel.config.cjs', '**/*.{js,jsx,ts,tsx}'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  prettierConfig,
]);
