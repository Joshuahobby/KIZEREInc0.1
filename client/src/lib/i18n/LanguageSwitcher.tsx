import React from 'react';
import { useLanguage, Language } from './LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe, Check } from 'lucide-react';

// Language display names
const languageNames: Record<string, { name: string; nativeName: string }> = {
  en: { name: 'English', nativeName: 'English' },
  fr: { name: 'French', nativeName: 'Français' },
};

/**
 * Language switcher component for the application
 * Shows a dropdown menu with available languages
 */
export function LanguageSwitcher() {
  const { language, setLanguage, t, getLanguages } = useLanguage();
  
  // Get available languages using getLanguages from context
  const availableLanguages = getLanguages();
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Change language">
          <Globe className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Select Language</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            className={`flex items-center justify-between ${language === lang.code ? 'font-medium' : ''}`}
            onClick={() => setLanguage(lang.code as Language)}
          >
            <span>{lang.name}</span>
            {language === lang.code && <Check className="h-4 w-4 ml-2" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}