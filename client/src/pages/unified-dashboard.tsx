import React, { useState, useEffect, useMemo, Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";

import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useDashboardData, DashboardData, DashboardStats } from "@/hooks/use-dashboard-data";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ActivityTimeline } from "@/components/dashboard/activity-timeline";
import { NotificationCenter } from "@/components/dashboard/notification-center";
import { PaymentHistoryCard } from "@/components/dashboard/payment-history-card";
import { ItemsTable } from "@/components/dashboard/items-table";
import { QuickActionsPanel } from "@/components/dashboard/quick-actions-panel";
import { GlobalSearch } from "@/components/dashboard/global-search";
import { createLogger } from "@/lib/logger";
import { PageLayout } from "@/components/layout/page-layout";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";
import {
  HelpCircle,
  Filter,
  ArrowDownUp,
  Calendar,
  BellRing,
  User,
  ShieldCheck,
  ShoppingBag,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Users,
  FileText,
  ClipboardList,
  Clock,
  Search,
  Bell,
  Plus,
  LayoutDashboard,
  BarChart3,
  LogOut
} from "lucide-react";
import { format } from "date-fns";

// Import admin-specific components
import { PaymentAnalyticsChart } from "@/components/dashboard/payment-analytics-chart-fixed";
import { PaymentStatusChart } from "@/components/dashboard/payment-status-chart";
import { PaymentTypeChart } from "@/components/dashboard/payment-type-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { ClaimReviewDialog } from "@/components/reports/claim-review-dialog";
import { Claim } from "@shared/schema";
import { ModerationQueue } from "@/components/dashboard/moderation-queue";
import { BusinessInsights } from "@/components/dashboard/business-insights";
import { VerificationRequestsTable } from "@/components/dashboard/verification-requests-table";
import { SuggestedMatches } from "@/components/dashboard/suggested-matches";
import { UpcomingTasksCard } from "@/components/dashboard/upcoming-tasks-card";
import { DashboardAlerts } from "@/components/dashboard/dashboard-alerts";
import { UserPreferences } from "@shared/schema";
import { AppLayout } from "@/components/layout/admin-layout";

const logger = createLogger('UnifiedDashboard');

