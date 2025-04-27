import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { DashboardStats } from "@/hooks/use-dashboard-stats";
import { SystemStatus } from "@/hooks/use-system-status";
import { ActivityEvent } from "@/hooks/use-activity-feed";

// Define the shape of our dashboard context state
interface DashboardState {
  // Dashboard configuration/preferences
  dashboardConfig: {
    showWelcomeMessage: boolean;
    compactView: boolean;
    dataRefreshInterval: number; // in seconds
    defaultDateRange: 'day' | 'week' | 'month' | 'year';
    favoriteCards: string[];
    visibleSections: string[];
    layout: 'default' | 'compact' | 'expanded';
  };
  
  // UI state
  ui: {
    // Sidebar state
    sidebarCollapsed: boolean;
    activeSidebarItem: string;
    
    // Active filters and sorting
    activeFilters: Record<string, any>;
    sorting: {
      field: string;
      direction: 'asc' | 'desc';
    };
    
    // Modal states
    activeModal: string | null;
    
    // Toast notifications
    notifications: {
      id: string;
      type: 'info' | 'success' | 'warning' | 'error';
      message: string;
      duration?: number;
    }[];
  };
  
  // Loading states for different sections
  loadingStates: {
    stats: boolean;
    system: boolean;
    activity: boolean;
    charts: boolean;
  };
  
  // Error states for different sections
  errorStates: {
    stats: Error | null;
    system: Error | null;
    activity: Error | null;
    charts: Error | null;
  };
  
  // Quick action states
  quickActions: {
    recentActions: string[];
    favoriteActions: string[];
  };
  
  // Cache for dashboard data
  dataCache: {
    stats: DashboardStats | null;
    systemStatus: SystemStatus | null;
    activityFeed: ActivityEvent[] | null;
    lastUpdated: Record<string, Date>;
  };
}

// Set up default state
const defaultDashboardState: DashboardState = {
  dashboardConfig: {
    showWelcomeMessage: true,
    compactView: false,
    dataRefreshInterval: 60,
    defaultDateRange: 'week',
    favoriteCards: ['users', 'items', 'reports', 'revenue'],
    visibleSections: ['metrics', 'charts', 'activity', 'system'],
    layout: 'default',
  },
  ui: {
    sidebarCollapsed: false,
    activeSidebarItem: 'dashboard',
    activeFilters: {},
    sorting: {
      field: 'createdAt',
      direction: 'desc',
    },
    activeModal: null,
    notifications: [],
  },
  loadingStates: {
    stats: false,
    system: false,
    activity: false,
    charts: false,
  },
  errorStates: {
    stats: null,
    system: null,
    activity: null,
    charts: null,
  },
  quickActions: {
    recentActions: [],
    favoriteActions: ['add-user', 'add-item', 'generate-report'],
  },
  dataCache: {
    stats: null,
    systemStatus: null,
    activityFeed: null,
    lastUpdated: {},
  },
};

