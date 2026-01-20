import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Moon, Sun, Bell, ChevronDown } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/providers/theme-provider";
import { LanguageSwitcher } from "@/lib/i18n/LanguageSwitcher";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

export function Header() {
  const [location] = useLocation();
  const { user, isAuthenticated, signOut } = useAuth();
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isDarkTheme = theme === "dark";

  // Handle scroll events to change header appearance
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isDashboardRoute = 
    location.startsWith("/dashboard") || 
    location.startsWith("/admin") || 
    location.startsWith("/agent");
  
  // Don't show header if we're on a dashboard page
  if (isAuthenticated && isDashboardRoute) {
    return null;
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full",
        isScrolled
          ? "border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
          : "bg-background"
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
            <a className="flex items-center gap-2">
              <Logo className="h-8 w-8" />
              <span className="text-xl font-bold">KIZERE</span>
            </a>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:gap-2">
          <NavigationMenu className="hidden md:block">
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link href="/">
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    {t("nav.home")}
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuTrigger>{t("nav.features")}</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    <div>
                      <Link href="/register-item">
                        <NavigationMenuLink
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none">
                            {t("nav.register")}
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Register your valuable items in our secure digital registry
                          </p>
                        </NavigationMenuLink>
                      </Link>
                    </div>
                    <div>
                      <Link href="/search">
                        <NavigationMenuLink
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none">
                            {t("nav.search")}
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Search for lost or found items in our database
                          </p>
                        </NavigationMenuLink>
                      </Link>
                    </div>
                    <div>
                      <Link href="/lost-found">
                        <NavigationMenuLink
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none">
                            {t("nav.lostFound")}
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Report lost items or items you've found
                          </p>
                        </NavigationMenuLink>
                      </Link>
                    </div>
                    {isAuthenticated && (
                      <div>
                        <Link href="/dashboard">
                          <NavigationMenuLink
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="text-sm font-medium leading-none">
                              {t("nav.dashboard")}
                            </div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Manage your registered items and reports
                            </p>
                          </NavigationMenuLink>
                        </Link>
                      </div>
                    )}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <Link href="/about">
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    {t("nav.about")}
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <Link href="/contact">
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    {t("nav.contact")}
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-1.5">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            aria-label={isDarkTheme ? "Switch to light theme" : "Switch to dark theme"}
            onClick={() => setTheme(isDarkTheme ? "light" : "dark")}
          >
            {isDarkTheme ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Notifications (for authenticated users) */}
          {isAuthenticated && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <Badge className="absolute -right-1 -top-1 h-5 min-w-[1.25rem] px-1 text-xs">
                    2
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-4 py-2">
                  <h4 className="font-medium">
                    {t("common.notifications")}
                  </h4>
                  <Badge variant="secondary" className="px-1.5 py-0.5">
                    {t("common.new")}
                  </Badge>
                </div>
                <DropdownMenuSeparator />
                <div className="max-h-80 overflow-y-auto">
                  <div className="flex cursor-pointer gap-4 px-4 py-3 hover:bg-accent">
                    <div>
                      <Avatar className="h-9 w-9">
                        <AvatarImage src="" />
                        <AvatarFallback>KZ</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">
                        {t("notifications.itemMatched")}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {t("notifications.itemMatchedDesc")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        2 {t("common.ago")}
                      </p>
                    </div>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <div className="p-2 text-center">
                  <Link href="/dashboard/notifications">
                    <Button variant="ghost" className="w-full">
                      {t("common.viewAll")}
                    </Button>
                  </Link>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* User Account (for authenticated users) */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-2 text-base"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={user?.avatarUrl || ""} 
                      alt={user?.fullName} 
                    />
                    <AvatarFallback>
                      {user?.fullName?.substring(0, 2).toUpperCase() || "??"}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem className="cursor-default p-2">
                  <div className="flex flex-col gap-1">
                    <p className="font-medium">{user?.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <Link href="/dashboard">
                  <DropdownMenuItem>
                    {t("nav.dashboard")}
                  </DropdownMenuItem>
                </Link>
                <Link href="/dashboard/profile">
                  <DropdownMenuItem>
                    {t("nav.profile")}
                  </DropdownMenuItem>
                </Link>
                <Link href="/dashboard/settings">
                  <DropdownMenuItem>
                    {t("nav.settings")}
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => signOut()}>
                  {t("auth.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost">{t("auth.signIn")}</Button>
              </Link>
              <Link href="/register">
                <Button>{t("auth.register")}</Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button
                variant="ghost" 
                size="icon"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col">
              <SheetHeader>
                <SheetTitle>
                  <div className="flex items-center gap-2">
                    <Logo className="h-6 w-6" />
                    <span className="font-bold">KIZERE</span>
                  </div>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  {t("nav.navigation")}
                </h3>
                <div className="flex flex-col gap-1">
                  <Link href="/">
                    <a className="py-2.5 px-3 rounded-md hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                      {t("nav.home")}
                    </a>
                  </Link>
                  <Link href="/register-item">
                    <a className="py-2.5 px-3 rounded-md hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                      {t("nav.register")}
                    </a>
                  </Link>
                  <Link href="/search">
                    <a className="py-2.5 px-3 rounded-md hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                      {t("nav.search")}
                    </a>
                  </Link>
                  <Link href="/lost-found">
                    <a className="py-2.5 px-3 rounded-md hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                      {t("nav.lostFound")}
                    </a>
                  </Link>
                  <Link href="/about">
                    <a className="py-2.5 px-3 rounded-md hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                      {t("nav.about")}
                    </a>
                  </Link>
                  <Link href="/contact">
                    <a className="py-2.5 px-3 rounded-md hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                      {t("nav.contact")}
                    </a>
                  </Link>
                </div>
              </div>
              {isAuthenticated && (
                <div className="mt-6">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    {t("nav.account")}
                  </h3>
                  <div className="flex flex-col gap-1">
                    <Link href="/dashboard">
                      <a className="py-2.5 px-3 rounded-md hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                        {t("nav.dashboard")}
                      </a>
                    </Link>
                    <Link href="/dashboard/profile">
                      <a className="py-2.5 px-3 rounded-md hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                        {t("nav.profile")}
                      </a>
                    </Link>
                    <Link href="/dashboard/settings">
                      <a className="py-2.5 px-3 rounded-md hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                        {t("nav.settings")}
                      </a>
                    </Link>
                    <button 
                      className="text-left py-2.5 px-3 rounded-md hover:bg-accent hover:text-destructive text-red-500"
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                      }}
                    >
                      {t("auth.signOut")}
                    </button>
                  </div>
                </div>
              )}
              <div className="mt-auto">
                {!isAuthenticated && (
                  <div className="grid grid-cols-2 gap-2 mb-6">
                    <Link href="/login">
                      <Button variant="outline" className="w-full" onClick={() => setMobileMenuOpen(false)}>
                        {t("auth.signIn")}
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button className="w-full" onClick={() => setMobileMenuOpen(false)}>
                        {t("auth.register")}
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}