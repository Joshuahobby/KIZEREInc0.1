import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useAuth } from "../hooks/use-auth";
import { Item, Report, Notification, Payment, UserRole } from "../../shared/schema";
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

interface UseDashboardDataOptions {
  refreshInterval?: number;
}

export function useDashboardData(options: UseDashboardDataOptions = {}) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const isAgent = user?.role === 'Agent';
  const { refreshInterval = 60000 } = options; // Default refresh every minute

  // Basic data queries for all users
  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ['/api/items'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/items');
      return await res.json() as Item[];
    },
    refetchInterval: refreshInterval
  });

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ['/api/reports'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/reports');
      return await res.json() as Report[];
    },
    refetchInterval: refreshInterval
  });

  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/notifications');
      return await res.json() as Notification[];
    },
    refetchInterval: refreshInterval
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['/api/payments'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/payment-history');
      return await res.json() as Payment[];
    },
    refetchInterval: refreshInterval
  });

  // Admin-only data queries
  const { data: allUsers, isLoading: allUsersLoading } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      if (!isAdmin) return null;
      const res = await apiRequest('GET', '/api/users');
      return await res.json();
    },
    enabled: isAdmin,
    refetchInterval: isAdmin ? refreshInterval : false
  });

  const { data: revenueSummary, isLoading: revenueSummaryLoading } = useQuery({
    queryKey: ['/api/admin/payments/summary'],
    queryFn: async () => {
      if (!isAdmin) return null;
      const res = await apiRequest('GET', '/api/admin/payments/summary');
      return await res.json();
    },
    enabled: isAdmin,
    refetchInterval: isAdmin ? refreshInterval : false
  });

  // Data for agents - they need access to all reports, not just their own
  const { data: allReports, isLoading: allReportsLoading } = useQuery({
    queryKey: ['/api/reports/all'],
    queryFn: async () => {
      if (!isAgent && !isAdmin) return null;
      const lostRes = await apiRequest('GET', '/api/reports?type=lost');
      const foundRes = await apiRequest('GET', '/api/reports?type=found');
      
      const lostReports = await lostRes.json();
      const foundReports = await foundRes.json();
      
      return [...lostReports, ...foundReports];
    },
    enabled: isAgent || isAdmin,
    refetchInterval: (isAgent || isAdmin) ? refreshInterval : false
  });

  // Compute derived stats for all users
  const userStats: DashboardStats = useMemo(() => {
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
    const totalLostReports = reports.filter(r => r.type === 'lost').length;
    const totalFoundReports = reports.filter(r => r.type === 'found').length;
    const totalSpent = payments.reduce((total, payment) => 
      payment.status === 'successful' ? total + payment.amount : total, 0);
    
    const sortedItems = [...items].sort((a, b) => 
      new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());
    const recentlyAddedItems = sortedItems.slice(0, 5);
    
    const pendingPayments = payments.filter(p => p.status === 'pending').length;
    const unreadNotifications = notifications.filter(n => !n.isRead).length;

    return {
      totalItems,
      totalLostReports,
      totalFoundReports,
      totalSpent,
      recentlyAddedItems,
      pendingPayments,
      unreadNotifications
    };
  }, [items, reports, notifications, payments]);

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
        lost: reports ? reports.filter(r => r.type === 'lost').length : 0,
        found: reports ? reports.filter(r => r.type === 'found').length : 0,
        resolved: reports ? reports.filter(r => r.status === 'Resolved').length : 0,
        pending: reports ? reports.filter(r => r.status === 'Open').length : 0
      },
      userRoleDistribution: [
        { role: 'Admin', count: allUsers.filter(u => u.role === 'Admin').length },
        { role: 'Agent', count: allUsers.filter(u => u.role === 'Agent').length },
        { role: 'Subscriber', count: allUsers.filter(u => u.role === 'Subscriber').length }
      ],
      recentTransactions: revenueSummary.recentTransactions || [],
      paymentsByType: revenueSummary.paymentsByType || [],
      paymentsByStatus: revenueSummary.paymentsByStatus || [],
      monthlyRevenue: revenueSummary.monthlyRevenue || []
    };
  }, [isAdmin, allUsers, revenueSummary, userStats, reports]);

  // Calculate loading state
  const isLoading = itemsLoading || reportsLoading || notificationsLoading || paymentsLoading || 
    (isAdmin && (allUsersLoading || revenueSummaryLoading)) ||
    ((isAdmin || isAgent) && allReportsLoading);

  return {
    user,
    isAdmin,
    isAgent,
    userStats,
    adminStats,
    isLoading,
    items,
    reports,
    allReports: isAdmin || isAgent ? allReports : reports,
    notifications,
    payments,
    allUsers: isAdmin ? allUsers : null
  };
}