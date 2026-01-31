import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useAuth } from "../hooks/use-auth";
import { Item, Report, Notification, Payment, UserRole, User, Claim } from "../../../shared/schema";
import { useMemo } from "react";
import { createLogger } from "../lib/logger";

const logger = createLogger('useDashboardData');

export interface DashboardStats {
  totalItems: number;
  totalLostReports: number;
  totalFoundReports: number;
  totalSpent: number;
  recentlyAddedItems: Item[];
  pendingPayments: number;
  unreadNotifications: number;
}

export interface AdminDashboardStats extends DashboardStats {
  totalUsers: number;
  totalRevenue: number;
  revenue: {
    thisMonth: number;
    lastMonth: number;
    percentChange: number;
  };
  registrations: {
    thisMonth: number;
    lastMonth: number;
    percentChange: number;
  };
  reportBreakdown: {
    lost: number;
    found: number;
    resolved: number;
    pending: number;
  };
  userRoleDistribution: {
    role: UserRole;
    count: number;
  }[];
  recentTransactions: Payment[];
  paymentsByType: {
    type: string;
    amount: number;
    count: number;
  }[];
  paymentsByStatus: {
    status: string;
    count: number;
  }[];
  monthlyRevenue: {
    month: string;
    revenue: number;
  }[];
}

export interface DashboardData {
  user: Omit<User, "password"> | null;
  isAdmin: boolean;
  isAgent: boolean;
  userStats: DashboardStats;
  adminStats: AdminDashboardStats | null;
  isLoading: boolean;
  items: Item[];
  reports: Report[];
  allReports: Report[];
  notifications: Notification[];
  payments: Payment[];
  myClaims: Claim[];
  claimsReceived: Claim[];
  allUsers: any[] | null;
}

interface UseDashboardDataOptions {
  refreshInterval?: number;
}

