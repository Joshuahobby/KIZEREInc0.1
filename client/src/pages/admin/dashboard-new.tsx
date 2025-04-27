import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  HardDrive
} from "lucide-react";
import { PaymentAnalyticsChart, PaymentStatusChart } from "@/components/dashboard/payment-analytics-chart-fixed";
import { UserRoleDistribution } from "@/components/dashboard/user-role-distribution";
import { ItemCategoryChart } from "@/components/dashboard/item-category-chart";
import { CustomizableDashboard, CardConfig, DashboardConfig } from "@/components/dashboard/customizable-dashboard";
import { ContextualSidebar } from "@/components/dashboard/contextual-sidebar";
import { ExpandableDetailView } from "@/components/dashboard/expandable-detail-view";
import { QuickActionMenu } from "@/components/dashboard/quick-action-menu";
import { MetricsCard } from "@/components/dashboard/metrics-card";
import { ActivityFeed, ActivityEvent } from "@/components/dashboard/activity-feed";
import { EnhancedPaymentAnalytics } from "@/components/dashboard/enhanced-payment-analytics";
import { SystemStatus, SystemStatusItemProps } from "@/components/dashboard/system-status";
import { DataTableDashboard, renderStatusBadge } from "@/components/dashboard/data-table-dashboard";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [timeRange, setTimeRange] = useState("30d");
  const [activeInsightCategory, setActiveInsightCategory] = useState("all");
  const [selectedDetailView, setSelectedDetailView] = useState<string | null>(null);
  const [showContextSidebar, setShowContextSidebar] = useState(false);
  const [useCustomDashboard, setUseCustomDashboard] = useState(false);
  const [sidebarContext, setSidebarContext] = useState<{ type: string; id?: string; data: any }>({
    type: 'none',
    data: null
  });
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig | null>(null);
  
  // Fetch dashboard stats
  const { stats, chartData, isLoading, isError, error, refetch } = useDashboardStats();
  
  // System insights with filtering
  const insights = [
    { 
      id: 1, 
      title: 'Low recovery rate detected', 
      time: '2 hours ago',
      message: 'The item recovery rate has dropped below 40% this week.',
      type: 'alert',
      category: 'items'
    },
    { 
      id: 2, 
      title: 'New admin user registered', 
      time: '5 hours ago',
      message: 'User "Carol Admin" was assigned admin privileges.',
      type: 'info',
      category: 'users'
    },
    { 
      id: 3, 
      title: 'Payment gateway issue resolved', 
      time: '1 day ago',
      message: 'The reported issue with MTN Mobile Money has been fixed.',
      type: 'success',
      category: 'revenue'
    },
    { 
      id: 4, 
      title: 'Unusual login activity', 
      time: '2 days ago',
      message: 'Multiple failed login attempts detected for account ID #386.',
      type: 'warning',
      category: 'users'
    }
  ];
  
  const filteredInsights = activeInsightCategory === 'all' 
    ? insights 
    : insights.filter(insight => insight.category === activeInsightCategory);
    
  // Try to load the dashboard config from localStorage on mount
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('dashboardConfig');
      if (savedConfig) {
        setDashboardConfig(JSON.parse(savedConfig));
      }
    } catch (e) {
      console.error("Error loading dashboard config:", e);
    }
  }, []);
    
  // Dashboard card definitions
  const dashboardCards: CardConfig[] = [
    {
      id: 'users-overview',
      title: 'Total Users',
      type: 'metric',
      size: 'small',
      icon: <Users className="h-5 w-5" />,
      description: 'User accounts across all roles',
      content: (
        <div className="h-full flex flex-col">
          <div className="flex items-end justify-between">
            <div className="text-3xl font-semibold text-white">
              {stats?.totalUsers || 0}
            </div>
            <div className="flex items-center text-emerald-400 text-xs font-medium bg-emerald-400/10 px-2 py-0.5 rounded">
              <TrendingUp className="h-3 w-3 mr-1" />
              +4.3%
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {stats?.totalUsers ? `${Math.round((stats.totalUsers * 0.3))} new this month` : "No new users"}
          </p>
          <div className="mt-auto pt-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-[#00BFFF] p-0 hover:text-[#00BFFF]/90 hover:bg-transparent"
              onClick={() => {
                setSidebarContext({ type: 'users', data: { } });
                setShowContextSidebar(true);
              }}
            >
              View all users <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </div>
      ),
      quickActions: [
        {
          label: "Add User",
          icon: <Plus className="h-3 w-3" />,
          onClick: () => navigate("/admin/users/new")
        },
        {
          label: "Manage Roles",
          icon: <Settings className="h-3 w-3" />,
          onClick: () => navigate("/admin/permissions")
        }
      ]
    },
    {
      id: 'items-overview',
      title: 'Registered Items',
      type: 'metric',
      size: 'small',
      icon: <Package className="h-5 w-5" />,
      description: 'All registered valuable items',
      content: (
        <div className="h-full flex flex-col">
          <div className="flex items-end justify-between">
            <div className="text-3xl font-semibold text-white">
              {stats?.totalItems || 0}
            </div>
            <div className="flex items-center text-emerald-400 text-xs font-medium bg-emerald-400/10 px-2 py-0.5 rounded">
              <TrendingUp className="h-3 w-3 mr-1" />
              +2.1%
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {stats?.totalItems ? `${Math.round((stats.totalItems * 0.2))} registered this week` : "No items registered"}
          </p>
          <div className="mt-auto pt-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-[#00BFFF] p-0 hover:text-[#00BFFF]/90 hover:bg-transparent"
              onClick={() => {
                setSidebarContext({ type: 'items', data: { } });
                setShowContextSidebar(true);
              }}
            >
              View all items <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </div>
      ),
      quickActions: [
        {
          label: "Add Item",
          icon: <Plus className="h-3 w-3" />,
          onClick: () => navigate("/admin/items/new")
        },
        {
          label: "Categories",
          icon: <Tags className="h-3 w-3" />,
          onClick: () => navigate("/admin/categories")
        }
      ]
    },
    {
      id: 'reports-overview',
      title: 'Pending Reports',
      type: 'metric',
      size: 'small',
      icon: <FileText className="h-5 w-5" />,
      description: 'Reports awaiting processing',
      content: (
        <div className="h-full flex flex-col">
          <div className="flex items-end justify-between">
            <div className="text-3xl font-semibold text-white">
              {stats?.pendingReports || 0}
            </div>
            <div className="flex items-center text-red-400 text-xs font-medium bg-red-400/10 px-2 py-0.5 rounded">
              <TrendingDown className="h-3 w-3 mr-1" />
              -1.8%
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {stats?.pendingReports ? `${Math.round((stats.pendingReports * 0.7))} need attention` : "No pending reports"}
          </p>
          <div className="mt-auto pt-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-[#00BFFF] p-0 hover:text-[#00BFFF]/90 hover:bg-transparent"
              onClick={() => {
                setSidebarContext({ type: 'reports', data: { filter: 'pending' } });
                setShowContextSidebar(true);
              }}
            >
              View pending reports <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </div>
      ),
      quickActions: [
        {
          label: "Process Next",
          icon: <CheckCircle className="h-3 w-3" />,
          onClick: () => navigate("/admin/reports/next")
        }
      ]
    },
    {
      id: 'revenue-overview',
      title: 'Total Revenue',
      type: 'metric',
      size: 'small',
      icon: <CreditCard className="h-5 w-5" />,
      description: 'Payment collection summary',
      content: (
        <div className="h-full flex flex-col">
          <div className="flex items-end justify-between">
            <div className="text-3xl font-semibold text-white">
              RWF {stats?.totalPayments ? (stats.totalPayments * 5000).toLocaleString() : 0}
            </div>
            <div className="flex items-center text-emerald-400 text-xs font-medium bg-emerald-400/10 px-2 py-0.5 rounded">
              <TrendingUp className="h-3 w-3 mr-1" />
              +8.7%
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {stats?.totalPayments ? `RWF ${(stats.totalPayments * 5000 * 0.4).toLocaleString()} this month` : "No revenue"}
          </p>
          <div className="mt-auto pt-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-[#00BFFF] p-0 hover:text-[#00BFFF]/90 hover:bg-transparent"
              onClick={() => {
                setSidebarContext({ type: 'payments', data: { } });
                setShowContextSidebar(true);
              }}
            >
              View all transactions <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </div>
      ),
      quickActions: [
        {
          label: "Export",
          icon: <Download className="h-3 w-3" />,
          onClick: () => alert("Export functionality will be implemented.")
        }
      ]
    },
    {
      id: 'revenue-chart',
      title: 'Revenue Overview',
      type: 'chart',
      size: 'large',
      icon: <BarChart3 className="h-5 w-5" />,
      description: 'Monthly payment collection trends',
      content: (
        <div className="h-full">
          <div className="flex justify-end gap-2 mb-2">
            <Button variant="outline" size="sm" className="h-8 text-xs border-gray-700 bg-gray-700/50 text-gray-300 hover:bg-gray-700">
              <Filter className="h-3 w-3 mr-1" /> Filter
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs border-gray-700 bg-gray-700/50 text-gray-300 hover:bg-gray-700">
              <Download className="h-3 w-3 mr-1" /> Export
            </Button>
          </div>
          <div className="h-[300px]">
            <PaymentAnalyticsChart 
              title="" 
              description=""
              data={[
                { date: 'Jan', amount: 2400 },
                { date: 'Feb', amount: 1398 },
                { date: 'Mar', amount: 9800 },
                { date: 'Apr', amount: 3908 },
                { date: 'May', amount: 4800 },
                { date: 'Jun', amount: 3800 },
                { date: 'Jul', amount: 4300 }
              ]}
            />
          </div>
          <div className="mt-4 text-center">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-[#00BFFF] hover:text-[#00BFFF]/90 hover:bg-gray-700"
              onClick={() => setSelectedDetailView('revenue-detail')}
            >
              View detailed analysis
            </Button>
          </div>
        </div>
      ),
      quickActions: [
        {
          label: "Full Report",
          icon: <FileText className="h-3 w-3" />,
          onClick: () => navigate("/admin/financial-reports")
        }
      ]
    },
    {
      id: 'payment-status',
      title: 'Payment Status',
      type: 'chart',
      size: 'medium',
      icon: <PieChart className="h-5 w-5" />,
      description: 'Distribution by payment outcomes',
      content: (
        <div className="h-full">
          <div className="flex items-center justify-center py-2">
            <PaymentStatusChart 
              data={chartData?.paymentStatusData || []} 
            />
          </div>
          <div className="space-y-2 mt-2">
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
        </div>
      ),
      quickActions: [
        {
          label: "Fix Failed",
          icon: <AlertTriangle className="h-3 w-3" />,
          onClick: () => navigate("/admin/payments/failed")
        }
      ]
    },
    {
      id: 'user-distribution',
      title: 'User Distribution',
      type: 'chart',
      size: 'medium',
      icon: <Users className="h-5 w-5" />,
      description: 'Breakdown by user roles',
      content: (
        <div className="h-full">
          <div className="flex items-center justify-center py-2">
            <UserRoleDistribution 
              data={chartData?.userRoleData || []} 
            />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="bg-[#00BFFF]/10 rounded-lg p-2 text-center">
              <User className="h-4 w-4 text-[#00BFFF] mx-auto mb-1" />
              <p className="text-xs text-gray-400 mb-1">Subscribers</p>
              <p className="font-semibold text-white">{chartData?.userRoleData?.[0]?.value || 0}%</p>
            </div>
            <div className="bg-blue-500/10 rounded-lg p-2 text-center">
              <Star className="h-4 w-4 text-blue-400 mx-auto mb-1" />
              <p className="text-xs text-gray-400 mb-1">Agents</p>
              <p className="font-semibold text-white">{chartData?.userRoleData?.[1]?.value || 0}%</p>
            </div>
            <div className="bg-yellow-500/10 rounded-lg p-2 text-center">
              <Settings className="h-4 w-4 text-yellow-400 mx-auto mb-1" />
              <p className="text-xs text-gray-400 mb-1">Admins</p>
              <p className="font-semibold text-white">{chartData?.userRoleData?.[2]?.value || 0}%</p>
            </div>
          </div>
        </div>
      ),
      quickActions: [
        {
          label: "User Roles",
          icon: <Settings className="h-3 w-3" />,
          onClick: () => navigate("/admin/permissions")
        }
      ]
    },
    {
      id: 'item-categories',
      title: 'Item Categories',
      type: 'chart',
      size: 'medium',
      icon: <Package className="h-5 w-5" />,
      description: 'Distribution of registered items',
      content: (
        <div className="h-full flex flex-col">
          <div className="flex-1">
            <ItemCategoryChart data={[
              { name: 'Electronics', value: 45 },
              { name: 'Jewelry', value: 28 },
              { name: 'Documents', value: 33 },
              { name: 'Phones', value: 22 },
              { name: 'Other', value: 12 }
            ]} />
          </div>
          <div className="mt-2 text-center">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-[#00BFFF] hover:text-[#00BFFF]/90 hover:bg-gray-700"
              onClick={() => navigate("/admin/categories")}
            >
              Manage categories
            </Button>
          </div>
        </div>
      ),
      quickActions: [
        {
          label: "Add Category",
          icon: <Plus className="h-3 w-3" />,
          onClick: () => navigate("/admin/categories/new")
        }
      ]
    },
    {
      id: 'recent-activity',
      title: 'Recent Activity',
      type: 'feed',
      size: 'large',
      icon: <Activity className="h-5 w-5" />,
      description: 'Latest platform events and actions',
      content: (
        <div className="h-full flex flex-col">
          <div className="flex-1 space-y-3">
            {[
              { type: "user", title: "New user registered", time: "5 min ago", details: "User John Doe joined as Subscriber", icon: <Users className="h-4 w-4 text-[#00BFFF]" /> },
              { type: "item", title: "Item #1042 registered", time: "30 min ago", details: "Electronics category, registered by Agent Carol", icon: <Package className="h-4 w-4 text-[#00BFFF]" /> },
              { type: "payment", title: "Payment of RWF 5,000 received", time: "1 hour ago", details: "Registration fee for item #1038 by Emma Smith", icon: <CreditCard className="h-4 w-4 text-green-400" /> },
              { type: "report", title: "Lost report submitted", time: "3 hours ago", details: "Report #352 for item #986 by Michael Brown", icon: <FileText className="h-4 w-4 text-yellow-400" /> }
            ].map((activity, i) => (
              <div key={i} className="flex items-start p-2 rounded-lg hover:bg-gray-700/50 transition-colors cursor-pointer"
                onClick={() => {
                  setSidebarContext({ 
                    type: activity.type === 'user' ? 'users' : 
                           activity.type === 'item' ? 'items' : 
                           activity.type === 'payment' ? 'payments' : 'reports',
                    id: `${activity.type}-${i}`,
                    data: { activityDetails: activity }
                  });
                  setShowContextSidebar(true);
                }}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-full mr-3 ${
                  activity.type === 'user' ? 'bg-[#00BFFF]/20' : 
                  activity.type === 'item' ? 'bg-[#00BFFF]/20' : 
                  activity.type === 'payment' ? 'bg-green-500/20' :
                  'bg-yellow-500/20'
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
          <div className="mt-auto pt-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-center text-[#00BFFF] hover:text-[#00BFFF]/90 hover:bg-gray-700"
              onClick={() => navigate("/admin/activity")}
            >
              View all activity <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </div>
      )
    },
    {
      id: 'system-insights',
      title: 'System Insights',
      type: 'alerts',
      size: 'medium',
      icon: <AlertTriangle className="h-5 w-5" />,
      description: 'Important system notifications',
      content: (
        <div className="h-full flex flex-col">
          <div className="flex gap-1 mb-3">
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
          
          <div className="flex-1 space-y-2 overflow-auto">
            {filteredInsights.map(insight => (
              <div 
                key={insight.id} 
                className={`p-2 rounded-lg text-sm border border-opacity-20 cursor-pointer hover:bg-gray-700/20 ${
                  insight.type === 'alert' ? 'bg-red-500/10 border-red-500' : 
                  insight.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500' :
                  insight.type === 'success' ? 'bg-green-500/10 border-green-500' :
                  'bg-[#00BFFF]/10 border-[#00BFFF]'
                }`}
                onClick={() => {
                  setSidebarContext({ 
                    type: 'insight', 
                    id: `insight-${insight.id}`,
                    data: { insight } 
                  });
                  setShowContextSidebar(true);
                }}
              >
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
        </div>
      )
    },
    {
      id: 'system-status',
      title: 'System Status',
      type: 'status',
      size: 'medium',
      icon: <Activity className="h-5 w-5" />,
      description: 'Current platform service status',
      content: (
        <div className="h-full flex flex-col">
          <div className="flex-1 space-y-2">
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
          
          <div className="mt-4 border-t border-gray-700 pt-2">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Last checked: 2 min ago</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-xs text-[#00BFFF] p-0 hover:text-[#00BFFF]/90 hover:bg-transparent"
                onClick={() => setSelectedDetailView('system-status')}
              >
                View Details
              </Button>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'quick-actions',
      title: 'Quick Actions',
      type: 'actions',
      size: 'small',
      icon: <Plus className="h-5 w-5" />,
      description: 'Frequent administrative tasks',
      content: (
        <div className="h-full flex flex-col">
          <div className="space-y-2 flex-1">
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
        </div>
      )
    }
  ];
  
  // Handle user saves dashboard configuration
  const handleSaveDashboardConfig = (config: DashboardConfig) => {
    try {
      // Store in localStorage
      localStorage.setItem('dashboardConfig', JSON.stringify(config));
      // Update state
      setDashboardConfig(config);
    } catch (e) {
      console.error("Error saving dashboard config:", e);
    }
  };
  
  // Handle API errors
  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load dashboard data. Please try again later.
          </AlertDescription>
        </Alert>
        <Button onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  // Create system status data for the system status component
  const systemStatusItems: SystemStatusItemProps[] = [
    {
      name: 'API Server',
      status: 'operational',
      details: 'All endpoints functioning normally',
      responseTime: 126,
      uptime: 99.98,
      icon: <Server className="h-4 w-4" />
    },
    {
      name: 'Database',
      status: 'operational',
      details: 'Connection pool healthy',
      responseTime: 42,
      uptime: 99.99,
      icon: <Database className="h-4 w-4" />
    },
    {
      name: 'Authentication',
      status: 'operational',
      details: 'Firebase integration active',
      responseTime: 231,
      uptime: 99.95,
      icon: <Shield className="h-4 w-4" />
    },
    {
      name: 'Storage Service',
      status: 'operational',
      details: 'All storage operations normal',
      responseTime: 87,
      uptime: 100,
      icon: <HardDrive className="h-4 w-4" />
    },
    {
      name: 'Payment Gateway',
      status: 'operational',
      details: 'Processing payments normally',
      responseTime: 315,
      uptime: 99.9,
      icon: <CreditCard className="h-4 w-4" />
    }
  ];

  // Transform insights to activity events
  const activityEvents: ActivityEvent[] = insights.map(insight => ({
    id: insight.id,
    title: insight.title,
    time: insight.time,
    message: insight.message,
    type: insight.type as 'alert' | 'info' | 'success' | 'warning',
    category: insight.category as 'items' | 'users' | 'reports' | 'revenue' | 'system'
  }));

  // Generate payment data for the enhanced analytics chart
  const paymentAnalyticsData = [
    { date: 'Jan', amount: 2400, count: 48, successRate: 92 },
    { date: 'Feb', amount: 1398, count: 28, successRate: 89 },
    { date: 'Mar', amount: 9800, count: 196, successRate: 95 },
    { date: 'Apr', amount: 3908, count: 78, successRate: 91 },
    { date: 'May', amount: 4800, count: 96, successRate: 93 },
    { date: 'Jun', amount: 3800, count: 76, successRate: 90 },
    { date: 'Jul', amount: 4300, count: 86, successRate: 94 }
  ];

  // Sample data for recent transactions
  const recentTransactions = [
    { 
      id: 1, 
      reference: 'TRX-001234',
      amount: 5000,
      status: 'successful',
      date: '2025-04-26',
      paymentMethod: 'Mobile Money',
      customer: 'John Doe'
    },
    { 
      id: 2, 
      reference: 'TRX-001235',
      amount: 5000,
      status: 'pending',
      date: '2025-04-26',
      paymentMethod: 'Credit Card',
      customer: 'Jane Smith'
    },
    { 
      id: 3, 
      reference: 'TRX-001236',
      amount: 5000,
      status: 'failed',
      date: '2025-04-25',
      paymentMethod: 'Bank Transfer',
      customer: 'Robert Johnson'
    },
    { 
      id: 4, 
      reference: 'TRX-001237',
      amount: 5000,
      status: 'successful',
      date: '2025-04-25',
      paymentMethod: 'Mobile Money',
      customer: 'Mary Williams'
    },
    { 
      id: 5, 
      reference: 'TRX-001238',
      amount: 5000,
      status: 'successful',
      date: '2025-04-24',
      paymentMethod: 'Mobile Money',
      customer: 'David Brown'
    }
  ];

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 pb-12">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center py-4 sticky top-0 z-10 border-b border-border/60 mb-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div>
          <h1 className="text-2xl font-semibold">KIZERE Command Center</h1>
          <p className="text-sm text-muted-foreground">
            Comprehensive platform management and analytics
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-48 md:w-64">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder="Search..." 
              className="pl-8 h-9 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px] sm:w-[180px] h-9">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last Quarter</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => refetch()}>
              <Loader2 className="h-5 w-5 text-muted-foreground" />
            </Button>
            
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </Button>
            
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
              {user?.fullName?.charAt(0) || 'A'}
            </div>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <span className="ml-3 text-lg text-muted-foreground">Loading dashboard data...</span>
        </div>
      ) : !stats ? (
        <div className="flex flex-col items-center justify-center py-32">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
          <p className="text-muted-foreground mb-4 text-lg">Unable to load dashboard data</p>
          <Button className="bg-primary hover:bg-primary/90" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      ) : !useCustomDashboard ? (
        <div className="space-y-6 pb-10">
          {/* Metric cards row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricsCard
              title="Total Users"
              icon={<Users className="h-5 w-5" />}
              description="User accounts across all roles"
              value={stats?.totalUsers || 0}
              trend={{
                value: 4.3,
                trend: 'up',
                percentage: 4.3,
                label: 'vs last month'
              }}
              secondaryValue={{
                label: `New this month`,
                value: stats?.totalUsers ? Math.round(stats.totalUsers * 0.3) : 0
              }}
              actions={{
                primary: {
                  label: "View all users",
                  onClick: () => {
                    setSidebarContext({ type: 'users', data: { } });
                    setShowContextSidebar(true);
                  }
                },
                secondary: [
                  {
                    label: "Add User",
                    icon: <Plus className="h-4 w-4" />,
                    onClick: () => navigate("/admin/users/new")
                  },
                  {
                    label: "Manage Roles",
                    icon: <Settings className="h-4 w-4" />,
                    onClick: () => navigate("/admin/permissions")
                  }
                ]
              }}
              loading={isLoading}
            />
            
            <MetricsCard
              title="Registered Items"
              icon={<Package className="h-5 w-5" />}
              description="All registered valuable items"
              value={stats?.totalItems || 0}
              trend={{
                value: 2.1,
                trend: 'up',
                percentage: 2.1,
                label: 'vs last week'
              }}
              secondaryValue={{
                label: `Registered this week`,
                value: stats?.totalItems ? Math.round(stats.totalItems * 0.2) : 0
              }}
              actions={{
                primary: {
                  label: "View all items",
                  onClick: () => {
                    setSidebarContext({ type: 'items', data: { } });
                    setShowContextSidebar(true);
                  }
                },
                secondary: [
                  {
                    label: "Add Item",
                    icon: <Plus className="h-4 w-4" />,
                    onClick: () => navigate("/admin/items/new")
                  },
                  {
                    label: "Categories",
                    icon: <Tags className="h-4 w-4" />,
                    onClick: () => navigate("/admin/categories")
                  }
                ]
              }}
              loading={isLoading}
            />
            
            <MetricsCard
              title="Pending Reports"
              icon={<FileText className="h-5 w-5" />}
              description="Reports awaiting processing"
              value={stats?.pendingReports || 0}
              trend={{
                value: -1.8,
                trend: 'down',
                percentage: 1.8,
                label: 'vs last week'
              }}
              secondaryValue={{
                label: `Need attention`,
                value: stats?.pendingReports ? Math.round(stats.pendingReports * 0.7) : 0
              }}
              actions={{
                primary: {
                  label: "View pending reports",
                  onClick: () => {
                    setSidebarContext({ type: 'reports', data: { filter: 'pending' } });
                    setShowContextSidebar(true);
                  }
                },
                secondary: [
                  {
                    label: "Process Next",
                    icon: <CheckCircle className="h-4 w-4" />,
                    onClick: () => navigate("/admin/reports/next")
                  }
                ]
              }}
              loading={isLoading}
            />
            
            <MetricsCard
              title="Total Revenue"
              icon={<CreditCard className="h-5 w-5" />}
              description="Payment collection summary"
              valuePrefix="RWF "
              value={stats?.totalPayments ? (stats.totalPayments * 5000).toLocaleString() : 0}
              trend={{
                value: 8.7,
                trend: 'up',
                percentage: 8.7,
                label: 'vs last month'
              }}
              secondaryValue={{
                label: `This month`,
                value: `RWF ${stats?.totalPayments ? (stats.totalPayments * 5000 * 0.4).toLocaleString() : 0}`
              }}
              actions={{
                primary: {
                  label: "View all transactions",
                  onClick: () => {
                    setSidebarContext({ type: 'payments', data: { } });
                    setShowContextSidebar(true);
                  }
                },
                secondary: [
                  {
                    label: "Export",
                    icon: <Download className="h-4 w-4" />,
                    onClick: () => alert("Export functionality will be implemented.")
                  }
                ]
              }}
              loading={isLoading}
            />
          </div>
          
          {/* Analytics and activity section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Enhanced payment analytics */}
            <div className="lg:col-span-2 order-2 lg:order-1">
              <EnhancedPaymentAnalytics
                title="Revenue Analytics"
                description="Track payment trends and performance"
                data={paymentAnalyticsData}
                onFilterChange={(period) => setTimeRange(period)}
                onDownload={() => alert("Export functionality will be implemented soon")}
                isLoading={isLoading}
                comparisonData={{
                  previousPeriod: {
                    totalAmount: 25000,
                    percentageChange: 8.7
                  },
                  averagePerTransaction: 4950,
                  successRate: 92
                }}
              />
            </div>
            
            {/* Activity feed */}
            <div className="order-1 lg:order-2">
              <ActivityFeed
                events={activityEvents}
                onEventClick={(event) => {
                  setSidebarContext({ 
                    type: 'insight', 
                    id: event.id.toString(), 
                    data: event 
                  });
                  setShowContextSidebar(true);
                }}
                onFilterChange={setActiveInsightCategory}
                activeCategory={activeInsightCategory}
                maxHeight={470}
              />
            </div>
          </div>
          
          {/* Charts and system status section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Payment status chart */}
            <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Payment Status</CardTitle>
                <CardDescription>Distribution by payment outcomes</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[180px] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-2">
                    <PaymentStatusChart 
                      data={chartData?.paymentStatusData || []} 
                    />
                  </div>
                )}
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
            
            {/* User distribution chart */}
            <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">User Distribution</CardTitle>
                <CardDescription>Breakdown by user roles</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[180px] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-2">
                    <UserRoleDistribution 
                      data={chartData?.userRoleData || []} 
                    />
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="bg-blue-500/10 rounded-lg p-2 text-center">
                    <User className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground mb-1">Subscribers</p>
                    <p className="font-semibold">{chartData?.userRoleData?.[0]?.value || 0}%</p>
                  </div>
                  <div className="bg-purple-500/10 rounded-lg p-2 text-center">
                    <Star className="h-4 w-4 text-purple-500 mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground mb-1">Agents</p>
                    <p className="font-semibold">{chartData?.userRoleData?.[1]?.value || 0}%</p>
                  </div>
                  <div className="bg-yellow-500/10 rounded-lg p-2 text-center">
                    <Settings className="h-4 w-4 text-yellow-500 mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground mb-1">Admins</p>
                    <p className="font-semibold">{chartData?.userRoleData?.[2]?.value || 0}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* System status */}
            <Card className="border border-border/50 bg-card/50 backdrop-blur-sm md:col-span-2 lg:col-span-1">
              <SystemStatus
                items={systemStatusItems}
                lastUpdated={new Date().toLocaleString()}
                onRefresh={() => refetch()}
                isLoading={isLoading}
              />
            </Card>
          </div>
          
          {/* Recent transactions and item categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Recent transactions */}
            <DataTableDashboard
              title="Recent Transactions"
              description="Latest payment activities"
              data={recentTransactions}
              columns={[
                { label: 'Reference', key: 'reference', sortable: true },
                { label: 'Amount', key: 'amount', sortable: true, render: (value) => `RWF ${value.toLocaleString()}` },
                { label: 'Status', key: 'status', sortable: true, render: (value) => renderStatusBadge(value) },
                { label: 'Date', key: 'date', sortable: true },
                { label: 'Customer', key: 'customer', sortable: true },
              ]}
              keyField="id"
              pagination={{
                page: 1,
                pageSize: 5,
                totalItems: recentTransactions.length,
                totalPages: 1
              }}
              actions={[
                {
                  label: 'View Details',
                  icon: <Eye className="h-4 w-4" />,
                  onClick: (item) => {
                    setSidebarContext({ 
                      type: 'payments', 
                      id: item.id.toString(), 
                      data: item 
                    });
                    setShowContextSidebar(true);
                  }
                }
              ]}
              onExport={() => alert('Export functionality will be implemented')}
              isLoading={isLoading}
            />
            
            {/* Item categories chart */}
            <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">Item Categories</CardTitle>
                    <CardDescription>Distribution by category</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    <Download className="h-3 w-3 mr-1" /> Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[250px] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="h-[250px]">
                    <ItemCategoryChart 
                      data={[
                        { name: 'Electronics', value: 42 },
                        { name: 'Documents', value: 28 },
                        { name: 'Jewelry', value: 15 },
                        { name: 'Accessories', value: 10 },
                        { name: 'Other', value: 5 }
                      ]} 
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Use customizable dashboard instead if preferred */}
          {user?.role === 'Admin' && (
            <Card className="border border-border/50 bg-card/50 backdrop-blur-sm mt-8">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">Dashboard Layout</h3>
                    <p className="text-sm text-muted-foreground">Use the customizable dashboard interface instead?</p>
                  </div>
                  <Button 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
                    onClick={() => setUseCustomDashboard(true)}
                  >
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Switch to Customizable Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="pb-10">
          <CustomizableDashboard 
            availableCards={dashboardCards}
            initialConfig={dashboardConfig || undefined}
            onSaveLayout={handleSaveDashboardConfig}
          />
        </div>
      )}
      
      {/* Contextual Sidebar */}
      <ContextualSidebar
        title={
          sidebarContext.type === 'users' ? 'User Management' :
          sidebarContext.type === 'items' ? 'Item Registry' :
          sidebarContext.type === 'reports' ? 'Report Details' :
          sidebarContext.type === 'payments' ? 'Payment Management' :
          sidebarContext.type === 'insight' ? 'Insight Details' : 'Details'
        }
        icon={
          sidebarContext.type === 'users' ? <Users className="h-5 w-5" /> :
          sidebarContext.type === 'items' ? <Package className="h-5 w-5" /> :
          sidebarContext.type === 'reports' ? <FileText className="h-5 w-5" /> :
          sidebarContext.type === 'payments' ? <CreditCard className="h-5 w-5" /> :
          sidebarContext.type === 'insight' ? <AlertTriangle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />
        }
        isOpen={showContextSidebar}
        onClose={() => setShowContextSidebar(false)}
        data={sidebarContext.data || {}}
        type={sidebarContext.type}
      />
      
      {/* Expandable Detail Views */}
      {selectedDetailView === 'revenue-detail' && (
        <ExpandableDetailView
          title="Revenue Analysis"
          id="revenue-detail"
          onClose={() => setSelectedDetailView(null)}
          children={null}
          sections={[
            {
              id: 'overview',
              title: 'Overview',
              icon: <BarChart3 className="h-4 w-4" />,
              content: (
                <div className="p-4 text-white">
                  <h2 className="text-xl font-semibold mb-4">Revenue Overview</h2>
                  <p className="mb-6 text-gray-300">
                    This section provides detailed analysis of platform revenue across different time periods,
                    payment methods, and user segments.
                  </p>
                  
                  <div className="h-[400px]">
                    <PaymentAnalyticsChart 
                      title="Revenue Over Time" 
                      description="Monthly payment collection trends"
                      data={[
                        { date: 'Jan', amount: 2400 },
                        { date: 'Feb', amount: 1398 },
                        { date: 'Mar', amount: 9800 },
                        { date: 'Apr', amount: 3908 },
                        { date: 'May', amount: 4800 },
                        { date: 'Jun', amount: 3800 },
                        { date: 'Jul', amount: 4300 }
                      ]}
                    />
                  </div>
                </div>
              )
            },
            {
              id: 'by-type',
              title: 'By Payment Type',
              icon: <PieChart className="h-4 w-4" />,
              content: (
                <div className="p-4 text-white">
                  <h2 className="text-xl font-semibold mb-4">Revenue by Payment Type</h2>
                  <div className="h-[300px] flex items-center justify-center">
                    <PaymentStatusChart 
                      data={[
                        { name: 'Registration', value: 65 },
                        { name: 'Lost Reports', value: 35 }
                      ]} 
                    />
                  </div>
                </div>
              )
            },
            {
              id: 'by-user',
              title: 'By User Type',
              icon: <Users className="h-4 w-4" />,
              content: (
                <div className="p-4 text-white">
                  <h2 className="text-xl font-semibold mb-4">Revenue by User Type</h2>
                  <div className="h-[300px] flex items-center justify-center">
                    <UserRoleDistribution 
                      data={[
                        { name: 'Subscribers', value: 80 },
                        { name: 'Agents', value: 15 },
                        { name: 'Admins', value: 5 }
                      ]} 
                    />
                  </div>
                </div>
              )
            },
            {
              id: 'forecasts',
              title: 'Forecasts',
              icon: <TrendingUp className="h-4 w-4" />,
              content: (
                <div className="p-4 text-white">
                  <h2 className="text-xl font-semibold mb-4">Revenue Forecasts</h2>
                  <p className="text-gray-300">
                    Based on historical trends and growth patterns, we project the following revenue
                    growth for the next quarters:
                  </p>
                  <div className="mt-6 space-y-4">
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">Q2 2025</span>
                        <span className="text-emerald-400">+12.5%</span>
                      </div>
                      <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: '12.5%' }}></div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">Q3 2025</span>
                        <span className="text-emerald-400">+18.3%</span>
                      </div>
                      <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: '18.3%' }}></div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">Q4 2025</span>
                        <span className="text-emerald-400">+24.7%</span>
                      </div>
                      <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: '24.7%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            }
          ]}
          relatedItems={[
            { id: 'payment-methods', title: 'Payment Method Analysis', onClick: () => {} },
            { id: 'failed-payments', title: 'Failed Payment Report', onClick: () => {} },
            { id: 'financial-reports', title: 'Financial Reports', onClick: () => navigate('/admin/financial-reports') }
          ]}
        />
      )}
      
      {selectedDetailView === 'system-status' && (
        <ExpandableDetailView
          title="System Status Details"
          id="system-status"
          onClose={() => setSelectedDetailView(null)}
          children={null}
          sections={[
            {
              id: 'current-status',
              title: 'Current Status',
              icon: <Activity className="h-4 w-4" />,
              content: (
                <div className="p-4 text-white">
                  <h2 className="text-xl font-semibold mb-4">System Status</h2>
                  <div className="space-y-4">
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                        <h3 className="font-medium">API Services</h3>
                      </div>
                      <p className="text-sm text-gray-300 ml-6">
                        All API endpoints are functioning normally. Response times averaging 45ms.
                      </p>
                    </div>
                    
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                        <h3 className="font-medium">Database</h3>
                      </div>
                      <p className="text-sm text-gray-300 ml-6">
                        Database connections stable. Query performance within expected parameters.
                      </p>
                    </div>
                    
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                        <h3 className="font-medium">Authentication</h3>
                      </div>
                      <p className="text-sm text-gray-300 ml-6">
                        Auth services operating normally. No failed authentication spikes detected.
                      </p>
                    </div>
                    
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                        <h3 className="font-medium">Payment Services</h3>
                      </div>
                      <p className="text-sm text-gray-300 ml-6">
                        MTN Mobile Money integration experiencing intermittent delays. Technical team is investigating.
                      </p>
                    </div>
                    
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                        <h3 className="font-medium">Storage Services</h3>
                      </div>
                      <p className="text-sm text-gray-300 ml-6">
                        File storage and retrieval operating at optimal capacity.
                      </p>
                    </div>
                  </div>
                </div>
              )
            },
            {
              id: 'incident-history',
              title: 'Incident History',
              icon: <AlertTriangle className="h-4 w-4" />,
              content: (
                <div className="p-4 text-white">
                  <h2 className="text-xl font-semibold mb-4">Recent Incidents</h2>
                  <div className="space-y-4">
                    <div className="border-l-2 border-yellow-500 pl-4 py-2">
                      <div className="flex justify-between mb-1">
                        <h3 className="font-medium">Payment Integration Delay</h3>
                        <span className="text-xs text-gray-400">Ongoing</span>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">
                        MTN Mobile Money integration experiencing intermittent delays.
                      </p>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Started: April 26, 2025 at 08:45 AM</span>
                        <span className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">In Progress</span>
                      </div>
                    </div>
                    
                    <div className="border-l-2 border-green-500 pl-4 py-2">
                      <div className="flex justify-between mb-1">
                        <h3 className="font-medium">Database Performance</h3>
                        <span className="text-xs text-gray-400">April 24, 2025</span>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">
                        Slow query performance during peak hours. Optimized database indices.
                      </p>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Duration: 2 hours 15 minutes</span>
                        <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Resolved</span>
                      </div>
                    </div>
                    
                    <div className="border-l-2 border-green-500 pl-4 py-2">
                      <div className="flex justify-between mb-1">
                        <h3 className="font-medium">API Authentication Issue</h3>
                        <span className="text-xs text-gray-400">April 20, 2025</span>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">
                        API token validation errors after maintenance window. Redeployed auth service.
                      </p>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Duration: 45 minutes</span>
                        <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Resolved</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            },
            {
              id: 'performance',
              title: 'Performance',
              icon: <Activity className="h-4 w-4" />,
              content: (
                <div className="p-4 text-white">
                  <h2 className="text-xl font-semibold mb-4">System Performance</h2>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <h3 className="font-medium">API Response Time</h3>
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Good</span>
                      </div>
                      <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-green-500 h-full rounded-full" style={{ width: '15%' }}></div>
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-gray-400">
                        <span>45ms average</span>
                        <span>300ms threshold</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <h3 className="font-medium">Database Load</h3>
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Good</span>
                      </div>
                      <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-green-500 h-full rounded-full" style={{ width: '30%' }}></div>
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-gray-400">
                        <span>30% utilization</span>
                        <span>80% threshold</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <h3 className="font-medium">Memory Usage</h3>
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Good</span>
                      </div>
                      <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-green-500 h-full rounded-full" style={{ width: '45%' }}></div>
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-gray-400">
                        <span>45% usage</span>
                        <span>80% threshold</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <h3 className="font-medium">Storage Usage</h3>
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Good</span>
                      </div>
                      <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-green-500 h-full rounded-full" style={{ width: '25%' }}></div>
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-gray-400">
                        <span>25% usage</span>
                        <span>90% threshold</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            }
          ]}
        />
      )}
      
      {/* Quick action floating menu */}
      <QuickActionMenu />
    </div>
  );
}