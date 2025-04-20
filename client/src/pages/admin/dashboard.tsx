import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { BarChart3, Users, ShoppingBag, AlertCircle, DollarSign, Loader2 } from 'lucide-react';
import { PaymentAnalyticsChart } from "@/components/dashboard/payment-analytics-chart";
import { PaymentStatusChart } from "@/components/dashboard/payment-status-chart";
import { PaymentTypeChart } from "@/components/dashboard/payment-type-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { apiRequest } from "@/lib/queryClient";
import { DEFAULT_CURRENCY } from "@/config/payment.config";

export default function AdminDashboard() {
  // State for chart data
  const [monthlyRevenueData, setMonthlyRevenueData] = useState([]);
  const [paymentStatusData, setPaymentStatusData] = useState([]);
  const [paymentTypeData, setPaymentTypeData] = useState([]);

  // Fetch summary statistics
  const { 
    data: revenueSummary, 
    isLoading: isRevenueSummaryLoading 
  } = useQuery({
    queryKey: ["/api/admin/payments/summary"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/payments/summary");
      if (!res.ok) {
        throw new Error("Failed to fetch revenue summary");
      }
      return await res.json();
    }
  });

  // Fetch recent transactions
  const { 
    data: recentTransactions, 
    isLoading: isRecentTransactionsLoading 
  } = useQuery({
    queryKey: ["/api/admin/payments", 1, 5],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/payments?page=1&pageSize=5");
      if (!res.ok) {
        throw new Error("Failed to fetch recent transactions");
      }
      const data = await res.json();
      return data.transactions;
    }
  });

  // Fetch user stats
  const {
    data: userStats,
    isLoading: isUserStatsLoading
  } = useQuery({
    queryKey: ["/api/admin/users/stats"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/users/stats");
        if (!res.ok) {
          return { totalUsers: 0, newUsersThisWeek: 0 };
        }
        return await res.json();
      } catch (error) {
        return { totalUsers: 0, newUsersThisWeek: 0 };
      }
    }
  });

  // Fetch item stats
  const {
    data: itemStats,
    isLoading: isItemStatsLoading
  } = useQuery({
    queryKey: ["/api/admin/items/stats"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/items/stats");
        if (!res.ok) {
          return { totalItems: 0, newItemsThisMonth: 0 };
        }
        return await res.json();
      } catch (error) {
        return { totalItems: 0, newItemsThisMonth: 0 };
      }
    }
  });

  // Fetch report stats
  const {
    data: reportStats,
    isLoading: isReportStatsLoading
  } = useQuery({
    queryKey: ["/api/admin/reports/stats"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/reports/stats");
        if (!res.ok) {
          return { openReports: 0, changeLastWeek: 0 };
        }
        return await res.json();
      } catch (error) {
        return { openReports: 0, changeLastWeek: 0 };
      }
    }
  });

  // Process data for charts when revenue summary changes
  useEffect(() => {
    if (revenueSummary) {
      // Create payment status chart data
      const statusData = [
        { 
          name: 'Successful', 
          value: revenueSummary.successfulTransactions || 0, 
          color: '#10b981' 
        },
        { 
          name: 'Pending', 
          value: revenueSummary.pendingTransactions || 0, 
          color: '#f59e0b' 
        },
        { 
          name: 'Failed', 
          value: revenueSummary.failedTransactions || 0, 
          color: '#ef4444' 
        },
        { 
          name: 'Cancelled', 
          value: revenueSummary.cancelledTransactions || 0, 
          color: '#6b7280' 
        },
        { 
          name: 'Refunded', 
          value: revenueSummary.refundedTransactions || 0, 
          color: '#3b82f6' 
        }
      ];
      setPaymentStatusData(statusData);

      // Create payment type chart data
      const typeData = [
        {
          name: 'Registration',
          value: revenueSummary.registrationCount || 0,
          color: '#8b5cf6'
        },
        {
          name: 'Lost Report',
          value: revenueSummary.lostReportCount || 0,
          color: '#ec4899'
        }
      ];
      setPaymentTypeData(typeData);

      // Monthly revenue data (simulated for demo)
      const currentMonth = new Date().getMonth();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      // Demo data using the total revenue allocated across months
      const totalRevenue = revenueSummary.totalRevenue || 0;
      const months = [];
      
      for (let i = 0; i < 12; i++) {
        const monthIndex = (currentMonth - 11 + i) % 12;
        const isCurrentMonth = monthIndex === currentMonth;
        
        // More revenue for current and recent months for demo
        let factor = 0.05;
        if (i > 9) factor = 0.15;
        if (i > 10) factor = 0.25;
        if (i === 11) factor = 0.3;
        
        months.push({
          name: monthNames[monthIndex],
          value: Math.round(totalRevenue * factor)
        });
      }
      
      setMonthlyRevenueData(months);
    }
  }, [revenueSummary]);

  return (
    <AdminLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Stats Cards */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isUserStatsLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-muted-foreground">Loading...</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {userStats?.totalUsers?.toLocaleString() || 0}
                    </div>
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {userStats?.newUsersThisWeek > 0 ? '+' : ''}{userStats?.newUsersThisWeek || 0} this week
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Registered Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isItemStatsLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-muted-foreground">Loading...</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {itemStats?.totalItems?.toLocaleString() || 0}
                    </div>
                    <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {itemStats?.newItemsThisMonth > 0 ? '+' : ''}{itemStats?.newItemsThisMonth || 0} this month
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Open Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isReportStatsLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-muted-foreground">Loading...</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {reportStats?.openReports?.toLocaleString() || 0}
                    </div>
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {reportStats?.changeLastWeek > 0 ? '+' : ''}{reportStats?.changeLastWeek || 0} since last week
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isRevenueSummaryLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-muted-foreground">Loading...</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {DEFAULT_CURRENCY} {(revenueSummary?.totalRevenue || 0).toLocaleString()}
                    </div>
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    From {revenueSummary?.successfulTransactions || 0} successful payments
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <PaymentAnalyticsChart 
            paymentData={monthlyRevenueData} 
            isLoading={isRevenueSummaryLoading} 
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <PaymentStatusChart 
            data={paymentStatusData} 
            isLoading={isRevenueSummaryLoading} 
          />
          <PaymentTypeChart 
            data={paymentTypeData} 
            isLoading={isRevenueSummaryLoading} 
          />
        </div>
        
        {/* Recent Transactions */}
        <div className="grid grid-cols-1 gap-6">
          <RecentTransactions 
            transactions={recentTransactions} 
            isLoading={isRecentTransactionsLoading} 
          />
        </div>
      </div>
    </AdminLayout>
  );
}