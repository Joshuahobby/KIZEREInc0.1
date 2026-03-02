import * as React from "react";
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
import {
  Menu,
  X,
  User,
  Search,
  PlusCircle,
  LayoutDashboard,
  Bell,
  Package,
  Settings,
  Shield,
  LogOut,
  Home,
  Info,
  Users,
  Mail,
  Phone
} from "lucide-react";
import { LanguageSwitcher } from "@/components/ui/language-switcher-custom";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DashboardStyleSwitcher } from "@/components/dashboard/dashboard-style-switcher";
import { GlobalSearch } from "@/components/dashboard/global-search";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { WifiOff } from "lucide-react";

export function Header() {
  const [location] = useLocation();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const { t } = useLanguage();
  const isOnline = useOnlineStatus();

  const isAdmin = user?.role === "Admin";
  const isAuthenticated = !!user;

  // Handle scroll events to change header appearance
  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Define the navigation item type
  type NavItem = {
    name: string;
    href: string;
    icon?: any;
  };

  const getDashboardPath = (): string => {
    if (!user) return "/dashboard";
    switch (user.role) {
      case "Admin": return "/admin";
      case "Agent": return "/lost";
      default: return "/dashboard";
    }
  };

  // Dynamic navigation based on auth state
  const navigation: NavItem[] = isAuthenticated
    ? [
      { name: t('nav.dashboard'), href: "/dashboard", icon: LayoutDashboard },
      { name: "Lost Directory", href: "/lost", icon: Search },
      { name: "Found Directory", href: "/found", icon: Package },
    ]
    : [
      { name: t('nav.home'), href: "/", icon: Home },
      { name: "Lost Directory", href: "/lost", icon: Search },
      { name: "Found Directory", href: "/found", icon: Package },
      { name: "Community", href: "/community", icon: Users },
      { name: "About", href: "/about", icon: Info },
      { name: "Contact", href: "/contact", icon: Mail },
    ];

  // Admin access is now handled via the sidebar in the dashboard layout

  const handleLogout = () => {
    signOut();
  };

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && path !== "/#features" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-200 border-b",
        isScrolled
          ? "bg-background/80 backdrop-blur-md shadow-sm border-border"
          : "bg-background border-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            {/* Logo */}
            <Link href={isAuthenticated ? getDashboardPath() : "/"} className="flex items-center gap-2 group" aria-label="KIZERE Home">
              <Logo className="h-8 w-8 transition-transform group-hover:scale-110" aria-hidden="true" />
              <span className="text-xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70 tracking-tighter">
                KIZERE
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex lg:items-center lg:gap-1 ml-8" aria-label="Main Navigation">
              {!isOnline && (
                <Badge variant="outline" className="mr-2 border-amber-500/50 bg-amber-500/10 text-amber-600 animate-pulse gap-1">
                  <WifiOff className="h-3 w-3" />
                  Offline
                </Badge>
              )}
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive(item.href)
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  {item.name}
                </Link>
              ))}

              {isAuthenticated && (
                <div className="ml-4 lg:ml-6">
                  <GlobalSearch variant="navbar" placeholder="Quick search..." />
                </div>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {/* Actions grouped together */}
            <div className="flex items-center gap-1 sm:gap-2 mr-2">
              <ThemeToggle />

              <div className="hidden sm:block">
                <LanguageSwitcher variant="minimal" />
              </div>

              {isAdmin && (
                <div className="hidden md:block">
                  <DashboardStyleSwitcher />
                </div>
              )}

              {isAuthenticated && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative group">
                      <Bell className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      <Badge className="absolute -right-1 -top-1 h-4 min-w-[1rem] px-1 text-[10px] bg-primary flex items-center justify-center">
                        2
                      </Badge>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 p-0 shadow-xl border-border rounded-xl">
                    <div className="p-4 border-b flex justify-between items-center bg-muted/50">
                      <h4 className="font-semibold text-sm">{t('common.notifications') || "Notifications"}</h4>
                      <Badge variant="secondary" className="text-[10px]">{t('common.new') || "New"}</Badge>
                    </div>
                    <div className="max-h-80 overflow-y-auto p-2">
                      <div className="flex gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Shield className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-xs font-medium line-clamp-1">{t('notifications.itemMatched') || "Item Matched"}</p>
                          <p className="text-[10px] text-muted-foreground line-clamp-2">
                            {t('notifications.itemMatchedDesc') || "A matching item has been found in the system."}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2 border-t">
                      <Button variant="ghost" size="sm" className="w-full text-xs h-8" asChild>
                        <Link href="/dashboard/notifications">{t('common.viewAll') || "View All"}</Link>
                      </Button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <div className="h-6 w-px bg-border hidden sm:block mx-1"></div>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 overflow-hidden ring-offset-background transition-all hover:ring-2 hover:ring-primary/20">
                    <AvatarWithInitials name={user?.fullName || ''} className="h-full w-full" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60 p-1 shadow-xl border-border rounded-xl">
                  <div className="px-3 py-3 border-b mb-1">
                    <p className="text-sm font-semibold truncate">{user.fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email || user.username}</p>
                  </div>
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer focus:bg-accent">
                    <Link href="/profile" className="flex items-center w-full">
                      <User className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{t('profile.title') || "Profile"}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer focus:bg-accent">
                    <Link href="/settings" className="flex items-center w-full">
                      <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{t('settings.title') || "Settings"}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="rounded-lg cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive font-medium"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('auth.logout') || "Sign Out"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild className="hidden md:inline-flex rounded-full px-6 shadow-md hover:shadow-lg transition-all bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-9 text-sm">
                <Link href="/auth">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{t('auth.getStarted') || t('auth.signIn') || "Get Started"}</span>
                  </div>
                </Link>
              </Button>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-full ml-1"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md animate-in slide-in-from-top duration-300">
          <div className="px-4 py-6 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-4 py-3 rounded-xl text-base font-medium transition-all",
                  isActive(item.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.icon && <item.icon className="mr-3 h-5 w-5" />}
                {item.name}
              </Link>
            ))}

            <div className="pt-4 border-t border-border mt-4 flex flex-col gap-4">
              <div className="flex items-center justify-between px-4">
                <span className="text-sm font-medium text-muted-foreground">{t('common.language') || "Language"}</span>
                <LanguageSwitcher variant="minimal" />
              </div>

              {!isAuthenticated && (
                <div className="flex flex-col gap-2">
                  <Button asChild className="w-full rounded-xl py-6 rounded-full shadow-md bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg">
                    <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                      {t('auth.getStarted') || "Get Started"}
                    </Link>
                  </Button>
                </div>
              )}

              {isAuthenticated && (
                <>
                  <Link href="/profile" className="flex items-center px-4 py-3 rounded-xl text-base font-medium text-muted-foreground hover:bg-accent hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
                    <User className="mr-3 h-5 w-5" />
                    {t('profile.title') || "Profile"}
                  </Link>
                  <Link href="/settings" className="flex items-center px-4 py-3 rounded-xl text-base font-medium text-muted-foreground hover:bg-accent hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
                    <Settings className="mr-3 h-5 w-5" />
                    {t('settings.title') || "Settings"}
                  </Link>
                </>
              )}

              {isAuthenticated && (
                <Button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full rounded-xl py-6 rounded-full shadow-md bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold text-lg mt-2"
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  {t('auth.logout') || "Sign Out"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
