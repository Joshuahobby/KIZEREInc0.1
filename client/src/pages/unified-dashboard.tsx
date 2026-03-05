import * as React from "react";
import { ErrorBoundary } from "@/components/error-boundary";

import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useDashboardData, DashboardData, DashboardStats } from "../hooks/use-dashboard-data";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardSkeleton } from "@/components/ui/skeleton-loader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsCard } from "@/components/dashboard/stats-card";
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
  Activity,
  Package,
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


// Identity Protection Card (Rwanda Specific)
const IdentityProtectionCard = ({ user, t }: { user: any, t: any }) => (
  <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden relative group">
    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
      <ShieldCheck className="h-24 w-24 text-primary" />
    </div>
    <CardHeader className="pb-2">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-primary/10 rounded-lg">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <CardTitle className="text-lg">{t('dashboard.identityProtection.title') || "Identity Protection"}</CardTitle>
          <CardDescription className="text-xs">
            {t('dashboard.identityProtection.desc') || "Secure your National ID and Passport"}
          </CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="flex flex-wrap gap-3 mt-2">
        <Badge variant="outline" className="bg-background/50 backdrop-blur-sm border-primary/20 px-3 py-1 flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wider">{t('dashboard.identityProtection.nid_protected')}</span>
        </Badge>
        <Badge variant="outline" className="bg-background/50 backdrop-blur-sm border-primary/20 px-3 py-1 flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wider">{t('dashboard.identityProtection.passport_protected')}</span>
        </Badge>
      </div>
      <Button variant="link" size="sm" className="px-0 mt-4 text-xs font-bold text-primary group-hover:underline">
        {t('dashboard.identityProtection.manage') || "Manage Protection Settings →"}
      </Button>
    </CardContent>
  </Card>
);

// Helper component for the header
const WelcomeHeader = ({ user, isAdmin, t }: { user: any, isAdmin: boolean, t: any }) => (
  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
    <div className="space-y-1">
      <div className="flex items-center gap-2 mb-1">
        <Badge variant="outline" className="text-[10px] font-black tracking-tighter uppercase border-primary/20 text-primary px-2 py-0">
          KIZERE {user?.role || 'User'}
        </Badge>
        <div className="h-1 w-1 rounded-full bg-border" />
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Rwanda Operations</span>
      </div>
      <h1 className="text-3xl font-black tracking-tight sm:text-4xl text-foreground">
        {t('dashboard.welcomeBack', { name: "" }).replace(/,?\s*$/, '')}{' '}
        <span className="text-primary italic">
          {user?.fullName?.split(' ')[0] || user?.username}
        </span>
        {isAdmin && <span className="ml-3 text-[10px] uppercase tracking-[0.2em] font-black text-white bg-primary px-3 py-1 rounded-full shadow-lg shadow-primary/20">SUDO</span>}
      </h1>
      <p className="text-muted-foreground text-sm font-medium leading-relaxed max-w-2xl">
        {t('dashboard.welcomeSubtitle')}
      </p>
    </div>
    <div className="flex items-center gap-4 bg-secondary/5 p-3 rounded-2xl border border-border/50 backdrop-blur-sm">
      <div className="flex flex-col items-start pr-4 border-r border-border/50">
        <span className="text-[9px] uppercase tracking-widest font-black text-muted-foreground/60">{t('dashboard.localTime')}</span>
        <span className="font-bold tabular-nums text-lg">{format(new Date(), 'HH:mm')}</span>
      </div>
      <div className="flex flex-col items-start">
        <span className="text-[9px] uppercase tracking-widest font-black text-muted-foreground/60">Status</span>
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-xs font-bold">Online</span>
        </div>
      </div>
    </div>
  </div>
);


const logger = createLogger('UnifiedDashboard');

