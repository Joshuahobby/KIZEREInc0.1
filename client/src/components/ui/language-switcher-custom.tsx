import React from 'react';
import { useLanguage, Language } from '@/lib/i18n/LanguageContext';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Check, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  variant?: 'default' | 'minimal' | 'icon-only';
  className?: string;
}

// Language display names
const languageNames: Record<Language, { name: string; nativeName: string }> = {
  en: { name: 'English', nativeName: 'English' },
  fr: { name: 'French', nativeName: 'Français' },
};

export function LanguageSwitcher({ 
  variant = 'default',
  className
}: LanguageSwitcherProps) {
  const { language, setLanguage, t, getLanguages } = useLanguage();
  
  // Get list of available languages
  const availableLanguages = getLanguages();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className={cn(
            "flex items-center gap-1.5 px-2 h-9",
            variant === 'minimal' && "px-1.5 h-8",
            className
          )}
        >
          <Globe className="h-4 w-4" />
          {variant !== 'icon-only' && (
            <span className="text-sm">
              {variant === 'default' ? 
                languageNames[language]?.nativeName || language : 
                language.toUpperCase()}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{t('settings_language')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableLanguages.map((lang) => (
          <DropdownMenuItem 
            key={lang.code}
            className={cn(
              "flex items-center justify-between cursor-pointer",
              lang.code === language && "font-medium"
            )}
            onClick={() => setLanguage(lang.code as Language)}
          >
            <span>{lang.name}</span>
            {lang.code === language && <Check className="h-4 w-4 ml-2" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}