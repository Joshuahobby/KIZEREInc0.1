import React from "react";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { NotificationCenter } from "@/components/dashboard/notification-center";
import { AppLayout as DashboardLayout } from "@/components/layout/admin-layout";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  const { notifications, isLoading } = useDashboardData();
  const { t } = useLanguage();

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold flex items-center gap-3">
              <Bell className="h-8 w-8 text-primary" />
              {t('notifications.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('notifications.subtitle')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <div className="h-[calc(100vh-250px)] min-h-[500px]">
            <NotificationCenter 
              notifications={notifications} 
              isLoading={isLoading} 
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