// Create the context and hooks
type DashboardContextType = {
  state: DashboardState;
  updateDashboardConfig: (config: Partial<DashboardState['dashboardConfig']>) => void;
  updateUiState: (ui: Partial<DashboardState['ui']>) => void;
  setLoadingState: (section: keyof DashboardState['loadingStates'], isLoading: boolean) => void;
  setErrorState: (section: keyof DashboardState['errorStates'], error: Error | null) => void;
  updateDataCache: <K extends keyof DashboardState['dataCache']>(
    key: K, 
    data: DashboardState['dataCache'][K]
  ) => void;
  addNotification: (notification: Omit<DashboardState['ui']['notifications'][0], 'id'>) => void;
  removeNotification: (id: string) => void;
  toggleSidebar: () => void;
  setSidebarItem: (item: string) => void;
  resetDashboard: () => void;
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

// Create a provider component
export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DashboardState>(() => {
    // Try to load saved state from localStorage
    const savedState = localStorage.getItem('kizere_dashboard_state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        // Merge with default state to ensure all properties exist
        return {
          ...defaultDashboardState,
          dashboardConfig: {
            ...defaultDashboardState.dashboardConfig,
            ...(parsed.dashboardConfig || {}),
          },
          ui: {
            ...defaultDashboardState.ui,
            ...(parsed.ui || {}),
            // Don't restore notifications
            notifications: [],
          },
          quickActions: {
            ...defaultDashboardState.quickActions,
            ...(parsed.quickActions || {}),
          },
        };
      } catch (e) {
        console.error('Failed to parse saved dashboard state:', e);
        return defaultDashboardState;
      }
    }
    return defaultDashboardState;
  });

  // Save state to localStorage when it changes
  useEffect(() => {
    const stateToSave = {
      dashboardConfig: state.dashboardConfig,
      ui: {
        ...state.ui,
        // Don't persist notifications or modal state
        notifications: [],
        activeModal: null,
      },
      quickActions: state.quickActions,
    };
    localStorage.setItem('kizere_dashboard_state', JSON.stringify(stateToSave));
  }, [state.dashboardConfig, state.ui.sidebarCollapsed, state.ui.activeSidebarItem, state.quickActions]);

  // Update dashboard configuration
  const updateDashboardConfig = useCallback((config: Partial<DashboardState['dashboardConfig']>) => {
    setState(prev => ({
      ...prev,
      dashboardConfig: {
        ...prev.dashboardConfig,
        ...config,
      },
    }));
  }, []);

  // Update UI state
  const updateUiState = useCallback((ui: Partial<DashboardState['ui']>) => {
    setState(prev => ({
      ...prev,
      ui: {
        ...prev.ui,
        ...ui,
      },
    }));
  }, []);

  // Set loading state for a section
  const setLoadingState = useCallback((section: keyof DashboardState['loadingStates'], isLoading: boolean) => {
    setState(prev => ({
      ...prev,
      loadingStates: {
        ...prev.loadingStates,
        [section]: isLoading,
      },
    }));
  }, []);

  // Set error state for a section
  const setErrorState = useCallback((section: keyof DashboardState['errorStates'], error: Error | null) => {
    setState(prev => ({
      ...prev,
      errorStates: {
        ...prev.errorStates,
        [section]: error,
      },
    }));
  }, []);

  // Update data cache
  const updateDataCache = useCallback(<K extends keyof DashboardState['dataCache']>(
    key: K, 
    data: DashboardState['dataCache'][K]
  ) => {
    setState(prev => ({
      ...prev,
      dataCache: {
        ...prev.dataCache,
        [key]: data,
        lastUpdated: {
          ...prev.dataCache.lastUpdated,
          [key]: new Date(),
        },
      },
    }));
  }, []);

  // Add a notification
  const addNotification = useCallback((notification: Omit<DashboardState['ui']['notifications'][0], 'id'>) => {
    const id = Math.random().toString(36).substring(2, 11);
    setState(prev => ({
      ...prev,
      ui: {
        ...prev.ui,
        notifications: [
          ...prev.ui.notifications,
          { ...notification, id },
        ],
      },
    }));
    
    // Auto-remove after duration (default 5s)
    const duration = notification.duration || 5000;
    setTimeout(() => {
      removeNotification(id);
    }, duration);
    
    return id;
  }, []);

  // Remove a notification
  const removeNotification = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      ui: {
        ...prev.ui,
        notifications: prev.ui.notifications.filter(n => n.id !== id),
      },
    }));
  }, []);

  // Toggle sidebar collapsed state
  const toggleSidebar = useCallback(() => {
    setState(prev => ({
      ...prev,
      ui: {
        ...prev.ui,
        sidebarCollapsed: !prev.ui.sidebarCollapsed,
      },
    }));
  }, []);

  // Set active sidebar item
  const setSidebarItem = useCallback((item: string) => {
    setState(prev => ({
      ...prev,
      ui: {
        ...prev.ui,
        activeSidebarItem: item,
      },
    }));
  }, []);

  // Reset dashboard to defaults
  const resetDashboard = useCallback(() => {
    setState(defaultDashboardState);
  }, []);

  // Context value
  const value = {
    state,
    updateDashboardConfig,
    updateUiState,
    setLoadingState,
    setErrorState,
    updateDataCache,
    addNotification,
    removeNotification,
    toggleSidebar,
    setSidebarItem,
    resetDashboard,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

// Hook for using the dashboard context
export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}