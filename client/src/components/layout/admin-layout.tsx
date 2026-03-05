import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { QuickActionMenu } from "@/components/dashboard/quick-action-menu";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  BellRing,
  CreditCard,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageSearch,
  Search,
  Settings,
  Shield,
  Star,
  Users,
  Wallet,
  Database,
  Lock,
  List,
  ChevronRight,
  ChevronLeft,
  BookCheck,
  Sliders,
  PanelTop,
  PanelLeftClose,
  PanelLeft,
  LayoutGrid,
  Info,
  Calendar,
  Clock,
  ArrowRight,
  ArrowRightCircle,
  HelpCircle,
  Filter,
  X,
  PackageIcon,
  Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { DashboardStyleSwitcher } from "@/components/dashboard/dashboard-style-switcher";
import { AuthService } from "@/services/auth.service";
import { UserPreferences } from "@shared/schema";
import { GlobalSearch } from "@/components/dashboard/global-search";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/ui/language-switcher-custom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/hooks/use-socket";


interface AppLayoutProps {
  children: ReactNode;
  hideSidebar?: boolean;
  defaultSidebarCollapsed?: boolean;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  onClick?: () => void;
}

export function AppLayout({ children, hideSidebar = false, defaultSidebarCollapsed = false }: AppLayoutProps) {
  const [location] = useLocation();
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(defaultSidebarCollapsed);
  const queryClient = useQueryClient();
  const { onEvent } = useSocket();

  // Fetch unread notification count
  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    enabled: !!user,
    refetchInterval: 60000, // fallback polling every 60s
  });
  const unreadCount = unreadData?.count ?? 0;

  // Real-time: invalidate unread count when a notification arrives
  useEffect(() => {
    const cleanup = onEvent("notification:new", () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    });
    return cleanup;
  }, [onEvent, queryClient]);

  // Keyboard shortcut: Ctrl+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        setSidebarCollapsed((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Check roles
  const isAdmin = user?.role === "Admin";
  const isAgent = user?.role === "Agent" || user?.role === "Moderator";
  const isSubscriber = user?.role === "Subscriber" || user?.role === "Business";

  // Get current dashboard path dynamically based on role and preference
  // Handle logout
  const handleLogout = () => {
    signOut();
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (user?.fullName) {
      return user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
    }
    return user?.username?.substring(0, 2).toUpperCase() || "U";
  };

  const dashboardPath = AuthService.getDashboardPathByRole(
    user?.role || '',
    (user?.preferences as UserPreferences)?.dashboardStyle
  );

  // Navigation categories and items based on role
  interface NavCategory {
    title: string;
    items: NavItem[];
  }

  const getCategorizedNavItems = (): NavCategory[] => {
    const categories: NavCategory[] = [];

    // CORE Category
    const coreItems: NavItem[] = [
      { title: t('nav.dashboard'), href: "/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> }
    ];
    if (isSubscriber) {
      coreItems.push({ title: t('nav.myItems'), href: "/my-items", icon: <List className="h-5 w-5" /> });
      coreItems.push({ title: t('nav.registerItems'), href: "/register-item", icon: <ArrowRightCircle className="h-5 w-5" /> });
    } else if (isAdmin || isAgent) {
      coreItems.push({ title: t('nav.adminPanel'), href: "/admin/item-management", icon: <List className="h-5 w-5" /> });
      coreItems.push({ title: t('nav.verification'), href: "/admin/verifications", icon: <AlertTriangle className="h-5 w-5" />, badge: 3 });
    }
    categories.push({ title: t('nav.navigation'), items: coreItems });

    // COMMUNITY Category
    const communityItems: NavItem[] = [
      { title: t('nav.search'), href: "/search", icon: <Search className="h-5 w-5" /> },
      { title: t('nav.lostFound'), href: "/dashboard?tab=claims", icon: <Shield className="h-5 w-5" /> }
    ];
    categories.push({ title: t('nav.community'), items: communityItems });

    // MANAGEMENT Category (Admin/Agent)
    if (isAdmin || isAgent) {
      const mgmtItems: NavItem[] = [
        { title: "User Directory", href: "/admin/users", icon: <Users className="h-5 w-5" /> }
      ];
      if (isAdmin) {
        mgmtItems.push({ title: "Client Management", href: "/admin/clients", icon: <Briefcase className="h-5 w-5" /> });
      }
      mgmtItems.push({ title: "Identity Verification", href: "/admin/verifications", icon: <BookCheck className="h-5 w-5" /> });
      mgmtItems.push({ title: "Moderation Queue", href: "/dashboard?tab=moderation", icon: <Shield className="h-5 w-5" /> });
      if (isAdmin) {
        mgmtItems.push({ title: "Analytics", href: "/admin/analytics", icon: <BarChart3 className="h-5 w-5" /> });
        mgmtItems.push({ title: "Roles", href: "/admin/roles", icon: <Shield className="h-5 w-5" /> });
      }
      categories.push({ title: "MANAGEMENT", items: mgmtItems });
    }

    return categories;
  };

  const navCategories = getCategorizedNavItems();
  const allNavItems = navCategories.flatMap(c => c.items); // For mobile and other lookups

  // Top Nav Items (Simplified for quick access)
  const topNavItems: NavItem[] = [
    { title: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { title: "Search Hub", href: "/search", icon: <Search className="h-4 w-4" /> },
    { title: "My Items", href: "/my-items", icon: <PackageIcon className="h-4 w-4" /> },
  ];

  // AdminLayout is now role-aware and available to all authenticated users

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top navigation bar */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] px-4 md:px-8 transition-all duration-300 group/header">
        <div className="grid grid-cols-3 h-16 items-center w-full max-w-[1600px] mx-auto relative px-4 md:px-0">
          {/* Column 1: Logo + Sidebar Toggle - Left Aligned */}
          <div className="flex items-center gap-2 md:gap-4 justify-self-start">
            {/* Mobile menu trigger */}
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="md:hidden rounded-xl border-border/50 bg-background/50 shadow-sm"
                  aria-label="Open Menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] p-0 border-r-0 overflow-hidden flex flex-col midnight-sidebar sidebar-dark-content dark">
                <div className="p-8 pb-4">
                  <SheetTitle className="sr-only">KIZERE Navigation Menu</SheetTitle>
                  <SheetDescription className="sr-only">
                    Access your property dashboard, lost & found hub, and platform settings.
                  </SheetDescription>
                  <div className="flex items-center space-x-3 mb-8">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                      <Shield className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-xl font-black block leading-none tracking-tighter text-white">{t('common.brandName')}</span>
                      <span className="text-[10px] uppercase tracking-[0.3em] text-primary font-black opacity-80">{t('common.brandSubtitle')}</span>
                    </div>
                  </div>

                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                    <Input
                      placeholder={t('common.searchPlaceholder')}
                      className="pl-9 bg-white/5 border-none focus-visible:ring-1 focus-visible:ring-primary/40 rounded-2xl h-11 text-sm text-white placeholder:text-muted-foreground/30"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-8 custom-scrollbar h-full">
                  <nav className="flex flex-col space-y-2 h-full">
                    {allNavItems.map((item) => {
                      const isActive = location === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={(e) => {
                            if (item.onClick) {
                              e.preventDefault();
                              item.onClick();
                            }
                            setIsMobileOpen(false);
                          }}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 text-sm font-bold transition-colors duration-300 relative rounded-2xl group",
                            isActive
                              ? "text-primary font-black bg-primary/10"
                              : item.title === "Terminate Session"
                                ? "text-red-500/70 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 mt-auto pt-8 border-t border-border"
                                : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="active-capsule-mobile"
                              className="absolute inset-0 active-capsule-glow rounded-2xl -z-10"
                              initial={false}
                              transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 30
                              }}
                            />
                          )}
                          <div className={cn(
                            "flex h-5 w-5 items-center justify-center transition-all duration-500",
                            isActive ? "text-primary scale-110 drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]" : "text-muted-foreground/30 group-hover:scale-110 group-hover:text-white"
                          )}>
                            {item.icon}
                          </div>
                          <span className="flex-1 tracking-tight">{item.title}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="h-5 px-2 text-[9px] bg-primary/20 text-primary border-none font-black rounded-full">
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo - always visible in header (top-left) */}
            <Link href="/" className="flex items-center space-x-2 lg:mr-4 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform duration-300">
                <Shield className="h-5 w-5" />
              </div>
              <div className="hidden sm:block">
                <span className="text-lg font-black block leading-none tracking-tighter text-foreground group-hover:text-primary transition-colors">
                  {t('common.brandName')}
                </span>
                <span className="text-[8px] uppercase tracking-[0.2em] text-primary font-black opacity-70">
                  {t('common.brandSubtitle')}
                </span>
              </div>
            </Link>
          </div>

          {/* Column 2: Global search - Perfectly Centered */}
          <div className="hidden md:flex justify-self-center w-full max-w-xl transition-all duration-300 focus-within:max-w-2xl px-4">
            <GlobalSearch variant="navbar" className="w-full h-10 rounded-xl" placeholder={t('common.searchPlaceholder')} />
          </div>

          {/* Column 3: Right side actions - Right Aligned */}
          <div className="flex items-center gap-2 md:gap-4 justify-self-end">
            <div className="hidden sm:flex items-center gap-1.5 md:gap-2 pr-3 border-r border-border/50">
              <motion.div whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.95 }}>
                <ThemeToggle />
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <LanguageSwitcher />
              </motion.div>
              <motion.div whileHover={{ scale: 1.1, rotate: -5 }} whileTap={{ scale: 0.95 }}>
                <DashboardStyleSwitcher />
              </motion.div>
            </div>

            {/* Notification bell */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative group/bell hover:bg-primary/5">
                    <motion.div
                      animate={unreadCount > 0 ? {
                        rotate: [0, -10, 10, -10, 10, 0],
                        scale: [1, 1.1, 1, 1.1, 1]
                      } : {}}
                      transition={{
                        repeat: Infinity,
                        duration: 3,
                        repeatDelay: 5
                      }}
                    >
                      <Bell className="h-5 w-5 text-muted-foreground group-hover/bell:text-primary transition-colors" />
                    </motion.div>
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground px-1 ring-2 ring-background animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-primary text-primary-foreground font-bold border-none">Notifications</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* User dropdown menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full p-0 overflow-hidden hover:ring-2 hover:ring-primary/20 transition-all duration-300"
                  aria-label="User menu"
                >
                  <Avatar className="h-full w-full">
                    <AvatarImage
                      src={user?.avatarUrl || undefined}
                      alt={user?.username || "User"}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">{getUserInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2 shadow-2xl border-border/50 rounded-2xl animate-in zoom-in-95 duration-200">
                <DropdownMenuLabel className="px-3 py-4">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-black leading-none tracking-tight">
                      {user?.fullName || user?.username}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground font-medium opacity-60">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/50" />
                <div className="p-1 space-y-1">
                  <DropdownMenuItem asChild className="rounded-xl cursor-pointer focus:bg-primary/10 focus:text-primary transition-colors py-2.5">
                    <Link href="/profile" className="flex items-center w-full">
                      <Users className="mr-3 h-4 w-4 opacity-50" />
                      <span className="font-bold">Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl cursor-pointer focus:bg-primary/10 focus:text-primary transition-colors py-2.5">
                    <Link href="/settings" className="flex items-center w-full">
                      <Settings className="mr-3 h-4 w-4 opacity-50" />
                      <span className="font-bold">Settings</span>
                    </Link>
                  </DropdownMenuItem>
                </div>
                <DropdownMenuSeparator className="bg-border/50" />
                <div className="p-1">
                  <DropdownMenuItem
                    className="rounded-xl cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive font-bold py-2.5"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    <span>{t('auth.logout')}</span>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden">
        {/* Left panel: Navigation sidebar - desktop only, collapsible */}
        {!hideSidebar && (
          <aside
            className={cn(
              "hidden md:flex flex-col h-full transition-all duration-300 ease-in-out relative group/sidebar",
              sidebarCollapsed ? "w-24 p-3" : "w-72 p-6"
            )}
          >
            <div className="flex flex-col h-full bg-card/40 backdrop-blur-2xl border border-white/10 dark:border-white/5 rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] overflow-hidden">
              <div className={cn("flex-1 overflow-y-auto custom-scrollbar", sidebarCollapsed ? "px-2 py-6" : "px-4 py-8")}>
                <nav className="flex flex-col space-y-8 h-full">
                  {navCategories.map((category, catIndex) => (
                    <motion.div
                      key={category.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: catIndex * 0.1, duration: 0.5 }}
                      className="flex flex-col space-y-2"
                    >
                      {!sidebarCollapsed && (
                        <h3 className="px-5 text-[10px] font-black tracking-[0.2em] text-muted-foreground/40 mb-2 uppercase">
                          {category.title}
                        </h3>
                      )}
                      {sidebarCollapsed && <Separator className="bg-white/5 mb-4 mx-2" />}

                      <div className="flex flex-col space-y-1">
                        {category.items.map((item, itemIndex) => {
                          const isActive = location === item.href;
                          return (
                            <TooltipProvider key={item.href}>
                              <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                  <Link
                                    href={item.href}
                                    onClick={(e) => {
                                      if (item.onClick) {
                                        e.preventDefault();
                                        item.onClick();
                                      }
                                    }}
                                    className={cn(
                                      "group relative flex items-center gap-3 text-sm font-bold transition-all duration-500 outline-none rounded-2xl",
                                      sidebarCollapsed ? "px-3 py-3 justify-center" : "px-5 py-3.5 hover:translate-x-1",
                                      isActive
                                        ? "text-primary font-black"
                                        : "text-muted-foreground/60 hover:text-foreground hover:bg-white/5"
                                    )}
                                  >
                                    {isActive && (
                                      <motion.div
                                        layoutId="active-nav-glow"
                                        className="absolute inset-0 bg-primary/10 rounded-2xl -z-10 shadow-[inner_0_0_12px_rgba(var(--primary),0.1)] border border-primary/20"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                      />
                                    )}
                                    <div className={cn(
                                      "flex h-5 w-5 items-center justify-center transition-all duration-500 shrink-0",
                                      isActive ? "text-primary scale-110 drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" : "text-muted-foreground/40 group-hover:text-primary group-hover:scale-110"
                                    )}>
                                      {item.icon}
                                    </div>
                                    {!sidebarCollapsed && (
                                      <span className="flex-1 truncate tracking-tight">{item.title}</span>
                                    )}
                                    {!sidebarCollapsed && item.badge && (
                                      <Badge
                                        variant="secondary"
                                        className={cn(
                                          "ml-auto h-5 px-2 text-[9px] font-black min-w-[20px] justify-center transition-all duration-500 border-none rounded-full",
                                          isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-white/5 text-muted-foreground/40"
                                        )}
                                      >
                                        {item.badge}
                                      </Badge>
                                    )}
                                  </Link>
                                </TooltipTrigger>
                                {sidebarCollapsed && (
                                  <TooltipContent side="right" className="font-bold border-none bg-primary text-primary-foreground backdrop-blur-xl">
                                    {item.title}
                                    {item.badge ? ` (${item.badge})` : ""}
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                          );
                        })}
                      </div>
                    </motion.div>
                  ))}
                </nav>
              </div>
            </div>

            {/* Smart toggle handle — always visible at the top edge */}
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className={cn(
                      "absolute top-10 z-20 flex items-center justify-center",
                      "h-6 w-6 rounded-full",
                      "bg-primary border border-primary/20 shadow-xl shadow-primary/20",
                      "text-primary-foreground hover:scale-110 active:scale-95 transition-all duration-300",
                      "right-[-12px]" // Center over the border
                    )}
                    aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  >
                    {sidebarCollapsed ? (
                      <ChevronRight className="h-3 w-3" />
                    ) : (
                      <ChevronLeft className="h-3 w-3" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs font-black bg-foreground text-background border-none">
                  {sidebarCollapsed ? "EXPAND" : "COLLAPSE"} <kbd className="ml-1 px-1 py-0.5 rounded bg-muted/20 text-[10px] font-mono">Ctrl+B</kbd>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </aside>
        )}

        {/* Center panel: Main content area */}
        <main className="flex-1 overflow-y-auto bg-neutral-50/50 dark:bg-background custom-scrollbar">
          <div className="p-8 pb-12 max-w-[1600px] mx-auto min-h-full flex flex-col">
            {children}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="mt-auto pt-16 pb-8 px-8 flex flex-col items-center">
        <div className="w-full max-w-[1600px] border-t border-border/30 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4 text-muted-foreground/60 transition-opacity hover:opacity-100 duration-300">
            <div className="flex items-center justify-center h-5 w-5 rounded-full bg-muted/30 border border-border/20" title={t('footer.systemStatus')}>
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[11px] font-medium tracking-wide">
              &copy; {new Date().getFullYear()} <span className="text-foreground/80 font-bold">{t('common.brandName')}</span>. {t('footer.rightsReserved')}
            </p>
          </div>

          <nav className="flex items-center gap-6">
            <Link
              href="/terms"
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 hover:text-primary transition-all duration-300 hover:tracking-[0.15em]"
            >
              {t('footer.terms')}
            </Link>
            <div className="h-1 w-1 rounded-full bg-border/40" />
            <Link
              href="/privacy"
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 hover:text-primary transition-all duration-300 hover:tracking-[0.15em]"
            >
              {t('footer.privacy')}
            </Link>
            <div className="h-1 w-1 rounded-full bg-border/40" />
            <Link
              href="/help"
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 hover:text-primary transition-all duration-300 hover:tracking-[0.15em]"
            >
              {t('footer.help')}
            </Link>
          </nav>
        </div>
      </footer>

      {/* Quick action floating menu */}
      <QuickActionMenu />
    </div>
  );
}