import React from 'react';
import { useLanguage } from './LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

interface LocaleOption {
  code: string;
  name: string;
  nativeName: string;
}

/**
 * Language switcher component for the application
 * Shows a dropdown menu with available languages
 */
export function LanguageSwitcher() {
  const { locale, setLocale, availableLocales } = useLanguage();
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Change language">
          <Globe className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableLocales.map((lang: LocaleOption) => (
          <DropdownMenuItem
            key={lang.code}
            className={locale === lang.code ? 'bg-accent' : ''}
            onClick={() => setLocale(lang.code)}
          >
            <span className="font-medium">{lang.nativeName}</span>
            <span className="ml-2 text-muted-foreground">({lang.name})</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}