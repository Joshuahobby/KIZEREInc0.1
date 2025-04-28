import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { useSystemStatus } from "@/hooks/use-system-status";
import { useActivityFeed } from "@/hooks/use-activity-feed";
import { DashboardWrapper } from "@/components/dashboard/dashboard-wrapper";
import { MetricsDashboard } from "@/components/dashboard/metrics-dashboard";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { SettingsToggle } from "@/components/dashboard/settings-panel";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { SystemStatus } from "@/components/dashboard/system-status";
import { EnhancedPaymentAnalytics } from "@/components/dashboard/enhanced-payment-analytics";
import { PaymentStatusChart } from "@/components/dashboard/payment-analytics-chart-fixed";
import { UserRoleDistribution } from "@/components/dashboard/user-role-distribution";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  Calendar,
  CreditCard,
  Download,
  FileText,
  Filter,
  HelpCircle,
  Inbox,
  Info,
  Loader2,
  Package,
  PieChart,
  Plus,
  Search,
  Settings,
  Star,
  Users,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Tags,
  User,
  LayoutDashboard,
  Activity,
  Eye,
  Server,
  Wifi,
  Database,
  Shield,
  HardDrive,
  Menu
} from "lucide-react";

/**
 * KIZERE Command Center - Main Dashboard Component
 * Implements Phase 1 & 2 of the implementation plan
 * 
 * NOTE: For pages that need to be wrapped in the command center layout,
 * use the CommandCenterLayout component imported from '@/components/layouts/command-center-layout'
 */
export default function CommandCenter() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [timeRange, setTimeRange] = useState("30d");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
              
              <SettingsToggle />
              
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
                  <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => navigate('/admin')}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => navigate('/admin/users')}>
                    <Users className="mr-2 h-4 w-4" />
                    Users
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => navigate('/admin/item-management')}>
                    <Package className="mr-2 h-4 w-4" />
                    Items
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => navigate('/admin/reports')}>
                    <FileText className="mr-2 h-4 w-4" />
                    Reports
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => navigate('/admin/payment-dashboard')}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Payments
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => navigate('/admin/payment-packages')}>
                    <Package className="mr-2 h-4 w-4" />
                    Payment Packages
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
                    onClick={() => navigate('/admin/users')}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Manage Users
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => navigate('/admin/payment-packages/new')}
                  >
                    <Package className="mr-2 h-4 w-4" />
                    New Payment Package
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
            <div className="grid gap-6">
              {/* Welcome Message */}
              <div className="flex flex-col md:flex-row justify-between gap-4 px-2">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">Welcome back{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}</h2>
                  <p className="text-muted-foreground">
                    Here's what's happening with your platform today.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => navigate("/admin/classic")}>
                    Switch to Classic View
                  </Button>
                </div>
              </div>
              
              {/* Key Metrics */}
              <div className="grid gap-6">
                <h3 className="text-lg font-medium">Key Performance Metrics</h3>
                <MetricsDashboard />
              </div>
              
              {/* Revenue Overview */}
              <div className="grid gap-6">
                <h3 className="text-lg font-medium">Revenue Analytics</h3>
                <RevenueChart />
              </div>
              
              {/* Distribution Charts */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium">Payment Status</CardTitle>
                    <CardDescription>Distribution by payment outcomes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center py-2">
                      <PaymentStatusChart 
                        data={chartData?.paymentStatusData || []} 
                      />
                    </div>
                    <div className="space-y-2 mt-2">
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                          <span>Successful</span>
                        </div>
                        <span className="font-medium">
                          {chartData?.paymentStatusData?.[0]?.value || 0}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                          <span>Pending</span>
                        </div>
                        <span className="font-medium">
                          {chartData?.paymentStatusData?.[1]?.value || 0}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                          <span>Failed</span>
                        </div>
                        <span className="font-medium">
                          {chartData?.paymentStatusData?.[2]?.value || 0}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium">User Distribution</CardTitle>
                    <CardDescription>Breakdown by user roles</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center py-2">
                      <UserRoleDistribution 
                        data={chartData?.userRoleData || []} 
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div className="bg-primary/10 rounded-lg p-2 text-center">
                        <User className="h-4 w-4 text-primary mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground mb-1">Subscribers</p>
                        <p className="font-semibold">{chartData?.userRoleData?.[0]?.value || 0}%</p>
                      </div>
                      <div className="bg-blue-500/10 rounded-lg p-2 text-center">
                        <Shield className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground mb-1">Agents</p>
                        <p className="font-semibold">{chartData?.userRoleData?.[1]?.value || 0}%</p>
                      </div>
                      <div className="bg-purple-500/10 rounded-lg p-2 text-center">
                        <Star className="h-4 w-4 text-purple-500 mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground mb-1">Admins</p>
                        <p className="font-semibold">{chartData?.userRoleData?.[2]?.value || 0}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Activity & System Status */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
                        <CardDescription>Latest actions and events</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => navigate('/admin/activity')}>
                        View All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {activityLoading ? (
                        <div className="animate-pulse flex flex-col space-y-3">
                          <div className="h-6 bg-muted-foreground/20 rounded w-3/4"></div>
                          <div className="h-4 bg-muted-foreground/20 rounded w-full"></div>
                          <div className="h-6 bg-muted-foreground/20 rounded w-3/4 mt-6"></div>
                          <div className="h-4 bg-muted-foreground/20 rounded w-5/6"></div>
                        </div>
                      ) : (
                        activityEvents.slice(0, 5).map(event => (
                          <div key={event.id} className="border-b border-border/40 pb-3 last:border-0">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-medium text-sm">{event.title}</h4>
                              <span className="text-xs text-muted-foreground">{event.relativeTime || '—'}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{event.message}</p>
                            <div className="flex mt-2">
                              <Badge variant={
                                event.type === 'info' ? 'outline' :
                                event.type === 'success' ? 'default' :
                                event.type === 'warning' ? 'secondary' : 'destructive'
                              } className="text-xs">
                                {event.category}
                              </Badge>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-lg font-medium">System Status</CardTitle>
                        <CardDescription>Service health and performance</CardDescription>
                      </div>
                      <Badge variant={systemStatus.overall === 'operational' ? 'default' : 'destructive'}>
                        {systemStatus.overall.charAt(0).toUpperCase() + systemStatus.overall.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {systemStatus.services.map(service => (
                        <div key={service.id} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-2 ${
                              service.status === 'operational' ? 'bg-green-500' : 
                              service.status === 'degraded' ? 'bg-yellow-500' :
                              service.status === 'maintenance' ? 'bg-blue-500' : 'bg-red-500'
                            }`}></div>
                            <span>{service.name}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{service.status}</span>
                        </div>
                      ))}
                      {systemLoading && (
                        <div className="animate-pulse flex flex-col space-y-3">
                          <div className="h-4 bg-muted-foreground/20 rounded w-3/4"></div>
                          <div className="h-4 bg-muted-foreground/20 rounded w-full"></div>
                          <div className="h-4 bg-muted-foreground/20 rounded w-5/6"></div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </DashboardWrapper>
  );
}