import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { en } from './locales/en';
import { fr } from './locales/fr';
import { rw } from './locales/rw'; // Kinyarwanda
import { sw } from './locales/sw'; // Swahili

type Translations = Record<string, string>;

export interface LocaleData {
  name: string;
  translations: Translations;
  nativeName: string;
}

export interface LocaleOption extends LocaleData {
  code: string;
}

export interface LanguageContextType {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  availableLocales: LocaleOption[];
}

// Define available locales
const locales: Record<string, LocaleData> = {
  en: {
    name: 'English',
    nativeName: 'English',
    translations: en,
  },
  fr: {
    name: 'French',
    nativeName: 'Français',
    translations: fr,
  },
  rw: {
    name: 'Kinyarwanda',
    nativeName: 'Kinyarwanda',
    translations: rw,
  },
  sw: {
    name: 'Swahili',
    nativeName: 'Kiswahili',
    translations: sw,
  },
};

// Create the context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Define the storage key
const LOCALE_STORAGE_KEY = 'kizere-locale';

// Provider component
export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  // Initialize state with stored preference or default to English
  const [locale, setLocaleState] = useState(() => {
    const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
    return savedLocale && locales[savedLocale] ? savedLocale : 'en';
  });

  // Update locale and save to localStorage
  const setLocale = (newLocale: string) => {
    if (locales[newLocale]) {
      setLocaleState(newLocale);
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
      
      // Update HTML lang attribute
      document.documentElement.lang = newLocale;
    }
  };

  // Set initial HTML lang attribute
  useEffect(() => {
    document.documentElement.lang = locale;
  }, []);

  // Translation function
  const t = (key: string, params?: Record<string, string | number>): string => {
    // Get the current translations
    const translations = locales[locale]?.translations || {};
    
    // Get the translation for the key or fall back to the key itself
    let translation = translations[key] || key;
    
    // Replace parameters if provided
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(`{{${param}}}`, String(value));
      });
    }
    
    return translation;
  };

  const availableLocales: LocaleOption[] = Object.entries(locales).map(([code, data]) => ({
    ...data,
    code,
  }));

  const value = {
    locale,
    setLocale,
    t,
    availableLocales,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  
  return context;
};