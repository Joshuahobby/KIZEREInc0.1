import * as React from 'react';
// Import all translations from JSON files for consistency
// @ts-ignore - Allow direct import of JSON files
import en from './locales/en.json';


// Define available languages
export type Language = 'en' | 'fr' | 'rw' | 'sw';

const staticTranslations = {
  en,
};

// Default to English if no language is set
const DEFAULT_LANGUAGE: Language = 'en';

const getInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;

  const savedLanguage = localStorage.getItem('language') as Language;
  const availableLanguages: Language[] = ['en', 'fr', 'rw', 'sw'];
  return savedLanguage && availableLanguages.includes(savedLanguage)
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
  translations: { [DEFAULT_LANGUAGE]: en } as any,
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
  const [translations, setTranslations] = React.useState<Record<string, any>>({ en });

  // Update the language state and save to localStorage
  const setLanguage = (newLanguage: Language) => {
    console.log(`[LanguageContext] Changing language to: ${newLanguage}`);
    setLanguageState(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  // Load translations dynamically
  React.useEffect(() => {
    const loadTranslations = async () => {
      if (language === 'en') return;

      if (!translations[language]) {
        try {
          console.log(`[LanguageContext] Dynamically loading ${language} bundle...`);
          let bundle;
          switch (language) {
            case 'fr': bundle = await import('./locales/fr.json'); break;
            case 'rw': bundle = await import('./locales/rw.json'); break;
            case 'sw': bundle = await import('./locales/sw.json'); break;
            default: return;
          }

          setTranslations(prev => ({
            ...prev,
            [language]: bundle.default || bundle
          }));
        } catch (error) {
          console.error(`[LanguageContext] Failed to load ${language} bundle:`, error);
        }
      }
    };

    loadTranslations();

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
    const getRoot = (obj: any) => (obj && (obj.__esModule || obj.default)) ? (obj.default || obj) : obj;

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
    // Always use the live imported 'en' object for English to ensure React Fast Refresh (HMR) 
    // picks up JSON changes without requiring a full page reload or state reset.
    const currentLangObj = language === 'en' ? en : translations[language];
    let value = traverse(currentLangObj, keys);

    // If translation not found in current language, try in default language
    if (value === undefined && language !== DEFAULT_LANGUAGE) {
      console.log(`[LanguageContext] Key "${key}" not found in "${language}", trying fallback to "${DEFAULT_LANGUAGE}"`);
      const defaultLangObj = translations[DEFAULT_LANGUAGE] || en;
      value = traverse(defaultLangObj, keys);
    }

    // If still not found, return the default value or the key itself
    if (value === undefined) {
      if (finalDefaultValue) return finalDefaultValue;

      console.warn(`[LanguageContext] Translation key not found: "${key}" (Language: ${language})`);
      return key;
    }

    // Handle params replacement if any
    if (options && typeof value === "string") {
      Object.entries(options).forEach(([paramKey, paramValue]) => {
        // Escape special characters in paramKey for RegExp
        const escapedKey = paramKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const replacement = String(paramValue);
        value = (value as string)
          .replace(new RegExp(`{{${escapedKey}}}`, "g"), replacement)
          .replace(new RegExp(`{${escapedKey}}`, "g"), replacement);
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