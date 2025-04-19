import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Item, Notification, UserRole } from "@shared/schema";

export interface DashboardStats {
  registeredItems: number;
  lostItems: number;
  foundItems: number;
  notifications: number;
}

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

export function useDashboardData(userRole: UserRole): DashboardData {
  const [statsPeriod, setStatsPeriod] = useState<string>('week');
  
  // Fetch stats
  const { data: stats, isLoading: isLoadingStats } = useQuery<DashboardStats>({
    queryKey: ["/api/stats", statsPeriod],
    // In a real implementation, we would pass the period to the API
    // queryFn: () => fetch(`/api/stats?period=${statsPeriod}`).then(res => res.json())
  });
  
  // Fetch user items
  const { data: items, isLoading: isLoadingItems } = useQuery<Item[]>({
    queryKey: ["/api/items"],
  });
  
  // Fetch notifications
  const { data: notifications, isLoading: isLoadingNotifications } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });
  
  // Calculate previous stats for trend indicators
  const previousStats = useMemo(() => {
    if (!stats) return null;
    
    // For demonstration purposes, we're using a simple calculation
    // In a real app, this would come from actual historical data
    return {
      registeredItems: Math.max(0, stats.registeredItems - 2),
      lostItems: Math.max(0, stats.lostItems - 1),
      foundItems: Math.max(0, stats.foundItems - 1),
      notifications: Math.max(0, stats.notifications - 3)
    };
  }, [stats]);
  
  return {
    stats,
    isLoadingStats,
    items,
    isLoadingItems,
    notifications,
    isLoadingNotifications,
    previousStats,
    statsPeriod,
    setStatsPeriod
  };
}