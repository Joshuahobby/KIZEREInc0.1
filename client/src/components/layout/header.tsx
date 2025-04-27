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
import { Menu, X, User } from "lucide-react";
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
  };

  // Navigation links that are visible to all users
  const publicNavigation: NavItem[] = [
    { name: t('nav.home'), href: "/" },
    { name: t('nav.search'), href: "/search" },
    { name: t('nav.lostFound'), href: "/lost-found" },
  ];

  // Navigation links that are only visible to authenticated users
  const authNavigation: NavItem[] = [
    { name: t('nav.dashboard'), href: "/" },
    { name: t('nav.registerItems'), href: "/register" },
    { name: t('nav.search'), href: "/search" },
    { name: t('nav.lostFound'), href: "/lost-found" },
    // Admin-only navigation
    { name: t('nav.userManagement'), href: "/user-management", admin: true },
  ];

  // Choose the appropriate navigation based on authentication status
  const navigation = isAuthenticated ? authNavigation : publicNavigation;

  const handleLogout = () => {
    signOut();
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };
  
  // Determine the appropriate dashboard path based on user role
  const getDashboardPath = (): string => {
    if (!user) return "/dashboard";
    
    switch (user.role) {
      case "Admin":
        return "/admin";
      case "Agent":
        return "/lost-found";
      default:
        return "/dashboard";
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Always show the logo, but with a different link for authenticated users */}
          <div className="flex-shrink-0 flex items-center">
            <Link href={isAuthenticated ? getDashboardPath() : "/"}>
              <h1 className="text-2xl font-display font-bold text-primary-600 cursor-pointer">KIZERE</h1>
            </Link>
          </div>
          
          {/* Only show navigation for non-authenticated users */}
          {!isAuthenticated && (
            <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                if (item.admin && !isAdmin) return null;
                
                return (
                  <Link key={item.name} href={item.href}>
                    <a
                      className={`${
                        isActive(item.href)
                          ? "border-primary-500 text-neutral-900"
                          : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700"
                      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                    >
                      {item.name}
                    </a>
                  </Link>
                );
              })}
            </nav>
          )}

          <div className="ml-6 flex items-center gap-2">
            {/* Language Switcher */}
            <LanguageSwitcher variant="minimal" />
            
            {isAuthenticated ? (
              /* User Profile Menu for authenticated users */
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-0">
                    <AvatarWithInitials name={user?.fullName || ''} className="h-8 w-8" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem>
                    <Link href="/profile">
                      <div className="flex w-full cursor-pointer">{t('profile.title')}</div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/settings">
                      <div className="flex w-full cursor-pointer">{t('settings.title')}</div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    {t('auth.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              /* Login/Register button for guests */
              <Link href="/auth">
                <Button className="flex items-center gap-1">
                  <User className="h-4 w-4 mr-1" />
                  {t('auth.login')}
                </Button>
              </Link>
            )}
          </div>

          {/* Only show mobile menu button for non-authenticated users */}
          {!isAuthenticated && (
            <div className="flex items-center sm:hidden">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={toggleMobileMenu}
                aria-controls="mobile-menu"
                aria-expanded={mobileMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu - only shown for non-authenticated users */}
      {!isAuthenticated && (
        <div className={`${mobileMenuOpen ? "" : "hidden"} sm:hidden`} id="mobile-menu">
          <div className="pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              if (item.admin && !isAdmin) return null;
              
              return (
                <Link key={item.name} href={item.href}>
                  <a
                    className={`${
                      isActive(item.href)
                        ? "bg-primary-50 border-primary-500 text-primary-700"
                        : "border-transparent text-neutral-500 hover:bg-gray-50 hover:border-neutral-300 hover:text-neutral-700"
                    } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </a>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
