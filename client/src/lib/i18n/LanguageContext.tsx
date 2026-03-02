import * as React from 'react';
// Import all translations from JSON files for consistency
// @ts-ignore - Allow direct import of JSON files
import en from './locales/en.json';
// @ts-ignore - Allow direct import of JSON files
import fr from './locales/fr.json';
// @ts-ignore - Allow direct import of JSON files
import rw from './locales/rw.json';
// @ts-ignore - Allow direct import of JSON files
import sw from './locales/sw.json';

// Define available languages
export type Language = 'en' | 'fr' | 'rw' | 'sw';

// Create language dictionaries
const translations = {
  en,
  fr,
  rw,
  sw,
};

// Default to English if no language is set
const DEFAULT_LANGUAGE: Language = 'en';

// Get initial language from localStorage or use default
const getInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;

  const savedLanguage = localStorage.getItem('language') as Language;
  return savedLanguage && Object.keys(translations).includes(savedLanguage)
    ? savedLanguage
    : DEFAULT_LANGUAGE;
};

interface LanguageContextType {
  language: Language;
  translations: Record<Language, any>;
  setLanguage: (language: Language) => void;
  t: (key: string, optionsOrDefault?: Record<string, any> | string, defaultValue?: string) => string;
  getLanguages: () => { code: Language; name: string }[];
}

const LanguageContext = React.createContext<LanguageContextType>({
  language: DEFAULT_LANGUAGE,
  translations,
  setLanguage: () => { },
  t: (key: string, optionsOrDefault?: Record<string, any> | string, defaultValue?: string) => {
    return typeof optionsOrDefault === 'string' ? optionsOrDefault : key;
  },
  getLanguages: () => [],
});
LanguageContext.displayName = "LanguageContext";

interface LanguageProviderProps {
  children: React.ReactNode;
  defaultLanguage?: Language;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
  defaultLanguage = DEFAULT_LANGUAGE
}) => {
  const initialLang = defaultLanguage || getInitialLanguage();
  const [language, setLanguageState] = React.useState<Language>(initialLang);

  // Update the language state and save to localStorage
  const setLanguage = (newLanguage: Language) => {
    console.log(`[LanguageContext] Changing language to: ${newLanguage}`);
    setLanguageState(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  // Initialize and update HTML lang attribute on mount and on language change
  React.useEffect(() => {
    console.log(`[LanguageContext] Updating document.documentElement.lang to: ${language}`);
    document.documentElement.lang = language;
  }, [language]);

  // Translation function
  const t = (key: string, optionsOrDefault?: Record<string, any> | string, defaultValue?: string): string => {
    // Split the key by periods to traverse the translations object
    const keys = key.split(".");

    // Determine if second arg is options or a default value string
    const options = typeof optionsOrDefault === 'object' ? optionsOrDefault : undefined;
    const finalDefaultValue = typeof optionsOrDefault === 'string' ? optionsOrDefault : defaultValue;

    // Helper to solve JSON default export issue in some environments
    const getRoot = (obj: any) => (obj && obj.default && Object.keys(obj).length === 1) ? obj.default : obj;

    // Traverse helper
    const traverse = (obj: any, pathKeys: string[]) => {
      let current = getRoot(obj);
      for (const k of pathKeys) {
        if (current && typeof current === 'object' && k in current) {
          current = current[k];
        } else {
          return undefined;
        }
      }
      return current;
    };

    // Get the current language's translations
    const currentLangObj = translations[language];
    let value = traverse(currentLangObj, keys);

    // If translation not found in current language, try in default language
    if (value === undefined && language !== DEFAULT_LANGUAGE) {
      console.log(`[LanguageContext] Key "${key}" not found in "${language}", trying fallback to "${DEFAULT_LANGUAGE}"`);
      const defaultLangObj = translations[DEFAULT_LANGUAGE];
      value = traverse(defaultLangObj, keys);
    }

    // If still not found, return the default value or the key itself
    if (value === undefined) {
      if (finalDefaultValue) return finalDefaultValue;

      console.warn(`[LanguageContext] Translation key not found: "${key}" (Language: ${language})`);
      // To help debug, let's see what keys ARE available at top level
      const root = getRoot(currentLangObj || translations[DEFAULT_LANGUAGE]);
      if (root) {
        console.log(`[LanguageContext] Available top-level keys:`, Object.keys(root).slice(0, 5));
      }
      return key;
    }

    // Handle params replacement if any
    if (options && typeof value === "string") {
      Object.entries(options).forEach(([paramKey, paramValue]) => {
        // Escape special characters in paramKey for RegExp
        const escapedKey = paramKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const replacement = String(paramValue);
        value = (value as string)
          .replace(new RegExp(`{${escapedKey}}`, "g"), replacement)
          .replace(new RegExp(`{{${escapedKey}}}`, "g"), replacement);
      });
    }

    return value as string;
  };

  // Helper to get all available languages
  const getLanguages = () => [
    { code: 'en' as Language, name: 'English' },
    { code: 'fr' as Language, name: 'Français' },
    { code: 'rw' as Language, name: 'Kinyarwanda' },
    { code: 'sw' as Language, name: 'Kiswahili' },
  ];

  const contextValue: LanguageContextType = {
    language,
    translations,
    setLanguage,
    t,
    getLanguages,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = () => React.useContext(LanguageContext);

/**
 * Compatibility shim for components transitioning from react-i18next
 * @deprecated Use useLanguage() instead
 */
export const useTranslation = () => {
  const { t } = useLanguage();
  return { t, i18n: { changeLanguage: (lang: string) => { /* no-op for shim */ } } };
};

// Higher-order component to wrap components that need translations
export const withLanguage = <P extends object>(
  Component: React.ComponentType<P & { t: (key: string, options?: Record<string, any>) => string }>
) => {
  return (props: P) => {
    const { t } = useLanguage();
    return <Component {...props} t={t} />;
  };
};