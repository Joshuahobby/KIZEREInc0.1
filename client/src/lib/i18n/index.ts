import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import all translation files
import en from './locales/en.json';
import fr from './locales/fr.json';
import rw from './locales/rw.json';
import sw from './locales/sw.json';

// Define the supported languages and their native names
export const languages = {
  rw: { name: 'Kinyarwanda', nativeName: 'Kinyarwanda' },
  en: { name: 'English', nativeName: 'English' },
  fr: { name: 'French', nativeName: 'Français' },
  sw: { name: 'Swahili', nativeName: 'Kiswahili' }
};

// Initialize i18next
i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize configuration
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      rw: { translation: rw },
      sw: { translation: sw }
    },
    fallbackLng: 'rw', // Default language (Kinyarwanda)
    debug: process.env.NODE_ENV === 'development',
    
    // Detection options
    detection: {
      // Order and from where user language should be detected
      order: ['localStorage', 'navigator'],
      // Keys or params to lookup language from
      lookupLocalStorage: 'kizere-language',
      // Cache user language on
      caches: ['localStorage'],
    },
    
    interpolation: {
      escapeValue: false, // Not needed for React
    }
  });

export default i18n;