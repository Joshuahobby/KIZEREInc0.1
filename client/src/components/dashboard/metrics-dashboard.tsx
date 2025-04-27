import React from 'react';
import { useNavigate } from 'wouter';
import { MetricsCard } from './metrics-card';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';
import { useDashboard } from '@/context/dashboard-context';
import { Users, Package, AlertTriangle, DollarSign } from 'lucide-react';

/**
 * Component that renders all the key metrics cards
 * Connected to the dashboard API service and displays live data
 */
export function MetricsDashboard() {
  const navigate = useNavigate();
  const { stats, isLoading } = useDashboardStats();
  const { state } = useDashboard();

  // Only show cards that are marked as favorites in dashboard config
  const { favoriteCards } = state.dashboardConfig;
  
  // Function to calculate the trend
  const calculateTrend = (current: number, previous: number): 'up' | 'down' | 'neutral' => {
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'neutral';
  };
  
  // Function to calculate the trend percentage
  const calculateTrendPercentage = (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Users Card */}
      {favoriteCards.includes('users') && (
        <MetricsCard
          title="Total Users"
          icon={<Users className="h-4 w-4" />}
          value={stats.totalUsers}
          description="Registered platform users"
          loading={isLoading}
          trend={{
            value: stats.totalUsers,
            trend: calculateTrend(stats.totalUsers, stats.totalUsers - 5), // Example: assuming 5 new users in period
            percentage: 8, // Example: 8% growth rate
            label: 'from last period'
          }}
          actions={{
            primary: {
              label: 'View all users',
              onClick: () => navigate('/admin/users')
            },
            secondary: [
              {
                label: 'Add new user',
                onClick: () => navigate('/admin/users/new')
              },
              {
                label: 'Export user data',
                onClick: () => alert('Exporting user data...')
              }
            ]
          }}
        />
      )}
      
      {/* Total Items Card */}
      {favoriteCards.includes('items') && (
        <MetricsCard
          title="Total Items"
          icon={<Package className="h-4 w-4" />}
          value={stats.totalItems}
          description="Registered valuable items"
          loading={isLoading}
          trend={{
            value: stats.totalItems,
            trend: calculateTrend(stats.totalItems, stats.totalItems - 12), // Example: assuming 12 new items in period
            percentage: 15, // Example: 15% growth rate
            label: 'from last period'
          }}
          secondaryValue={{
            label: 'Active items',
            value: `${stats.itemStats.registeredItems - stats.itemStats.lostItems}`
          }}
          actions={{
            primary: {
              label: 'View all items',
              onClick: () => navigate('/admin/items')
            }
          }}
        />
      )}
      
      {/* Pending Reports Card */}
      {favoriteCards.includes('reports') && (
        <MetricsCard
          title="Pending Reports"
          icon={<AlertTriangle className="h-4 w-4" />}
          value={stats.pendingReports}
          description="Unresolved item reports"
          loading={isLoading}
          trend={{
            value: stats.pendingReports,
            trend: calculateTrend(stats.pendingReports, stats.pendingReports + 3), // Example: assuming decrease in pending reports
            percentage: 12, // Example: 12% decrease rate (good)
            label: 'from last period'
          }}
          secondaryValue={{
            label: 'Resolution rate',
            value: `${Math.round((stats.reportStats.resolvedReportsCount / Math.max(stats.reportStats.resolvedReportsCount + stats.pendingReports, 1)) * 100)}%`
          }}
          actions={{
            primary: {
              label: 'View all reports',
              onClick: () => navigate('/admin/reports')
            }
          }}
        />
      )}
      
      {/* Total Revenue Card */}
      {favoriteCards.includes('revenue') && (
        <MetricsCard
          title="Total Revenue"
          icon={<DollarSign className="h-4 w-4" />}
          value={stats.totalPayments.toLocaleString()}
          valuePrefix="$"
          description="Platform revenue from payments"
          loading={isLoading}
          trend={{
            value: stats.totalPayments,
            trend: calculateTrend(stats.totalPayments, stats.totalPayments - 1800), // Example: assuming $1800 increase in revenue
            percentage: 23, // Example: 23% growth rate
            label: 'from last period'
          }}
          secondaryValue={{
            label: 'Success rate',
            value: `${Math.round((stats.paymentStats.successfulPayments / Math.max(stats.totalPayments, 1)) * 100)}%`
          }}
          actions={{
            primary: {
              label: 'View payment details',
              onClick: () => navigate('/admin/payments')
            }
          }}
        />
      )}
    </div>
  );
}