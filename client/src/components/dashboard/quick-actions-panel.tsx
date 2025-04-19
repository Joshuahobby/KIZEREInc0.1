import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search, Bell, ShieldAlert, UserPlus } from "lucide-react";
import { UserRole } from "@shared/schema";
import { Link } from "wouter";

/**
 * Quick Actions Panel for Dashboard
 * 
 * Displays different action buttons based on user role
 */
interface QuickActionsPanelProps {
  userRole: UserRole;
}

export function QuickActionsPanel({ userRole }: QuickActionsPanelProps) {
  const { t } = useTranslation();
  
  // Get actions based on user role
  const getActions = () => {
    const commonActions = [
      {
        icon: <PlusCircle className="h-4 w-4 mr-2" />,
        label: t('dashboard.actions.registerItem'),
        description: t('dashboard.actions.registerItemDesc'),
        href: "/register-item",
      },
      {
        icon: <Search className="h-4 w-4 mr-2" />,
        label: t('dashboard.actions.searchItems'),
        description: t('dashboard.actions.searchItemsDesc'),
        href: "/search",
      },
    ];
    
    // Role-specific actions
    if (userRole === 'Admin') {
      return [
        ...commonActions,
        {
          icon: <UserPlus className="h-4 w-4 mr-2" />,
          label: t('dashboard.actions.manageUsers'),
          description: t('dashboard.actions.manageUsersDesc'),
          href: "/admin/users",
        },
        {
          icon: <ShieldAlert className="h-4 w-4 mr-2" />,
          label: t('dashboard.actions.appSettings'),
          description: t('dashboard.actions.appSettingsDesc'),
          href: "/admin/settings",
        },
      ];
    } else if (userRole === 'Agent') {
      return [
        ...commonActions,
        {
          icon: <Bell className="h-4 w-4 mr-2" />,
          label: t('dashboard.actions.verifyReports'),
          description: t('dashboard.actions.verifyReportsDesc'),
          href: "/agent/verify",
        },
      ];
    } else {
      // Subscriber actions
      return commonActions;
    }
  };
  
  const actions = getActions();

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{t('dashboard.quickActions')}</CardTitle>
        <CardDescription>{t('dashboard.quickActionsDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {actions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Button 
                variant="outline" 
                className="w-full justify-start h-auto py-3 text-left"
              >
                <div className="flex flex-col items-start">
                  <span className="flex items-center font-medium mb-1">
                    {action.icon}
                    {action.label}
                  </span>
                  <span className="text-xs text-muted-foreground pl-6">
                    {action.description}
                  </span>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}