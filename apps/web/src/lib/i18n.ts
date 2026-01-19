import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '../locales/en-US.json';
import zh from '../locales/zh-TW.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      'en-US': { translation: en },
      zh: { translation: zh },
      'zh-TW': { translation: zh }
    },
    fallbackLng: 'zh-TW',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
