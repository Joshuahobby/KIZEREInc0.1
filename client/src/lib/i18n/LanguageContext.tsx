import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import en from './locales/en';
import fr from './locales/fr';

// Define available languages
export type Language = 'en' | 'fr';

// Create language dictionaries
const languages: Record<Language, Record<string, string>> = {
  en,
  fr,
};

// Default to English if no language is set
const DEFAULT_LANGUAGE: Language = 'en';

// Get initial language from localStorage or use default
const getInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  
  const savedLanguage = localStorage.getItem('language') as Language;
  return savedLanguage && Object.keys(languages).includes(savedLanguage)
    ? savedLanguage
    : DEFAULT_LANGUAGE;
};

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, options?: Record<string, any>) => string;
  getLanguages: () => { code: Language; name: string }[];
}

const LanguageContext = createContext<LanguageContextType>({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: (key: string) => key,
  getLanguages: () => [],
});

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage());

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
    const dictionary = languages[language] || languages[DEFAULT_LANGUAGE];
    
    let text = dictionary[key] || languages[DEFAULT_LANGUAGE][key] || key;
    
    // Replace placeholders with values if options are provided
    if (options) {
      Object.keys(options).forEach(optionKey => {
        const regex = new RegExp(`{{${optionKey}}}`, 'g');
        text = text.replace(regex, options[optionKey].toString());
      });
    }
    
    return text;
  };

  // Helper to get all available languages
  const getLanguages = () => [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
  ];

  const contextValue: LanguageContextType = {
    language,
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