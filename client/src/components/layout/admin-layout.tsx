import { ReactNode, useState } from "react";
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
  ChevronDown,
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
  X
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  badge?: number;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    // Default open categories
    Overview: true
  });
  const [showActionPanel, setShowActionPanel] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Check if user has admin role
  const isAdmin = user?.role === "Admin";

  // Navigation categories and items for admin sidebar
  interface NavCategory {
    title: string;
    icon: React.ReactNode;
    items: NavItem[];
    badge?: number;
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
      <header className="sticky top-0 z-40 border-b bg-background shadow-sm">
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

            {/* Global search */}
            <div className="hidden md:block relative max-w-md w-full ml-4">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search anything..." 
                className="pl-8 w-full" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Desktop navigation */}
            <nav className="hidden lg:flex lg:gap-2 xl:gap-6 ml-4">
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

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1 right-1 flex h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background"></span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Notifications</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Customization toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setShowActionPanel(!showActionPanel)}
                  >
                    <Sliders className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Customize dashboard</TooltipContent>
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

      {/* Main content with three-panel layout */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left panel: Navigation sidebar - desktop only */}
        <aside className="hidden md:block w-64 border-r bg-muted/10 p-4 pt-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Recently viewed */}
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-2 text-muted-foreground px-3">Recently Viewed</h3>
              <div className="space-y-1">
                <Link href="/admin/users/5">
                  <a className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>User ID #5</span>
                  </a>
                </Link>
                <Link href="/admin/items/10">
                  <a className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span>Item ID #10</span>
                  </a>
                </Link>
              </div>
            </div>
            
            {/* Navigation categories */}
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
                    {category.badge && (
                      <Badge variant="outline" className="ml-auto mr-2 px-1">
                        {category.badge}
                      </Badge>
                    )}
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
                          {item.badge && (
                            <Badge variant="outline" className="ml-auto">
                              {item.badge}
                            </Badge>
                          )}
                        </a>
                      </Link>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </nav>
            
            {/* Quick shortcuts */}
            <div className="pt-4">
              <h3 className="text-sm font-medium mb-2 text-muted-foreground px-3">Shortcuts</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="justify-start">
                  <Users className="h-3.5 w-3.5 mr-2" />
                  <span>New User</span>
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <Database className="h-3.5 w-3.5 mr-2" />
                  <span>New Item</span>
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <FileText className="h-3.5 w-3.5 mr-2" />
                  <span>Reports</span>
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <Settings className="h-3.5 w-3.5 mr-2" />
                  <span>Settings</span>
                </Button>
              </div>
            </div>
          </div>
        </aside>
        
        {/* Center panel: Main content area */}
        <main className="flex-1 overflow-auto p-6 bg-gradient-to-b from-background to-muted/20">
          {children}
        </main>
        
        {/* Right panel: Action panel - context-sensitive */}
        {showActionPanel && (
          <aside className="hidden lg:block w-80 border-l bg-muted/10 p-4 pt-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium">Actions & Insights</h3>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowActionPanel(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Alerts and insights */}
            <div className="mb-6 space-y-3">
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                <div className="flex items-start">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 mr-2" />
                  <div>
                    <h4 className="text-sm font-medium">3 pending verifications</h4>
                    <p className="text-xs text-muted-foreground mt-1">Items awaiting your approval</p>
                    <Button variant="link" size="sm" className="h-6 px-0 text-xs mt-1">
                      Review now <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
                <div className="flex items-start">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5 mr-2" />
                  <div>
                    <h4 className="text-sm font-medium">Revenue up 12% this week</h4>
                    <p className="text-xs text-muted-foreground mt-1">Registration payments increased</p>
                    <Button variant="link" size="sm" className="h-6 px-0 text-xs mt-1">
                      View report <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recent activity */}
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3">Recent Activity</h3>
              <div className="space-y-4">
                {[
                  { icon: <Users className="h-4 w-4" />, text: "New user registered", time: "5 minutes ago" },
                  { icon: <Database className="h-4 w-4" />, text: "Item #1042 registered", time: "30 minutes ago" },
                  { icon: <CreditCard className="h-4 w-4" />, text: "Payment of RWF 5,000 received", time: "1 hour ago" },
                  { icon: <Bell className="h-4 w-4" />, text: "System notification sent to all users", time: "2 hours ago" }
                ].map((activity, i) => (
                  <div key={i} className="flex items-start">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted mr-3">
                      {activity.icon}
                    </div>
                    <div>
                      <p className="text-sm">{activity.text}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="mt-3 w-full">View all activity</Button>
            </div>
            
            {/* Upcoming tasks or calendar */}
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3">Upcoming Tasks</h3>
              <div className="space-y-3">
                {[
                  { text: "Review verification requests", date: "Today", priority: "high" },
                  { text: "Check payment reconciliation", date: "Tomorrow", priority: "medium" },
                  { text: "System maintenance", date: "Apr 30", priority: "normal" }
                ].map((task, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-background rounded-md border">
                    <div className="flex items-start gap-3">
                      <div className={`h-2 w-2 rounded-full mt-1.5 ${
                        task.priority === 'high' ? 'bg-red-500' : 
                        task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}></div>
                      <div>
                        <p className="text-sm font-medium">{task.text}</p>
                        <div className="flex items-center mt-1">
                          <Calendar className="h-3 w-3 text-muted-foreground mr-1" />
                          <span className="text-xs text-muted-foreground">{task.date}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Quick settings */}
            <div>
              <h3 className="text-sm font-medium mb-3">Quick Settings</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Notifications</span>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">System status emails</span>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Dashboard preferences</span>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
              </div>
            </div>
          </aside>
        )}
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
      
      {/* Quick action floating menu */}
      <QuickActionMenu />
    </div>
  );
}