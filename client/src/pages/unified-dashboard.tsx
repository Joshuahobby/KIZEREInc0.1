import * as React from "react";
import { ErrorBoundary } from "@/components/error-boundary";

import { useAuth } from "@/hooks/use-auth";
import { useLocation, useSearch } from "wouter";
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
import { AuthWall } from "@/components/ui/auth-wall";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  XCircle,
  Clock,
  CheckCircle2,
  Trash2,
  ChevronRight,
  Plus,
  Search,
  ChevronDown,
  Filter,
  RefreshCw,
  Bell,
  CreditCard,
  CreditCard as PaymentIcon,
  Package,
  FileText,
  User,
  Users,
  Settings,
  MoreVertical,
  Download,
  Share2,
  Heart,
  MessageSquare,
  Shield,
  HelpCircle,
  ArrowDownUp,
  Calendar,
  BellRing,
  ShoppingBag,
  DollarSign,
  ClipboardList,
  Activity,
  LayoutDashboard,
  BarChart3,
  LogOut
} from "lucide-react";
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
import { OnboardingTour } from "@/components/dashboard/OnboardingTour";
import { AssistedRegistrationDialog } from "@/components/agent/AssistedRegistrationDialog";
import { AssistedUserCreationDialog } from "@/components/agent/AssistedUserCreationDialog";
import { ItemHandoverDialog } from "@/components/agent/ItemHandoverDialog";
import { DirectVerificationDialog } from "@/components/agent/DirectVerificationDialog";


// Moved inside UnifiedDashboard for translation scope

// Helper component for the header
const WelcomeHeader = ({ user, isAdmin, t }: { user: any, isAdmin: boolean, t: any }) => (
  <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10 lg:mb-16">
    <div className="space-y-4 text-center md:text-left">
      <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
        <Badge variant="outline" className="premium-label border-primary/40 bg-primary/10 text-primary px-4 py-1 rounded-full shadow-[0_0_15px_rgba(var(--primary),0.1)]">
          KIZERE {user?.role || 'User'}
        </Badge>
        {isAdmin && (
          <Badge className="bg-primary text-white premium-label px-3 py-1 rounded-full shadow-lg shadow-primary/20 animate-pulse">
            SUDO
          </Badge>
        )}
      </div>
      <h1 className="text-4xl font-black tracking-tighter sm:text-5xl lg:text-7xl text-foreground leading-[0.9]">
        {t('dashboard.welcomeBack', { name: "" }).split(',')[0]}{' '}
        <span className="text-primary block sm:inline mt-2 sm:mt-0 drop-shadow-[0_0_20px_rgba(var(--primary),0.2)]">
          {user?.fullName?.split(' ')[0] || user?.username}
        </span>
      </h1>
      <p className="text-muted-foreground text-base sm:text-lg font-medium leading-relaxed max-w-2xl opacity-80 mt-4 mx-auto md:mx-0">
        {t('dashboard.welcomeSubtitle')}
      </p>
    </div>
    <div className="grid grid-cols-1 sm:flex sm:flex-row items-center justify-center md:justify-end gap-3 w-full md:w-auto">
      {/* Replay Walkthrough Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-14 w-full sm:w-14 rounded-2xl text-muted-foreground hover:text-primary transition-all duration-300 bg-white dark:bg-slate-900 shadow-premium border border-border/50 group"
        onClick={() => window.dispatchEvent(new CustomEvent('replay-onboarding'))}
        title={t('walkthrough.replay') || "Replay Walkthrough"}
      >
        <HelpCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
        <span className="sm:hidden ml-2 font-black text-xs uppercase tracking-widest">{t('walkthrough.replay') || "Replay Tour"}</span>
      </Button>

      <div className="flex items-center gap-3 w-full sm:w-auto">
        {/* Time Pill */}
        <div className="flex-1 sm:flex-none flex items-center justify-between sm:justify-start gap-4 bg-background px-6 py-3 rounded-2xl border border-border shadow-premium h-14">
          <span className="premium-label text-muted-foreground/60">{t('dashboard.localTime')}</span>
          <span className="font-black text-sm tabular-nums text-foreground tracking-tight">{format(new Date(), 'HH:mm')}</span>
        </div>

        {/* Status Pill */}
        <div className="flex-1 sm:flex-none flex items-center justify-between sm:justify-start gap-4 bg-background px-6 py-3 rounded-2xl border border-border shadow-premium h-14">
          <span className="premium-label text-muted-foreground/60">Status</span>
          <div className="flex items-center gap-3 pl-1">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)] animate-pulse" />
            <span className="text-xs font-black text-foreground tracking-tight uppercase">ONLINE</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);