export default function UnifiedDashboard() {
  const [location, navigate] = useLocation();
  const { user, signOut } = useAuth();
  const { t } = useLanguage();

  // Get tab from URL or default to overview
  const getTabFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || "overview";
  };

  const [activeTab, setActiveTab] = React.useState(getTabFromUrl());




  // Update state when URL changes - using explicit React reference to avoid ReferenceErrors
  React.useEffect(() => {
    const currentTab = getTabFromUrl();
    if (currentTab !== activeTab) {
      setActiveTab(currentTab);
    }
    // Added console log to confirm this effect is running and cache is refreshed
    console.log('[UnifiedDashboard] Tab sync effect running', { currentTab, activeTab });
  }, [window.location.search, activeTab]);

  // Helper to change tab and update URL
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    navigate(`/dashboard?tab=${newTab}`);
  };

  const [selectedReportId, setSelectedReportId] = React.useState<number | null>(null);
  const [selectedClaim, setSelectedClaim] = React.useState<Claim | null>(null);
  const [reviewOpen, setReviewOpen] = React.useState(false);


  const dashboardData = useDashboardData();
  const {
    userStats = {
      totalItems: 0,
      totalLostReports: 0,
      totalFoundReports: 0,
      totalSpent: 0,
      recentlyAddedItems: [],
      pendingPayments: 0,
      unreadNotifications: 0
    },
    adminStats,
    isAdmin = false,
    isAgent = false,
    isModerator = false,
    isBusiness = false,
    isLoading = true,
    notifications = [],
    items = [],
    reports = [],
    allReports = [],
    myClaims = [],
    claimsReceived = []
  } = dashboardData || {};

  // Welcome Header with Retouch
  const WelcomeHeader = () => (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary/50">{user?.fullName || user?.username}</span>
          {isAdmin && <span className="ml-3 text-[10px] uppercase tracking-[0.2em] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full align-middle">SUDO</span>}
        </h1>
        <p className="text-muted-foreground text-sm font-medium leading-relaxed max-w-2xl mt-1">
          Manage your registered assets, monitor hub activity, and track security status in real-time.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-10 w-px bg-border/50 hidden md:block mx-2" />
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">Local Time</span>
          <span className="font-bold tabular-nums">{format(new Date(), 'HH:mm')}</span>
        </div>
      </div>
    </div>
  );




  const dashboardStyle = ((user?.preferences as UserPreferences)?.dashboardStyle || 'standard') as string;

  const getStatsGridClass = () => {
    switch (dashboardStyle) {
      case 'grid':
        return 'grid gap-6 md:grid-cols-3 lg:grid-cols-5 mb-8';
      case 'classic':
        return 'grid gap-6 md:grid-cols-1 lg:grid-cols-2 mb-8';
      default:
        return 'grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8';
    }
  };

  // Animate dashboard cards in sequence
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

  // Handle logout
  const handleLogout = () => {
    signOut();
  };

  if (!user) {
    // Handle not logged in state
    return (
      <PageLayout>
        <div className="max-w-7xl mx-auto text-center py-12 px-4">
          <h2 className="text-2xl font-semibold mb-4">{t('auth.loginRequired')}</h2>
          <Button onClick={() => navigate("/")}>{t('common.returnToHome')}</Button>
        </div>
      </PageLayout>
    );
  }

  // Function to render the appropriate dashboard based on user role
  const renderDashboardContent = () => {
    // Show loading state
    if (isLoading || !userStats) {
      return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-1/2 mb-2" />
                <Skeleton className="h-12 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    // Subscriber and default view
    if (activeTab === "overview") {
      return (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Stats Row */}
          <div className={getStatsGridClass()}>
            <motion.div variants={itemVariants}>
              <StatsCard
                title={t('dashboard.registeredItems')}
                value={userStats.totalItems}
                icon={<ShoppingBag className="h-5 w-5" />}
                iconBgClass="bg-blue-100 dark:bg-blue-900/30"
                iconTextClass="text-blue-600 dark:text-blue-400"
                trendData={[3, 7, 5, 10, 8, 12, userStats.totalItems]}
                chartColor="#4f46e5"
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <StatsCard
                title={t('dashboard.lostReports')}
                value={userStats.totalLostReports}
                icon={<AlertTriangle className="h-5 w-5" />}
                iconBgClass="bg-amber-100 dark:bg-amber-900/30"
                iconTextClass="text-amber-600 dark:text-amber-400"
                trendData={[2, 5, 3, 7, 6, 8, userStats.totalLostReports]}
                chartColor="#eab308"
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <StatsCard
                title={t('dashboard.foundReports')}
                value={userStats.totalFoundReports}
                icon={<CheckCircle2 className="h-5 w-5" />}
                iconBgClass="bg-green-100 dark:bg-green-900/30"
                iconTextClass="text-green-600 dark:text-green-400"
                trendData={[1, 3, 2, 4, 6, 5, userStats.totalFoundReports]}
                chartColor="#10b981"
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <StatsCard
                title={t('dashboard.totalSpent')}
                value={userStats.totalSpent}
                icon={<DollarSign className="h-5 w-5" />}
                iconBgClass="bg-purple-100 dark:bg-purple-900/30"
                iconTextClass="text-purple-600 dark:text-purple-400"
                trendData={[100, 250, 150, 400, 300, 500, userStats.totalSpent]}
                chartColor="#8b5cf6"
              />
            </motion.div>
          </div>

          {/* Role-Specific Stats Row */}
          {(isAdmin || isAgent) && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
              {userStats.allOpenReports !== undefined && (
                <motion.div variants={itemVariants}>
                  <StatsCard
                    title="Active Hub Reports"
                    value={userStats.allOpenReports}
                    icon={<FileText className="h-5 w-5" />}
                    iconBgClass="bg-orange-100 dark:bg-orange-900/30"
                    iconTextClass="text-orange-600 dark:text-orange-400"
                  />
                </motion.div>
              )}
              {isAdmin && userStats.totalUsers !== undefined && (
                <motion.div variants={itemVariants}>
                  <StatsCard
                    title="Total Platform Users"
                    value={userStats.totalUsers}
                    icon={<Users className="h-5 w-5" />}
                    iconBgClass="bg-indigo-100 dark:bg-indigo-900/30"
                    iconTextClass="text-indigo-600 dark:text-indigo-400"
                  />
                </motion.div>
              )}
              {isAdmin && userStats.pendingVerifications !== undefined && (
                <motion.div variants={itemVariants}>
                  <StatsCard
                    title="Pending Verifications"
                    value={userStats.pendingVerifications}
                    icon={<ShieldCheck className="h-5 w-5" />}
                    iconBgClass="bg-cyan-100 dark:bg-cyan-900/30"
                    iconTextClass="text-cyan-600 dark:text-cyan-400"
                  />
                </motion.div>
              )}
            </div>
          )}

          {/* Global Search removed - now accessible in the header for a cleaner UI */}

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

            {/* Upcoming Tasks - New Component */}
            <motion.div variants={itemVariants} className="lg:col-span-1">
              <UpcomingTasksCard />
            </motion.div>

            {/* Notifications */}
            <motion.div variants={itemVariants} className="lg:col-span-1">
              <NotificationCenter notifications={notifications || []} isLoading={false} />
            </motion.div>

            {/* Dashboard Alerts - New Component */}
            <motion.div variants={itemVariants} className="lg:col-span-1">
              <DashboardAlerts />
            </motion.div>
          </div>

          {/* Quick Actions & Recent Items */}
          {/* Recent Items Full Width */}
          <div className="grid gap-6 mb-6">
            <motion.div variants={itemVariants}>
              <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{t('dashboard.recentItems')}</CardTitle>
                    <CardDescription>
                      {t('dashboard.recentItemsDescription')}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('items')}>
                    View All
                  </Button>
                </CardHeader>
                <CardContent>
                  <ItemsTable items={userStats.recentlyAddedItems} isLoading={false} />
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Payment History */}
          <motion.div variants={itemVariants}>
            <PaymentHistoryCard />
          </motion.div>
        </motion.div>
      );
    }

    // Admin dashboard content
    if (isAdmin && activeTab === "admin") {
      return (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Admin Stats Row */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <motion.div variants={itemVariants}>
              <StatsCard
                title={t('dashboard.admin.totalRevenue')}
                value={adminStats?.totalRevenue || 0}
                previousValue={adminStats?.revenue?.lastMonth}
                icon={<DollarSign className="h-5 w-5" />}
                iconBgClass="bg-emerald-100 dark:bg-emerald-900/30"
                iconTextClass="text-emerald-600 dark:text-emerald-400"
                trendData={[3000, 4500, 3800, 5200, 4800, 6000, adminStats?.totalRevenue || 0]}
                chartColor="#10b981"
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <StatsCard
                title={t('dashboard.admin.totalUsers')}
                value={adminStats?.totalUsers || 0}
                icon={<Users className="h-5 w-5" />}
                iconBgClass="bg-blue-100 dark:bg-blue-900/30"
                iconTextClass="text-blue-600 dark:text-blue-400"
                trendData={[15, 22, 18, 27, 24, 32, adminStats?.totalUsers || 0]}
                chartColor="#3b82f6"
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <StatsCard
                title={t('dashboard.admin.registeredItems')}
                value={userStats.totalItems}
                icon={<ShoppingBag className="h-5 w-5" />}
                iconBgClass="bg-indigo-100 dark:bg-indigo-900/30"
                iconTextClass="text-indigo-600 dark:text-indigo-400"
                trendData={[30, 45, 38, 52, 48, 60, userStats.totalItems]}
                chartColor="#6366f1"
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <StatsCard
                title={t('dashboard.admin.activeReports')}
                value={(adminStats?.reportBreakdown?.lost || 0) + (adminStats?.reportBreakdown?.found || 0)}
                icon={<FileText className="h-5 w-5" />}
                iconBgClass="bg-red-100 dark:bg-red-900/30"
                iconTextClass="text-red-600 dark:text-red-400"
                trendData={[8, 12, 10, 15, 13, 18, (adminStats?.reportBreakdown?.lost || 0) + (adminStats?.reportBreakdown?.found || 0)]}
                chartColor="#ef4444"
              />
            </motion.div>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 md:grid-cols-2 mb-6">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>{t('dashboard.admin.monthlyRevenue')}</CardTitle>
                  <CardDescription>
                    {t('dashboard.admin.revenueDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PaymentAnalyticsChart data={adminStats?.monthlyRevenue?.map((item: any) => ({ date: item.month, amount: item.revenue })) || []} />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants} className="grid gap-6 grid-rows-2">
              <Card>
                <CardHeader>
                  <CardTitle>{t('dashboard.admin.paymentStatus')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <PaymentStatusChart data={
                    (adminStats?.paymentsByStatus || []).map((item: any) => ({
                      name: item.status,
                      value: item.count,
                      color: item.status === 'successful' ? '#10b981' :
                        item.status === 'pending' ? '#f59e0b' :
                          item.status === 'failed' ? '#ef4444' : '#94a3b8'
                    }))
                  } />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('dashboard.admin.paymentTypes')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <PaymentTypeChart data={
                    (adminStats?.paymentsByType || []).map((item: any) => ({
                      name: item.type,
                      value: item.amount,
                      color: item.type === 'registration' ? '#3b82f6' :
                        item.type === 'lost_report' ? '#8b5cf6' : '#94a3b8'
                    }))
                  } />
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Recent Transactions */}
          <motion.div variants={itemVariants}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{t('dashboard.admin.recentTransactions')}</CardTitle>
                <CardDescription>
                  {t('dashboard.admin.transactionsDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecentTransactions transactions={
                  (adminStats?.recentTransactions || []).map((transaction: any) => ({
                    id: transaction.id,
                    transactionRef: transaction.transactionRef,
                    amount: transaction.amount,
                    currency: transaction.currency,
                    status: transaction.status,
                    type: transaction.type,
                    createdAt: new Date(transaction.createdAt).toISOString(),
                    username: `User ${transaction.userId}` // Add mock username
                  }))
                } />
              </CardContent>
            </Card>
          </motion.div>

          {/* Verification Requests Management */}
          <motion.div variants={itemVariants} className="mb-6">
            <VerificationRequestsTable />
          </motion.div>
        </motion.div>
      );
    }

    // Agent dashboard content
    if ((isAgent || isAdmin) && activeTab === "agent") {
      return (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Agent Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <motion.div variants={itemVariants}>
              <StatsCard
                title={t('dashboard.agent.activeReports')}
                value={allReports.filter((r: any) => r.status === "active").length}
                icon={<ClipboardList className="h-5 w-5" />}
                iconBgClass="bg-orange-100 dark:bg-orange-900/30"
                iconTextClass="text-orange-600 dark:text-orange-400"
                trendData={[5, 12, 8, 15, 10, 18, allReports.filter((r: any) => r.status === "active").length]}
                chartColor="#f97316"
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <StatsCard
                title={t('dashboard.agent.lostReports')}
                value={allReports.filter((r: any) => r.type === "lost" && r.status === "active").length}
                icon={<AlertTriangle className="h-5 w-5" />}
                iconBgClass="bg-red-100 dark:bg-red-900/30"
                iconTextClass="text-red-600 dark:text-red-400"
                trendData={[4, 8, 6, 10, 7, 12, allReports.filter((r: any) => r.type === "lost" && r.status === "active").length]}
                chartColor="#ef4444"
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <StatsCard
                title={t('dashboard.agent.foundReports')}
                value={allReports.filter((r: any) => r.type === "found" && r.status === "active").length}
                icon={<CheckCircle2 className="h-5 w-5" />}
                iconBgClass="bg-green-100 dark:bg-green-900/30"
                iconTextClass="text-green-600 dark:text-green-400"
                trendData={[2, 5, 3, 7, 4, 8, allReports.filter((r: any) => r.type === "found" && r.status === "active").length]}
                chartColor="#10b981"
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <StatsCard
                title={t('dashboard.agent.resolvedReports')}
                value={allReports.filter((r: any) => r.status === "resolved").length}
                icon={<Clock className="h-5 w-5" />}
                iconBgClass="bg-blue-100 dark:bg-blue-900/30"
                iconTextClass="text-blue-600 dark:text-blue-400"
                trendData={[3, 6, 4, 9, 7, 12, allReports.filter((r: any) => r.status === "resolved").length]}
                chartColor="#3b82f6"
              />
            </motion.div>
          </div>

          {/* Report Tabs */}
          <motion.div variants={itemVariants} className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.agent.manageReports')}</CardTitle>
                <CardDescription>{t('dashboard.agent.reportsDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid lg:grid-cols-4 gap-6">
                  <div className="lg:col-span-3">
                    <Tabs defaultValue="all" className="w-full">
                      <TabsList className="grid w-full grid-cols-4 mb-4">
                        <TabsTrigger value="all">{t('dashboard.agent.allReports')}</TabsTrigger>
                        <TabsTrigger value="lost">{t('dashboard.agent.lostItems')}</TabsTrigger>
                        <TabsTrigger value="found">{t('dashboard.agent.foundItems')}</TabsTrigger>
                        <TabsTrigger value="resolved">{t('dashboard.agent.resolvedItems')}</TabsTrigger>
                      </TabsList>
                      <TabsContent value="all">
                        {/* All Reports Table */}
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>{t('dashboard.table.reportId')}</TableHead>
                                <TableHead>{t('dashboard.table.type')}</TableHead>
                                <TableHead>{t('dashboard.table.status')}</TableHead>
                                <TableHead>{t('dashboard.table.location')}</TableHead>
                                <TableHead>{t('dashboard.table.date')}</TableHead>
                                <TableHead>{t('dashboard.table.actions')}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {allReports.length > 0 ? (
                                allReports.map((r: any) => (
                                  <TableRow
                                    key={r.id}
                                    className={`cursor-pointer transition-colors ${selectedReportId === r.id ? 'bg-primary/5 hover:bg-primary/10' : ''}`}
                                    onClick={() => setSelectedReportId(r.id)}
                                  >
                                    <TableCell>{r.id}</TableCell>
                                    <TableCell>
                                      <Badge variant={r.type === "lost" ? "destructive" : "success"}>
                                        {r.type}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant={r.status === "active" ? "outline" : "secondary"}>
                                        {r.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>{r.location}</TableCell>
                                    <TableCell>{new Date(r.reportedAt).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                      <Button
                                        size="sm"
                                        variant={selectedReportId === r.id ? "default" : "outline"}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedReportId(r.id);
                                        }}
                                      >
                                        {selectedReportId === r.id ? t('dashboard.table.selected') : t('dashboard.table.match')}
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={6} className="text-center py-4">
                                    No reports found
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                  <div className="lg:col-span-1">
                    <SuggestedMatches reportId={selectedReportId} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions for Agents */}
          <motion.div variants={itemVariants} className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.agent.agentActions')}</CardTitle>
                <CardDescription>{t('dashboard.agent.actionsDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button className="flex flex-col items-center justify-center h-24 space-y-2" variant="outline">
                    <Search className="h-6 w-6" />
                    <span>{t('dashboard.agent.actions.search')}</span>
                  </Button>
                  <Button className="flex flex-col items-center justify-center h-24 space-y-2" variant="outline">
                    <FileText className="h-6 w-6" />
                    <span>{t('dashboard.agent.actions.newReport')}</span>
                  </Button>
                  <Button className="flex flex-col items-center justify-center h-24 space-y-2" variant="outline">
                    <Clock className="h-6 w-6" />
                    <span>{t('dashboard.agent.actions.recentActivity')}</span>
                  </Button>
                  <Button className="flex flex-col items-center justify-center h-24 space-y-2" variant="outline">
                    <Bell className="h-6 w-6" />
                    <span>{t('dashboard.agent.actions.notifications')}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      );
    }

    // Items tab
    if (activeTab === "items") {
      return (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{t('dashboard.items.title')}</CardTitle>
                  <CardDescription>{t('dashboard.items.description')}</CardDescription>
                </div>
                <Button size="sm" onClick={() => navigate("/register-item")}>
                  <Plus className="h-4 w-4 mr-2" /> {t('dashboard.items.registerNew')}
                </Button>
              </CardHeader>
              <CardContent>
                <ItemsTable items={items} isLoading={false} />
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      );
    }

    // Reports tab
    if (activeTab === "reports") {
      return (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{t('dashboard.reports.title')}</CardTitle>
                  <CardDescription>{t('dashboard.reports.description')}</CardDescription>
                </div>
                <Button size="sm" onClick={() => navigate("/lost-found/report")}>
                  <Plus className="h-4 w-4 mr-2" /> {t('dashboard.reports.newReport')}
                </Button>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger value="all">{t('dashboard.reports.allReports')}</TabsTrigger>
                    <TabsTrigger value="lost">{t('dashboard.reports.lostItems')}</TabsTrigger>
                    <TabsTrigger value="found">{t('dashboard.reports.foundItems')}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="all">
                    {/* Render all reports table */}
                    <ActivityTimeline items={[]} reports={reports} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      );
    }

    // Payments tab
    if (activeTab === "payments") {
      return (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="mb-6">
            <h2 className="text-2xl font-semibold mb-4">{t('dashboard.payments.title')}</h2>
            <PaymentHistoryCard />
          </motion.div>
        </motion.div>
      );
    }

    // Claims tab
    if (activeTab === "claims") {
      return (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="grid gap-6 md:grid-cols-2 mb-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <CardTitle>My Claims</CardTitle>
                </div>
                <CardDescription>Items you've claimed as yours.</CardDescription>
              </CardHeader>
              <CardContent>
                {myClaims.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Claim ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myClaims.map((claim: any) => (
                        <TableRow key={claim.id}>
                          <TableCell className="font-mono text-xs">#{claim.id}</TableCell>
                          <TableCell>
                            <Badge variant={claim.status === 'pending' ? 'outline' : 'secondary'}>
                              {claim.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">{format(new Date(claim.createdAt), 'MMM d, yyyy')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-muted-foreground italic">You haven't filed any claims yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BellRing className="h-5 w-5 text-primary" />
                  <CardTitle>Claims Received</CardTitle>
                </div>
                <CardDescription>People claiming items you found.</CardDescription>
              </CardHeader>
              <CardContent>
                {claimsReceived.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>From</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {claimsReceived.map((claim: any) => (
                        <TableRow key={claim.id}>
                          <TableCell className="text-xs">User #{claim.userId}</TableCell>
                          <TableCell>
                            <Badge variant={claim.status === 'pending' ? 'outline' : 'secondary'}>
                              {claim.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedClaim(claim);
                                setReviewOpen(true);
                              }}
                            >
                              Review
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-muted-foreground italic">No claims received yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <ClaimReviewDialog
            claim={selectedClaim}
            isOpen={reviewOpen}
            onClose={() => setReviewOpen(false)}
          />
        </motion.div>
      );
    }

    if (activeTab === "moderation") {
      return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <ModerationQueue />
        </motion.div>
      );
    }

    if (activeTab === "business") {
      return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <BusinessInsights userStats={userStats} />
        </motion.div>
      );
    }

    return (
      <div className="p-6 text-center">
        <p>{t('dashboard.selectTab')}</p>
      </div>
    );
  };

  // Define dashboard tabs based on user role
  const getDashboardTabs = () => {
    const tabs = [
      {
        id: "overview",
        label: t('dashboard.tabs.overview'),
        icon: <LayoutDashboard className="h-5 w-5" />
      },
      {
        id: "items",
        label: t('dashboard.tabs.items'),
        icon: <ShoppingBag className="h-5 w-5" />
      },
      {
        id: "reports",
        label: t('dashboard.tabs.reports'),
        icon: <ClipboardList className="h-5 w-5" />
      },
      {
        id: "payments",
        label: t('dashboard.tabs.payments'),
        icon: <DollarSign className="h-5 w-5" />
      },
      {
        id: "claims",
        label: t('dashboard.tabs.claims'),
        icon: <ShieldCheck className="h-5 w-5" />
      }
    ];

    // Add admin tab for admins
    if (isAdmin) {
      tabs.push({
        id: "admin",
        label: t('dashboard.tabs.adminPanel'),
        icon: <BarChart3 className="h-5 w-5" />
      });
    }

    // Add agent tab for agents (and admins)
    if (isAgent || isAdmin) {
      tabs.push({
        id: "agent",
        label: t('dashboard.tabs.agentConsole'),
        icon: <Search className="h-5 w-5" />
      });
    }

    // Add moderation tab for moderators, agents and admins
    if (isAdmin || isAgent || isModerator) {
      tabs.push({
        id: "moderation",
        label: t('dashboard.tabs.moderation') || "Moderation",
        icon: <ShieldCheck className="h-5 w-5" />
      });
    }

    // Add Business Insights for business users and high-volume subscribers
    if (isBusiness || userStats.totalItems >= 5 || (user.role === 'Subscriber' && userStats.totalSpent > 5000)) {
      tabs.push({
        id: "business",
        label: t('dashboard.tabs.businessInsights') || "Business Insights",
        icon: <BarChart3 className="h-5 w-5" />
      });
    }

    return tabs;
  };

  return (
    <AppLayout>
      <ErrorBoundary>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {/* Simple Welcome Title */}
          {/* Premium Welcome Header */}
          <WelcomeHeader />

          {/* Dashboard Content */}
          <div className="mt-2">
            <Suspense fallback={<div className="p-8 text-center italic">Loading dashboard components...</div>}>
              {renderDashboardContent()}
            </Suspense>
          </div>
        </motion.div>
      </ErrorBoundary>
    </AppLayout>

  );
}
