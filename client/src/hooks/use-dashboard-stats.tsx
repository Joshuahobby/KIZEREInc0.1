import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface DashboardStats {
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
    onError: (err: Error) => {
      toast({
        title: "Failed to load dashboard statistics",
        description: err.message || "Please try again or contact support if the problem persists.",
        variant: "destructive",
      });
    },
  });

  // Compute percentages for charts
  const chartData = {
    userRoleData: data ? [
      { name: "Subscribers", value: Math.round((data.userStats.subscriberCount / data.totalUsers) * 100) || 0 },
      { name: "Agents", value: Math.round((data.userStats.agentCount / data.totalUsers) * 100) || 0 },
      { name: "Admins", value: Math.round((data.userStats.adminCount / data.totalUsers) * 100) || 0 },
    ] : [],
    
    itemStatusData: data ? [
      { name: "Registered", value: Math.round((data.itemStats.registeredItems / data.totalItems) * 100) || 0 },
      { name: "Lost", value: Math.round((data.itemStats.lostItems / data.totalItems) * 100) || 0 },
      { name: "Found", value: Math.round((data.itemStats.foundItems / data.totalItems) * 100) || 0 },
    ] : [],
    
    paymentStatusData: data ? [
      { name: "Successful", value: Math.round((data.paymentStats.successfulPayments / data.totalPayments) * 100) || 0 },
      { name: "Pending", value: Math.round((data.paymentStats.pendingPayments / data.totalPayments) * 100) || 0 },
      { name: "Failed", value: Math.round((data.paymentStats.failedPayments / data.totalPayments) * 100) || 0 },
    ] : [],
  };
  
  return {
    stats: data,
    chartData,
    isLoading,
    isError,
    error,
    refetch,
  };
}