export default function UnifiedDashboard() {
  const [location, navigate] = useLocation();
  const { user, signOut } = useAuth();
  const { t } = useLanguage();

  // Get initial tab based on URL and user role
  const getInitialTab = () => {
    const params = new URLSearchParams(window.location.search);
    const urlTab = params.get('tab');
    if (urlTab) return urlTab;

    // Default based on role
    if (user?.role === 'Admin') return "admin";
    if (user?.role === 'Agent') return "agent";
    return "overview";
  };

  const [activeTab, setActiveTab] = React.useState(getInitialTab());




  // Update state when URL changes - using explicit React reference to avoid ReferenceErrors
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const currentTab = params.get('tab') || (user?.role === 'Admin' ? 'admin' : user?.role === 'Agent' ? 'agent' : 'overview');
    if (currentTab !== activeTab) {
      setActiveTab(currentTab);
    }
    // Added console log to confirm this effect is running and cache is refreshed
    console.log('[UnifiedDashboard] Tab sync effect running', { currentTab, activeTab });
  }, [window.location.search, activeTab, user?.role]);

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






  const dashboardStyle = ((user?.preferences as UserPreferences)?.dashboardStyle || 'grid') as string;

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
      return <DashboardSkeleton />;
    }

    // Subscriber and default view (Minimalist Action-First)
    if (activeTab === "overview") {
      return (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-5xl mx-auto space-y-8"
        >
          {/* Identity Protection (Rwanda Focus) */}
          <motion.div variants={itemVariants}>
            <IdentityProtectionCard user={user} t={t} />
          </motion.div>

          {/* Primary Action Paths */}
          <div className="grid md:grid-cols-2 gap-4">
            <motion.div variants={itemVariants}>
              <Card
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-all border-destructive/20 bg-destructive/5 hover:bg-destructive/10 group relative"
                onClick={() => navigate('/lost')}
              >
                <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                  <AlertTriangle className="h-16 w-16 text-destructive" />
                </div>
                <CardContent className="p-5 flex flex-row items-center gap-5">
                  <div className="p-3 bg-destructive/10 rounded-2xl shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-black tracking-tight text-destructive">{t('dashboard.action.lostTitle')}</h3>
                    <p className="text-muted-foreground text-xs leading-tight mt-1 font-medium">{t('dashboard.action.lostDesc')}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-all border-primary/20 bg-primary/5 hover:bg-primary/10 group relative"
                onClick={() => navigate('/found')}
              >
                <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Search className="h-16 w-16 text-primary" />
                </div>
                <CardContent className="p-5 flex flex-row items-center gap-5">
                  <div className="p-3 bg-primary/10 rounded-2xl shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                    <Search className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-black tracking-tight text-primary">{t('dashboard.action.foundTitle')}</h3>
                    <p className="text-muted-foreground text-xs leading-tight mt-1 font-medium">{t('dashboard.action.foundDesc')}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Secondary Action & Clean List */}
          <motion.div variants={itemVariants} className="pt-2">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-1 bg-primary rounded-full" />
                <div>
                  <h2 className="text-xl font-black tracking-tight uppercase">{t('nav.myItems')}</h2>
                  <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold">
                    {userStats.totalItems} {t('dashboard.registeredItems')}
                  </p>
                </div>
              </div>
              <Button onClick={() => navigate('/register-item')} className="w-full sm:w-auto font-bold shadow-lg shadow-primary/20">
                <Plus className="mr-2 h-4 w-4" />
                {t('dashboard.action.protectTitle')}
              </Button>
            </div>

            <Card className="border-border/50 shadow-sm overflow-hidden bg-background/50 backdrop-blur-sm">
              <CardContent className="p-0">
                <ItemsTable items={userStats.recentlyAddedItems} isLoading={false} />
              </CardContent>
            </Card>

            <div className="flex justify-center mt-6">
              <Button variant="ghost" size="sm" onClick={() => setActiveTab('items')} className="text-muted-foreground font-bold hover:text-primary transition-colors">
                {t('dashboard.viewAll')} →
              </Button>
            </div>
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
          {/* Stats and System Status */}
          <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4 mb-6">
            <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-3">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                <StatsCard
                  title={t('dashboard.admin.totalUsers')}
                  value={adminStats?.totalUsers || 0}
                  icon={<Users className="h-5 w-5" />}
                  iconBgClass="bg-blue-100 dark:bg-blue-900/30"
                  iconTextClass="text-blue-600 dark:text-blue-400"
                  trendData={[15, 22, 18, 27, 24, 32, adminStats?.totalUsers || 0]}
                  chartColor="#3b82f6"
                />
                <StatsCard
                  title={t('dashboard.admin.activeReports')}
                  value={(adminStats?.reportBreakdown?.lost || 0) + (adminStats?.reportBreakdown?.found || 0)}
                  icon={<FileText className="h-5 w-5" />}
                  iconBgClass="bg-red-100 dark:bg-red-900/30"
                  iconTextClass="text-red-600 dark:text-red-400"
                  trendData={[8, 12, 10, 15, 13, 18, (adminStats?.reportBreakdown?.lost || 0) + (adminStats?.reportBreakdown?.found || 0)]}
                  chartColor="#ef4444"
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="md:col-span-1">
              <Card className="h-full border-primary/10 bg-primary/5">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      {t('dashboard.admin.systemStatus') || "System Status"}
                    </CardTitle>
                    <Badge variant="outline" className="text-[9px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">LIVE</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">{t('dashboard.admin.apiServices')}</span>
                      <span className="text-emerald-500 font-bold">{t('dashboard.admin.operational')}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">{t('dashboard.admin.database')}</span>
                      <span className="text-emerald-500 font-bold">{t('dashboard.admin.optimal')}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">{t('dashboard.admin.paymentsMtn')}</span>
                      <span className="text-emerald-500 font-bold">{t('dashboard.admin.online')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mb-6">
            <motion.div variants={itemVariants} className="md:col-span-2 space-y-6">
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

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">{t('dashboard.admin.paymentStatus')}</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[200px]">
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
                    <CardTitle className="text-sm">{t('dashboard.admin.paymentTypes')}</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[200px]">
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
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-6">
              <Card className="h-full flex flex-col max-h-[600px]">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    {t('dashboard.admin.recentActivity') || "Recent Activity"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto p-4 space-y-4 pt-0">
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-4"
                  >
                    {[
                      { title: t('dashboard.admin.recentActivityItems.newUser') || "New user", time: "5m ago", desc: t('dashboard.admin.recentActivityItems.newUserDesc') || "Subscriber John joined", icon: <Users className="h-3 w-3" /> },
                      { title: t('dashboard.admin.recentActivityItems.itemRegistered') || "Item registered", time: "12m ago", desc: t('dashboard.admin.recentActivityItems.itemRegisteredDesc') || "Samsung S24 registered", icon: <Package className="h-3 w-3" /> },
                      { title: t('dashboard.admin.recentActivityItems.paymentReceived') || "Payment received", time: "45m ago", desc: t('dashboard.admin.recentActivityItems.paymentReceivedDesc') || "RWF 5,000 via Momo", icon: <DollarSign className="h-3 w-3" /> }
                    ].map((act, i) => (
                      <motion.div key={i} variants={itemVariants} className="flex gap-3 items-start">
                        <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center shrink-0">
                          {act.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <p className="text-[11px] font-bold truncate">{act.title}</p>
                            <span className="text-[9px] text-muted-foreground shrink-0 ml-2">{act.time}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">{act.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                  <Button variant="ghost" size="sm" className="w-full text-[10px] font-bold text-primary mt-2">
                    {t('dashboard.viewAll') || "VIEW ALL"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

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
                    {reports.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t('dashboard.table.type')}</TableHead>
                              <TableHead>{t('dashboard.table.title') || 'Title'}</TableHead>
                              <TableHead className="hidden sm:table-cell">{t('dashboard.table.location')}</TableHead>
                              <TableHead>{t('dashboard.table.status')}</TableHead>
                              <TableHead className="hidden sm:table-cell">{t('dashboard.table.date')}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {reports.map((r: any) => (
                              <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/reports/${r.id}`)}>
                                <TableCell>
                                  <Badge variant={r.type === 'lost' ? 'destructive' : 'default'}>
                                    {r.type === 'lost' ? '🔴 Lost' : '🟢 Found'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-medium">{r.title}</TableCell>
                                <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{r.location}</TableCell>
                                <TableCell>
                                  <Badge variant={r.status === 'active' || r.status === 'Open' ? 'outline' : 'secondary'}>
                                    {r.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">
                                  {new Date(r.reportedAt).toLocaleDateString()}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <p className="text-muted-foreground">{t('dashboard.noReports') || 'No reports yet.'}</p>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="lost">
                    {reports.filter((r: any) => r.type === 'lost').length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t('dashboard.table.title') || 'Title'}</TableHead>
                              <TableHead className="hidden sm:table-cell">{t('dashboard.table.location')}</TableHead>
                              <TableHead>{t('dashboard.table.status')}</TableHead>
                              <TableHead className="hidden sm:table-cell">{t('dashboard.table.date')}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {reports.filter((r: any) => r.type === 'lost').map((r: any) => (
                              <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/reports/${r.id}`)}>
                                <TableCell className="font-medium">{r.title}</TableCell>
                                <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{r.location}</TableCell>
                                <TableCell>
                                  <Badge variant={r.status === 'active' || r.status === 'Open' ? 'outline' : 'secondary'}>{r.status}</Badge>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">
                                  {new Date(r.reportedAt).toLocaleDateString()}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <p className="text-muted-foreground">No lost reports filed yet.</p>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="found">
                    {reports.filter((r: any) => r.type === 'found').length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t('dashboard.table.title') || 'Title'}</TableHead>
                              <TableHead className="hidden sm:table-cell">{t('dashboard.table.location')}</TableHead>
                              <TableHead>{t('dashboard.table.status')}</TableHead>
                              <TableHead className="hidden sm:table-cell">{t('dashboard.table.date')}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {reports.filter((r: any) => r.type === 'found').map((r: any) => (
                              <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/reports/${r.id}`)}>
                                <TableCell className="font-medium">{r.title}</TableCell>
                                <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{r.location}</TableCell>
                                <TableCell>
                                  <Badge variant={r.status === 'active' || r.status === 'Open' ? 'outline' : 'secondary'}>{r.status}</Badge>
                                </TableCell>
                                <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">
                                  {new Date(r.reportedAt).toLocaleDateString()}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <p className="text-muted-foreground">No found reports filed yet.</p>
                      </div>
                    )}
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
                  <CardTitle>{t('dashboard.myClaims')}</CardTitle>
                </div>
                <CardDescription>{t('dashboard.claimsDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                {myClaims.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('dashboard.table.claimId')}</TableHead>
                        <TableHead>{t('dashboard.table.status')}</TableHead>
                        <TableHead>{t('dashboard.table.date')}</TableHead>
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
                    <p className="text-muted-foreground italic">{t('dashboard.noClaimsFiled')}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BellRing className="h-5 w-5 text-primary" />
                  <CardTitle>{t('dashboard.claimsReceived')}</CardTitle>
                </div>
                <CardDescription>{t('dashboard.claimsReceivedDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                {claimsReceived.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('dashboard.table.from')}</TableHead>
                        <TableHead>{t('dashboard.table.status')}</TableHead>
                        <TableHead>{t('dashboard.table.action')}</TableHead>
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
                              {t('common.actions.review')}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-muted-foreground italic">{t('dashboard.noClaimsReceived')}</p>
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
    // Shared tabs for all users
    const tabs = [
      {
        id: "overview",
        label: t('dashboard.tabs.overview'),
        icon: <LayoutDashboard className="h-4 w-5" />
      },
      {
        id: "items",
        label: t('dashboard.tabs.items'),
        icon: <ShoppingBag className="h-4 w-5" />
      },
      {
        id: "reports",
        label: t('dashboard.tabs.reports'),
        icon: <ClipboardList className="h-4 w-5" />
      }
    ];

    // Business users or high-volume power users get Business Insights prominently
    if (isBusiness || userStats.totalItems >= 5 || (user.role === 'Subscriber' && userStats.totalSpent > 10000)) {
      tabs.push({
        id: "business",
        label: t('dashboard.tabs.businessInsights') || "Business",
        icon: <BarChart3 className="h-4 w-5" />
      });
    }

    // Role specific functional tabs
    if (isAgent || isAdmin) {
      tabs.push({
        id: "agent",
        label: t('dashboard.tabs.agentConsole'),
        icon: <Search className="h-4 w-5" />
      });
    }

    if (isAdmin || isAgent || isModerator) {
      tabs.push({
        id: "moderation",
        label: t('dashboard.tabs.moderation') || "Moderation",
        icon: <ShieldCheck className="h-4 w-5" />
      });
    }

    // Admin Panel is exclusive to SUDO/Admin users
    if (isAdmin) {
      tabs.push({
        id: "admin",
        label: t('dashboard.tabs.adminPanel'),
        icon: <Settings className="h-5 w-5" />
      });
    }

    // Secondary tabs moved to a "More" or lower priority if needed, 
    // but here we keep them clean
    tabs.push({
      id: "payments",
      label: t('dashboard.tabs.payments'),
      icon: <DollarSign className="h-4 w-5" />
    });

    return tabs;
  };

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <WelcomeHeader user={user} isAdmin={isAdmin} t={t} />

        <div className="mt-2">
          <React.Suspense fallback={<div className="p-8 text-center italic">{t('dashboard.loadingComponents')}</div>}>
            {renderDashboardContent()}
          </React.Suspense>
        </div>
      </motion.div>
    </AppLayout>
  );
}
