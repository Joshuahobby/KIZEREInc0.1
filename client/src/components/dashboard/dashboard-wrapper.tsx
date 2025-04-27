import React, { useEffect } from "react";
import { DashboardProvider, useDashboard } from "@/context/dashboard-context";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { useSystemStatus } from "@/hooks/use-system-status";
import { useActivityFeed } from "@/hooks/use-activity-feed";
import { Toaster } from "@/components/ui/toaster";

/**
 * Inner component that consumes the dashboard context
 */
function DashboardContent({ children }: { children: React.ReactNode }) {
  const {
    state,
    updateDataCache,
    setLoadingState,
    setErrorState,
  } = useDashboard();

  // Fetch dashboard stats
  const {
    stats,
    isLoading: statsLoading,
    isError: statsError,
    error: statsErrorDetails,
    refetch: refetchStats,
  } = useDashboardStats();

  // Fetch system status
  const {
    systemStatus,
    isLoading: systemLoading,
    isError: systemError,
    error: systemErrorDetails,
    refetch: refetchSystem,
  } = useSystemStatus();

  // Fetch activity feed
  const {
    events: activityEvents,
    isLoading: activityLoading,
    isError: activityError,
    error: activityErrorDetails,
    refetch: refetchActivity,
  } = useActivityFeed();

  // Update loading states in the context
  useEffect(() => {
    setLoadingState('stats', statsLoading);
    setLoadingState('system', systemLoading);
    setLoadingState('activity', activityLoading);
  }, [statsLoading, systemLoading, activityLoading, setLoadingState]);

  // Update error states in the context
  useEffect(() => {
    setErrorState('stats', statsError ? new Error(statsErrorDetails?.message || 'Failed to load dashboard stats') : null);
    setErrorState('system', systemError ? new Error(systemErrorDetails?.message || 'Failed to load system status') : null);
    setErrorState('activity', activityError ? new Error(activityErrorDetails?.message || 'Failed to load activity feed') : null);
  }, [statsError, systemError, activityError, statsErrorDetails, systemErrorDetails, activityErrorDetails, setErrorState]);

  // Update data cache when new data is fetched
  useEffect(() => {
    if (stats) {
      updateDataCache('stats', stats);
    }
    if (systemStatus) {
      updateDataCache('systemStatus', systemStatus);
    }
    if (activityEvents) {
      updateDataCache('activityFeed', activityEvents);
    }
  }, [stats, systemStatus, activityEvents, updateDataCache]);

  // Trigger data refresh based on dashboard configuration
  useEffect(() => {
    const interval = setInterval(() => {
      if (!state.loadingStates.stats) {
        refetchStats();
      }
      if (!state.loadingStates.system) {
        refetchSystem();
      }
      if (!state.loadingStates.activity) {
        refetchActivity();
      }
    }, state.dashboardConfig.dataRefreshInterval * 1000);

    return () => clearInterval(interval);
  }, [
    state.dashboardConfig.dataRefreshInterval,
    state.loadingStates.stats,
    state.loadingStates.system,
    state.loadingStates.activity,
    refetchStats,
    refetchSystem,
    refetchActivity
  ]);

  return (
    <div className="dashboard-content">
      {/* Render custom notifications from the dashboard context */}
      {state.ui.notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2">
          {state.ui.notifications.map((notification) => (
            <div
              key={notification.id}
              className={`rounded-md p-4 shadow-md ${
                notification.type === 'error'
                  ? 'bg-destructive text-destructive-foreground'
                  : notification.type === 'warning'
                  ? 'bg-warning text-warning-foreground'
                  : notification.type === 'success'
                  ? 'bg-success text-success-foreground'
                  : 'bg-primary text-primary-foreground'
              }`}
            >
              {notification.message}
            </div>
          ))}
        </div>
      )}

      {/* Render the dashboard content */}
      {children}
      
      {/* Render the toast notifications */}
      <Toaster />
    </div>
  );
}

/**
 * Dashboard wrapper component that provides the dashboard context
 */
export function DashboardWrapper({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <DashboardContent>{children}</DashboardContent>
    </DashboardProvider>
  );
}