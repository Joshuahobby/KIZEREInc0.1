import React from 'react';
import { useLanguage, Language, languages } from '@/lib/i18n/LanguageContext';
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

export function LanguageSwitcher({ 
  variant = 'default',
  className
}: LanguageSwitcherProps) {
  const { language, setLanguage, t } = useLanguage();
  
  // Get current language display name
  const currentLanguage = languages[language];

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
                currentLanguage.nativeName : 
                language.toUpperCase()}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{t('common.language')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(Object.keys(languages) as Language[]).map((lang) => (
          <DropdownMenuItem 
            key={lang}
            className={cn(
              "flex items-center justify-between cursor-pointer",
              lang === language && "font-medium"
            )}
            onClick={() => setLanguage(lang)}
          >
            <span>{languages[lang].nativeName}</span>
            {lang === language && <Check className="h-4 w-4 ml-2" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}