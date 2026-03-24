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
const languageNames: Record<Language, { name: string; nativeName: string; flagCode: string }> = {
  en: { name: 'English', nativeName: 'English', flagCode: 'gb' },
  fr: { name: 'French', nativeName: 'Français', flagCode: 'fr' },
  rw: { name: 'Kinyarwanda', nativeName: 'Kinyarwanda', flagCode: 'rw' },
  sw: { name: 'Swahili', nativeName: 'Kiswahili', flagCode: 'ke' },
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
          <img 
            src={`https://flagcdn.com/w20/${languageNames[language]?.flagCode || 'un'}.png`} 
            srcSet={`https://flagcdn.com/w40/${languageNames[language]?.flagCode || 'un'}.png 2x`}
            width="20" 
            alt={language}
            className="rounded-sm object-cover" 
          />
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
        <DropdownMenuLabel>{t('common.language')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableLanguages.map((lang) => (
          <DropdownMenuItem 
            key={lang.code}
            className={cn(
              "flex items-center justify-between cursor-pointer",
              lang.code === language && "font-medium"
            )}
            onClick={() => {
              console.log(`[LanguageSwitcher] Item clicked: ${lang.code}`);
              setLanguage(lang.code as Language);
            }}
          >
            <div className="flex items-center gap-2">
              <img 
                src={`https://flagcdn.com/w20/${languageNames[lang.code as Language]?.flagCode || 'un'}.png`} 
                srcSet={`https://flagcdn.com/w40/${languageNames[lang.code as Language]?.flagCode || 'un'}.png 2x`}
                width="20" 
                alt={lang.code}
                className="rounded-sm object-cover shadow-sm" 
              />
              <span>{lang.name}</span>
            </div>
            {lang.code === language && <Check className="h-4 w-4 ml-2" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}