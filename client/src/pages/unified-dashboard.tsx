import { useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { useLocation } from "wouter";
import { useDashboardData } from "../hooks/use-dashboard-data.tsx";
import { motion } from "framer-motion";
import { Header } from "../components/layout/header";
import { Footer } from "../components/layout/footer";
import { Button } from "../components/ui/button";
import { Skeleton, DashboardSkeleton } from "../components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { StatsCard } from "../components/dashboard/stats-card";
import { ActivityTimeline } from "../components/dashboard/activity-timeline";
import { NotificationCenter } from "../components/dashboard/notification-center";
import { PaymentHistoryCard } from "../components/dashboard/payment-history-card";
import { ItemsTable } from "../components/dashboard/items-table";
import { QuickActionsPanel } from "../components/dashboard/quick-actions-panel";
import { GlobalSearch } from "../components/dashboard/global-search";
import { createLogger } from "../lib/logger";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import {
  LayoutDashboard,
  Search,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Bell,
  BarChart3,
  Clock,
  FileText,
  Users,
  ShoppingBag,
  DollarSign,
  Plus,
  Loader2
} from "lucide-react";

// Import admin-specific components
import { PaymentAnalyticsChart } from "../components/dashboard/payment-analytics-chart";
import { PaymentStatusChart } from "../components/dashboard/payment-status-chart";
import { PaymentTypeChart } from "../components/dashboard/payment-type-chart";
import { RecentTransactions } from "../components/dashboard/recent-transactions";

const logger = createLogger('UnifiedDashboard');

export default function UnifiedDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
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
    isLoading = true,
    notifications = [],
    items = [],
    reports = [],
    allReports = []
  } = dashboardData || {};

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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <motion.div variants={itemVariants}>
              <StatsCard
                title="Registered Items"
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
                title="Lost Reports"
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
                title="Found Reports"
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
                title="Total Spent"
                value={userStats.totalSpent}
                icon={<DollarSign className="h-5 w-5" />}
                iconBgClass="bg-purple-100 dark:bg-purple-900/30"
                iconTextClass="text-purple-600 dark:text-purple-400"
                trendData={[100, 250, 150, 400, 300, 500, userStats.totalSpent]}
                chartColor="#8b5cf6"
              />
            </motion.div>
          </div>

          {/* Global Search */}
          <motion.div variants={itemVariants} className="mb-6">
            <GlobalSearch onSearch={(query) => logger.info(`Search query: ${query}`)} />
          </motion.div>

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
              <NotificationCenter notifications={notifications || []} isLoading={false} />
            </motion.div>
          </div>

          {/* Recently Registered Items */}
          <motion.div variants={itemVariants}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Recently Registered Items</CardTitle>
                <CardDescription>
                  View and manage your most recently registered items
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ItemsTable items={userStats.recentlyAddedItems} isLoading={false} />
              </CardContent>
            </Card>
          </motion.div>

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
                title="Total Revenue"
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
                title="Total Users"
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
                title="Registered Items"
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
                title="Active Reports"
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
                  <CardTitle>Monthly Revenue</CardTitle>
                  <CardDescription>
                    Revenue trends over the past months
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PaymentAnalyticsChart paymentData={adminStats?.monthlyRevenue?.map(item => ({ name: item.month, value: item.revenue })) || []} />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants} className="grid gap-6 grid-rows-2">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <PaymentStatusChart data={
                    (adminStats?.paymentsByStatus || []).map(item => ({
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
                  <CardTitle>Payment Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <PaymentTypeChart data={
                    (adminStats?.paymentsByType || []).map(item => ({
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
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>
                  Latest payment transactions across the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecentTransactions transactions={
                  (adminStats?.recentTransactions || []).map(transaction => ({
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
                title="Active Reports"
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
                title="Lost Reports"
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
                title="Found Reports"
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
                title="Resolved Reports"
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
                <CardTitle>Manage Reports</CardTitle>
                <CardDescription>View and process active lost and found reports</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 mb-4">
                    <TabsTrigger value="all">All Reports</TabsTrigger>
                    <TabsTrigger value="lost">Lost Items</TabsTrigger>
                    <TabsTrigger value="found">Found Items</TabsTrigger>
                    <TabsTrigger value="resolved">Resolved</TabsTrigger>
                  </TabsList>
                  <TabsContent value="all">
                    {/* All Reports Table */}
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Report ID</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allReports.length > 0 ? (
                            allReports.map((r: any) => (
                              <TableRow key={r.id}>
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
                                  <Button size="sm" variant="outline">View</Button>
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
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions for Agents */}
          <motion.div variants={itemVariants} className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Agent Actions</CardTitle>
                <CardDescription>Quick access to common agent tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button className="flex flex-col items-center justify-center h-24 space-y-2" variant="outline">
                    <Search className="h-6 w-6" />
                    <span>Search Items</span>
                  </Button>
                  <Button className="flex flex-col items-center justify-center h-24 space-y-2" variant="outline">
                    <FileText className="h-6 w-6" />
                    <span>New Report</span>
                  </Button>
                  <Button className="flex flex-col items-center justify-center h-24 space-y-2" variant="outline">
                    <Clock className="h-6 w-6" />
                    <span>Recent Activity</span>
                  </Button>
                  <Button className="flex flex-col items-center justify-center h-24 space-y-2" variant="outline">
                    <Bell className="h-6 w-6" />
                    <span>Notifications</span>
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
                  <CardTitle>Your Registered Items</CardTitle>
                  <CardDescription>Manage all your registered items</CardDescription>
                </div>
                <Button size="sm" onClick={() => navigate("/register-item")}>
                  <Plus className="h-4 w-4 mr-2" /> Register New
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
                  <CardTitle>Your Reports</CardTitle>
                  <CardDescription>Manage your lost and found reports</CardDescription>
                </div>
                <Button size="sm" onClick={() => navigate("/lost-found/report")}>
                  <Plus className="h-4 w-4 mr-2" /> New Report
                </Button>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger value="all">All Reports</TabsTrigger>
                    <TabsTrigger value="lost">Lost Items</TabsTrigger>
                    <TabsTrigger value="found">Found Items</TabsTrigger>
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
            <h2 className="text-2xl font-semibold mb-4">Payment History</h2>
            <PaymentHistoryCard />
          </motion.div>
        </motion.div>
      );
    }

    // Fallback - should never reach here
    return (
      <div className="p-6 text-center">
        <p>Select a dashboard tab to view content</p>
      </div>
    );
  };

  // Define dashboard tabs based on user role
  const getDashboardTabs = () => {
    const tabs = [
      {
        id: "overview",
        label: "Overview",
        icon: <LayoutDashboard className="h-5 w-5" />
      },
      {
        id: "items",
        label: "Items",
        icon: <ShoppingBag className="h-5 w-5" />
      },
      {
        id: "reports",
        label: "Reports",
        icon: <ClipboardList className="h-5 w-5" />
      },
      {
        id: "payments",
        label: "Payments",
        icon: <DollarSign className="h-5 w-5" />
      }
    ];

    // Add admin tab for admins
    if (isAdmin) {
      tabs.push({
        id: "admin",
        label: "Admin Panel",
        icon: <BarChart3 className="h-5 w-5" />
      });
    }

    // Add agent tab for agents (and admins)
    if (isAgent || isAdmin) {
      tabs.push({
        id: "agent",
        label: "Agent Console",
        icon: <Search className="h-5 w-5" />
      });
    }

    return tabs;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-background p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background p-6 rounded-lg mb-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">
                    Welcome back, {user.fullName || user.username}!
                  </h1>
                  <p className="text-muted-foreground">
                    {isAdmin 
                      ? "Manage your platform and view performance insights" 
                      : isAgent 
                        ? "Review and process lost and found reports"
                        : "Track your items and manage your account"
                    }
                  </p>
                </div>
                <div className="mt-4 md:mt-0">
                  <Button onClick={() => navigate("/register-item")}>
                    <Plus className="h-4 w-4 mr-2" /> Register New Item
                  </Button>
                </div>
              </div>
            </div>

            {/* Dashboard Tabs */}
            <div className="bg-card rounded-lg shadow-sm mb-6 p-1">
              <div className="flex overflow-x-auto">
                {getDashboardTabs().map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md mr-1 ${
                      activeTab === tab.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-background hover:bg-muted"
                    }`}
                  >
                    {tab.icon}
                    <span className="ml-2">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dashboard Content */}
            {renderDashboardContent()}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}