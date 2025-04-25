import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import en from './locales/en';
import fr from './locales/fr';
// Import the Kinyarwanda translations directly
// @ts-ignore - Allow direct import of JSON files
import rw from './locales/rw.json';

// Define available languages
export type Language = 'en' | 'fr' | 'rw';

// Create language dictionaries
const translations = {
  en,
  fr,
  rw,
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
  t: (key: string, options?: Record<string, any>) => string;
  getLanguages: () => { code: Language; name: string }[];
}

const LanguageContext = createContext<LanguageContextType>({
  language: DEFAULT_LANGUAGE,
  translations,
  setLanguage: () => {},
  t: (key: string) => key,
  getLanguages: () => [],
});

interface LanguageProviderProps {
  children: ReactNode;
  defaultLanguage?: Language;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ 
  children, 
  defaultLanguage = DEFAULT_LANGUAGE 
}) => {
  const initialLang = defaultLanguage || getInitialLanguage();
  const [language, setLanguageState] = useState<Language>(initialLang);

  // Update the language state and save to localStorage
  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem('language', newLanguage);
    // Optional: Update HTML lang attribute
    document.documentElement.lang = newLanguage;
  };

  // Initialize language on mount
  useEffect(() => {
    // Set the HTML lang attribute
    document.documentElement.lang = language;
  }, []);

  // Translation function
  const t = (key: string, options?: Record<string, any>): string => {
    // Split the key by periods to traverse the translations object
    const keys = key.split(".");
    
    // Get the current language's translations or default to empty object
    const currentTranslations = translations[language] || {};
    
    // Traverse the translations object
    let value = keys.reduce((obj, k) => (obj && obj[k] !== undefined ? obj[k] : undefined), currentTranslations as any);
    
    // If translation not found in current language, try in default language
    if (value === undefined && language !== DEFAULT_LANGUAGE) {
      const defaultTranslations = translations[DEFAULT_LANGUAGE] || {};
      value = keys.reduce((obj, k) => (obj && obj[k] !== undefined ? obj[k] : undefined), defaultTranslations as any);
    }
    
    // If still not found, return the key itself
    if (value === undefined) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    
    // Handle params replacement if any
    if (options && typeof value === "string") {
      Object.entries(options).forEach(([paramKey, paramValue]) => {
        // Support both {name} and {{name}} formats for parameter replacement
        value = (value as string)
          .replace(new RegExp(`{${paramKey}}`, "g"), String(paramValue))
          .replace(new RegExp(`{{${paramKey}}}`, "g"), String(paramValue));
      });
    }
    
    return value as string;
  };

  // Helper to get all available languages
  const getLanguages = () => [
    { code: 'en' as Language, name: 'English' },
    { code: 'fr' as Language, name: 'Français' },
    { code: 'rw' as Language, name: 'Kinyarwanda' },
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
export const useLanguage = () => useContext(LanguageContext);

// Higher-order component to wrap components that need translations
export const withLanguage = <P extends object>(
  Component: React.ComponentType<P & { t: (key: string, options?: Record<string, any>) => string }>
) => {
  return (props: P) => {
    const { t } = useLanguage();
    return <Component {...props} t={t} />;
  };
};