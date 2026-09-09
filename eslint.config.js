import css from '@eslint/css';
import js from '@eslint/js';
import json from '@eslint/json';
import prettierConfig from 'eslint-config-prettier';
import pluginReact from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
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
      'pnpm-lock.yaml',
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
    // Hook 규칙. 렌더 중 ref 쓰기, 어긋난 deps 같은 건 tsc도 prettier도 못 잡는다.
    // 지금은 동작해도 React Compiler를 켜는 순간 빌드가 깨지는 종류라 규칙으로 막는다.
    files: [
      'app/**/*.{ts,tsx}',
      'components/**/*.{ts,tsx}',
      'features/**/*.{ts,tsx}',
      'lib/**/*.{ts,tsx}',
      'store/**/*.{ts,tsx}',
    ],
    ...reactHooks.configs.flat['recommended-latest'],
    rules: {
      ...reactHooks.configs.flat['recommended-latest'].rules,
      // 남은 11건은 전부 "효과 안에서 조회를 시작하며 setLoading(true)" 형태다.
      // 규칙이 권하는 해법이 곧 서버 상태 라이브러리(React Query) 도입이라,
      // 손으로 우회하면 use-async.ts가 더 나빠진다. 도입 전까지만 warn이다.
      'react-hooks/set-state-in-effect': 'warn',
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
    // 테마 값은 lib/color-scheme.ts 한 곳에서만 나온다.
    // nativewind의 colorScheme은 'unspecified'를 그대로 흘려보내는데, className은
    // 그 값을 "light가 아니면 다크"로, useColors()는 "dark일 때만 다크"로 읽는다.
    // 두 판정이 갈리면 어두운 시트 위에 검은 글씨가 깔린다 — 실제로 그렇게 깨졌었다.
    files: [
      'app/**/*.{ts,tsx}',
      'components/**/*.{ts,tsx}',
      'features/**/*.{ts,tsx}',
      'lib/**/*.{ts,tsx}',
      'store/**/*.{ts,tsx}',
    ],
    ignores: ['lib/color-scheme.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'nativewind',
              importNames: ['useColorScheme', 'colorScheme'],
              message:
                '테마 값은 @/lib/color-scheme의 useResolvedScheme() 또는 @/lib/use-colors의 useColors()에서만 읽으세요.',
            },
            {
              name: 'react-native-css-interop/dist/runtime/native/appearance-observables',
              message: 'systemColorScheme은 lib/color-scheme.ts만 건드립니다.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "MemberExpression[object.name='Appearance'][property.name=/^(setColorScheme|getColorScheme)$/]",
          message:
            'Appearance를 직접 부르지 마세요 — applyAppTheme()/useResolvedScheme()을 씁니다. 직접 부르면 RN의 JS 캐시가 오염돼 테마가 다크로 굳습니다.',
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
