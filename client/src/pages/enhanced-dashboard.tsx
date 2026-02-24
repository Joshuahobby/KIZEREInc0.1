import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useDashboardData, DashboardData, DashboardStats } from "@/hooks/use-dashboard-data";
import { useLanguage } from "@/lib/i18n/LanguageContext";
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
import { GlobalSearch } from "@/components/dashboard/global-search";
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
  const { user, logoutMutation } = useAuth();
  const [_, navigate] = useLocation();
  const { t } = useLanguage();

  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Use the dashboard data hook with refresh interval option
  const dashboardData: DashboardData = useDashboardData({
    refreshInterval: 60000 // Refresh every minute
  });

  // Extract data from dashboard data hook
  const { items, reports, notifications, isLoading, userStats } = dashboardData;

  // Determine user roles and access rights
  const isAdmin = user?.role === 'Admin';
  const isAgent = user?.role === 'Agent';

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
            <h2 className="text-2xl font-semibold mb-4">{t('auth.pleaseLoginToContinue')}</h2>
            <Button onClick={() => navigate("/")}>
              {t('nav.returnToHome')}
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Format currency values
  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numValue);
  };

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <Header />

      <main className="flex-1 bg-gradient-to-b from-background to-background/90 p-4 md:p-6 pb-24 md:pb-6">
        <div className="max-w-7xl mx-auto">
          {/* Dashboard Header */}
          <div className="mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  {t('dashboard.welcomeBack')}, {user.fullName || user.username}!
                </h1>
                <p className="text-muted-foreground mt-1">
                  {isAdmin
                    ? t('dashboard.adminDescription')
                    : isAgent
                      ? t('dashboard.agentDescription')
                      : t('dashboard.userDescription')
                  }
                </p>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <GlobalSearch />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>{t('common.profile')}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      <User className="mr-2 h-4 w-4" />
                      <span>{t('profile.title')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/settings")}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>{t('settings.title')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{t('auth.logout')}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Main Dashboard Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg p-1">
              <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 w-full">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden md:inline">{t('dashboard.overview')}</span>
                </TabsTrigger>
                <TabsTrigger value="items" className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  <span className="hidden md:inline">{t('dashboard.registeredItems')}</span>
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  <span className="hidden md:inline">{t('reports.title')}</span>
                </TabsTrigger>
                <TabsTrigger value="payments" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="hidden md:inline">{t('payments.title')}</span>
                </TabsTrigger>
                {isAdmin && (
                  <TabsTrigger value="admin" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    <span className="hidden md:inline">{t('dashboard.adminTab')}</span>
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
                  {isAdmin ? (
                    <>
                      <motion.div variants={itemVariants}>
                        <StatsCard
                          title="Total Users"
                          value={userStats?.totalUsers || 0}
                          icon={<User className="h-5 w-5" />}
                          iconBgClass="bg-blue-100 dark:bg-blue-900/30"
                          iconTextClass="text-blue-600 dark:text-blue-400"
                          isLoading={isLoading}
                        />
                      </motion.div>
                      <motion.div variants={itemVariants}>
                        <StatsCard
                          title="Total Reports"
                          value={userStats?.allOpenReports || 0}
                          icon={<ClipboardList className="h-5 w-5" />}
                          iconBgClass="bg-amber-100 dark:bg-amber-900/30"
                          iconTextClass="text-amber-600 dark:text-amber-400"
                          isLoading={isLoading}
                        />
                      </motion.div>
                      <motion.div variants={itemVariants}>
                        <StatsCard
                          title="Total Revenue"
                          value={userStats?.totalRevenue || 0}
                          icon={<DollarSign className="h-5 w-5" />}
                          iconBgClass="bg-green-100 dark:bg-green-900/30"
                          iconTextClass="text-green-600 dark:text-green-400"
                          isLoading={isLoading}
                          formatter={formatCurrency}
                        />
                      </motion.div>
                      <motion.div variants={itemVariants}>
                        <StatsCard
                          title="System Health"
                          value={userStats?.systemHealth || "N/A"}
                          icon={<RefreshCw className="h-5 w-5" />}
                          iconBgClass="bg-purple-100 dark:bg-purple-900/30"
                          iconTextClass="text-purple-600 dark:text-purple-400"
                          isLoading={isLoading}
                        />
                      </motion.div>
                    </>
                  ) : isAgent ? (
                    <>
                      <motion.div variants={itemVariants}>
                        <StatsCard
                          title="Total Reports"
                          value={userStats?.allOpenReports || 0}
                          icon={<ClipboardList className="h-5 w-5" />}
                          iconBgClass="bg-blue-100 dark:bg-blue-900/30"
                          iconTextClass="text-blue-600 dark:text-blue-400"
                          isLoading={isLoading}
                        />
                      </motion.div>
                      <motion.div variants={itemVariants}>
                        <StatsCard
                          title="Pending Verifications"
                          value={userStats?.pendingVerifications || 0}
                          icon={<AlertTriangle className="h-5 w-5" />}
                          iconBgClass="bg-amber-100 dark:bg-amber-900/30"
                          iconTextClass="text-amber-600 dark:text-amber-400"
                          isLoading={isLoading}
                        />
                      </motion.div>
                      <motion.div variants={itemVariants}>
                        <StatsCard
                          title="Found Items"
                          value={userStats?.totalFoundReports || 0}
                          icon={<CheckCircle2 className="h-5 w-5" />}
                          iconBgClass="bg-green-100 dark:bg-green-900/30"
                          iconTextClass="text-green-600 dark:text-green-400"
                          isLoading={isLoading}
                        />
                      </motion.div>
                      <motion.div variants={itemVariants}>
                        <StatsCard
                          title="Notifications"
                          value={userStats?.unreadNotifications || 0}
                          icon={<BellRing className="h-5 w-5" />}
                          iconBgClass="bg-purple-100 dark:bg-purple-900/30"
                          iconTextClass="text-purple-600 dark:text-purple-400"
                          isLoading={isLoading}
                        />
                      </motion.div>
                    </>
                  ) : (
                    <>
                      <motion.div variants={itemVariants}>
                        <StatsCard
                          title={t('dashboard.registeredItems')}
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
                          title={t('dashboard.lostReports')}
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
                          title={t('dashboard.foundReports')}
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
                          title={t('dashboard.totalSpent')}
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
                    </>
                  )}
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
                        <CardTitle className="text-lg font-display">{t('dashboard.recentlyRegisteredItems')}</CardTitle>
                        <CardDescription>
                          {t('dashboard.recentItemsDescription')}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-8">
                          <Filter className="h-3.5 w-3.5 mr-1" />
                          <span className="text-xs">{t('common.filter')}</span>
                        </Button>
                        <Button variant="outline" size="sm" className="h-8">
                          <ArrowDownUp className="h-3.5 w-3.5 mr-1" />
                          <span className="text-xs">{t('common.sort')}</span>
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
                        <span className="text-xs">{t('dashboard.viewAllItems')}</span>
                      </Button>
                      <Button variant="ghost" size="sm">
                        <RefreshCw className="h-3.5 w-3.5 mr-1" />
                        <span className="text-xs">{t('common.refresh')}</span>
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              </motion.div>
            </TabsContent>

            {/* Other tabs would be implemented here */}
            <TabsContent value="items">
              <div className="bg-card border border-border/50 rounded-xl p-8 text-center glass-morphism">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <ShoppingBag className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">{t('dashboard.items.tabTitle')}</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {t('dashboard.items.tabDescription')}
                </p>
                <Button onClick={() => navigate('/register-item')}>
                  <Plus className="h-4 w-4 mr-2" /> {t('dashboard.registerNewItem')}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="reports">
              <div className="bg-card border border-border/50 rounded-xl p-8 text-center glass-morphism">
                <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">{t('dashboard.reports.tabTitle')}</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {t('dashboard.reports.tabDescription')}
                </p>
                <Button variant="outline" onClick={() => navigate('/lost-found/report')}>
                  <FileText className="h-4 w-4 mr-2" /> Report Lost or Found
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="payments">
              <div className="bg-card border border-border/50 rounded-xl p-8 text-center glass-morphism">
                <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">{t('dashboard.payments.tabTitle')}</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {t('dashboard.payments.tabDescription')}
                </p>
                <Button variant="outline" onClick={() => navigate('/payments')}>
                  <RefreshCw className="h-4 w-4 mr-2" /> View Transactions
                </Button>
              </div>
            </TabsContent>

            {isAdmin && (
              <TabsContent value="admin">
                <div className="bg-card border border-border/50 rounded-xl p-8 text-center glass-morphism">
                  <div className="mx-auto w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mb-4">
                    <BarChart3 className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{t('dashboard.adminPanel.tabTitle')}</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    {t('dashboard.adminPanel.tabDescription')}
                  </p>
                  <Button variant="outline" onClick={() => navigate('/admin/analytics')}>
                    <BarChart3 className="h-4 w-4 mr-2" /> Open Management Console
                  </Button>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>

      {/* Mobile Sticky Quick Actions */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border/50 p-3 flex gap-2">
        <Button
          className="flex-1 rounded-xl shadow-lg bg-blue-600 hover:bg-blue-700 text-white font-bold h-12"
          onClick={() => navigate('/register-item')}
        >
          <div className="flex flex-col items-center gap-1">
            <Plus className="h-4 w-4" />
            <span className="text-[10px] uppercase tracking-wider">Register</span>
          </div>
        </Button>
        <Button
          variant="outline"
          className="flex-1 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-200 hover:bg-amber-100 hover:text-amber-700 h-12"
          onClick={() => navigate('/lost-found/report/lost')}
        >
          <div className="flex flex-col items-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Lost</span>
          </div>
        </Button>
        <Button
          variant="outline"
          className="flex-1 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 border-green-200 hover:bg-green-100 hover:text-green-700 h-12"
          onClick={() => navigate('/lost-found/report/found')}
        >
          <div className="flex flex-col items-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Found</span>
          </div>
        </Button>
      </div>

      <Footer />
    </div>
  );
};

export default EnhancedDashboard;