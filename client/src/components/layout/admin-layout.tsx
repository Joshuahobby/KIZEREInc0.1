import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  AlertTriangle,
  BarChart3,
  Bell,
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
  ChevronDown,
  BookCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
// TODO: Use translation hook once fully implemented
// import { useTranslation } from "@/hooks/use-translation";
const useTranslation = () => ({ t: (key: string) => key });

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  // Check if user has admin role
  const isAdmin = user?.role === "Admin";

  // Navigation categories and items for admin sidebar
  interface NavCategory {
    title: string;
    icon: React.ReactNode;
    items: NavItem[];
  }

  const navCategories: NavCategory[] = [
    {
      title: "Overview",
      icon: <LayoutDashboard className="h-5 w-5" />,
      items: [
        {
          title: "Dashboard",
          href: "/admin",
          icon: <Home className="h-5 w-5" />,
        },
        {
          title: "Analytics",
          href: "/admin/analytics",
          icon: <BarChart3 className="h-5 w-5" />,
        },
        {
          title: "Activity Logs",
          href: "/admin/activity",
          icon: <FileText className="h-5 w-5" />,
        },
      ],
    },
    {
      title: "User Management",
      icon: <Users className="h-5 w-5" />,
      items: [
        {
          title: "User Directory",
          href: "/admin/users",
          icon: <List className="h-5 w-5" />,
        },
        {
          title: "User Verification",
          href: "/admin/user-verification",
          icon: <BookCheck className="h-5 w-5" />,
        },
        {
          title: "Permissions",
          href: "/admin/permissions",
          icon: <Lock className="h-5 w-5" />,
        },
      ],
    },
    {
      title: "Item Registry",
      icon: <Database className="h-5 w-5" />,
      items: [
        {
          title: "Item Database",
          href: "/admin/items",
          icon: <List className="h-5 w-5" />,
        },
        {
          title: "Categories",
          href: "/admin/categories",
          icon: <FileText className="h-5 w-5" />,
        },
        {
          title: "Verification Queue",
          href: "/admin/item-verification",
          icon: <AlertTriangle className="h-5 w-5" />,
        },
      ],
    },
    {
      title: "Lost & Found",
      icon: <PackageSearch className="h-5 w-5" />,
      items: [
        {
          title: "Match Dashboard",
          href: "/admin/matches",
          icon: <Star className="h-5 w-5" />,
        },
        {
          title: "Case Management",
          href: "/admin/cases",
          icon: <FileText className="h-5 w-5" />,
        },
        {
          title: "Notifications",
          href: "/admin/notifications",
          icon: <Bell className="h-5 w-5" />,
        },
      ],
    },
    {
      title: "Financial",
      icon: <Wallet className="h-5 w-5" />,
      items: [
        {
          title: "Payment Dashboard",
          href: "/admin/payment-dashboard",
          icon: <CreditCard className="h-5 w-5" />,
        },
        {
          title: "Transactions",
          href: "/admin/transactions",
          icon: <FileText className="h-5 w-5" />,
        },
        {
          title: "Reports",
          href: "/admin/financial-reports",
          icon: <BarChart3 className="h-5 w-5" />,
        },
      ],
    },
    {
      title: "System",
      icon: <Settings className="h-5 w-5" />,
      items: [
        {
          title: "Settings",
          href: "/admin/settings",
          icon: <Settings className="h-5 w-5" />,
        },
        {
          title: "Security",
          href: "/admin/security",
          icon: <Lock className="h-5 w-5" />,
        },
        {
          title: "API & Integrations",
          href: "/admin/api",
          icon: <Database className="h-5 w-5" />,
        },
      ],
    },
  ];

  // Flatten nav categories for top bar
  const topNavItems: NavItem[] = [
    { title: "Dashboard", href: "/admin", icon: <LayoutDashboard className="h-5 w-5" /> },
    { title: "Users", href: "/admin/users", icon: <Users className="h-5 w-5" /> },
    { title: "Items", href: "/admin/items", icon: <Database className="h-5 w-5" /> },
    { title: "Matches", href: "/admin/matches", icon: <Star className="h-5 w-5" /> },
    { title: "Payments", href: "/admin/payment-dashboard", icon: <CreditCard className="h-5 w-5" /> },
  ];

  // Toggle category open/closed state
  const toggleCategory = (categoryTitle: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [categoryTitle]: !prev[categoryTitle],
    }));
  };

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

  // If user is not admin, redirect to home page
  if (!isAdmin) {
    return <div className="py-10 text-center">{children}</div>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top navigation bar */}
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2 md:gap-4">
            {/* Mobile menu trigger */}
            <Sheet>
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
              <SheetContent side="left" className="w-80 overflow-y-auto">
                <div className="flex flex-col space-y-6 py-4">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-6 w-6 text-primary" />
                    <span className="text-lg font-bold">KIZERE Admin</span>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      className="pl-8"
                    />
                  </div>
                  <Separator />
                  <nav className="flex flex-col space-y-1 pr-1">
                    {navCategories.map((category) => (
                      <Collapsible
                        key={category.title}
                        open={openCategories[category.title]}
                        onOpenChange={() => toggleCategory(category.title)}
                        className="w-full"
                      >
                        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                          <div className="flex items-center gap-3">
                            {category.icon}
                            <span>{category.title}</span>
                          </div>
                          <ChevronDown className={cn(
                            "h-4 w-4 transition-transform duration-200",
                            openCategories[category.title] ? "rotate-180 transform" : ""
                          )} />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pl-4">
                          {category.items.map((item) => (
                            <Link key={item.href} href={item.href}>
                              <a
                                className={cn(
                                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                                  location === item.href
                                    ? "bg-accent text-accent-foreground"
                                    : "transparent"
                                )}
                              >
                                {item.icon}
                                <span>{item.title}</span>
                              </a>
                            </Link>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo for larger screens */}
            <Link href="/">
              <a className="flex items-center space-x-2">
                <Shield className="h-6 w-6 text-primary" />
                <span className="hidden font-bold md:inline-block">
                  KIZERE Admin
                </span>
              </a>
            </Link>

            {/* Desktop navigation */}
            <nav className="hidden md:flex md:gap-2 lg:gap-6">
              {topNavItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <a
                    className={cn(
                      "flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary",
                      location === item.href
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {item.icon && <span className="mr-1">{item.icon}</span>}
                    {item.title}
                  </a>
                </Link>
              ))}
            </nav>
          </div>

          {/* User dropdown menu */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                  aria-label="User menu"
                >
                  <Avatar>
                    <AvatarImage
                      src={undefined}
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
                  <Link href="/profile">
                    <a className="w-full cursor-pointer">Profile</a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <a className="w-full cursor-pointer">Settings</a>
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

      {/* Main content with sidebar */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Admin sidebar - desktop only */}
        <aside className="hidden md:block w-64 border-r bg-muted/10 p-6 pt-8">
          <div className="space-y-6">
            <div className="relative mb-4">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-8" />
            </div>
            
            <nav className="flex flex-col space-y-2">
              {navCategories.map((category) => (
                <Collapsible
                  key={category.title}
                  open={openCategories[category.title]}
                  onOpenChange={() => toggleCategory(category.title)}
                  className="w-full"
                >
                  <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                    <div className="flex items-center gap-3">
                      {category.icon}
                      <span>{category.title}</span>
                    </div>
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      openCategories[category.title] ? "rotate-180 transform" : ""
                    )} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-8 pt-1">
                    {category.items.map((item) => (
                      <Link key={item.href} href={item.href}>
                        <a
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                            location === item.href
                              ? "bg-accent text-accent-foreground"
                              : "text-muted-foreground"
                          )}
                        >
                          {item.icon}
                          <span>{item.title}</span>
                        </a>
                      </Link>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </nav>
          </div>
        </aside>
        
        {/* Main content area */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} KIZERE Platform. All rights
            reserved.
          </p>
          <nav className="flex gap-4">
            <Link href="/terms">
              <a className="text-sm text-muted-foreground underline-offset-4 hover:underline">
                Terms
              </a>
            </Link>
            <Link href="/privacy">
              <a className="text-sm text-muted-foreground underline-offset-4 hover:underline">
                Privacy
              </a>
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}