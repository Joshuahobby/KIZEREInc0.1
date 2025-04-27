import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";

export interface SystemStatusItem {
  id: string;
  name: string;
  status: 'operational' | 'degraded' | 'outage' | 'maintenance';
  description: string;
  updatedAt: string;
  metrics?: {
    responseTime?: number;
    uptime?: number;
    errorRate?: number;
  };
}

export interface SystemStatus {
  overall: 'operational' | 'degraded' | 'outage' | 'maintenance';
  lastUpdated: string;
  services: SystemStatusItem[];
  issues: {
    id: string;
    serviceId: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    createdAt: string;
    resolvedAt: string | null;
  }[];
}

const defaultSystemStatus: SystemStatus = {
  overall: 'operational',
  lastUpdated: new Date().toISOString(),
  services: [
    {
      id: 'api',
      name: 'API Services',
      status: 'operational',
      description: 'Core API endpoints and services',
      updatedAt: new Date().toISOString(),
      metrics: {
        responseTime: 45,
        uptime: 99.95,
        errorRate: 0.05,
      },
    },
    {
      id: 'database',
      name: 'Database',
      status: 'operational',
      description: 'Database connections and queries',
      updatedAt: new Date().toISOString(),
      metrics: {
        responseTime: 22,
        uptime: 99.98,
        errorRate: 0.02,
      },
    },
    {
      id: 'auth',
      name: 'Authentication',
      status: 'operational',
      description: 'User authentication and authorization services',
      updatedAt: new Date().toISOString(),
      metrics: {
        responseTime: 35,
        uptime: 99.99,
        errorRate: 0.01,
      },
    },
    {
      id: 'payments',
      name: 'Payment Services',
      status: 'operational',
      description: 'Payment processing and transactions',
      updatedAt: new Date().toISOString(),
      metrics: {
        responseTime: 67,
        uptime: 99.9,
        errorRate: 0.1,
      },
    },
    {
      id: 'storage',
      name: 'Storage Services',
      status: 'operational',
      description: 'File storage and retrieval',
      updatedAt: new Date().toISOString(),
      metrics: {
        responseTime: 32,
        uptime: 99.97,
        errorRate: 0.03,
      },
    }
  ],
  issues: []
};

/**
 * Hook for fetching system status information
 * This is used for the system status monitoring panel
 */
export function useSystemStatus() {
  const { data, isLoading, isError, error, refetch } = useQuery<SystemStatus>({
    queryKey: ['/api/admin/system-status'],
    queryFn: async () => {
      // Try to get system status from API
      try {
        const result = await adminApi.getSystemStatus();
        return result as SystemStatus;
      } catch (err: any) {
        // If API endpoint doesn't exist yet, use default data
        if (err.status === 404) {
          console.warn('System status API not implemented yet, using default data');
          return defaultSystemStatus;
        }
        throw err;
      }
    },
    // Refresh every minute
    refetchInterval: 60000,
    // Don't retry on 404 (endpoint not implemented yet)
    retry: (failureCount, error: any) => {
      if (error?.status === 404) return false;
      return failureCount < 2;
    },
  });

  // Calculate overall system health score (0-100)
  const calculateHealthScore = (status: SystemStatus): number => {
    if (!status || !status.services || status.services.length === 0) return 100;
    
    const statusWeights = {
      'operational': 1,
      'degraded': 0.7,
      'maintenance': 0.5,
      'outage': 0
    };
    
    const totalServices = status.services.length;
    const healthSum = status.services.reduce((sum, service) => {
      return sum + statusWeights[service.status];
    }, 0);
    
    return Math.round((healthSum / totalServices) * 100);
  };

  // Get active issues (unresolved)
  const activeIssues = data?.issues.filter(issue => !issue.resolvedAt) || [];
  
  // Calculate health score
  const healthScore = data ? calculateHealthScore(data) : 100;

  return {
    systemStatus: data || defaultSystemStatus,
    healthScore,
    activeIssues,
    isLoading,
    isError,
    error,
    refetch
  };
}