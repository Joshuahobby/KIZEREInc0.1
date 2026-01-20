import { useState } from "react";
import { Link, useLocation } from "wouter";
import { AvatarWithInitials } from "@/components/ui/avatar-with-initials";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Menu, X, User, Search, PlusCircle, LayoutDashboard } from "lucide-react";
import { LanguageSwitcher } from "@/components/ui/language-switcher-custom";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export function Header() {
  const [location] = useLocation();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useLanguage();

  const isAdmin = user?.role === "Admin";
  const isAuthenticated = !!user;

  // Define the navigation item type
  type NavItem = {
    name: string;
    href: string;
    admin?: boolean;
    icon?: any;
  };

  const getDashboardPath = (): string => {
    if (!user) return "/dashboard";
    switch (user.role) {
      case "Admin": return "/admin";
      case "Agent": return "/lost-found";
      default: return "/dashboard";
    }
  };

  // Dynamic navigation based on auth state
  const navigation: NavItem[] = isAuthenticated 
    ? [
        { name: t('nav.dashboard'), href: getDashboardPath(), icon: LayoutDashboard },
        { name: t('nav.myItems'), href: "/my-items" }, 
        { name: t('nav.lostFound'), href: "/lost-found" },
        { name: t('nav.search'), href: "/search", icon: Search },
        { name: t('nav.registerItems'), href: "/register-item", icon: PlusCircle },
      ]
    : [
        { name: t('nav.home'), href: "/" },
        { name: t('nav.features'), href: "/#features" },
        { name: t('nav.search'), href: "/search", icon: Search },
      ];

  if (isAdmin) {
    navigation.push({ name: t('nav.userManagement'), href: "/user-management" });
  }

  const authActions: NavItem[] = []; // Deprecated, kept empty for safety

  const handleLogout = () => {
    signOut();
  };

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center mr-8">
              <Link href={isAuthenticated ? getDashboardPath() : "/"}>
                <h1 className="text-2xl font-display font-bold text-primary-600 cursor-pointer tracking-tight">KIZERE</h1>
              </Link>
            </div>
            
            {/* Desktop Navigation - Hidden on mobile */}
            <nav className="hidden md:flex md:space-x-4">
              {navigation.map((item) => (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className={`${
                    isActive(item.href)
                      ? "border-primary-500 text-neutral-900"
                      : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
                  } inline-flex items-center px-2 pt-1 border-b-2 text-sm font-medium transition-colors`}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Actions removed (merged into main navigation) */}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Language Switcher grouped in background - hidden on mobile */}
            <div className="bg-neutral-50 rounded-full px-1 border border-neutral-100 hidden lg:block">
              <LanguageSwitcher variant="minimal" />
            </div>
            
            <div className="h-6 w-px bg-neutral-200 hidden lg:block mx-1"></div>
            
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="p-1 h-auto rounded-full hover:bg-neutral-100 transition-all border border-transparent hover:border-neutral-200">
                      <AvatarWithInitials name={user?.fullName || ''} className="h-9 w-9" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mt-1 shadow-xl border-neutral-200 rounded-xl p-1">
                    <div className="px-3 py-2 text-xs font-semibold text-neutral-400 uppercase tracking-widest leading-none mb-1">
                      {user.fullName}
                    </div>
                    <DropdownMenuSeparator className="mx-1" />
                    <DropdownMenuItem className="rounded-lg cursor-pointer focus:bg-neutral-50">
                      <Link href="/profile">
                        <div className="flex items-center w-full py-1">
                          <User className="mr-2 h-4 w-4 text-neutral-500" />
                          <span>{t('profile.title')}</span>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-lg cursor-pointer focus:bg-neutral-50">
                      <Link href="/settings">
                        <div className="flex items-center w-full py-1">
                          <PlusCircle className="mr-2 h-4 w-4 text-neutral-500" />
                          <span>{t('settings.title')}</span>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="mx-1" />
                    <DropdownMenuItem onClick={handleLogout} className="rounded-lg cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700">
                      <div className="flex items-center w-full py-1 font-medium">
                        <X className="mr-2 h-4 w-4" />
                        {t('auth.logout')}
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Link href="/auth">
                <Button className="flex items-center gap-2 rounded-full px-6 shadow-sm hover:shadow transition-all bg-primary-600 hover:bg-primary-700 text-white font-semibold">
                  <User className="h-4 w-4" />
                  {t('auth.getStarted') || "Get Started"}
                </Button>
              </Link>
            )}

            {/* Mobile menu button - visible on small screens */}
            <div className="flex items-center md:hidden">
              <Button 
                variant="ghost" 
                size="icon"
                className="rounded-full hover:bg-neutral-100"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6 text-neutral-500" />
                ) : (
                  <Menu className="h-6 w-6 text-neutral-500" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${mobileMenuOpen ? "block" : "hidden"} md:hidden border-t border-neutral-100 bg-white`}>
        <div className="pt-2 pb-3 space-y-1">
          {navigation.map((item) => (
            <Link 
              key={item.name} 
              href={item.href}
              className={`${
                isActive(item.href)
                  ? "bg-primary-50 border-primary-500 text-primary-700"
                  : "border-transparent text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700"
              } block pl-3 pr-4 py-3 border-l-4 text-base font-medium transition-all cursor-pointer`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}
          {/* Auth actions and Admin links merged into main navigation loop */}
        </div>
        <div className="pt-4 pb-3 border-t border-neutral-100 px-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-500">{t('common.language')}</span>
            <LanguageSwitcher variant="minimal" />
          </div>
        </div>
      </div>
    </header>
  );
}
