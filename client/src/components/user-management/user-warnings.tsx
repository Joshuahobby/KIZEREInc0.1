import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format, formatDistanceToNow } from "date-fns";
import { AlertTriangle, ShieldAlert, Clock } from "lucide-react";

interface UserWarning {
  id: number;
  userId: number;
  warningType: string;
  severity: string;
  message: string;
  issuedBy: number;
  acknowledgedAt?: string;
  issuedAt: string;
  expiresAt?: string;
}

interface UserWarningsProps {
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

// Helper to get severity badge variant
const getSeverityBadgeVariant = (severity: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (severity.toLowerCase()) {
    case 'low':
      return "secondary";
    case 'medium':
      return "default";
    case 'high':
      return "destructive";
    default:
      return "outline";
  }
};

export function UserWarnings({ userId }: UserWarningsProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/admin/users/${userId}/warnings`],
    queryFn: async () => {
      const response = await fetch(`/api/admin/users/${userId}/warnings`);
      if (!response.ok) {
        throw new Error('Failed to fetch user warnings');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">User Warnings</h3>
        {[1, 2].map(i => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-16 w-full rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/15 p-4 text-center">
        <AlertTriangle className="mx-auto h-6 w-6 text-destructive" />
        <p className="mt-2 text-sm text-destructive">Failed to load warnings</p>
      </div>
    );
  }

  const warnings: UserWarning[] = data || [];

  if (warnings.length === 0) {
    return (
      <div className="text-center py-4">
        <ShieldAlert className="mx-auto h-6 w-6 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">No warnings issued</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">User Warnings</h3>
        <Badge variant="destructive">{warnings.length}</Badge>
      </div>
      
      <div className="space-y-4">
        {warnings.map((warning) => {
          const issuedTimeInfo = formatTimestamp(warning.issuedAt);
          const isExpired = warning.expiresAt && new Date(warning.expiresAt) < new Date();
          const isAcknowledged = !!warning.acknowledgedAt;
          
          return (
            <div key={warning.id} className="border border-destructive/20 rounded-md p-3 space-y-2 bg-destructive/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="font-medium">
                    {warning.warningType.replace(/_/g, ' ')}
                  </span>
                  <Badge variant={getSeverityBadgeVariant(warning.severity)}>
                    {warning.severity}
                  </Badge>
                </div>
                
                <time className="text-xs text-muted-foreground" title={issuedTimeInfo.full}>
                  {issuedTimeInfo.relative}
                </time>
              </div>
              
              <div className="text-sm p-2 rounded-md">
                <p>{warning.message}</p>
              </div>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  {isExpired && (
                    <span className="text-green-600 font-medium">Expired</span>
                  )}
                  {!isExpired && warning.expiresAt && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Expires: {format(new Date(warning.expiresAt), 'PP')}
                    </span>
                  )}
                </div>
                
                {isAcknowledged && (
                  <span className="text-green-600">
                    Acknowledged {formatDistanceToNow(new Date(warning.acknowledgedAt!), { addSuffix: true })}
                  </span>
                )}
                
                {!isAcknowledged && (
                  <span className="text-amber-600">
                    Not acknowledged
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}