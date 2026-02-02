import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { User, UserPreferences } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Activity, Server, ChevronDown, Loader2 } from "lucide-react";
import { AuthService } from "@/services/auth.service";

export function DashboardStyleSwitcher() {
  const { user, refreshUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();

  const currentStyle = (user?.preferences as UserPreferences)?.dashboardStyle || "standard";

  const mutation = useMutation({
    mutationFn: async (style: string) => {
      const newPreferences = {
        ...(user?.preferences as UserPreferences),
        dashboardStyle: style,
      };
      return await apiRequest("/api/me/preferences", {
        method: "PUT",
        data: newPreferences,
      });
    },
    onSuccess: async (userData: User, style) => {
      console.log(`[DashboardStyleSwitcher] Style update success: ${style}`);
      
      // Update local auth state instantly with returned data
      await refreshUser(userData);
      
      // Update query cache manually to avoid immediate refetches
      queryClient.setQueryData(["/api/user"], userData);
      queryClient.setQueryData(["/api/me"], userData);
      
      // Still invalidate to ensure other related data is fresh eventually
      queryClient.invalidateQueries({ queryKey: ["/api/me/preferences"] });
      
      toast({
        title: t("dashboard.experience.updated"),
        description: t("dashboard.experience.updatedDesc", { style: t(`dashboard.experience.${style}`) }),
      });
      
      // Use AuthService for consistent path resolution
      if (user?.role === 'Admin') {
        const path = AuthService.getDashboardPathByRole(user.role, style);
        console.log(`[DashboardStyleSwitcher] Navigating to: ${path}`);
        setLocation(path);
      }
    },
    onError: (error: any) => {
      console.error("[DashboardStyleSwitcher] Style update failed:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Could not update dashboard preference",
        variant: "destructive",
      });
    },
  });

  // Removed admin check to enable for all roles

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-2 px-3" disabled={mutation.isPending}>
          {mutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {currentStyle === "standard" && <LayoutDashboard className="h-4 w-4 text-primary" />}
              {currentStyle === "classic" && <Activity className="h-4 w-4 text-emerald-500" />}
              {currentStyle === "command_center" && <Server className="h-4 w-4 text-amber-500" />}
              {currentStyle === "grid" && <LayoutDashboard className="h-4 w-4 text-blue-500" />}
            </>
          )}
          <span className="hidden md:inline-block">
            {t("dashboard.experience.style", { style: t(`dashboard.experience.${currentStyle}`) })}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>{t("dashboard.experience.title")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => mutation.mutate("standard")}
          className={currentStyle === "standard" ? "bg-accent font-medium" : ""}
        >
          <LayoutDashboard className="mr-2 h-4 w-4" />
          <span>{t("dashboard.experience.standard")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => mutation.mutate("classic")}
          className={currentStyle === "classic" ? "bg-accent font-medium" : ""}
        >
          <Activity className="mr-2 h-4 w-4 text-emerald-500" />
          <span>{t("dashboard.experience.classic")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => mutation.mutate("command_center")}
          className={currentStyle === "command_center" ? "bg-accent font-medium" : ""}
          hidden={user?.role !== 'Admin'}
        >
          <Server className="mr-2 h-4 w-4 text-amber-500" />
          <span>{t("dashboard.experience.command_center")}</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => mutation.mutate("grid")}
          className={currentStyle === "grid" ? "bg-accent font-medium" : ""}
          hidden={user?.role === 'Admin'}
        >
          <LayoutDashboard className="mr-2 h-4 w-4 text-blue-500" />
          <span>{t("dashboard.experience.grid")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
