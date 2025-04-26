import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronRight, Users, FileText, Clock, Settings, BarChart3, Wallet, Bell, Loader2 } from "lucide-react";
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
    <div className="container px-4 py-8 mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your platform, users, and view statistics
          </p>
        </div>
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="w-10 h-10 rounded-full" />
              ) : (
                <span className="text-primary font-medium">{user.fullName?.charAt(0) || "A"}</span>
              )}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium">{user.fullName}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview" className="text-sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="text-sm">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="items" className="text-sm">
            <FileText className="h-4 w-4 mr-2" />
            Items
          </TabsTrigger>
          <TabsTrigger value="reports" className="text-sm">
            <Clock className="h-4 w-4 mr-2" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="payments" className="text-sm">
            <Wallet className="h-4 w-4 mr-2" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading dashboard data...</span>
            </div>
          ) : !stats ? (
            <div className="flex flex-col items-center justify-center py-10">
              <p className="text-muted-foreground mb-2">Failed to load dashboard statistics</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last updated: {new Date().toLocaleDateString()}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => setActiveTab("users")}>
                      View all users
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Registered Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalItems || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last updated: {new Date().toLocaleDateString()}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => setActiveTab("items")}>
                      View all items
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.pendingReports || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last updated: {new Date().toLocaleDateString()}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => setActiveTab("reports")}>
                      View all reports
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalPayments || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last updated: {new Date().toLocaleDateString()}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => setLocation("/admin/payment-dashboard")}>
                      View payment dashboard
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              {/* Analytics Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
                <PaymentAnalyticsChart 
                  title="Revenue Trends" 
                  description="Monthly payment collection trends" 
                />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <PaymentStatusChart 
                    data={chartData?.paymentStatusData || []} 
                  />
                  <UserRoleDistribution 
                    data={chartData?.userRoleData || []} 
                  />
                </div>
              </div>

              {/* Additional Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
                <ItemStatusDistribution 
                  data={chartData?.itemStatusData || []} 
                />
                <ItemCategoryChart />
              </div>

              {/* Recent Activity and System Status */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                      Latest system activity for the past 7 days
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-start">
                          <div className="w-2 h-2 rounded-full bg-primary mt-2 mr-2" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {["New user registration", "Item registered", "Lost report created", "Payment received", "User password reset"][i]}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {i === 0 ? "Just now" : i === 1 ? "2 hours ago" : i === 2 ? "Yesterday" : `${i + 1} days ago`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm" className="w-full">
                      View All Activity
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>System Status</CardTitle>
                    <CardDescription>
                      Overview of system health and performance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { name: "Server Uptime", value: "99.9%", status: "good" },
                        { name: "API Response Time", value: "89ms", status: "good" },
                        { name: "Database Load", value: "42%", status: "good" },
                        { name: "Storage Usage", value: "68%", status: "warning" },
                        { name: "Monthly API Calls", value: "245K", status: "good" }
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <p className="text-sm font-medium">{item.name}</p>
                          <div className="flex items-center">
                            <span className="text-sm mr-2">{item.value}</span>
                            <div 
                              className={`w-3 h-3 rounded-full ${
                                item.status === 'good' 
                                  ? 'bg-green-500' 
                                  : item.status === 'warning' 
                                    ? 'bg-yellow-500' 
                                    : 'bg-red-500'
                              }`} 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm" className="w-full">
                      View System Details
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </>
          )}
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
                User management functionality will be displayed here. You can view, edit, and manage user accounts, roles, and permissions.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={() => setLocation("/user-management")}>Go to User Management</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="items">
          <Card>
            <CardHeader>
              <CardTitle>Item Management</CardTitle>
              <CardDescription>
                View and manage all registered items
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Item management functionality will be displayed here. You can view, edit, and manage registered items in the system.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Report Management</CardTitle>
              <CardDescription>
                View and manage all lost and found reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Report management functionality will be displayed here. You can view, process, and manage lost and found reports.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment Management</CardTitle>
              <CardDescription>
                View and manage all payment transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Payment management functionality will be displayed here. You can view, process, and manage payment transactions.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={() => setLocation("/admin/payment-dashboard")}>Go to Payment Dashboard</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>
                Configure system-wide settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                System settings functionality will be displayed here. You can configure various system parameters and preferences.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}