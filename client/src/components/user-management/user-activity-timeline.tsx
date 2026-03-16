import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format, formatDistanceToNow } from "date-fns";
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Clock, 
  XCircle, 
  CheckCircle,
  AlertTriangle,
  LogIn,
  Settings,
  FileText,
  Edit,
  ShieldAlert,
  User,
  Trash
} from "lucide-react";

interface UserActivityLogEntry {
  id: number;
  userId: number;
  action: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

interface UserActivityTimelineProps {
  userId: number;
}

// Helper function to format the timestamp
const formatTimestamp = (timestamp: string) => {
  try {
    const date = new Date(timestamp);
    return {
      relative: formatDistanceToNow(date, { addSuffix: true }),
      full: format(date, 'PPpp')
    };
  } catch (e) {
    return { relative: 'Unknown date', full: 'Invalid date' };
  }
};

// Helper to determine icon based on action
const getActionIcon = (action: string) => {
  switch (action.toLowerCase()) {
    case 'login':
      return <LogIn className="h-4 w-4 text-green-500" />;
    case 'logout':
      return <ArrowDownCircle className="h-4 w-4 text-orange-500" />;
    case 'item_registration':
    case 'report_filed':
      return <FileText className="h-4 w-4 text-blue-500" />;
    case 'profile_update':
      return <Edit className="h-4 w-4 text-indigo-500" />;
    case 'status_changed':
      return <Settings className="h-4 w-4 text-yellow-500" />;
    case 'verification_submitted':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'verification_rejected':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'warning_received':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case 'permission_changed':
      return <ShieldAlert className="h-4 w-4 text-purple-500" />;
    case 'account_created':
      return <User className="h-4 w-4 text-green-500" />;
    case 'account_deleted':
      return <Trash className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

// Get badge variant based on action severity
const getActionBadgeVariant = (action: string): "default" | "secondary" | "destructive" | "outline" => {
  const actionLower = action.toLowerCase();
  
  if (actionLower.includes('delete') || 
      actionLower.includes('warning') || 
      actionLower.includes('suspended') ||
      actionLower.includes('rejected')) {
    return "destructive";
  }
  
  if (actionLower.includes('create') || 
      actionLower.includes('login') || 
      actionLower.includes('approved') ||
      actionLower.includes('verified')) {
    return "default";
  }
  
  if (actionLower.includes('update') || 
      actionLower.includes('edit') || 
      actionLower.includes('submitted')) {
    return "secondary";
  }
  
  return "outline";
};

export function UserActivityTimeline({ userId }: UserActivityTimelineProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/admin/users/${userId}/activity`],
    queryFn: () => apiRequest(`/api/admin/users/${userId}/activity?page=1&pageSize=20`),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Activity Timeline</h3>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/15 p-4 text-center">
        <AlertTriangle className="mx-auto h-6 w-6 text-destructive" />
        <p className="mt-2 text-sm text-destructive">Failed to load activity data</p>
        <Button variant="outline" size="sm" className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  const logs = data?.logs || [];

  if (logs.length === 0) {
    return (
      <div className="text-center py-6">
        <Clock className="mx-auto h-6 w-6 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">No activity recorded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Activity Timeline</h3>
      
      <div className="space-y-4">
        {logs.map((log: UserActivityLogEntry) => {
          const timeInfo = formatTimestamp(log.timestamp);
          const details = log.details || {};
          
          return (
            <div key={log.id} className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {getActionIcon(log.action)}
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{log.action.replace(/_/g, ' ')}</span>
                    <Badge variant={getActionBadgeVariant(log.action)}>
                      {log.action.split('_')[0]}
                    </Badge>
                  </div>
                  <time className="text-xs text-muted-foreground" title={timeInfo.full}>
                    {timeInfo.relative}
                  </time>
                </div>
                
                {Object.keys(details).length > 0 && (
                  <div className="text-sm text-muted-foreground rounded-md bg-muted/50 p-2 mt-1">
                    {Object.entries(details).map(([key, value]) => (
                      <div key={key} className="flex items-start">
                        <span className="font-medium mr-2">{key}:</span>
                        <span>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {log.ipAddress && (
                  <div className="text-xs text-muted-foreground">
                    IP: {log.ipAddress} {log.userAgent && `• ${log.userAgent.split(' ')[0]}`}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {data?.total > logs.length && (
        <Button variant="outline" size="sm" className="w-full">
          Load more
        </Button>
      )}
    </div>
  );
}