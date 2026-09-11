import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import ko from './locales/ko';
import en from './locales/en';
import ja from './locales/ja';

export const resources = {
  ko: { translation: ko },
  en: { translation: en },
  ja: { translation: ja },
};

const deviceLanguage = Localization.getLocales()[0]?.languageCode ?? 'en';

i18n.use(initReactI18next).init({
  resources,
  lng: deviceLanguage === 'ko' ? 'ko' : 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
