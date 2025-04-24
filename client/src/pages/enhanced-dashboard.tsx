import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ActivityTimeline } from "@/components/dashboard/activity-timeline";
import { NotificationCenter } from "@/components/dashboard/notification-center";
import { PaymentHistoryCard } from "@/components/dashboard/payment-history-card";
import { ItemsTable } from "@/components/dashboard/items-table";
import { QuickActionsPanel } from "@/components/dashboard/quick-actions-panel";
import { HeaderSearch } from "@/components/dashboard/header-search";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  Plus, 
  ChevronDown, 
  Calendar, 
  BellRing, 
  Search, 
  User, 
  Settings,
  BarChart3,
  ClipboardList,
  RefreshCw,
  LogOut,
  HelpCircle,
  Filter,
  FileText,
  ArrowDownUp
} from "lucide-react";

const EnhancedDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { user, logout } = useAuth();
  const [_, navigate] = useLocation();

  // Use the dashboard data hook
  const dashboardData = useDashboardData();
  
  const {
    userStats,
    adminStats,
    isAdmin = false,
    isAgent = false,
    isLoading = true,
    notifications = [],
    items = [],
    reports = []
  } = dashboardData || {};

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  if (!user) {
    // Handle not logged in state
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto text-center py-12">
            <h2 className="text-2xl font-semibold mb-4">Please log in to access your dashboard</h2>
            <Button onClick={() => navigate("/")}>Return to Home</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-RW', { 
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 bg-gradient-to-b from-background to-background/90 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Dashboard Header */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  Welcome back, {user.fullName || user.username}!
                </h1>
                <p className="text-muted-foreground mt-1">
                  {isAdmin 
                    ? "Manage your platform and view performance insights" 
                    : isAgent 
                      ? "Review and process lost and found reports"
                      : "Track your items and manage your account"
                  }
                </p>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                <HeaderSearch />
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/settings")}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => logout()}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button onClick={() => navigate("/register-item")}>
                  <Plus className="h-4 w-4 mr-2" /> Register Item
                </Button>
              </div>
            </div>
          </div>
          
          {/* Main Dashboard Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg p-1">
              <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 w-full">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden md:inline">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="items" className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  <span className="hidden md:inline">My Items</span>
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  <span className="hidden md:inline">Reports</span>
                </TabsTrigger>
                <TabsTrigger value="payments" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="hidden md:inline">Payments</span>
                </TabsTrigger>
                {isAdmin && (
                  <TabsTrigger value="admin" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    <span className="hidden md:inline">Admin</span>
                  </TabsTrigger>
                )}
              </TabsList>
            </div>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6 space-y-6">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {/* Stats Row */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                  <motion.div variants={itemVariants}>
                    <StatsCard
                      title="Registered Items"
                      value={userStats?.totalItems || 0}
                      icon={<ShoppingBag className="h-5 w-5" />}
                      iconBgClass="bg-blue-100 dark:bg-blue-900/30"
                      iconTextClass="text-blue-600 dark:text-blue-400"
                      trendData={[3, 7, 5, 10, 8, 12, userStats?.totalItems || 0]}
                      chartColor="#00BFFF"
                      isLoading={isLoading}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <StatsCard
                      title="Lost Reports"
                      value={userStats?.totalLostReports || 0}
                      icon={<AlertTriangle className="h-5 w-5" />}
                      iconBgClass="bg-amber-100 dark:bg-amber-900/30"
                      iconTextClass="text-amber-600 dark:text-amber-400"
                      trendData={[2, 5, 3, 7, 6, 8, userStats?.totalLostReports || 0]}
                      chartColor="#f59e0b"
                      isLoading={isLoading}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <StatsCard
                      title="Found Reports"
                      value={userStats?.totalFoundReports || 0}
                      icon={<CheckCircle2 className="h-5 w-5" />}
                      iconBgClass="bg-green-100 dark:bg-green-900/30"
                      iconTextClass="text-green-600 dark:text-green-400"
                      trendData={[1, 3, 2, 4, 6, 5, userStats?.totalFoundReports || 0]}
                      chartColor="#10b981"
                      isLoading={isLoading}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <StatsCard
                      title="Total Spent"
                      value={userStats?.totalSpent || 0}
                      icon={<DollarSign className="h-5 w-5" />}
                      iconBgClass="bg-purple-100 dark:bg-purple-900/30"
                      iconTextClass="text-purple-600 dark:text-purple-400"
                      trendData={[100, 250, 150, 400, 300, 500, userStats?.totalSpent || 0]}
                      chartColor="#8b5cf6"
                      isLoading={isLoading}
                      formatter={formatCurrency}
                      prefix=""
                    />
                  </motion.div>
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
                  {/* Quick Actions Panel */}
                  <motion.div variants={itemVariants} className="lg:col-span-1">
                    <QuickActionsPanel user={user} />
                  </motion.div>

                  {/* Activity Timeline */}
                  <motion.div variants={itemVariants} className="lg:col-span-1">
                    <ActivityTimeline items={items} reports={reports} />
                  </motion.div>

                  {/* Notifications */}
                  <motion.div variants={itemVariants} className="lg:col-span-1">
                    <NotificationCenter notifications={notifications || []} isLoading={isLoading} />
                  </motion.div>
                </div>

                {/* Recently Registered Items */}
                <motion.div variants={itemVariants}>
                  <Card className="mb-6 border border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <div>
                        <CardTitle className="text-lg font-display">Recently Registered Items</CardTitle>
                        <CardDescription>
                          View and manage your most recently registered items
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-8">
                          <Filter className="h-3.5 w-3.5 mr-1" />
                          <span className="text-xs">Filter</span>
                        </Button>
                        <Button variant="outline" size="sm" className="h-8">
                          <ArrowDownUp className="h-3.5 w-3.5 mr-1" />
                          <span className="text-xs">Sort</span>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="space-y-4">
                          {Array(3).fill(0).map((_, i) => (
                            <div key={i} className="flex items-center space-x-4">
                              <Skeleton className="h-12 w-12 rounded-md" />
                              <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-full" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <ItemsTable 
                          items={userStats?.recentlyAddedItems || []} 
                          isLoading={isLoading} 
                        />
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-between border-t py-3">
                      <Button variant="ghost" size="sm">
                        <span className="text-xs">View All Items</span>
                      </Button>
                      <Button variant="ghost" size="sm">
                        <RefreshCw className="h-3.5 w-3.5 mr-1" />
                        <span className="text-xs">Refresh</span>
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              </motion.div>
            </TabsContent>
            
            {/* Other tabs would be implemented here */}
            <TabsContent value="items">
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-8 text-center">
                <h3 className="text-xl font-medium mb-2">Items Tab Content</h3>
                <p className="text-muted-foreground mb-4">
                  This tab would contain a comprehensive view of all your registered items with filtering, sorting, and batch actions.
                </p>
                <Button>View Implementation Plan</Button>
              </div>
            </TabsContent>
            
            <TabsContent value="reports">
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-8 text-center">
                <h3 className="text-xl font-medium mb-2">Reports Tab Content</h3>
                <p className="text-muted-foreground mb-4">
                  This tab would show all your lost and found reports with status tracking and updates.
                </p>
                <Button>View Implementation Plan</Button>
              </div>
            </TabsContent>
            
            <TabsContent value="payments">
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-8 text-center">
                <h3 className="text-xl font-medium mb-2">Payments Tab Content</h3>
                <p className="text-muted-foreground mb-4">
                  This tab would show your payment history, receipts, and subscription information.
                </p>
                <Button>View Implementation Plan</Button>
              </div>
            </TabsContent>
            
            {isAdmin && (
              <TabsContent value="admin">
                <div className="bg-primary/5 border border-primary/10 rounded-lg p-8 text-center">
                  <h3 className="text-xl font-medium mb-2">Admin Dashboard</h3>
                  <p className="text-muted-foreground mb-4">
                    This tab would provide comprehensive admin controls and analytics for platform management.
                  </p>
                  <Button>View Implementation Plan</Button>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default EnhancedDashboard;