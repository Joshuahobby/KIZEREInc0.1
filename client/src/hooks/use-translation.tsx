import { useContext, createContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'fr' | 'rw' | 'sw';

type TranslationContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
  availableLanguages: Language[];
};

// Create the context
const TranslationContext = createContext<TranslationContextType | null>(null);

// Base translations
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Common
    'app.name': 'KIZERE',
    'app.tagline': 'Secure your belongings',
    
    // Authentication
    'auth.login': 'Log in',
    'auth.register': 'Register',
    'auth.logout': 'Log out',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.username': 'Username',
    'auth.fullName': 'Full Name',
    'auth.phoneNumber': 'Phone Number',
    
    // Navigation
    'nav.home': 'Home',
    'nav.dashboard': 'Dashboard',
    'nav.items': 'My Items',
    'nav.reports': 'Lost & Found',
    'nav.profile': 'Profile',
    'nav.settings': 'Settings',
    
    // Admin
    'admin.dashboard': 'Admin Dashboard',
    'admin.users': 'User Management',
    'admin.payments': 'Payment Dashboard',
    'admin.analytics': 'Analytics',
    'admin.settings': 'Settings',
    
    // Items
    'items.register': 'Register Item',
    'items.myItems': 'My Items',
    'items.search': 'Search Items',
    'items.details': 'Item Details',
    'items.edit': 'Edit Item',
    'items.delete': 'Delete Item',
    'items.transfer': 'Transfer Ownership',
    
    // Reports
    'reports.lostItems': 'Lost Items',
    'reports.foundItems': 'Found Items',
    'reports.myReports': 'My Reports',
    'reports.file': 'File Report',
    'reports.details': 'Report Details',
    
    // Payments
    'payment.history': 'Payment History',
    'payment.methods': 'Payment Methods',
    'payment.add': 'Add Payment Method',
    'payment.process': 'Process Payment',
    'payment.successful': 'Payment Successful',
    'payment.failed': 'Payment Failed',
    'payment.pending': 'Payment Pending',
    'payment.refund': 'Refund Payment',
    
    // Legal
    'legal.terms': 'Terms of Service',
    'legal.privacy': 'Privacy Policy',
    
    // Misc
    'misc.loading': 'Loading...',
    'misc.error': 'Error',
    'misc.success': 'Success',
    'misc.save': 'Save',
    'misc.cancel': 'Cancel',
    'misc.delete': 'Delete',
    'misc.edit': 'Edit',
    'misc.submit': 'Submit',
    'misc.confirm': 'Confirm',
  },
  fr: {
    // Common
    'app.name': 'KIZERE',
    'app.tagline': 'Sécurisez vos biens',
    
    // Authentication
    'auth.login': 'Se connecter',
    'auth.register': 'S\'inscrire',
    'auth.logout': 'Se déconnecter',
    'auth.email': 'Email',
    'auth.password': 'Mot de passe',
    'auth.confirmPassword': 'Confirmer le mot de passe',
    'auth.username': 'Nom d\'utilisateur',
    'auth.fullName': 'Nom complet',
    'auth.phoneNumber': 'Numéro de téléphone',
    
    // Navigation
    'nav.home': 'Accueil',
    'nav.dashboard': 'Tableau de bord',
    'nav.items': 'Mes objets',
    'nav.reports': 'Objets perdus & trouvés',
    'nav.profile': 'Profil',
    'nav.settings': 'Paramètres',
    
    // Admin
    'admin.dashboard': 'Tableau de bord admin',
    'admin.users': 'Gestion des utilisateurs',
    'admin.payments': 'Tableau de bord des paiements',
    'admin.analytics': 'Analytiques',
    'admin.settings': 'Paramètres',
  },
  rw: {
    // Common
    'app.name': 'KIZERE',
    'app.tagline': 'Rinda umutekano w\'ibikoresho byawe',
    
    // Authentication
    'auth.login': 'Injira',
    'auth.register': 'Iyandikishe',
    'auth.logout': 'Sohoka',
    'auth.email': 'Imeri',
    'auth.password': 'Ijambo ry\'ibanga',
    'auth.confirmPassword': 'Emeza ijambo ry\'ibanga',
    'auth.username': 'Izina ry\'ukoresha',
    'auth.fullName': 'Amazina yose',
    'auth.phoneNumber': 'Telefoni',
    
    // Navigation
    'nav.home': 'Ahabanza',
    'nav.dashboard': 'Ikibaho',
    'nav.items': 'Ibintu byanjye',
    'nav.reports': 'Ibyabuze & Ibyatoraguwe',
    'nav.profile': 'Umwirondoro',
    'nav.settings': 'Igenamiterere',
    
    // Admin
    'admin.dashboard': 'Ikibaho cy\'umuyobozi',
    'admin.users': 'Icunga ry\'abakoresha',
    'admin.payments': 'Ikibaho cy\'ubwishyu',
    'admin.analytics': 'Imibare',
    'admin.settings': 'Igenamiterere',
  },
  sw: {
    // Common
    'app.name': 'KIZERE',
    'app.tagline': 'Linda mali yako',
    
    // Authentication
    'auth.login': 'Ingia',
    'auth.register': 'Jiandikishe',
    'auth.logout': 'Toka',
    'auth.email': 'Barua pepe',
    'auth.password': 'Neno la siri',
    'auth.confirmPassword': 'Thibitisha neno la siri',
    'auth.username': 'Jina la mtumiaji',
    'auth.fullName': 'Jina kamili',
    'auth.phoneNumber': 'Namba ya simu',
    
    // Navigation
    'nav.home': 'Nyumbani',
    'nav.dashboard': 'Dashibodi',
    'nav.items': 'Vitu vyangu',
    'nav.reports': 'Vitu vilivyopotea & Kupatikana',
    'nav.profile': 'Wasifu',
    'nav.settings': 'Mipangilio',
    
    // Admin
    'admin.dashboard': 'Dashibodi ya Msimamizi',
    'admin.users': 'Usimamizi wa Watumiaji',
    'admin.payments': 'Dashibodi ya Malipo',
    'admin.analytics': 'Uchambuzi',
    'admin.settings': 'Mipangilio',
  },
};

// Provider component
export function TranslationProvider({ children }: { children: ReactNode }): JSX.Element {
  const [language, setLanguage] = useState<Language>('en');
  const availableLanguages: Language[] = ['en', 'fr', 'rw', 'sw'];

  // Load stored language preference from localStorage, defaulting to 'rw' (Kinyarwanda)
  useEffect(() => {
    const storedLanguage = localStorage.getItem('language') as Language;
    if (storedLanguage && availableLanguages.includes(storedLanguage)) {
      setLanguage(storedLanguage);
    } else {
      // Default to Kinyarwanda
      setLanguage('rw');
      localStorage.setItem('language', 'rw');
    }
  }, []);

  // Update localStorage when language changes
  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  // Translation function with parameter replacement
  const translate = (key: string, params?: Record<string, string>): string => {
    // Get the translation from the current language
    let translation = translations[language][key];
    
    // Fallback to English if the key doesn't exist in the current language
    if (!translation && language !== 'en') {
      translation = translations['en'][key];
    }
    
    // Default to key if no translation found
    if (!translation) {
      return key;
    }
    
    // Replace parameters if provided
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        translation = translation.replace(`{{${paramKey}}}`, value);
      });
    }
    
    return translation;
  };

  const value: TranslationContextType = {
    language,
    setLanguage: handleLanguageChange,
    t: translate,
    availableLanguages,
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

// Hook to use the translation context
export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}