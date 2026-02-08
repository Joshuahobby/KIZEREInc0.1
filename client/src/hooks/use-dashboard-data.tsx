import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "./use-auth";
import { Item, Report, Notification, Payment, UserRole, User, Claim } from "@shared/schema";
import { useMemo } from "react";
import { createLogger } from "@/lib/logger";

const logger = createLogger('useDashboardData');

export interface DashboardStats {
  totalItems: number;
  totalLostReports: number;
  totalFoundReports: number;
  totalSpent: number;
  recentlyAddedItems: Item[];
  pendingPayments: number;
  unreadNotifications: number;
  allOpenReports?: number;
  allUsersCount?: number;
  totalUsers?: number;
  pendingVerifications?: number;
  totalRevenue?: number;
  systemHealth?: string;
}

export interface DashboardData {
  user: User | null;
  isAdmin: boolean;
  isAgent: boolean;
  isModerator: boolean;
  isBusiness: boolean;
  userStats: DashboardStats;
  adminStats: any;
  isLoading: boolean;
  items: Item[];
  reports: Report[];
  allReports: Report[];
  notifications: Notification[];
  payments: Payment[];
  myClaims: Claim[];
  claimsReceived: Claim[];
  allUsers: User[];
}

export interface UseDashboardDataOptions {
  refreshInterval?: number;
}

export function useDashboardData(options: UseDashboardDataOptions = {}): DashboardData {
  const { refreshInterval = 60000 } = options;
  const { user } = useAuth();

  const isAdmin = user?.role === 'Admin';
  const isAgent = user?.role === 'Agent';
  const isModerator = user?.role === 'Moderator';
  const isBusiness = user?.role === 'Business';

  // Basic data queries for all users
  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['/api/items'],
    queryFn: async () => await apiRequest('/api/items'),
    enabled: !!user,
    refetchInterval: refreshInterval
  });

  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ['/api/reports'],
    queryFn: async () => await apiRequest('/api/reports'),
    enabled: !!user,
    refetchInterval: refreshInterval
  });

  const { data: notifications = [], isLoading: notificationsLoading } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: async () => await apiRequest('/api/notifications'),
    enabled: !!user,
    refetchInterval: refreshInterval
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['/api/payments'],
    queryFn: async () => await apiRequest('/api/payments'),
    enabled: !!user,
    refetchInterval: refreshInterval
  });

  const { data: myClaims = [], isLoading: myClaimsLoading } = useQuery({
    queryKey: ['/api/claims'],
    queryFn: async () => await apiRequest('/api/claims'),
    enabled: !!user,
    refetchInterval: refreshInterval
  });

  const { data: claimsReceived = [], isLoading: claimsReceivedLoading } = useQuery({
    queryKey: ['/api/claims/received'],
    queryFn: async () => await apiRequest('/api/claims/received'),
    enabled: !!user,
    refetchInterval: refreshInterval
  });

  // Admin and Agent specific queries
  const { data: allUsers = [], isLoading: allUsersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => await apiRequest('/api/admin/users'),
    enabled: isAdmin,
    refetchInterval: refreshInterval
  });

  const { data: revenueSummary = null, isLoading: revenueSummaryLoading } = useQuery({
    queryKey: ['/api/admin/revenue-summary'],
    queryFn: async () => await apiRequest('/api/admin/revenue-summary'),
    enabled: isAdmin,
    refetchInterval: refreshInterval
  });

  const { data: allReports = [], isLoading: allReportsLoading } = useQuery({
    queryKey: ['/api/admin/reports'],
    queryFn: async () => await apiRequest('/api/admin/reports'),
    enabled: isAdmin || isAgent || isModerator,
    refetchInterval: refreshInterval
  });

  const { data: dashboardStats = null, isLoading: dashboardStatsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: async () => await apiRequest('/api/dashboard/stats'),
    enabled: !!user,
    refetchInterval: refreshInterval
  });

  const combinedIsLoading = itemsLoading || reportsLoading || notificationsLoading || paymentsLoading ||
    dashboardStatsLoading || myClaimsLoading || claimsReceivedLoading ||
    (isAdmin && (allUsersLoading || revenueSummaryLoading)) ||
    ((isAdmin || isAgent || isModerator) && allReportsLoading);

  return useMemo(() => {
    // Basic user stats
    const userStats: DashboardStats = {
      totalItems: items.length || 0,
      totalLostReports: reports.filter(r => r.type === 'lost').length || 0,
      totalFoundReports: reports.filter(r => r.type === 'found').length || 0,
      totalSpent: payments.reduce((acc, p) => p.status === 'completed' ? acc + Number(p.amount) : acc, 0) || 0,
      recentlyAddedItems: [...items].sort((a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, 5),
      pendingPayments: payments.filter(p => p.status === 'pending').length || 0,
      unreadNotifications: notifications.filter(n => !n.read).length || 0
    };

    // If we have dashboard stats from the server, use those to augment
    if (dashboardStats) {
      Object.assign(userStats, dashboardStats);
    }

    return {
      user,
      isAdmin,
      isAgent: isAgent || isModerator,
      isModerator,
      isBusiness,
      userStats,
      adminStats: revenueSummary,
      isLoading: combinedIsLoading,
      items,
      reports,
      allReports,
      notifications,
      payments,
      myClaims,
      claimsReceived,
      allUsers
    };
  }, [
    user, isAdmin, isAgent, isModerator, isBusiness, items, reports,
    allReports, notifications, payments, myClaims, claimsReceived,
    allUsers, revenueSummary, dashboardStats, combinedIsLoading
  ]);
}