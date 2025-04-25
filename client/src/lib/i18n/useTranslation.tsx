import { useLanguage } from "./LanguageContext";

/**
 * Simple translation hook that uses the language context
 * @returns Translation utilities
 */
export function useTranslation() {
  const { language, translations } = useLanguage();
  
  /**
   * Get a translated value for a given key
   * @param key The translation key
   * @param params Optional parameters to replace in the translation string
   * @returns The translated string or the key itself if translation is not found
   */
  const t = (key: string, params?: Record<string, string | number>): string => {
    // Split the key by periods to traverse the translations object
    const keys = key.split(".");
    
    // Get the current language's translations or default to empty object
    const currentTranslations = translations[language] || {};
    
    // Traverse the translations object
    let value = keys.reduce((obj, k) => (obj && obj[k] !== undefined ? obj[k] : undefined), currentTranslations as any);
    
    // If translation not found, return the key itself
    if (value === undefined) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    
    // Handle params replacement if any
    if (params && typeof value === "string") {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        value = (value as string).replace(new RegExp(`{{${paramKey}}}`, "g"), String(paramValue));
      });
    }
    
    return value as string;
  };
  
  return {
    t,
    language,
  };
}