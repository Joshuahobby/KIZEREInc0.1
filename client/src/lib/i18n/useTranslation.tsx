import { useLanguage } from "./LanguageContext";

/**
 * Simple translation hook that uses the language context
 * @returns Translation utilities
 */
export function useTranslation() {
  const { t, language } = useLanguage();
  
  return {
    t,
    language,
  };
}