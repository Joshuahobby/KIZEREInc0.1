import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Notification } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Bell, Check, CheckCircle2, AlertCircle, InfoIcon } from "lucide-react";

interface NotificationCenterProps {
  notifications: Notification[];
  isLoading: boolean;
}

/**
 * Enhanced Notification Center Component
 * 
 * Displays user notifications with filtering options, read/unread status,
 * and actions to mark notifications as read
 */
export const NotificationCenter = ({ 
  notifications = [], 
  isLoading = false 
}: NotificationCenterProps) => {
  const [filter, setFilter] = useState<string>("all");
  
  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/notifications/${id}/read`);
      return res.json();
    },
    onSuccess: () => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/notifications"] });
    }
  });
  
  // Filter notifications based on selected category
  const filteredNotifications = filter === "all" 
    ? notifications 
    : notifications.filter(notification => {
        if (filter === "unread") return !notification.isRead;
        return notification.type === filter;
      });
  
  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch(type) {
      case 'alert':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'match':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'info':
      default:
        return <InfoIcon className="h-5 w-5 text-blue-500" />;
    }
  };
  
  // Get badge color based on notification type
  const getNotificationBadgeClass = (type: string) => {
    switch(type) {
      case 'alert':
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case 'match':
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case 'info':
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    }
  };
  
  // Handle mark as read
  const handleMarkAsRead = (id: number) => {
    markAsReadMutation.mutate(id);
  };
  
  // Generate loading skeletons
  const renderSkeletons = () => {
    return Array(3).fill(0).map((_, index) => (
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
            <Bell className="h-5 w-5 mr-2 text-[#00BFFF]" />
            Notification Center
          </CardTitle>
          
          {/* Notification Filters */}
          <Tabs value={filter} onValueChange={setFilter} className="w-auto">
            <TabsList className="h-8">
              <TabsTrigger value="all" className="text-xs h-7 px-2">All</TabsTrigger>
              <TabsTrigger value="unread" className="text-xs h-7 px-2">Unread</TabsTrigger>
              <TabsTrigger value="alert" className="text-xs h-7 px-2">Alerts</TabsTrigger>
              <TabsTrigger value="match" className="text-xs h-7 px-2">Matches</TabsTrigger>
              <TabsTrigger value="info" className="text-xs h-7 px-2">Updates</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flow-root">
          <ul role="list">
            {isLoading ? (
              renderSkeletons()
            ) : filteredNotifications.length > 0 ? (
              <AnimatePresence>
                {filteredNotifications.map((notification, index) => (
                  <motion.li 
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ 
                      duration: 0.3, 
                      delay: index * 0.05,
                      ease: "easeOut" 
                    }}
                    className={`py-3 border-b border-border/40 last:border-0 ${!notification.isRead ? 'bg-primary/5' : ''}`}
                  >
                    <div className="relative flex items-start space-x-3">
                      <div className="relative">
                        <div className={`h-10 w-10 rounded-full bg-muted/50 border border-border/50 flex items-center justify-center ${!notification.isRead ? 'ring-2 ring-primary/30' : ''}`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div>
                          <div className="flex justify-between">
                            <p className="text-sm font-medium text-foreground flex items-center">
                              {notification.title}
                              {!notification.isRead && (
                                <span className="ml-2 inline-block h-2 w-2 rounded-full bg-primary" />
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                            </p>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {notification.message}
                          </p>
                          
                          {/* Action buttons */}
                          <div className="mt-2 flex space-x-2">
                            {!notification.isRead && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleMarkAsRead(notification.id)}
                                disabled={markAsReadMutation.isPending}
                                className="h-7 px-2 text-xs"
                              >
                                <Check className="h-3.5 w-3.5 mr-1" />
                                Mark as read
                              </Button>
                            )}
                            <Badge 
                              variant="outline" 
                              className={getNotificationBadgeClass(notification.type)}
                            >
                              {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p>No notifications found for the selected filter.</p>
              </div>
            )}
          </ul>
        </div>
        
        {notifications.length > 0 && !isLoading && (
          <div className="mt-4 flex justify-between">
            <Button variant="outline" size="sm">
              View All Notifications
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                // Mark all as read functionality would go here
              }}
            >
              Mark All as Read
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};