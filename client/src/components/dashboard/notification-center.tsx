import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Bell, BellRing, CheckCircle, Clock, User, Settings, X, Info, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { Notification } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "../ui/skeleton";

interface NotificationCenterProps {
  notifications: Notification[];
  isLoading: boolean;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  notifications = [],
  isLoading = false
}) => {
  const [activeTab, setActiveTab] = useState("all");
  const [openNotification, setOpenNotification] = useState<string | null>(null);

  // Mark notification as read
  const markAsRead = async (id: number) => {
    try {
      await apiRequest('PATCH', `/api/notifications/${id}`, { isRead: true });
      // Update cache to reflect the change
      // This would typically be handled by react-query's mutation API
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'system':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'alert':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  // Format notification date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // Less than a day
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHrs < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    }
    
    if (diffHrs < 24) {
      return `${diffHrs} hour${diffHrs !== 1 ? 's' : ''} ago`;
    }
    
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
    
    return date.toLocaleDateString();
  };

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !notification.isRead;
    return notification.type === activeTab;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <Card className="h-full border border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-display flex items-center">
            <BellRing className="h-5 w-5 mr-2 text-[#00BFFF]" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2 bg-primary text-white">
                {unreadCount} new
              </Badge>
            )}
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>Stay updated on system alerts and activity</CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="unread" className="text-xs">Unread</TabsTrigger>
            <TabsTrigger value="alert" className="text-xs">Alerts</TabsTrigger>
            <TabsTrigger value="system" className="text-xs">System</TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="pt-0">
          <TabsContent value={activeTab} className="m-0">
            {isLoading ? (
              // Loading state
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start space-x-4 pb-4 border-b border-border/30">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              // Empty state
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                <p className="text-muted-foreground text-sm max-w-xs">
                  {activeTab === "unread" 
                    ? "You have no unread notifications at the moment." 
                    : "You don't have any notifications yet."}
                </p>
              </div>
            ) : (
              // Notification list
              <div className="space-y-1 max-h-[370px] overflow-y-auto pr-2">
                {filteredNotifications.map((notification) => (
                  <motion.div 
                    key={notification.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`
                      relative p-3 rounded-lg mb-2 cursor-pointer
                      ${notification.isRead 
                        ? "bg-background hover:bg-muted/50" 
                        : "bg-primary/5 hover:bg-primary/10 border-l-2 border-primary"
                      }
                    `}
                    onClick={() => setOpenNotification(openNotification === `${notification.id}` ? null : `${notification.id}`)}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3">
                        <div className={`
                          h-9 w-9 rounded-full flex items-center justify-center
                          ${notification.isRead ? 'bg-muted' : 'bg-primary/10'}
                        `}>
                          {getNotificationIcon(notification.type)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className={`text-sm font-medium ${!notification.isRead && "text-primary-foreground"}`}>
                            {notification.title}
                          </p>
                          <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                            {formatDate(notification.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
                          {notification.message}
                        </p>
                        {openNotification === `${notification.id}` && (
                          <div className="mt-2 text-sm">
                            <p>{notification.message}</p>
                            {!notification.isRead && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="mt-2 h-8 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                              >
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                Mark as read
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                      {!notification.isRead && (
                        <div className="flex-shrink-0 ml-2">
                          <div className="h-2 w-2 rounded-full bg-primary"></div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </CardContent>
      </Tabs>
      
      <CardFooter className="flex justify-between border-t pt-3 mt-auto">
        <Button variant="ghost" size="sm" className="text-xs">
          Mark all as read
        </Button>
        <Button variant="ghost" size="sm" className="text-xs">
          View all
        </Button>
      </CardFooter>
    </Card>
  );
};