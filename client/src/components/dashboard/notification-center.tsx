import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Bell, BellRing, CheckCircle, Clock, User, Settings, X, Info, AlertTriangle, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { Notification } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "../ui/skeleton";
import { useLocation } from "wouter";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";

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

  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { toast } = useToast();

  // Mark notification as read
  const markAsRead = async (id: number) => {
    try {
      await apiRequest(`/api/notifications/${id}/read`, { method: 'PATCH' });
      // Invalidate the notifications and unread count queries to refresh everything
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await apiRequest("/api/notifications/mark-all-read", { method: 'POST' });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      toast({
        title: t('notifications.markAllReadSuccess'),
      });
    } catch (error) {
      console.error("Failed to mark all notifications as read", error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('notifications.markAllReadError'),
      });
    }
  };

  // Delete a specific notification
  const deleteNotification = async (id: number) => {
    try {
      await apiRequest(`/api/notifications/${id}`, { method: 'DELETE' });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      toast({
        title: t('notifications.deleteSuccess'),
      });
    } catch (error) {
      console.error("Failed to delete notification", error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('notifications.deleteError'),
      });
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    try {
      await apiRequest("/api/notifications", { method: 'DELETE' });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      toast({
        title: t('notifications.clearAllSuccess'),
      });
    } catch (error) {
      console.error("Failed to clear notifications", error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('notifications.clearAllError'),
      });
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
      case 'report_match':
        return <AlertTriangle className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  // Format notification date - handles both string and Date objects
  const formatDate = (dateInput: string | Date) => {
    // Ensure we have a Date object
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

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
            {t('notifications.title')}
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2 bg-primary text-white">
                {unreadCount} {t('common.new')}
              </Badge>
            )}
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>{t('notifications.subtitle')}</CardDescription>
      </CardHeader>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="all" className="text-xs">{t('notifications.tabs.all')}</TabsTrigger>
            <TabsTrigger value="unread" className="text-xs">{t('notifications.tabs.unread')}</TabsTrigger>
            <TabsTrigger value="alert" className="text-xs">{t('notifications.tabs.alerts')}</TabsTrigger>
            <TabsTrigger value="system" className="text-xs">{t('notifications.tabs.system')}</TabsTrigger>
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
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#00BFFF]/5 to-[#00BFFF]/10 flex items-center justify-center mb-6 animate-pulse">
                  <Bell className="h-10 w-10 text-[#00BFFF]/40" />
                </div>
                <h3 className="text-xl font-bold mb-2 tracking-tight">{t('notifications.empty')}</h3>
                <p className="text-muted-foreground text-sm max-w-[240px] mx-auto leading-relaxed">
                  {activeTab === "unread"
                    ? t('notifications.emptyUnread')
                    : t('notifications.emptyDesc')}
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
                    onClick={() => {
                      const isOpening = openNotification !== `${notification.id}`;
                      setOpenNotification(isOpening ? `${notification.id}` : null);
                      
                      // Auto-mark as read if opening an unread notification
                      if (isOpening && !notification.isRead) {
                        markAsRead(notification.id);
                      }
                    }}
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
                          <p className={`text-sm font-medium ${!notification.isRead ? "text-primary" : "text-foreground"}`}>
                            {notification.title}
                          </p>
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] text-muted-foreground ml-2 flex-shrink-0">
                              {formatDate(notification.createdAt)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive transition-colors opactiy-0 group-hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
                          {notification.message}
                        </p>
                        {openNotification === `${notification.id}` && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            className="mt-2 text-sm border-t border-border/30 pt-2"
                          >
                            <p className="text-foreground leading-relaxed mb-3">{notification.message}</p>
                            <div className="flex flex-wrap gap-2">
                              {!notification.isRead && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="h-8 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                >
                                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                  {t('notifications.markAsRead')}
                                </Button>
                              )}
                              {notification.type === 'report_match' && notification.relatedReportId && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs border-purple-200 text-purple-600 hover:bg-purple-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setLocation(`/reports/${notification.relatedReportId}`);
                                  }}
                                >
                                  {t('notifications.viewMatch')}
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs text-destructive hover:bg-destructive/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-1" />
                                {t('common.actions.delete')}
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </div>
                      {!notification.isRead && (
                        <div className="flex-shrink-0 ml-2">
                          <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
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

      <CardFooter className="flex justify-between border-t pt-3 mt-auto bg-muted/5 gap-2">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs font-semibold"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            {t('notifications.markAllRead')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs font-semibold text-destructive hover:bg-destructive/10"
            onClick={clearAllNotifications}
            disabled={notifications.length === 0}
          >
            <X className="h-3 w-3 mr-1" />
            {t('notifications.clearAll')}
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs hover:bg-primary/10 hover:text-primary transition-colors"
          onClick={() => setLocation("/dashboard/notifications")}
        >
          {t('common.viewAll')}
        </Button>
      </CardFooter>
    </Card>
  );
};