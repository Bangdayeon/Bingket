import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import ko from './locales/ko';
import en from './locales/en';
import ja from './locales/ja';
import es from './locales/es';
import fr from './locales/fr';

export const resources = {
  ko: { translation: ko },
  en: { translation: en },
  ja: { translation: ja },
  es: { translation: es },
  fr: { translation: fr },
};

const deviceLanguage = Localization.getLocales()[0]?.languageCode ?? 'en';

i18n.use(initReactI18next).init({
  resources,
  lng: Object.hasOwn(resources, deviceLanguage) ? deviceLanguage : 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
