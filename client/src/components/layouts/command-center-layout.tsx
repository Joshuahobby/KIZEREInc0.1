import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { useSystemStatus } from "@/hooks/use-system-status";
import { useActivityFeed } from "@/hooks/use-activity-feed";
import { DashboardWrapper } from "@/components/dashboard/dashboard-wrapper";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  AlertTriangle,
  Activity,
  BarChart3,
  Bell,
  CreditCard,
  Download,
  FileText,
  HardDrive,
  LayoutDashboard,
  Menu,
  Package,
  Plus,
  Search,
  Settings,
  Shield,
  Star,
  User,
  Users,
} from "lucide-react";

/**
 * Command Center Layout Component
 * Provides consistent layout and navigation for all admin pages
 */
export function CommandCenterLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [timeRange, setTimeRange] = React.useState("30d");
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  // Get data using our hooks
  const { stats, chartData, isLoading: statsLoading } = useDashboardStats();
  const { systemStatus, healthScore, activeIssues, isLoading: systemLoading } = useSystemStatus();
  const { events: activityEvents, isLoading: activityLoading } = useActivityFeed({ limit: 6 });

  // Function to get the background color based on system health score
  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-500/10';
    if (score >= 70) return 'bg-amber-500/10';
    return 'bg-red-500/10';
  };

  // Function to get the text color based on system health score
  const getHealthScoreTextColor = (score: number) => {
    if (score >= 90) return 'text-emerald-500';
    if (score >= 70) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <DashboardWrapper>
      <div className="flex flex-col min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-30 w-full border-b border-border/40 bg-background/95 backdrop-blur">
          <div className="container flex h-16 items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="md:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold text-primary">KIZERE Command Center</h1>
              
              {/* Dashboard Navigation */}
              <div className="hidden md:flex items-center ml-4 border-l border-border/50 pl-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-xs gap-1"
                  onClick={() => navigate("/admin")}
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Standard
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-xs gap-1"
                  onClick={() => navigate("/admin/classic")}
                >
                  <Activity className="h-3.5 w-3.5" />
                  Classic
                </Button>
              </div>
              
              <Tabs defaultValue={timeRange} onValueChange={setTimeRange}>
                <TabsList>
                  <TabsTrigger value="7d">Week</TabsTrigger>
                  <TabsTrigger value="30d">Month</TabsTrigger>
                  <TabsTrigger value="90d">Quarter</TabsTrigger>
                  <TabsTrigger value="365d">Year</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search..."
                  className="w-[200px] pl-8 md:w-[300px] bg-muted/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Button variant="outline" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-white">
                  {activeIssues.length}
                </span>
              </Button>
              
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground hidden md:block">
                  Hi, {user?.fullName?.split(' ')[0] || 'Admin'}
                </div>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="User avatar" className="h-8 w-8 rounded-full" />
                  ) : (
                    <User className="h-4 w-4 text-primary" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>
      
        <div className="flex flex-1">
          {/* Sidebar - hidden on mobile when collapsed */}
          <aside className={`w-64 border-r border-border/40 bg-background/95 backdrop-blur ${sidebarCollapsed ? 'hidden' : 'block'} md:block`}>
            <div className="space-y-4 py-4">
              <div className="px-4 py-2">
                <div className="space-y-1">
                  <Button 
                    variant={location === '/admin/command-center' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    className="w-full justify-start" 
                    onClick={() => navigate('/admin/command-center')}
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                  <Button 
                    variant={location.includes('/admin/users') ? 'secondary' : 'ghost'} 
                    size="sm" 
                    className="w-full justify-start" 
                    onClick={() => navigate('/admin/users')}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Users
                  </Button>
                  <Button 
                    variant={location.includes('/admin/item-management') ? 'secondary' : 'ghost'} 
                    size="sm" 
                    className="w-full justify-start" 
                    onClick={() => navigate('/admin/item-management')}
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Items
                  </Button>
                  <Button 
                    variant={location.includes('/admin/reports') ? 'secondary' : 'ghost'} 
                    size="sm" 
                    className="w-full justify-start" 
                    onClick={() => navigate('/admin/reports')}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Reports
                  </Button>
                  <Button
                    variant={location.includes('/admin/payment-dashboard') ? 'secondary' : 'ghost'} 
                    size="sm" 
                    className="w-full justify-start" 
                    onClick={() => navigate('/admin/payment-dashboard')}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Payments
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => navigate('/admin/analytics')}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Analytics
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => navigate('/admin/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                </div>
              </div>
              
              <div className="px-4">
                <h2 className="mb-2 text-lg font-semibold tracking-tight">System Health</h2>
                <div className={`${getHealthScoreColor(healthScore)} ${getHealthScoreTextColor(healthScore)} rounded-lg p-4 mb-2`}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm font-medium">Health Score</div>
                    <div className="text-lg font-bold">{healthScore}%</div>
                  </div>
                  <div className="h-2 bg-background rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${healthScore >= 90 ? 'bg-emerald-500' : healthScore >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${healthScore}%` }}
                    ></div>
                  </div>
                </div>
                {activeIssues.length > 0 && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>System Issues</AlertTitle>
                    <AlertDescription>{activeIssues.length} active issues need attention</AlertDescription>
                  </Alert>
                )}
              </div>
              
              <div className="px-4">
                <h2 className="mb-2 text-lg font-semibold tracking-tight">Quick Actions</h2>
                <div className="space-y-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => navigate('/admin/users/new')}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    New User
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => navigate('/admin/item-management/new')}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Item
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Download className="mr-2 h-4 w-4" />
                    Export Report
                  </Button>
                </div>
              </div>
            </div>
          </aside>
          
          {/* Main content */}
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </DashboardWrapper>
  );
}