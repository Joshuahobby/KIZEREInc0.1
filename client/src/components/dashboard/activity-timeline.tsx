import React from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Item, Report } from "@shared/schema";
import {
  ClipboardList,
  Clock,
  Package,
  AlertTriangle,
  CheckCircle2,
  QrCode,
  FileText,
  BarChart,
  DollarSign
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ActivityItem {
  id: number | string;
  type: 'item' | 'report' | 'payment' | 'notification';
  title: string;
  description?: string;
  timestamp: string | Date;
  status?: string;
  category?: string;
  url: string;
}

interface ActivityTimelineProps {
  items?: Item[];
  reports?: Report[];
  isLoading?: boolean;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  items = [],
  reports = [],
  isLoading = false
}) => {
  const [, navigate] = useLocation();

  // Merge and sort items and reports to create a timeline
  const createTimeline = (): ActivityItem[] => {
    const itemActivities: ActivityItem[] = items.map(item => ({
      id: item.id,
      type: 'item',
      title: `Registered: ${item.name}`,
      description: `${item.category} - ${item.uniqueIdentifier || 'No ID'}`,
      timestamp: item.registeredAt,
      status: item.status,
      category: item.category,
      url: `/items/${item.id}`
    }));

    const reportActivities: ActivityItem[] = reports.map(report => ({
      id: report.id,
      type: 'report',
      title: `${report.type === 'lost' ? 'Lost' : 'Found'} Report: ${report.title}`,
      description: report.description,
      timestamp: report.reportedAt,
      status: report.status,
      url: `/reports/${report.id}`
    }));

    // Combine all activities and sort by timestamp (newest first)
    return [...itemActivities, ...reportActivities]
      .sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 10); // Show only the 10 most recent activities
  };

  const activityTimeline = createTimeline();

  // Format the timestamp for display
  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Today - show time
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      // Yesterday
      return 'Yesterday';
    } else if (diffDays < 7) {
      // Within a week - show day name
      return date.toLocaleDateString([], { weekday: 'long' });
    } else {
      // Older - show date
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Get icon based on activity type and status
  const getActivityIcon = (activity: ActivityItem) => {
    if (activity.type === 'item') {
      return <Package className="h-5 w-5 text-blue-500" />;
    } else if (activity.type === 'report') {
      if (activity.title.toLowerCase().includes('lost')) {
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      } else {
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      }
    } else if (activity.type === 'payment') {
      return <DollarSign className="h-5 w-5 text-purple-500" />;
    } else {
      return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  // Get status badge
  const getStatusBadge = (status?: string) => {
    if (!status) return null;

    let className = '';

    switch (status.toLowerCase()) {
      case 'registered':
        className = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
        break;
      case 'active':
      case 'open':
        className = 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
        break;
      case 'resolved':
      case 'found':
        className = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
        break;
      case 'lost':
        className = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
        break;
      default:
        className = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }

    return (
      <Badge variant="outline" className={`${className} text-xs`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <Card className="h-full border border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-display flex items-center">
            <ClipboardList className="h-5 w-5 mr-2 text-[#00BFFF]" />
            Activity Timeline
          </CardTitle>
        </div>
        <CardDescription>Track your recent activity and interactions</CardDescription>
      </CardHeader>

      <CardContent className="py-0">
        <ScrollArea className="max-h-[330px] pr-3">
          {isLoading ? (
            // Loading state
            <div className="space-y-5">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <Skeleton className="h-10 w-10 rounded-full" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : activityTimeline.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center mb-6 animate-pulse">
                <ClipboardList className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <h3 className="text-xl font-bold mb-2 tracking-tight">Nothing here yet</h3>
              <p className="text-muted-foreground text-sm max-w-[240px] mx-auto leading-relaxed">
                Your activity timeline will automatically track your registered items and reports.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-primary/20 hover:bg-primary/5 transition-all"
                  onClick={() => navigate('/register-item')}
                >
                  <Package className="h-4 w-4 mr-2 text-primary" />
                  Register Item
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-amber-200/50 hover:bg-amber-50/50 transition-all"
                  onClick={() => navigate('/lost-found/report')}
                >
                  <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                  File Report
                </Button>
              </div>
            </div>
          ) : (
            // Activity timeline
            <div className="relative pl-4">
              {/* Vertical timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-px bg-border/60" />

              <div className="space-y-5">
                {activityTimeline.map((activity, index) => (
                  <div key={`${activity.type}-${activity.id}`} className="relative pb-1">
                    {/* Timeline dot */}
                    <div className="absolute -left-4 mt-1.5 h-8 w-8 rounded-full border-4 border-background bg-card flex items-center justify-center">
                      {getActivityIcon(activity)}
                    </div>

                    {/* Timeline content */}
                    <div
                      className="ml-6 cursor-pointer hover:bg-muted/50 p-3 rounded-lg transition-colors"
                      onClick={() => navigate(activity.url)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm">{activity.title}</h4>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(activity.status)}
                        </div>
                      </div>

                      {activity.description && (
                        <p className="text-muted-foreground text-xs mb-1">
                          {activity.description}
                        </p>
                      )}

                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTimestamp(activity.timestamp)}

                        {activity.category && (
                          <>
                            <span className="mx-1">•</span>
                            <span>{activity.category}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-3 mt-3">
        <Button variant="ghost" size="sm" className="text-xs">
          View All Activity
        </Button>
        <Button variant="ghost" size="sm" className="text-xs">
          <Clock className="h-3.5 w-3.5 mr-1" />
          24h
        </Button>
      </CardFooter>
    </Card>
  );
};