export function useDashboardData(options: UseDashboardDataOptions = {}): DashboardData {
  // Convert options type to match TypeScript requirements
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const isAgent = user?.role === 'Agent';
  const { refreshInterval = 60000 } = options; // Default refresh every minute

  // Basic data queries for all users
  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ['/api/items'],
    queryFn: async () => {
      return await apiRequest('/api/items');
    },
    refetchInterval: refreshInterval
  });

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ['/api/reports'],
    queryFn: async () => {
      return await apiRequest('/api/reports');
    },
    refetchInterval: refreshInterval
  });

  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      return await apiRequest('/api/notifications');
    },
    refetchInterval: refreshInterval
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['/api/payments'],
    queryFn: async () => {
      return await apiRequest('/api/payments/history');
    },
    refetchInterval: refreshInterval
  });
  
  const { data: myClaims, isLoading: myClaimsLoading } = useQuery({
    queryKey: ['/api/claims/my-claims'],
    queryFn: async () => {
      return await apiRequest('/api/claims/my-claims');
    },
    refetchInterval: refreshInterval
  });

  const { data: claimsReceived, isLoading: claimsReceivedLoading } = useQuery({
    queryKey: ['/api/claims/received'],
    queryFn: async () => {
      return await apiRequest('/api/claims/received');
    },
    refetchInterval: refreshInterval
  });

  // Admin-only data queries
  const { data: allUsers, isLoading: allUsersLoading } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      if (!isAdmin) return null;
      return await apiRequest('/api/users');
    },
    enabled: isAdmin,
    refetchInterval: isAdmin ? refreshInterval : false
  });

  const { data: revenueSummary, isLoading: revenueSummaryLoading } = useQuery({
    queryKey: ['/api/admin/payments/summary'],
    queryFn: async () => {
      if (!isAdmin) return null;
      return await apiRequest('/api/admin/payments/summary');
    },
    enabled: isAdmin,
    refetchInterval: isAdmin ? refreshInterval : false
  });

  // Data for agents - they need access to all reports, not just their own
  const { data: allReports, isLoading: allReportsLoading } = useQuery({
    queryKey: ['/api/reports/all'],
    queryFn: async () => {
      if (!isAgent && !isAdmin) return null;
      const lostReports = await apiRequest('/api/reports?type=lost');
      const foundReports = await apiRequest('/api/reports?type=found');
      
      return [...(lostReports as any[]), ...(foundReports as any[])];
    },
    enabled: isAgent || isAdmin,
    refetchInterval: (isAgent || isAdmin) ? refreshInterval : false
  });

  // Query for unified dashboard stats
  const { data: dashboardStats, isLoading: dashboardStatsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: async () => {
      if (!user) return null;
      return await apiRequest('/api/dashboard/stats');
    },
    enabled: !!user,
    refetchInterval: refreshInterval
  });

  // Compute derived stats for all users
  const userStats: DashboardStats = useMemo(() => {
    // If we have dashboard stats from the API, use those
    if (dashboardStats) {
      return {
        ...dashboardStats,
        // The API may return the amount as a string, ensure it's a number
        totalSpent: typeof dashboardStats.totalSpent === 'string' 
          ? parseFloat(dashboardStats.totalSpent) 
          : dashboardStats.totalSpent
      };
    }
    
    // Fallback to client-side computation if API data is not available
    if (!items || !reports || !notifications || !payments) {
      return {
        totalItems: 0,
        totalLostReports: 0,
        totalFoundReports: 0,
        totalSpent: 0,
        recentlyAddedItems: [],
        pendingPayments: 0,
        unreadNotifications: 0
      };
    }

    const totalItems = items.length;
    const totalLostReports = reports.filter((r: Report) => r.type === 'lost').length;
    const totalFoundReports = reports.filter((r: Report) => r.type === 'found').length;
    const totalSpent = payments.reduce((total: number, payment: Payment) => 
      payment.status === 'successful' ? total + parseFloat(payment.amount as string) : total, 0);
    
    const sortedItems = [...items].sort((a, b) => 
      new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());
    const recentlyAddedItems = sortedItems.slice(0, 5);
    
    const pendingPayments = payments.filter((p: Payment) => p.status === 'pending').length;
    const unreadNotifications = notifications.filter((n: Notification) => !n.isRead).length;

    return {
      totalItems,
      totalLostReports,
      totalFoundReports,
      totalSpent,
      recentlyAddedItems,
      pendingPayments,
      unreadNotifications
    };
  }, [items, reports, notifications, payments, dashboardStats, user]);

  // Compute admin stats
  const adminStats: AdminDashboardStats | null = useMemo(() => {
    if (!isAdmin || !allUsers || !revenueSummary) {
      return null;
    }

    // Get the base stats + admin specific stats
    return {
      ...userStats,
      totalUsers: allUsers.length,
      totalRevenue: revenueSummary.totalRevenue || 0,
      revenue: revenueSummary.revenueComparison || {
        thisMonth: 0,
        lastMonth: 0,
        percentChange: 0
      },
      registrations: revenueSummary.registrationsComparison || {
        thisMonth: 0,
        lastMonth: 0,
        percentChange: 0
      },
      reportBreakdown: {
        lost: reports ? reports.filter((r: Report) => r.type === 'lost').length : 0,
        found: reports ? reports.filter((r: Report) => r.type === 'found').length : 0,
        resolved: reports ? reports.filter((r: Report) => r.status === 'Resolved').length : 0,
        pending: reports ? reports.filter((r: Report) => r.status === 'Open').length : 0
      },
      userRoleDistribution: [
        { role: 'Admin', count: allUsers.filter((u: any) => u.role === 'Admin').length },
        { role: 'Agent', count: allUsers.filter((u: any) => u.role === 'Agent').length },
        { role: 'Subscriber', count: allUsers.filter((u: any) => u.role === 'Subscriber').length }
      ],
      recentTransactions: revenueSummary.recentTransactions || [],
      paymentsByType: revenueSummary.paymentsByType || [],
      paymentsByStatus: revenueSummary.paymentsByStatus || [],
      monthlyRevenue: revenueSummary.monthlyRevenue || []
    };
  }, [isAdmin, allUsers, revenueSummary, userStats, reports]);

  // Calculate loading state
  const isLoading = itemsLoading || reportsLoading || notificationsLoading || paymentsLoading || 
    dashboardStatsLoading || myClaimsLoading || claimsReceivedLoading || (isAdmin && (allUsersLoading || revenueSummaryLoading)) ||
    ((isAdmin || isAgent) && allReportsLoading);

  return {
    user,
    isAdmin,
    isAgent,
    userStats,
    adminStats,
    isLoading,
    items: items || [], 
    reports: reports || [],
    allReports: (isAdmin || isAgent) ? (allReports || []) : (reports || []),
    notifications: notifications || [],
    payments: payments || [],
    myClaims: myClaims || [],
    claimsReceived: claimsReceived || [],
    allUsers: isAdmin ? (allUsers || []) : null
  };
}