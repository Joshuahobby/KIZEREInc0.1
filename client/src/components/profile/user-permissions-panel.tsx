import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle, HelpCircle, ShieldAlert, ShieldCheck } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserRole } from "@shared/schema";

interface UserPermissionsPanelProps {
  userRole: UserRole;
  permissions: string[];
  isLoading: boolean;
}

export function UserPermissionsPanel({ userRole, permissions, isLoading }: UserPermissionsPanelProps) {
  const { t } = useTranslation();

  // Role information and descriptions
  const roleInfo = {
    Admin: {
      description: t("profile.permissions.adminDesc"),
      color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      icon: <ShieldAlert className="h-4 w-4 mr-1" />
    },
    Agent: {
      description: t("profile.permissions.agentDesc"),
      color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
      icon: <ShieldCheck className="h-4 w-4 mr-1" />
    },
    Subscriber: {
      description: t("profile.permissions.subscriberDesc"),
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      icon: <CheckCircle className="h-4 w-4 mr-1" />
    }
  };

  // Group permissions by category
  const groupedPermissions = {
    dashboard: permissions.filter(p => p.includes('dashboard')),
    user: permissions.filter(p => p.includes('user')),
    items: permissions.filter(p => p.includes('item')),
    reports: permissions.filter(p => p.includes('report')),
    payments: permissions.filter(p => p.includes('payment')),
    settings: permissions.filter(p => p.includes('setting')),
    other: permissions.filter(p => 
      !p.includes('dashboard') && 
      !p.includes('user') && 
      !p.includes('item') && 
      !p.includes('report') && 
      !p.includes('payment') && 
      !p.includes('setting')
    )
  };

  // Permission description helper
  const getPermissionDescription = (permission: string) => {
    const descriptions: Record<string, string> = {
      can_view_dashboard: t("profile.permissions.canViewDashboard"),
      can_create_user: t("profile.permissions.canCreateUser"),
      can_delete_user: t("profile.permissions.canDeleteUser"),
      can_update_user: t("profile.permissions.canUpdateUser"),
      can_view_reports: t("profile.permissions.canViewReports"),
      can_manage_items: t("profile.permissions.canManageItems"),
      can_manage_own_items: t("profile.permissions.canManageOwnItems"),
      can_view_payments: t("profile.permissions.canViewPayments"),
      can_view_own_payments: t("profile.permissions.canViewOwnPayments"),
      can_manage_settings: t("profile.permissions.canManageSettings"),
      can_create_reports: t("profile.permissions.canCreateReports")
    };
    
    return descriptions[permission] || permission;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-8 w-36" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t("profile.permissions.title")}</CardTitle>
          <Badge className={roleInfo[userRole]?.color || "bg-gray-100 text-gray-800"}>
            <span className="flex items-center">
              {roleInfo[userRole]?.icon}
              {userRole}
            </span>
          </Badge>
        </div>
        <CardDescription>
          {roleInfo[userRole]?.description || t("profile.permissions.defaultDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Role information */}
          <div className="border rounded-md p-4 bg-muted/30">
            <div className="flex items-start">
              <div className="mr-2 mt-0.5">
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">{t("profile.permissions.adminContactInfo")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("profile.permissions.adminContactDesc")}
                </p>
              </div>
            </div>
          </div>

          {/* Dashboard Permissions */}
          {groupedPermissions.dashboard.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">{t("profile.permissions.categories.dashboard")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {groupedPermissions.dashboard.map((permission) => (
                  <TooltipProvider key={permission}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 rounded-md border p-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{permission.split('_').slice(1).join(' ')}</span>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{getPermissionDescription(permission)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          )}

          {/* User Management Permissions */}
          {groupedPermissions.user.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">{t("profile.permissions.categories.users")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {groupedPermissions.user.map((permission) => (
                  <TooltipProvider key={permission}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 rounded-md border p-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{permission.split('_').slice(1).join(' ')}</span>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{getPermissionDescription(permission)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          )}

          {/* Items Permissions */}
          {groupedPermissions.items.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">{t("profile.permissions.categories.items")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {groupedPermissions.items.map((permission) => (
                  <TooltipProvider key={permission}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 rounded-md border p-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{permission.split('_').slice(1).join(' ')}</span>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{getPermissionDescription(permission)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          )}

          {/* Reports Permissions */}
          {groupedPermissions.reports.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">{t("profile.permissions.categories.reports")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {groupedPermissions.reports.map((permission) => (
                  <TooltipProvider key={permission}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 rounded-md border p-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{permission.split('_').slice(1).join(' ')}</span>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{getPermissionDescription(permission)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          )}

          {/* Payments Permissions */}
          {groupedPermissions.payments.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">{t("profile.permissions.categories.payments")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {groupedPermissions.payments.map((permission) => (
                  <TooltipProvider key={permission}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 rounded-md border p-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{permission.split('_').slice(1).join(' ')}</span>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{getPermissionDescription(permission)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          )}

          {/* Settings Permissions */}
          {groupedPermissions.settings.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">{t("profile.permissions.categories.settings")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {groupedPermissions.settings.map((permission) => (
                  <TooltipProvider key={permission}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 rounded-md border p-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{permission.split('_').slice(1).join(' ')}</span>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{getPermissionDescription(permission)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          )}

          {/* Other Permissions */}
          {groupedPermissions.other.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">{t("profile.permissions.categories.other")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {groupedPermissions.other.map((permission) => (
                  <TooltipProvider key={permission}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 rounded-md border p-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{permission.split('_').slice(1).join(' ')}</span>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{getPermissionDescription(permission)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}