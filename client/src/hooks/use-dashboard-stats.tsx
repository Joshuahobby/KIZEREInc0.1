import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// Default values for stats
const defaultStats = {
  // Base stats
  totalUsers: 0,
  totalItems: 0,
  pendingReports: 0,
  totalPayments: 0,
  
  // Additional stats
  userStats: {
    subscriberCount: 0,
    agentCount: 0,
    adminCount: 0,
  },
  itemStats: {
    registeredItems: 0,
    lostItems: 0,
    foundItems: 0,
  },
  reportStats: {
    lostReportsCount: 0,
    foundReportsCount: 0,
    resolvedReportsCount: 0,
  },
  paymentStats: {
    successfulPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
  },
};

export interface DashboardStats {
  // Base stats
  totalUsers: number;
  totalItems: number;
  pendingReports: number;
  totalPayments: number;
  
  // Additional stats
  userStats: {
    subscriberCount: number;
    agentCount: number;
    adminCount: number;
  };
  itemStats: {
    registeredItems: number;
    lostItems: number;
    foundItems: number;
  };
  reportStats: {
    lostReportsCount: number;
    foundReportsCount: number;
    resolvedReportsCount: number;
  };
  paymentStats: {
    successfulPayments: number;
    pendingPayments: number;
    failedPayments: number;
  };
}

export function useDashboardStats() {
  const { toast } = useToast();
  
  const { data, isLoading, isError, error, refetch } = useQuery<DashboardStats>({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Error fetching dashboard stats: ${response.status}`);
      }
      return response.json();
    },
    retry: 1,
    // Using onSettled instead of onError is more compatible with TanStack Query v5
    onSettled: (data, error) => {
      if (error) {
        toast({
          title: "Failed to load dashboard statistics",
          description: (error as Error).message || "Please try again or contact support if the problem persists.",
          variant: "destructive",
        });
      }
    },
  });

  // Fall back to default stats if data is undefined
  const stats = data || defaultStats;

  // Compute percentages for charts
  const chartData = {
    userRoleData: stats ? [
      { name: "Subscribers", value: Math.round((stats.userStats.subscriberCount / Math.max(stats.totalUsers, 1)) * 100) || 0 },
      { name: "Agents", value: Math.round((stats.userStats.agentCount / Math.max(stats.totalUsers, 1)) * 100) || 0 },
      { name: "Admins", value: Math.round((stats.userStats.adminCount / Math.max(stats.totalUsers, 1)) * 100) || 0 },
    ] : [],
    
    itemStatusData: stats ? [
      { name: "Registered", value: Math.round((stats.itemStats.registeredItems / Math.max(stats.totalItems, 1)) * 100) || 0 },
      { name: "Lost", value: Math.round((stats.itemStats.lostItems / Math.max(stats.totalItems, 1)) * 100) || 0 },
      { name: "Found", value: Math.round((stats.itemStats.foundItems / Math.max(stats.totalItems, 1)) * 100) || 0 },
    ] : [],
    
    paymentStatusData: stats ? [
      { name: "Successful", value: Math.round((stats.paymentStats.successfulPayments / Math.max(stats.totalPayments, 1)) * 100) || 0 },
      { name: "Pending", value: Math.round((stats.paymentStats.pendingPayments / Math.max(stats.totalPayments, 1)) * 100) || 0 },
      { name: "Failed", value: Math.round((stats.paymentStats.failedPayments / Math.max(stats.totalPayments, 1)) * 100) || 0 },
    ] : [],
  };
  
  return {
    stats,
    chartData,
    isLoading,
    isError,
    error,
    refetch,
  };
}