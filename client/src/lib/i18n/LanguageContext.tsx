import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Import all translation files
import en from './locales/en.json';
import fr from './locales/fr.json';
import rw from './locales/rw.json';
import sw from './locales/sw.json';

// Define the supported languages
export type Language = 'rw' | 'en' | 'fr' | 'sw';

// Define language information type
export type LanguageInfo = {
  [key in Language]: { name: string; nativeName: string; }
};

// Create a translations object with all languages
const translations = {
  en,
  fr,
  rw,
  sw
};

// Type for nested translation objects
export type TranslationValue = string | { [key: string]: TranslationValue };
export type TranslationsType = { [key: string]: { [key: string]: TranslationValue } };

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  translations: TranslationsType;
  languages: LanguageInfo;
}

// Create the context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Local storage key for saved language preference
const LANGUAGE_STORAGE_KEY = 'kizere-language';

// Helper function to get a nested translation value using dot notation
const getNestedTranslation = (obj: any, path: string): string => {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return path; // Return the path if translation not found
    }
  }
  
  return typeof result === 'string' ? result : path;
};

interface LanguageProviderProps {
  children: ReactNode;
  defaultLanguage?: Language;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ 
  children, 
  defaultLanguage = 'rw' // Kinyarwanda is the default language
}) => {
  // Define available languages
  const languagesInfo: LanguageInfo = {
    rw: { name: 'Kinyarwanda', nativeName: 'Kinyarwanda' },
    en: { name: 'English', nativeName: 'English' },
    fr: { name: 'French', nativeName: 'Français' },
    sw: { name: 'Swahili', nativeName: 'Kiswahili' }
  };
  
  // Try to get the saved language from localStorage, fallback to default
  const getInitialLanguage = (): Language => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language;
      return savedLanguage && Object.keys(translations).includes(savedLanguage) 
        ? savedLanguage 
        : defaultLanguage;
    }
    return defaultLanguage;
  };

  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  // Update language and save to localStorage
  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage);
    }
  };

  // Translation function
  const t = (key: string, params?: Record<string, string | number>): string => {
    let translatedText = getNestedTranslation(translations[language], key) || key;
    
    // Replace parameters if provided
    if (params) {
      Object.keys(params).forEach(paramKey => {
        translatedText = translatedText.replace(`{${paramKey}}`, String(params[paramKey]));
      });
    }
    
    return translatedText;
  };

  // Provide the language context
  const value = {
    language,
    setLanguage,
    t,
    translations,
    languages: languagesInfo
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};