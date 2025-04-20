import { useState, useEffect } from "react";
import { useAuth } from "../hooks/use-auth";
import { Link, useLocation } from "wouter";
import { useDashboardData } from "../hooks/use-dashboard-data";
import { motion } from "framer-motion";
import { Header } from "../components/layout/header";
import { Footer } from "../components/layout/footer";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { StatsCard } from "../components/dashboard/stats-card";
import { ActivityTimeline } from "../components/dashboard/activity-timeline";
import { NotificationCenter } from "../components/dashboard/notification-center";
import { PaymentHistoryCard } from "../components/dashboard/payment-history-card";
import { ItemsTable } from "../components/dashboard/items-table";
import { QuickActionsPanel } from "../components/dashboard/quick-actions-panel";
import { createLogger } from "../lib/logger";
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
              <NotificationCenter notifications={notifications || []} />
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
                <ItemsTable items={userStats.recentlyAddedItems} isCompact={true} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment History */}
          <motion.div variants={itemVariants}>
            <PaymentHistoryCard compact={true} />
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
                previousValue={adminStats?.revenue.lastMonth}
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
                value={(adminStats?.reportBreakdown.lost || 0) + (adminStats?.reportBreakdown.found || 0)}
                icon={<FileText className="h-5 w-5" />}
                iconBgClass="bg-red-100 dark:bg-red-900/30"
                iconTextClass="text-red-600 dark:text-red-400"
                trendData={[8, 12, 10, 15, 13, 18, (adminStats?.reportBreakdown.lost || 0) + (adminStats?.reportBreakdown.found || 0)]}
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
                  <PaymentAnalyticsChart data={adminStats?.monthlyRevenue || []} />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants} className="grid gap-6 grid-rows-2">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <PaymentStatusChart data={adminStats?.paymentsByStatus || []} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <PaymentTypeChart data={adminStats?.paymentsByType || []} />
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
                <RecentTransactions transactions={adminStats?.recentTransactions || []} />
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
          {/* Agent Stats Row */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <motion.div variants={itemVariants}>
              <StatsCard
                title="Total Reports"
                value={(allReports?.length || 0)}
                icon={<ClipboardList className="h-5 w-5" />}
                iconBgClass="bg-blue-100 dark:bg-blue-900/30"
                iconTextClass="text-blue-600 dark:text-blue-400"
                trendData={[12, 18, 15, 24, 20, 28, (allReports?.length || 0)]}
                chartColor="#3b82f6"
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <StatsCard
                title="Lost Reports"
                value={allReports?.filter(r => r.type === 'lost').length || 0}
                icon={<AlertTriangle className="h-5 w-5" />}
                iconBgClass="bg-amber-100 dark:bg-amber-900/30"
                iconTextClass="text-amber-600 dark:text-amber-400"
                trendData={[7, 10, 8, 14, 11, 16, allReports?.filter(r => r.type === 'lost').length || 0]}
                chartColor="#eab308"
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <StatsCard
                title="Found Reports"
                value={allReports?.filter(r => r.type === 'found').length || 0}
                icon={<CheckCircle2 className="h-5 w-5" />}
                iconBgClass="bg-green-100 dark:bg-green-900/30"
                iconTextClass="text-green-600 dark:text-green-400"
                trendData={[5, 8, 7, 10, 9, 12, allReports?.filter(r => r.type === 'found').length || 0]}
                chartColor="#10b981"
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <StatsCard
                title="Resolution Rate"
                value={allReports?.filter(r => r.status === 'Resolved').length || 0}
                successRate={allReports?.length ? Math.round((allReports.filter(r => r.status === 'Resolved').length / allReports.length) * 100) : 0}
                icon={<Clock className="h-5 w-5" />}
                iconBgClass="bg-purple-100 dark:bg-purple-900/30"
                iconTextClass="text-purple-600 dark:text-purple-400"
                trendData={[2, 4, 6, 8, 10, 12, allReports?.filter(r => r.status === 'Resolved').length || 0]}
                chartColor="#8b5cf6"
              />
            </motion.div>
          </div>

          {/* Reports Tables */}
          <motion.div variants={itemVariants}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Active Reports</CardTitle>
                <CardDescription>
                  Manage and respond to active lost and found reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="lost">
                  <TabsList className="mb-4">
                    <TabsTrigger value="lost">Lost Reports</TabsTrigger>
                    <TabsTrigger value="found">Found Reports</TabsTrigger>
                  </TabsList>
                  <TabsContent value="lost">
                    {/* Lost reports table component would go here */}
                    <div className="text-center p-6">
                      <p>Lost reports component will be displayed here</p>
                    </div>
                  </TabsContent>
                  <TabsContent value="found">
                    {/* Found reports table component would go here */}
                    <div className="text-center p-6">
                      <p>Found reports component will be displayed here</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>

          {/* Activity Timeline for Agents */}
          <motion.div variants={itemVariants}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Timeline of recent lost and found report activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ActivityTimeline items={[]} reports={allReports || []} />
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      );
    }

    // Items Management Tab
    if (activeTab === "items") {
      return (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Your Registered Items</h2>
              <Button onClick={() => navigate("/register-item")}>
                <Plus className="h-4 w-4 mr-1" /> Register New Item
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-6">
                <ItemsTable items={items || []} />
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      );
    }

    // Reports Tab
    if (activeTab === "reports") {
      return (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Your Lost & Found Reports</h2>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => navigate("/lost-found/report/lost")}>
                  <AlertTriangle className="h-4 w-4 mr-1" /> Report Lost
                </Button>
                <Button onClick={() => navigate("/lost-found/report/found")}>
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Report Found
                </Button>
              </div>
            </div>
            
            <Card>
              <CardContent className="p-6">
                <Tabs defaultValue="all">
                  <TabsList className="mb-4">
                    <TabsTrigger value="all">All Reports</TabsTrigger>
                    <TabsTrigger value="lost">Lost</TabsTrigger>
                    <TabsTrigger value="found">Found</TabsTrigger>
                    <TabsTrigger value="resolved">Resolved</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all">
                    {/* All reports table would go here */}
                    <div className="text-center p-6">
                      <p>All reports will be displayed here</p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="lost">
                    {/* Lost reports table would go here */}
                    <div className="text-center p-6">
                      <p>Lost reports will be displayed here</p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="found">
                    {/* Found reports table would go here */}
                    <div className="text-center p-6">
                      <p>Found reports will be displayed here</p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="resolved">
                    {/* Resolved reports table would go here */}
                    <div className="text-center p-6">
                      <p>Resolved reports will be displayed here</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      );
    }

    // Payments Tab
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
        </div>
      </main>
      <Footer />
    </div>
  );
}