import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowUpRight, 
  Calendar, 
  ChevronRight, 
  Users, 
  FileText, 
  Clock, 
  Settings, 
  BarChart3, 
  Wallet, 
  Bell, 
  Loader2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ArrowRight,
  LayoutDashboard,
  Database,
  X
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { PaymentAnalyticsChart, PaymentStatusChart } from "@/components/dashboard/payment-analytics-chart";
import { ItemStatusDistribution, ItemCategoryChart } from "@/components/dashboard/item-stats-chart";
import { UserRoleDistribution } from "@/components/dashboard/user-stats-chart";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const { stats, chartData, isLoading, refetch } = useDashboardStats();
  const [timeRange, setTimeRange] = useState("7d");
  const [showActionPanel, setShowActionPanel] = useState(true);

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
    <div>
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Command Center</h1>
            <p className="text-muted-foreground">
              Monitor all platform activity and performance
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select defaultValue={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last Quarter</SelectItem>
                <SelectItem value="1y">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading command center...</span>
          </div>
        ) : !stats ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-muted-foreground mb-2">Failed to load dashboard statistics</p>
            <Button variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-primary">
                <CardHeader className="pb-2">
                  <CardDescription>Total Users</CardDescription>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">{stats.totalUsers || 0}</CardTitle>
                    <div className="flex items-center text-green-500 text-sm">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      <span>+4.3%</span>
                    </div>
                  </div>
                </CardHeader>
              </Card>
              
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-2">
                  <CardDescription>Registered Items</CardDescription>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">{stats.totalItems || 0}</CardTitle>
                    <div className="flex items-center text-green-500 text-sm">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      <span>+2.1%</span>
                    </div>
                  </div>
                </CardHeader>
              </Card>
              
              <Card className="border-l-4 border-l-yellow-500">
                <CardHeader className="pb-2">
                  <CardDescription>Pending Reports</CardDescription>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">{stats.pendingReports || 0}</CardTitle>
                    <div className="flex items-center text-red-500 text-sm">
                      <TrendingDown className="h-4 w-4 mr-1" />
                      <span>-1.8%</span>
                    </div>
                  </div>
                </CardHeader>
              </Card>
              
              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="pb-2">
                  <CardDescription>Total Revenue</CardDescription>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">RWF {stats.totalPayments ? (stats.totalPayments * 5000).toLocaleString() : 0}</CardTitle>
                    <div className="flex items-center text-green-500 text-sm">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      <span>+8.7%</span>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PaymentAnalyticsChart 
                title="Revenue Trends" 
                description="Monthly payment collection trends" 
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PaymentStatusChart 
                  data={chartData?.paymentStatusData || []} 
                />
                <UserRoleDistribution 
                  data={chartData?.userRoleData || []} 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              <ItemStatusDistribution 
                data={chartData?.itemStatusData || []} 
              />
              <ItemCategoryChart />
            </div>
            
            {/* Recent Activity Table */}
            <div className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>
                        Latest platform events and actions
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      View All <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { type: "user", title: "New user registered", time: "5 min ago", icon: <Users className="h-4 w-4" /> },
                      { type: "item", title: "Item #1042 registered", time: "30 min ago", icon: <Database className="h-4 w-4" /> },
                      { type: "payment", title: "Payment of RWF 5,000 received", time: "1 hour ago", icon: <Wallet className="h-4 w-4" /> },
                      { type: "report", title: "Lost report submitted", time: "3 hours ago", icon: <FileText className="h-4 w-4" /> },
                      { type: "system", title: "System maintenance completed", time: "Yesterday", icon: <Settings className="h-4 w-4" /> }
                    ].map((activity, i) => (
                      <div key={i} className="flex items-start">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full mr-3 ${
                          activity.type === 'user' ? 'bg-primary/10' : 
                          activity.type === 'item' ? 'bg-blue-500/10' : 
                          activity.type === 'payment' ? 'bg-green-500/10' :
                          activity.type === 'report' ? 'bg-yellow-500/10' : 'bg-slate-500/10'
                        }`}>
                          {activity.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-medium">{activity.title}</p>
                            <span className="text-xs text-muted-foreground">{activity.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
        
        {/* Hidden legacy tabs system - for future reference only */}
        <div className="hidden">
          <Tabs defaultValue="overview" onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="items">Items</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              {/* Overview tab content */}
            </TabsContent>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    View and manage all users on the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    User management functionality will be displayed here.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="items">
              <Card>
                <CardHeader>
                  <CardTitle>Item Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Item management functionality will be displayed here.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports">
              <Card>
                <CardHeader>
                  <CardTitle>Report Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Report management functionality will be displayed here.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Payment management functionality will be displayed here.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>System Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    System settings functionality will be displayed here.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}