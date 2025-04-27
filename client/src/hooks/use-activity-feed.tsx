import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";

export interface ActivityEvent {
  id: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  category: 'users' | 'items' | 'reports' | 'revenue' | 'system';
  title: string;
  message: string;
  time: string;
  userId?: number;
  itemId?: number;
  reportId?: number;
  paymentId?: number;
  metadata?: Record<string, any>;
}

// Default activity events if API is not available yet
const defaultActivityEvents: ActivityEvent[] = [
  { 
    id: '1', 
    title: 'Low recovery rate detected', 
    time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    message: 'The item recovery rate has dropped below 40% this week.',
    type: 'alert',
    category: 'items'
  },
  { 
    id: '2', 
    title: 'New admin user registered', 
    time: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    message: 'User "Carol Admin" was assigned admin privileges.',
    type: 'info',
    category: 'users'
  },
  { 
    id: '3', 
    title: 'Payment gateway issue resolved', 
    time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    message: 'The reported issue with MTN Mobile Money has been fixed.',
    type: 'success',
    category: 'revenue'
  },
  { 
    id: '4', 
    title: 'Unusual login activity', 
    time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    message: 'Multiple failed login attempts detected for account ID #386.',
    type: 'warning',
    category: 'users'
  }
];

/**
 * Hook for fetching activity feed data
 * This is used for the activity feed component in the dashboard
 */
export function useActivityFeed(options: {
  limit?: number;
  category?: string | null;
  type?: string | null;
} = {}) {
  const { limit = 20, category = null, type = null } = options;
  
  const queryKey = ['/api/admin/activity-log', { limit, category, type }];
  
  const { data, isLoading, isError, error, refetch } = useQuery<ActivityEvent[]>({
    queryKey,
    queryFn: async () => {
      try {
        // Try to get activity data from API
        const result = await adminApi.getActivityLog();
        let events = result as ActivityEvent[];
        
        // Apply filters if provided
        if (category) {
          events = events.filter(event => event.category === category);
        }
        
        if (type) {
          events = events.filter(event => event.type === type);
        }
        
        // Apply limit
        return events.slice(0, limit);
      } catch (err) {
        // If API endpoint doesn't exist yet, use default data
        if (err.status === 404) {
          console.warn('Activity log API not implemented yet, using default data');
          
          // Apply filters to default data
          let events = [...defaultActivityEvents];
          
          if (category) {
            events = events.filter(event => event.category === category);
          }
          
          if (type) {
            events = events.filter(event => event.type === type);
          }
          
          // Apply limit and return
          return events.slice(0, limit);
        }
        throw err;
      }
    },
    // Refresh every 2 minutes
    refetchInterval: 120000,
    // Don't retry on 404 (endpoint not implemented yet)
    retry: (failureCount, error: any) => {
      if (error?.status === 404) return false;
      return failureCount < 2;
    },
  });

  // Format the relative time (e.g., "2 hours ago")
  const formatRelativeTime = (isoTime: string): string => {
    const date = new Date(isoTime);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    // Convert to minutes, hours, and days
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) {
      return diffMinutes <= 1 ? 'just now' : `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else if (diffDays < 30) {
      return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Format the events with relative time
  const formattedEvents = (data || []).map(event => ({
    ...event,
    relativeTime: formatRelativeTime(event.time)
  }));

  return {
    events: formattedEvents,
    rawEvents: data || defaultActivityEvents,
    isLoading,
    isError,
    error,
    refetch
  };
}