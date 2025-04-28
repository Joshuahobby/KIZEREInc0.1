import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format, formatDistanceToNow } from "date-fns";
import { AlertTriangle, CheckCircle, XCircle, ShieldAlert } from "lucide-react";

interface StatusChange {
  id: number;
  userId: number;
  previousStatus: string;
  newStatus: string;
  reason?: string;
  changedBy: number;
  expirationDate?: string;
  notes?: string;
  timestamp: string;
}

interface UserStatusHistoryProps {
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

// Helper to get status badge variant
const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status.toLowerCase()) {
    case 'active':
      return "default";
    case 'inactive':
      return "secondary";
    case 'suspended':
    case 'banned':
      return "destructive";
    default:
      return "outline";
  }
};

export function UserStatusHistory({ userId }: UserStatusHistoryProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/admin/users/${userId}/status-history`],
    queryFn: async () => {
      const response = await fetch(`/api/admin/users/${userId}/status-history`);
      if (!response.ok) {
        throw new Error('Failed to fetch user status history');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Status History</h3>
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full" />
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
        <p className="mt-2 text-sm text-destructive">Failed to load status history</p>
      </div>
    );
  }

  const statusChanges: StatusChange[] = data || [];

  if (statusChanges.length === 0) {
    return (
      <div className="text-center py-4">
        <CheckCircle className="mx-auto h-6 w-6 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">No status changes recorded</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Status History</h3>
      
      <div className="space-y-4">
        {statusChanges.map((change) => {
          const timeInfo = formatTimestamp(change.timestamp);
          
          return (
            <div key={change.id} className="border rounded-md p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Changed from</span>
                  <Badge variant={getStatusBadgeVariant(change.previousStatus)}>
                    {change.previousStatus}
                  </Badge>
                  <span className="text-sm font-medium">to</span>
                  <Badge variant={getStatusBadgeVariant(change.newStatus)}>
                    {change.newStatus}
                  </Badge>
                </div>
                
                <time className="text-xs text-muted-foreground" title={timeInfo.full}>
                  {timeInfo.relative}
                </time>
              </div>
              
              {change.reason && (
                <div className="text-sm bg-muted/50 p-2 rounded-md">
                  <p><span className="font-medium">Reason:</span> {change.reason}</p>
                </div>
              )}
              
              {change.expirationDate && (
                <div className="text-xs flex items-center gap-1 text-muted-foreground">
                  <ShieldAlert className="h-3 w-3" />
                  <span>
                    Expires: {format(new Date(change.expirationDate), 'PP')}
                  </span>
                </div>
              )}
              
              {change.notes && (
                <div className="text-xs italic text-muted-foreground">
                  {change.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}