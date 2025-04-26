import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowUpRight, 
  Calendar, 
  ChevronDown,
  ChevronRight, 
  Users, 
  FileText, 
  Clock, 
  Settings, 
  BarChart3, 
  Wallet,
  CreditCard,
  Search, 
  Bell, 
  Loader2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ArrowRight,
  LayoutDashboard,
  Database,
  CheckCircle,
  AlertTriangle,
  Package,
  X,
  Download,
  Filter,
  Plus,
  User,
  Star,
  Inbox,
  Tags,
  HelpCircle
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { PaymentAnalyticsChart, PaymentStatusChart } from "@/components/dashboard/payment-analytics-chart";
import { ItemStatusDistribution, ItemCategoryChart } from "@/components/dashboard/item-stats-chart";
import { UserRoleDistribution } from "@/components/dashboard/user-stats-chart";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  const { stats, chartData, isLoading, refetch } = useDashboardStats();
  const [timeRange, setTimeRange] = useState("7d");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeInsightCategory, setActiveInsightCategory] = useState("all");
  
  // Insights sample data
  const insights = [
    { 
      id: 1, 
      type: "alert", 
      title: "Registration spike detected", 
      message: "23% increase in registrations today", 
      time: "12 min ago",
      category: "users",
      priority: "high"
    },
    { 
      id: 2, 
      type: "info", 
      title: "Revenue increased by 12%",
      message: "Compared to last month's figures", 
      time: "2 hours ago",
      category: "revenue",
      priority: "medium"
    },
    { 
      id: 3, 
      type: "warning", 
      title: "Item verification pending",
      message: "5 items awaiting verification for over 24h", 
      time: "1 day ago",
      category: "items",
      priority: "medium"
    },
    { 
      id: 4, 
      type: "success", 
      title: "Report resolution rate improved",
      message: "Time to resolve decreased by 15%", 
      time: "2 days ago",
      category: "reports",
      priority: "low"
    }
  ];
  
  // Filter insights based on active category
  const filteredInsights = activeInsightCategory === 'all' 
    ? insights 
    : insights.filter(insight => insight.category === activeInsightCategory);

  if (!user || user.role !== "Admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-4 text-center">
          You don't have the required permissions to access the admin dashboard.
        </p>
        <Button onClick={() => setLocation("/")}>Return to Home</Button>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto">
      {/* Header section */}
      <div className="flex justify-between items-center bg-gray-900 py-4 sticky top-0 z-10 border-b border-gray-800 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">KIZERE Command Center</h1>
          <p className="text-sm text-gray-400">
            Comprehensive platform management and analytics
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input 
              className="pl-8 h-9 bg-gray-800 border-gray-700 text-gray-300" 
              placeholder="Search across platform..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select defaultValue={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[160px] h-9 bg-gray-800 border-gray-700 text-gray-300">
              <Calendar className="mr-2 h-4 w-4 text-[#00BFFF]" />
              <SelectValue placeholder="Select range">
                {timeRange === "24h" ? "Last 24 Hours" : 
                 timeRange === "7d" ? "Last 7 Days" : 
                 timeRange === "30d" ? "Last 30 Days" : 
                 timeRange === "90d" ? "Last Quarter" : "Last Year"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 text-gray-300">
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last Quarter</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" className="h-9 w-9 border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" size="icon" className="h-9 w-9 relative border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">3</span>
          </Button>
          
          <div className="flex items-center gap-2 border-l border-gray-700 pl-4">
            <div className="h-8 w-8 rounded-full bg-[#00BFFF]/20 flex items-center justify-center text-[#00BFFF] font-medium">
              {user?.fullName?.charAt(0) || 'A'}
            </div>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-12 w-12 animate-spin text-[#00BFFF]" />
          <span className="ml-3 text-lg text-gray-400">Loading dashboard data...</span>
        </div>
      ) : !stats ? (
        <div className="flex flex-col items-center justify-center py-32">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
          <p className="text-gray-400 mb-4 text-lg">Unable to load dashboard data</p>
          <Button className="bg-[#00BFFF] hover:bg-[#00BFFF]/90" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          {/* Main content area - 9 columns */}
          <div className="col-span-12 lg:col-span-9 space-y-6">
            {/* Key metrics section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="overflow-hidden bg-gray-800 border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
                <div className="absolute top-0 left-0 w-1 bg-[#00BFFF] h-full"></div>
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between">
                    <CardDescription className="text-xs uppercase font-medium text-gray-400">
                      Total Users
                    </CardDescription>
                    <Users className="h-5 w-5 text-[#00BFFF]" />
                  </div>
                  <div className="mt-2 flex items-end justify-between">
                    <CardTitle className="text-3xl font-semibold text-white">
                      {stats.totalUsers || 0}
                    </CardTitle>
                    <div className="flex items-center text-emerald-400 text-xs font-medium bg-emerald-400/10 px-2 py-0.5 rounded">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +4.3%
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-xs text-gray-400">
                    {stats.totalUsers > 0 ? `${Math.round((stats.totalUsers * 0.3))} new this month` : "No new users"}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="overflow-hidden bg-gray-800 border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
                <div className="absolute top-0 left-0 w-1 bg-[#00BFFF] h-full"></div>
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between">
                    <CardDescription className="text-xs uppercase font-medium text-gray-400">
                      Registered Items
                    </CardDescription>
                    <Package className="h-5 w-5 text-[#00BFFF]" />
                  </div>
                  <div className="mt-2 flex items-end justify-between">
                    <CardTitle className="text-3xl font-semibold text-white">
                      {stats.totalItems || 0}
                    </CardTitle>
                    <div className="flex items-center text-emerald-400 text-xs font-medium bg-emerald-400/10 px-2 py-0.5 rounded">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +2.1%
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-xs text-gray-400">
                    {stats.totalItems > 0 ? `${Math.round((stats.totalItems * 0.2))} registered this week` : "No items registered"}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="overflow-hidden bg-gray-800 border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
                <div className="absolute top-0 left-0 w-1 bg-yellow-500 h-full"></div>
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between">
                    <CardDescription className="text-xs uppercase font-medium text-gray-400">
                      Pending Reports
                    </CardDescription>
                    <FileText className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div className="mt-2 flex items-end justify-between">
                    <CardTitle className="text-3xl font-semibold text-white">
                      {stats.pendingReports || 0}
                    </CardTitle>
                    <div className="flex items-center text-red-400 text-xs font-medium bg-red-400/10 px-2 py-0.5 rounded">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      -1.8%
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-xs text-gray-400">
                    {stats.pendingReports > 0 ? `${Math.round((stats.pendingReports * 0.7))} need attention` : "No pending reports"}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="overflow-hidden bg-gray-800 border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
                <div className="absolute top-0 left-0 w-1 bg-green-500 h-full"></div>
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between">
                    <CardDescription className="text-xs uppercase font-medium text-gray-400">
                      Total Revenue
                    </CardDescription>
                    <CreditCard className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="mt-2 flex items-end justify-between">
                    <CardTitle className="text-3xl font-semibold text-white">
                      RWF {stats.totalPayments ? (stats.totalPayments * 5000).toLocaleString() : 0}
                    </CardTitle>
                    <div className="flex items-center text-emerald-400 text-xs font-medium bg-emerald-400/10 px-2 py-0.5 rounded">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +8.7%
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-xs text-gray-400">
                    {stats.totalPayments > 0 ? `RWF ${(stats.totalPayments * 5000 * 0.4).toLocaleString()} this month` : "No revenue"}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Revenue chart and payment stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 bg-gray-800 border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="px-6 pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-medium text-white">Revenue Overview</CardTitle>
                      <CardDescription className="text-gray-400">Monthly payment collection trends</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="h-8 text-xs border-gray-700 bg-gray-700/50 text-gray-300 hover:bg-gray-700">
                        <Filter className="h-3 w-3 mr-1" /> Filter
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 text-xs border-gray-700 bg-gray-700/50 text-gray-300 hover:bg-gray-700">
                        <Download className="h-3 w-3 mr-1" /> Export
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-6">
                  <PaymentAnalyticsChart 
                    title="" 
                    description="" 
                  />
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="px-6 pb-2">
                  <CardTitle className="text-lg font-medium text-white">Payment Status</CardTitle>
                  <CardDescription className="text-gray-400">Distribution by payment outcomes</CardDescription>
                </CardHeader>
                <CardContent className="px-6">
                  <PaymentStatusChart 
                    data={chartData?.paymentStatusData || []} 
                  />
                  <div className="mt-4 space-y-3">
                    <div className="flex justify-between items-center text-sm text-gray-300">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                        <span>Successful</span>
                      </div>
                      <span className="font-medium">
                        {chartData?.paymentStatusData?.[0]?.value || 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-300">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                        <span>Pending</span>
                      </div>
                      <span className="font-medium">
                        {chartData?.paymentStatusData?.[1]?.value || 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-300">
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
            </div>
            
            {/* User and item stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="px-6 pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-medium text-white">User Distribution</CardTitle>
                      <CardDescription className="text-gray-400">Breakdown by user roles</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="h-8 border-gray-700 bg-gray-700/50 text-gray-300 hover:bg-gray-700">
                      <Plus className="h-3 w-3 mr-1" /> Add User
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="px-6">
                  <div className="flex items-center justify-center py-4">
                    <UserRoleDistribution 
                      data={chartData?.userRoleData || []} 
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="bg-[#00BFFF]/10 rounded-lg p-3 text-center">
                      <User className="h-5 w-5 text-[#00BFFF] mx-auto mb-1" />
                      <p className="text-xs text-gray-400 mb-1">Subscribers</p>
                      <p className="font-semibold text-white">{chartData?.userRoleData?.[0]?.value || 0}%</p>
                    </div>
                    <div className="bg-blue-500/10 rounded-lg p-3 text-center">
                      <Star className="h-5 w-5 text-blue-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-400 mb-1">Agents</p>
                      <p className="font-semibold text-white">{chartData?.userRoleData?.[1]?.value || 0}%</p>
                    </div>
                    <div className="bg-yellow-500/10 rounded-lg p-3 text-center">
                      <Settings className="h-5 w-5 text-yellow-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-400 mb-1">Admins</p>
                      <p className="font-semibold text-white">{chartData?.userRoleData?.[2]?.value || 0}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="px-6 pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-medium text-white">Item Categories</CardTitle>
                      <CardDescription className="text-gray-400">Distribution of registered items</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="h-8 border-gray-700 bg-gray-700/50 text-gray-300 hover:bg-gray-700">
                      <Tags className="h-3 w-3 mr-1" /> Manage
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="px-6">
                  <ItemCategoryChart />
                </CardContent>
              </Card>
            </div>
            
            {/* Recent activity */}
            <Card className="bg-gray-800 border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="px-6 pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-medium text-white">Recent Activity</CardTitle>
                    <CardDescription className="text-gray-400">Latest platform events and actions</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 border-gray-700 bg-gray-700/50 text-gray-300 hover:bg-gray-700">
                    View All <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-6">
                <div className="space-y-4">
                  {[
                    { type: "user", title: "New user registered", time: "5 min ago", details: "User John Doe joined as Subscriber", icon: <Users className="h-4 w-4 text-[#00BFFF]" /> },
                    { type: "item", title: "Item #1042 registered", time: "30 min ago", details: "Electronics category, registered by Agent Carol", icon: <Package className="h-4 w-4 text-[#00BFFF]" /> },
                    { type: "payment", title: "Payment of RWF 5,000 received", time: "1 hour ago", details: "Registration fee for item #1038 by Emma Smith", icon: <CreditCard className="h-4 w-4 text-green-400" /> },
                    { type: "report", title: "Lost report submitted", time: "3 hours ago", details: "Report #352 for item #986 by Michael Brown", icon: <FileText className="h-4 w-4 text-yellow-400" /> },
                    { type: "system", title: "System maintenance completed", time: "Yesterday", details: "Database optimization and security updates applied", icon: <Settings className="h-4 w-4 text-gray-400" /> }
                  ].map((activity, i) => (
                    <div key={i} className="flex items-start p-3 rounded-lg hover:bg-gray-700/50 transition-colors">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full mr-3 ${
                        activity.type === 'user' ? 'bg-[#00BFFF]/20' : 
                        activity.type === 'item' ? 'bg-[#00BFFF]/20' : 
                        activity.type === 'payment' ? 'bg-green-500/20' :
                        activity.type === 'report' ? 'bg-yellow-500/20' : 'bg-gray-500/20'
                      }`}>
                        {activity.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-white">{activity.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{activity.details}</p>
                          </div>
                          <span className="text-xs text-gray-500 shrink-0 ml-4">{activity.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right sidebar - 3 columns */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            {/* Quick actions */}
            <Card className="bg-gray-800 border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base font-medium text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start text-sm h-9 border-gray-700 bg-gray-700/50 text-gray-300 hover:bg-gray-700">
                    <Plus className="h-4 w-4 mr-2 text-[#00BFFF]" /> Add New User
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-sm h-9 border-gray-700 bg-gray-700/50 text-gray-300 hover:bg-gray-700">
                    <Package className="h-4 w-4 mr-2 text-[#00BFFF]" /> Register Item
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-sm h-9 border-gray-700 bg-gray-700/50 text-gray-300 hover:bg-gray-700">
                    <FileText className="h-4 w-4 mr-2 text-[#00BFFF]" /> Create Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-sm h-9 border-gray-700 bg-gray-700/50 text-gray-300 hover:bg-gray-700">
                    <BarChart3 className="h-4 w-4 mr-2 text-[#00BFFF]" /> Generate Report
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* System insights */}
            <Card className="bg-gray-800 border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base font-medium text-white">System Insights</CardTitle>
                  <HelpCircle className="h-4 w-4 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex gap-1 mt-2 mb-3">
                  <Badge 
                    variant={activeInsightCategory === 'all' ? 'default' : 'outline'}
                    className={`cursor-pointer ${activeInsightCategory === 'all' ? 'bg-[#00BFFF] hover:bg-[#00BFFF]/90' : 'text-gray-300 border-gray-600'}`}
                    onClick={() => setActiveInsightCategory('all')}
                  >
                    All
                  </Badge>
                  <Badge 
                    variant={activeInsightCategory === 'users' ? 'default' : 'outline'}
                    className={`cursor-pointer ${activeInsightCategory === 'users' ? 'bg-[#00BFFF] hover:bg-[#00BFFF]/90' : 'text-gray-300 border-gray-600'}`}
                    onClick={() => setActiveInsightCategory('users')}
                  >
                    Users
                  </Badge>
                  <Badge 
                    variant={activeInsightCategory === 'items' ? 'default' : 'outline'}
                    className={`cursor-pointer ${activeInsightCategory === 'items' ? 'bg-[#00BFFF] hover:bg-[#00BFFF]/90' : 'text-gray-300 border-gray-600'}`}
                    onClick={() => setActiveInsightCategory('items')}
                  >
                    Items
                  </Badge>
                  <Badge 
                    variant={activeInsightCategory === 'revenue' ? 'default' : 'outline'}
                    className={`cursor-pointer ${activeInsightCategory === 'revenue' ? 'bg-[#00BFFF] hover:bg-[#00BFFF]/90' : 'text-gray-300 border-gray-600'}`}
                    onClick={() => setActiveInsightCategory('revenue')}
                  >
                    Revenue
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  {filteredInsights.map(insight => (
                    <div key={insight.id} className={`p-3 rounded-lg text-sm border border-opacity-20 ${
                      insight.type === 'alert' ? 'bg-red-500/10 border-red-500' : 
                      insight.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500' :
                      insight.type === 'success' ? 'bg-green-500/10 border-green-500' :
                      'bg-[#00BFFF]/10 border-[#00BFFF]'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div className="flex gap-2">
                          {insight.type === 'alert' && <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5" />}
                          {insight.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5" />}
                          {insight.type === 'success' && <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />}
                          {insight.type === 'info' && <Inbox className="h-4 w-4 text-[#00BFFF] mt-0.5" />}
                          <p className="font-medium text-white">{insight.title}</p>
                        </div>
                        <span className="text-xs text-gray-400">{insight.time}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 ml-6">{insight.message}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* System status */}
            <Card className="bg-gray-800 border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base font-medium text-white">System Status</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-300">API Services</span>
                    </div>
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Operational</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-300">Database</span>
                    </div>
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Operational</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-300">Authentication</span>
                    </div>
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Operational</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-300">Payment Services</span>
                    </div>
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">Partial Outage</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-300">Storage Services</span>
                    </div>
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Operational</span>
                  </div>
                </div>
                
                <div className="mt-4 border-t border-gray-700 pt-3">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Last checked: 2 min ago</span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs text-[#00BFFF] p-0 hover:text-[#00BFFF]/90 hover:bg-transparent">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}