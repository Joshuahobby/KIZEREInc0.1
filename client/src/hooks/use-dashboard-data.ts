import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Item, Notification, UserRole } from "@shared/schema";
import { catchErrorHandler } from "@/utils/error-handler";

/**
 * Dashboard Statistics Data Structure
 */
export interface DashboardStats {
  registeredItems: number;
  lostItems: number;
  foundItems: number;
  notifications: number;
}

/**
 * Dashboard Data Hook Return Structure
 */
export interface DashboardData {
  stats: DashboardStats | undefined;
  isLoadingStats: boolean;
  items: Item[] | undefined;
  isLoadingItems: boolean;
  notifications: Notification[] | undefined;
  isLoadingNotifications: boolean;
  previousStats: DashboardStats | null;
  statsPeriod: string;
  setStatsPeriod: (period: string) => void;
}

/**
 * Hook for fetching and managing dashboard data
 * 
 * Provides a unified interface for accessing dashboard data
 * with role-specific endpoints and caching
 */
export function useDashboardData(userRole: UserRole): DashboardData {
  // State for managing time period of stats (today, week, month, year)
  const [statsPeriod, setStatsPeriod] = useState<string>("week");
  
  // Fetch dashboard statistics based on role and time period
  const { 
    data: stats, 
    isLoading: isLoadingStats 
  } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats", userRole, statsPeriod],
    retry: 1,
    enabled: !!userRole,
  });
  
  // Fetch previous period statistics for comparison
  const { 
    data: previousStats
  } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats/previous", userRole, statsPeriod],
    retry: 1,
    enabled: !!userRole && !!stats,
  });
  
  // Fetch user's items
  const {
    data: items,
    isLoading: isLoadingItems,
  } = useQuery<Item[]>({
    queryKey: ["/api/dashboard/items", userRole],
    retry: 1,
    enabled: !!userRole,
  });
  
  // Fetch user's notifications
  const {
    data: notifications,
    isLoading: isLoadingNotifications,
  } = useQuery<Notification[]>({
    queryKey: ["/api/dashboard/notifications", userRole],
    retry: 1,
    enabled: !!userRole,
  });
  
  return {
    stats,
    isLoadingStats,
    items,
    isLoadingItems,
    notifications,
    isLoadingNotifications,
    previousStats: previousStats || null,
    statsPeriod,
    setStatsPeriod
  };
}