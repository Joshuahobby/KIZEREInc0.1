import React from 'react';
import { useTranslation } from 'react-i18next';
import { languages } from '@/lib/i18n';
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
  const { t, i18n } = useTranslation();
  
  // Get current language display name
  const currentLanguage = languages[i18n.language as keyof typeof languages] || languages.rw;

  // Change language handler
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

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
                i18n.language.toUpperCase()}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{t('common.language')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {Object.keys(languages).map((lng) => (
          <DropdownMenuItem 
            key={lng}
            className={cn(
              "flex items-center justify-between cursor-pointer",
              i18n.language === lng && "font-medium"
            )}
            onClick={() => changeLanguage(lng)}
          >
            <span>{languages[lng as keyof typeof languages].nativeName}</span>
            {i18n.language === lng && <Check className="h-4 w-4 ml-2" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}