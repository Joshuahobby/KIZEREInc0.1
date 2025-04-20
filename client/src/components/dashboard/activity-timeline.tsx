import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, 
  ClipboardList, 
  AlertTriangle, 
  CheckCircle2, 
  Bell, 
  Filter,
  PenSquare
} from "lucide-react";

// Activity type definition
export interface Activity {
  id: number;
  type: 'register' | 'status' | 'notification' | 'update' | string;
  title: string;
  timestamp: Date | string;
  details: string;
  itemId?: number;
  category?: string;
}

interface ActivityTimelineProps {
  activities: Activity[];
  isLoading?: boolean;
}

/**
 * Activity Timeline Component
 * 
 * Displays a chronological timeline of user activities with filtering options
 */
export const ActivityTimeline = ({ 
  activities = [], 
  isLoading = false 
}: ActivityTimelineProps) => {
  const [filter, setFilter] = useState<string>("all");
  
  // Filter activities based on selected filter
  const filteredActivities = filter === "all" 
    ? activities 
    : activities.filter(activity => activity.type === filter || 
        (filter === "status" && (activity.type === "lost" || activity.type === "found")));
  
  // Get icon based on activity type
  const getActivityIcon = (type: string) => {
    switch(type) {
      case 'register':
        return <ClipboardList className="h-5 w-5 text-blue-500" />;
      case 'lost':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'found':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'notification':
        return <Bell className="h-5 w-5 text-amber-500" />;
      case 'update':
        return <PenSquare className="h-5 w-5 text-purple-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Get badge color based on activity type
  const getActivityBadgeClass = (type: string) => {
    switch(type) {
      case 'register':
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case 'lost':
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case 'found':
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case 'notification':
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
      case 'update':
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };
  
  // Generate loading skeletons
  const renderSkeletons = () => {
    return Array(4).fill(0).map((_, index) => (
      <div key={`skeleton-${index}`} className="py-3">
        <div className="flex items-start">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <Skeleton className="h-5 w-5 rounded-full" />
          </div>
          <div className="ml-4 flex-1">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-4 w-full mt-2" />
          </div>
        </div>
      </div>
    ));
  };

  return (
    <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-display flex items-center">
            <Clock className="h-5 w-5 mr-2 text-[#00BFFF]" />
            Activity Timeline
          </CardTitle>
          
          {/* Category Filter */}
          <Tabs value={filter} onValueChange={setFilter} className="w-auto">
            <TabsList className="h-8">
              <TabsTrigger value="all" className="text-xs h-7 px-2">All</TabsTrigger>
              <TabsTrigger value="register" className="text-xs h-7 px-2">Registered</TabsTrigger>
              <TabsTrigger value="status" className="text-xs h-7 px-2">Status Change</TabsTrigger>
              <TabsTrigger value="notification" className="text-xs h-7 px-2">Notifications</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flow-root">
          <ul role="list" className="-mb-8">
            {isLoading ? (
              renderSkeletons()
            ) : filteredActivities.length > 0 ? (
              <AnimatePresence>
                {filteredActivities.map((activity, index) => (
                  <motion.li 
                    key={activity.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ 
                      duration: 0.3, 
                      delay: index * 0.05,
                      ease: "easeOut" 
                    }}
                  >
                    <div className="relative pb-8">
                      {index < filteredActivities.length - 1 ? (
                        <span
                          className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-muted"
                          aria-hidden="true"
                        />
                      ) : null}
                      <div className="relative flex items-start space-x-3">
                        <div className="relative">
                          <div className="h-10 w-10 rounded-full bg-muted/50 border border-border/50 flex items-center justify-center">
                            {getActivityIcon(activity.type)}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div>
                            <div className="flex justify-between">
                              <p className="text-sm font-medium text-foreground">
                                {activity.title}
                                {activity.category && (
                                  <Badge variant="secondary" className="ml-2 font-normal">
                                    {activity.category}
                                  </Badge>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {typeof activity.timestamp === 'string' 
                                  ? activity.timestamp 
                                  : format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                              </p>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {activity.details}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p>No activities found for the selected filter.</p>
              </div>
            )}
          </ul>
        </div>
        
        {activities.length > 0 && !isLoading && (
          <div className="mt-2 flex justify-center">
            <Button variant="outline" size="sm">
              View All Activity
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};