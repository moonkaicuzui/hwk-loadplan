/**
 * @fileoverview i18n Configuration
 * Internationalization setup using i18next with React.
 * Supports Korean (ko), English (en), and Vietnamese (vi).
 *
 * @module i18n
 */

import i18n from 'i18next';
import { initReactI18next, I18nextProvider, useTranslation } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import ko from './locales/ko.json';
import en from './locales/en.json';
import vi from './locales/vi.json';

// ========================================
// i18n Configuration
// ========================================

const resources = {
  ko: { translation: ko },
  en: { translation: en },
  vi: { translation: vi }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ko',
    defaultNS: 'translation',

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'language'
    },

    interpolation: {
      escapeValue: false // React already escapes values
    },

    react: {
      useSuspense: false
    }
  });

// ========================================
// Provider Component
// ========================================

export function I18nProvider({ children }) {
  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}

// ========================================
// Helper Functions
// ========================================

/**
 * Get current language
 */
export function getCurrentLanguage() {
  return i18n.language || 'ko';
}

/**
 * Change language
 */
export function changeLanguage(lang) {
  return i18n.changeLanguage(lang);
}

/**
 * Get available languages
 */
export function getAvailableLanguages() {
  return [
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' }
  ];
}

// ========================================
// Exports
// ========================================

export { useTranslation };
export default i18n;