// Helper components
const KYCAlert = ({ t, navigate, verificationRequest }: { t: any, navigate: any, verificationRequest?: any }) => {
  const isRejected = verificationRequest?.status === 'rejected';
  const isPending = verificationRequest?.status === 'pending';
  const rejectionReason = verificationRequest?.adminComment;

  if (isPending) return null;

  return (
    <Card data-tour="kyc-alert" className={cn(
      "border-primary/20 shadow-premium mb-6 overflow-hidden relative group rounded-3xl",
      isRejected ? "bg-destructive/5 border-destructive/20" : "bg-primary/5"
    )}>
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
        {isRejected ? <XCircle className="h-24 w-24 text-destructive" /> : <ShieldCheck className="h-24 w-24 text-primary" />}
      </div>
      <CardContent className="p-6 relative">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex-1 text-center sm:text-left">
            <h3 className={cn(
              "text-xl font-black tracking-tight flex items-center justify-center sm:justify-start gap-3 mb-2",
              isRejected ? "text-destructive" : "text-foreground"
            )}>
              {isRejected ? <AlertTriangle className="h-6 w-6 animate-pulse" /> : <ShieldCheck className="h-6 w-6 text-primary animate-pulse" />}
              {isRejected ? (t('dashboard.identityProtection.status_rejected') || "Verification Rejected") : (t('dashboard.action.verifyTitle') || "Complete Your Verification")}
            </h3>
            <p className="text-muted-foreground text-sm max-w-xl font-medium leading-relaxed">
              {isRejected 
                ? (rejectionReason || t('dashboard.identityProtection.rejected_desc') || "Your verification was not approved. Please review the requirements and try again.")
                : (t('dashboard.action.verifyDesc') || "To fully secure your items and access all recovery features, please complete your identity verification.")
              }
            </p>
          </div>
          <Button 
            onClick={() => navigate('/verification')}
            variant={isRejected ? "destructive" : "default"}
            size="standard"
            className="w-full sm:w-auto"
          >
            {isRejected ? (t('dashboard.action.tryAgain') || "Try Again") : (t('dashboard.action.verifyAction') || "Verify Now")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};


const logger = createLogger('UnifiedDashboard');

export default function UnifiedDashboard() {
  const [location, navigate] = useLocation();
  const searchString = useSearch();
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const [assistedRegOpen, setAssistedRegOpen] = React.useState(false);
  const [assistedUserOpen, setAssistedUserOpen] = React.useState(false);
  const [directVerifyOpen, setDirectVerifyOpen] = React.useState(false);
  const [handoverOpen, setHandoverOpen] = React.useState(false);
  const [selectedClaimId, setSelectedClaimId] = React.useState<number | null>(null);


  // Identity Protection Card (Rwanda Specific)
  const IdentityProtectionCard = ({ verificationRequest }: { verificationRequest?: any }) => {
    const status = user?.verificationStatus || 'unverified';
    const adminComment = verificationRequest?.adminComment;
    
    const getStatusConfig = () => {
      switch (status) {
        case 'approved':
          return {
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            icon: <CheckCircle2 className="h-4 w-4" />,
            label: t('dashboard.identityProtection.status_approved'),
            desc: t('dashboard.identityProtection.approved_msg')
          };
        case 'pending':
          return {
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
            icon: <Clock className="h-4 w-4 animate-pulse" />,
            label: t('dashboard.identityProtection.status_pending'),
            desc: t('dashboard.identityProtection.pending_msg')
          };
        case 'rejected':
          return {
            color: 'text-destructive',
            bg: 'bg-destructive/10',
            icon: <XCircle className="h-4 w-4" />,
            label: t('dashboard.identityProtection.status_rejected'),
            desc: adminComment || t('dashboard.identityProtection.rejected_msg')
          };
        default:
          return {
            color: 'text-primary',
            bg: 'bg-primary/10',
            icon: <ShieldCheck className="h-4 w-4" />,
            label: t('dashboard.identityProtection.status_unverified'),
            desc: t('dashboard.identityProtection.unverified_msg')
          };
      }
    };

    const config = getStatusConfig();

    return (
      <Card data-tour="identity-card" className="border-border bg-card shadow-premium hover:border-primary transition-all duration-500 overflow-hidden relative group h-full flex flex-col justify-between rounded-3xl">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <ShieldCheck className="h-24 w-24 text-primary" />
        </div>
        <CardHeader className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className={`p-2 sm:p-2.5 ${config.bg} rounded-xl`}>
                <ShieldCheck className={`h-5 w-5 sm:h-6 sm:w-6 ${config.color}`} />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-semibold">{t('dashboard.identityProtection.title') || "Identity Protection"}</CardTitle>
                <div className={`flex items-center gap-1.5 mt-0.5 ${config.color} text-[10px] font-bold uppercase tracking-wider`}>
                  {config.icon}
                  {config.label}
                </div>
              </div>
            </div>
          </div>
          <CardDescription className="text-xs font-normal leading-relaxed">
            {config.desc}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 pt-0 mt-auto">
          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            <Badge variant="outline" className={`bg-background/40 ${status === 'approved' ? 'border-emerald-500/30' : 'border-primary/20'} px-2 py-1 flex items-center gap-1.5 rounded-full whitespace-nowrap w-fit`}>
              <div className={`h-1.5 w-1.5 rounded-full ${status === 'approved' ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
              <span className="text-[10px] font-medium tracking-wide">{t('dashboard.identityProtection.nid_protected') || "NID: PROTECTED"}</span>
            </Badge>
            <Badge variant="outline" className={`bg-background/40 ${status === 'approved' ? 'border-emerald-500/30' : 'border-primary/20'} px-2 py-1 flex items-center gap-1.5 rounded-full whitespace-nowrap w-fit`}>
              <div className={`h-1.5 w-1.5 rounded-full ${status === 'approved' ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
              <span className="text-[10px] font-medium tracking-wide">{t('dashboard.identityProtection.passport_protected') || "PASSPORT: PROTECTED"}</span>
            </Badge>
          </div>
          <Button 
            variant="link" 
            size="standard" 
            className="px-0 mt-4 text-sm font-black text-primary group-hover:text-primary/80 h-auto uppercase tracking-widest"
            onClick={() => navigate('/verification')}
          >
            {status === 'approved' ? t('dashboard.identityProtection.manage') : t('dashboard.action.verifyAction') || "Complete Verification"}
          </Button>
        </CardContent>
      </Card>
    );
  };

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
    const params = new URLSearchParams(searchString);
    const currentTab = params.get('tab') || (user?.role === 'Admin' ? 'admin' : user?.role === 'Agent' ? 'agent' : 'overview');
    if (currentTab !== activeTab) {
      setActiveTab(currentTab);
    }
    // Added console log to confirm this effect is running and cache is refreshed
    console.log('[UnifiedDashboard] Tab sync effect running', { currentTab, activeTab });
  }, [searchString, activeTab, user?.role]);

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
    claimsReceived = [],
    verificationRequest = null
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
    return (
      <PageLayout>
        <div className="container max-w-7xl mx-auto py-20 flex items-center justify-center">
          <AuthWall returnUrl="/dashboard" />
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
          className="max-w-5xl mx-auto space-y-4 sm:space-y-8"
        >
          {user.verificationStatus !== 'approved' && (
            <KYCAlert t={t} navigate={navigate} verificationRequest={verificationRequest} />
          )}
          {/* Bento Box Action Grid */}
          <div data-tour="quick-actions" className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:grid-cols-5">
            {/* Main Identity Block - Spans 3 columns on large screens, 2 on medium */}
            <motion.div data-tour="identity-protection" variants={itemVariants} className="md:col-span-2 lg:col-span-3">
              <IdentityProtectionCard verificationRequest={verificationRequest} />
            </motion.div>

            {/* Sub Action Blocks - Stacked vertically next to the identity block */}
            <div className="flex flex-col gap-6 md:col-span-1 lg:col-span-2">
              <motion.div variants={itemVariants} className="flex-1">
                <Card
                  data-tour="report-lost"
                  className="overflow-hidden cursor-pointer shadow-premium hover:shadow-destructive/20 transition-all duration-500 border-destructive/20 bg-destructive/5 hover:bg-destructive/10 group relative h-full flex flex-col justify-center min-h-[110px] rounded-3xl"
                  onClick={() => navigate('/report-lost')}
                >
                  <CardContent className="p-6 flex items-center gap-5">
                    <div className="p-4 bg-destructive/10 rounded-2xl shrink-0 group-hover:scale-110 group-hover:bg-destructive/20 transition-all duration-300">
                      <AlertTriangle className="h-7 w-7 text-destructive" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-destructive dark:text-red-400 tracking-tight uppercase">{t('dashboard.action.lostTitle') || "I Lost Something"}</h3>
                      <p className="text-muted-foreground text-xs leading-tight mt-1 font-medium opacity-70">{t('dashboard.action.lostDesc') || "Report a lost item and notify others."}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants} className="flex-1">
                <Card
                  data-tour="report-found"
                  className="overflow-hidden cursor-pointer shadow-premium hover:shadow-primary/20 transition-all duration-500 border-primary/20 bg-primary/5 hover:bg-primary/10 group relative h-full flex flex-col justify-center min-h-[110px] rounded-3xl"
                  onClick={() => navigate('/report-found')}
                >
                  <CardContent className="p-6 flex items-center gap-5">
                    <div className="p-4 bg-primary/10 rounded-2xl shrink-0 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                      <Search className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-primary dark:text-blue-400 tracking-tight uppercase">{t('dashboard.action.foundTitle') || "I Found Something"}</h3>
                      <p className="text-muted-foreground text-xs leading-tight mt-1 font-medium opacity-70">{t('dashboard.action.foundDesc') || "Scan a QR code or report an item."}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>

          {/* Secondary Action & Clean List */}
          <motion.div variants={itemVariants} className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="h-6 w-1 bg-primary rounded-full" />
                <div>
                  <h2 className="text-lg font-semibold tracking-normal uppercase">{t('nav.myItems')}</h2>
                  <p className="text-muted-foreground text-xs font-normal">
                    {userStats.totalItems} {t('dashboard.registeredItems')}
                  </p>
                </div>
              </div>
              <Button data-tour="register-item" onClick={() => navigate('/register-item')} variant="outline" size="standard" className="w-full sm:w-auto font-black uppercase tracking-widest text-xs">
                <Plus className="mr-2 h-5 w-5" />
                {t('dashboard.action.protectTitle')}
              </Button>
            </div>

            <Card className="border-border/50 shadow-premium overflow-hidden bg-background/50 backdrop-blur-sm rounded-3xl">
              <CardContent className="p-0">
                <ItemsTable items={userStats.recentlyAddedItems?.slice(0, 4) || []} isLoading={false} />
              </CardContent>
            </Card>

            <div className="flex justify-center mt-6">
              <Button variant="ghost" size="standard" onClick={() => navigate('/my-items')} className="text-muted-foreground font-black uppercase tracking-widest text-xs hover:text-primary transition-colors">
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
              <Card className="h-full border-primary/10 bg-primary/5 shadow-premium rounded-3xl overflow-hidden">
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
              <Card className="shadow-premium rounded-3xl overflow-hidden border-border/50">
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
                <Card className="shadow-premium rounded-3xl overflow-hidden border-border/50">
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

                <Card className="shadow-premium rounded-3xl overflow-hidden border-border/50">
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
              <Card className="h-full flex flex-col max-h-[600px] shadow-premium rounded-3xl overflow-hidden border-border/50">
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
                  <Button variant="ghost" size="standard" className="w-full text-xs font-black uppercase tracking-widest text-primary mt-2">
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
          {/* Field Operations - Prominent for Agents */}
          <div data-tour="agent-ops" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors cursor-pointer group shadow-premium rounded-3xl overflow-hidden" onClick={() => setDirectVerifyOpen(true)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 group-hover:text-emerald-600 transition-colors">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Field Verification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Verify users directly by inspecting physical ID cards on site.</p>
                <Button variant="link" size="standard" className="px-0 h-auto mt-2 text-emerald-600 group-hover:underline font-black uppercase tracking-widest text-[10px]">Start Verification →</Button>
              </CardContent>
            </Card>

            <Card className="border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-colors cursor-pointer group shadow-premium rounded-3xl overflow-hidden" onClick={() => setAssistedUserOpen(true)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                  <Users className="h-4 w-4 text-blue-500" />
                  Register New User
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Create accounts for new subscribers in the field (assisted login).</p>
                <Button variant="link" size="standard" className="px-0 h-auto mt-2 text-blue-600 group-hover:underline font-black uppercase tracking-widest text-[10px]">Create Account →</Button>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer group shadow-premium rounded-3xl overflow-hidden" onClick={() => setAssistedRegOpen(true)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 group-hover:text-primary transition-colors">
                  <Search className="h-4 w-4 text-primary" />
                  Assisted Item Registration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Register items for unverified or non-technical users.</p>
                <Button variant="link" size="standard" className="px-0 h-auto mt-2 text-primary group-hover:underline font-black uppercase tracking-widest text-[10px]">Register for User →</Button>
              </CardContent>
            </Card>
          </div>
          {/* Agent Stats */}
          <div data-tour="agent-stats" className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
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
          <motion.div data-tour="agent-reports" variants={itemVariants} className="mb-6">
            <Card className="shadow-premium rounded-3xl overflow-hidden border-border/50">
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
            <Card className="shadow-premium rounded-3xl overflow-hidden border-border/50">
              <CardHeader>
                <CardTitle>{t('dashboard.agent.agentActions')}</CardTitle>
                <CardDescription>{t('dashboard.agent.actionsDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button className="flex flex-col items-center justify-center h-24 space-y-2 rounded-2xl" variant="outline">
                    <Search className="h-6 w-6" />
                    <span>{t('dashboard.agent.actions.search')}</span>
                  </Button>
                  <Button className="flex flex-col items-center justify-center h-24 space-y-2 rounded-2xl" variant="outline">
                    <FileText className="h-6 w-6" />
                    <span>{t('dashboard.agent.actions.newReport')}</span>
                  </Button>
                  <Button className="flex flex-col items-center justify-center h-24 space-y-2 rounded-2xl" variant="outline">
                    <Clock className="h-6 w-6" />
                    <span>{t('dashboard.agent.actions.recentActivity')}</span>
                  </Button>
                  <Button className="flex flex-col items-center justify-center h-24 space-y-2 rounded-2xl" variant="outline">
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
            <Card className="shadow-premium rounded-3xl overflow-hidden border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{t('dashboard.items.title')}</CardTitle>
                  <CardDescription>{t('dashboard.items.description')}</CardDescription>
                </div>
                <Button size="standard" className="h-12 sm:h-14 font-black uppercase tracking-widest text-xs" onClick={() => navigate("/register-item")}>
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
            <Card className="shadow-premium rounded-3xl overflow-hidden border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{t('dashboard.reports.title')}</CardTitle>
                  <CardDescription>{t('dashboard.reports.description')}</CardDescription>
                </div>
                <Button size="standard" className="h-12 sm:h-14 font-black uppercase tracking-widest text-xs" onClick={() => navigate("/report-lost")}>
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
            <Card className="shadow-premium rounded-3xl overflow-hidden border-border/50">
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

            <Card className="shadow-premium rounded-3xl overflow-hidden border-border/50">
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
                          <TableCell className="flex gap-2">
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
                            {(isAgent || isAdmin) && claim.status !== 'resolved' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-primary/30 text-primary hover:bg-primary/5"
                                onClick={() => {
                                  setSelectedClaimId(claim.id);
                                  setHandoverOpen(true);
                                }}
                              >
                                <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                                {t('dashboard.action.handover') || "Handover"}
                              </Button>
                            )}
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
        className="relative"
      >
        {/* Ambient background glows for Premium Dark Mode */}
        <div className="fixed top-20 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10 hidden dark:block" />
        <div className="fixed bottom-0 left-[-100px] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none -z-10 hidden dark:block" />

        <div data-tour="welcome-section">
          <WelcomeHeader user={user} isAdmin={isAdmin} t={t} />
        </div>
        <OnboardingTour />

        <div className="mt-8 mb-6 hidden md:block">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="inline-flex h-12 items-center justify-center rounded-xl bg-muted/50 p-1 text-muted-foreground backdrop-blur-sm border border-border/50">
              {getDashboardTabs().map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  {tab.icon && <span className="mr-2 opacity-70 group-data-[state=active]:opacity-100">{tab.icon}</span>}
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="mt-2">
          <React.Suspense fallback={<div className="p-8 text-center italic">{t('dashboard.loadingComponents')}</div>}>
            {renderDashboardContent()}
          </React.Suspense>
        </div>

        {/* Action Dialogs */}
        <AssistedRegistrationDialog 
          isOpen={assistedRegOpen} 
          onClose={() => setAssistedRegOpen(false)} 
        />
        <AssistedUserCreationDialog
          isOpen={assistedUserOpen}
          onClose={() => setAssistedUserOpen(false)}
        />
        <ItemHandoverDialog
          isOpen={handoverOpen}
          claimId={selectedClaimId}
          onClose={() => {
            setHandoverOpen(false);
            setSelectedClaimId(null);
          }}
        />
        <DirectVerificationDialog 
          isOpen={directVerifyOpen} 
          onClose={() => setDirectVerifyOpen(false)} 
        />
      </motion.div>
    </AppLayout>
  );
}

