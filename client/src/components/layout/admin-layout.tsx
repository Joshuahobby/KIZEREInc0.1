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
  BookCheck,
  Sliders,
  PanelTop,
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
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  onClick?: () => void;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
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
    icon: React.ReactNode;
    items: NavItem[];
    badge?: number;
  }

  const getNavItems = (): NavItem[] => {
    const items: NavItem[] = [];

    // Core
    items.push({ title: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> });

    // Assets / Property
    if (isSubscriber) {
      items.push({ title: "My Items", href: "/my-items", icon: <List className="h-5 w-5" /> });
      items.push({ title: "Register New", href: "/register-item", icon: <ArrowRightCircle className="h-5 w-5" /> });
    } else if (isAdmin || isAgent) {
      items.push({ title: "Item Database", href: "/admin/items", icon: <List className="h-5 w-5" /> });
      items.push({ title: "Verification Queue", href: "/admin/item-verification", icon: <AlertTriangle className="h-5 w-5" />, badge: 3 });
    }

    // Community
    items.push({ title: "Search Hub", href: "/lost-found", icon: <Search className="h-5 w-5" /> });
    items.push({ title: "My Claims", href: "/dashboard?tab=claims", icon: <Shield className="h-5 w-5" /> });

    // Management (Admin/Agent)
    if (isAdmin || isAgent) {
      items.push({ title: "User Directory", href: "/admin/users", icon: <Users className="h-5 w-5" /> });
      if (isAdmin) {
        items.push({ title: "Client Management", href: "/admin/clients", icon: <Briefcase className="h-5 w-5" /> });
      }
      items.push({ title: "Identity Verification", href: "/admin/user-verification", icon: <BookCheck className="h-5 w-5" /> });
      items.push({ title: "Moderation Queue", href: "/dashboard?tab=moderation", icon: <Shield className="h-5 w-5" /> });
      if (isAdmin) {
        items.push({ title: "Reports & Analytics", href: "/admin/analytics", icon: <BarChart3 className="h-5 w-5" /> });
        items.push({ title: "Roles & Permissions", href: "/admin/roles", icon: <Shield className="h-5 w-5" /> });
        items.push({ title: "Audit Logs", href: "/admin/audit-logs", icon: <FileText className="h-5 w-5" /> });
      }
    }

    // Finance (Admin/Subscriber)
    if (isSubscriber || isAdmin) {
      items.push({ title: isAdmin ? "Financial Insights" : "My Wallet", href: isAdmin ? "/admin/payment-dashboard" : "/wallet", icon: isAdmin ? <CreditCard className="h-5 w-5" /> : <Wallet className="h-5 w-5" /> });
      items.push({ title: "Pricing Plans", href: "/admin/payment-packages", icon: <PackageIcon className="h-5 w-5" /> });
    }

    // System
    items.push({ title: "Settings", href: isAdmin ? "/admin/settings" : "/profile", icon: <Settings className="h-5 w-5" /> });
    items.push({ title: "Security", href: isAdmin ? "/admin/security" : "/settings", icon: <Lock className="h-5 w-5" /> });

    // Logout Item (Added for easy access since card is removed)
    items.push({
      title: "Terminate Session",
      href: "#",
      icon: <LogOut className="h-5 w-5" />,
      onClick: handleLogout
    });

    return items;
  };

  const navItems = getNavItems();

  // Top Nav Items (Simplified for quick access)
  const topNavItems: NavItem[] = [
    { title: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { title: "Lost & Found", href: "/lost-found", icon: <Search className="h-4 w-4" /> },
    { title: "My Items", href: "/my-items", icon: <PackageIcon className="h-4 w-4" /> },
  ];

  // AdminLayout is now role-aware and available to all authenticated users

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top navigation bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm px-4 md:px-8">
        <div className="flex h-16 items-center w-full max-w-[1600px] mx-auto relative">
          {/* Logo - Left */}
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            {/* Mobile menu trigger */}
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="md:hidden"
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
                      <span className="text-xl font-black block leading-none tracking-tighter text-white">KIZERE</span>
                      <span className="text-[10px] uppercase tracking-[0.3em] text-primary font-black opacity-80">CENTRAL HUB</span>
                    </div>
                  </div>

                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                    <Input
                      placeholder="Search OS..."
                      className="pl-9 bg-white/5 border-none focus-visible:ring-1 focus-visible:ring-primary/40 rounded-2xl h-11 text-sm text-white placeholder:text-muted-foreground/30"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-8 custom-scrollbar h-full">
                  <nav className="flex flex-col space-y-2 h-full">
                    {navItems.map((item) => {
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

            {/* Logo for larger screens */}
            <Link href="/" className="md:hidden flex items-center space-x-2 mr-4 lg:mr-8 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-all duration-300">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <span className="hidden font-bold text-lg md:inline-block tracking-tight text-foreground/90 group-hover:text-primary transition-colors">
                KIZERE <span className="text-primary/80">Hub</span>
              </span>
            </Link>
          </div>

          {/* Global search - Centered */}
          <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center w-full max-w-[400px] lg:max-w-xl">
            <div className="w-full bg-muted/30 hover:bg-muted/50 transition-colors border-none rounded-md overflow-hidden">
              <GlobalSearch variant="navbar" placeholder="Press ⌘K to search everything..." />
            </div>
          </div>

          {/* Right side actions - Right aligned */}
          <div className="ml-auto flex items-center gap-1.5 md:gap-3">
            <div className="hidden sm:flex items-center gap-1.5 md:gap-2 pr-2 border-r mr-1.5 md:mr-2">
              <ThemeToggle />
              <LanguageSwitcher />
              <DashboardStyleSwitcher />
            </div>

            {/* Notification bell */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1 ring-2 ring-background">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Notifications</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* User dropdown menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                  aria-label="User menu"
                >
                  <Avatar>
                    <AvatarImage
                      src={user?.avatarUrl || undefined}
                      alt={user?.username || "User"}
                    />
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.fullName || user?.username}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="w-full cursor-pointer">
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="w-full cursor-pointer">
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden">
        {/* Left panel: Navigation sidebar - desktop only */}
        <aside className="hidden md:flex flex-col w-72 h-full p-6">
          <div className="flex flex-col h-full bg-card/50 backdrop-blur-xl border border-border/60 rounded-[2rem] shadow-xl shadow-neutral-200/20 dark:shadow-none overflow-hidden">
            <div className="p-8 pb-4">
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform duration-500">
                  <Shield className="h-6 w-6" />
                </div>
                <div className="transition-all duration-500">
                  <span className="text-xl font-black block leading-none tracking-tighter text-foreground">KIZERE</span>
                  <span className="text-[10px] uppercase tracking-[0.3em] text-primary font-black opacity-80">CENTRAL HUB</span>
                </div>
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-8 custom-scrollbar">
              <nav className="flex flex-col space-y-2 h-full">
                {navItems.map((item) => {
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
                      }}
                      className={cn(
                        "group relative flex items-center gap-3 px-5 py-3 text-sm font-bold transition-all duration-300 outline-none rounded-2xl hover:translate-x-1",
                        isActive
                          ? "text-primary font-black bg-primary/10"
                          : item.title === "Terminate Session"
                            ? "text-red-500/70 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 mt-auto mb-6 border-t border-border pt-6 mx-2"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/10"
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="active-capsule-desktop"
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
                        isActive ? "text-primary scale-110 drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]" : "text-muted-foreground/30 group-hover:text-white group-hover:scale-110"
                      )}>
                        {item.icon}
                      </div>
                      <span className="flex-1 truncate tracking-tight">{item.title}</span>
                      {item.badge && (
                        <Badge
                          variant="secondary"
                          className={cn(
                            "ml-auto h-5 px-2 text-[9px] font-black min-w-[20px] justify-center transition-all duration-500 border-none rounded-full",
                            isActive ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground/30"
                          )}
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </aside>

        {/* Center panel: Main content area */}
        <main className="flex-1 overflow-y-auto bg-neutral-50/50 dark:bg-background custom-scrollbar">
          <div className="p-8 pb-12 max-w-[1600px] mx-auto min-h-full flex flex-col">
            {children}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} KIZERE Hub. All rights
            reserved.
          </p>
          <nav className="flex gap-4">
            <Link
              href="/terms"
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Privacy
            </Link>
          </nav>
        </div>
      </footer>

      {/* Quick action floating menu */}
      <QuickActionMenu />
    </div>
  );
}