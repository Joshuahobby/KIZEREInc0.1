import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { UserRole } from "@/types/user";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface UserPermissionsPanelProps {
  userRole: UserRole;
  permissions: string[];
  isLoading: boolean;
}

export function UserPermissionsPanel({ 
  userRole, 
  permissions = [], 
  isLoading 
}: UserPermissionsPanelProps) {
  const { t } = useTranslation();
  
  // Group permissions by category
  const groupedPermissions = {
    dashboard: permissions.filter(p => p.startsWith('can_dashboard')),
    items: permissions.filter(p => p.startsWith('can_items')),
    reports: permissions.filter(p => p.startsWith('can_reports')),
    users: permissions.filter(p => p.startsWith('can_users')),
    payments: permissions.filter(p => p.startsWith('can_payments')),
    system: permissions.filter(p => p.startsWith('can_system')),
    other: permissions.filter(p => !p.match(/^can_(dashboard|items|reports|users|payments|system)/))
  };
  
  // Get a human-readable description for each permission
  const getPermissionDescription = (permission: string): string => {
    const key = `permissions.descriptions.${permission}`;
    const translated = t(key);
    
    // If the key doesn't exist in translations, return a fallback
    if (translated === key) {
      return t('permissions.descriptions.fallback');
    }
    
    return translated;
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-5 w-1/4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Skeleton key={j} className="h-10 w-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t("profile.permissions.title")}</CardTitle>
            <CardDescription>{t("profile.permissions.description")}</CardDescription>
          </div>
          <Badge className="capitalize">{userRole}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
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
          
          {/* Users Permissions */}
          {groupedPermissions.users.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">{t("profile.permissions.categories.users")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {groupedPermissions.users.map((permission) => (
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
          
          {/* System Permissions */}
          {groupedPermissions.system.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">{t("profile.permissions.categories.system")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {groupedPermissions.system.map((permission) => (
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
          
          {/* No permissions message */}
          {permissions.length === 0 && (
            <div className="flex items-center justify-center p-8 text-center">
              <div className="space-y-2">
                <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
                <h3 className="font-medium">{t("profile.permissions.noPermissions")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("profile.permissions.noPermissionsDesc")}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}