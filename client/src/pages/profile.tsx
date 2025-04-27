import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";

// UI Components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// Layout components
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

// Icons
import { User, Settings, ShieldCheck, Bell, Palette, Lock, Phone, Mail, Edit } from "lucide-react";

// Form handling
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Helper components for this page
import { ProfileCard } from "@/components/profile/profile-card";
import { ProfileEditForm } from "@/components/profile/profile-edit-form";
import { PasswordChangeForm } from "@/components/profile/password-change-form";
import { UserPermissionsPanel } from "@/components/profile/user-permissions-panel";
import { UserPreferencesForm } from "@/components/profile/user-preferences-form";

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Fetch user permissions
  const { data: permissionsData, isLoading: permissionsLoading } = useQuery({
    queryKey: ['/api/me/permissions'],
    enabled: !!user,
  });

  // Fetch user preferences
  const { data: preferencesData, isLoading: preferencesLoading } = useQuery({
    queryKey: ['/api/me/preferences'],
    enabled: !!user,
  });

  // Handle toggling the profile edit mode
  const handleEditProfile = () => {
    setIsEditingProfile(true);
  };

  // Handle canceling profile edit
  const handleCancelEdit = () => {
    setIsEditingProfile(false);
  };

  // Handle successful profile update
  const handleProfileUpdated = () => {
    setIsEditingProfile(false);
    toast({
      title: t("profile.updateSuccess"),
      description: t("profile.updateSuccessDesc"),
    });
    // Refresh user data
    queryClient.invalidateQueries({ queryKey: ["/api/me"] });
  };

  if (!user) {
    return (
      <DashboardShell>
        <DashboardHeader
          heading={t("profile.title")}
          text={t("profile.subtitle")}
        />
        <div className="grid gap-4">
          <Card>
            <CardContent className="py-10 text-center">
              <p>{t("auth.loginRequired")}</p>
            </CardContent>
          </Card>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading={t("profile.title")}
        text={t("profile.subtitle")}
      >
        {!isEditingProfile && (
          <Button onClick={handleEditProfile} className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            {t("profile.editProfile")}
          </Button>
        )}
      </DashboardHeader>

      <div className="grid gap-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {t("profile.tabs.profile")}
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              {t("profile.tabs.security")}
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              {t("profile.tabs.permissions")}
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {t("profile.tabs.preferences")}
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4 mt-6">
            {isEditingProfile ? (
              <ProfileEditForm 
                user={user} 
                onCancel={handleCancelEdit}
                onSuccess={handleProfileUpdated}
              />
            ) : (
              <ProfileCard user={user} onEdit={handleEditProfile} />
            )}
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("profile.security.passwordTitle")}</CardTitle>
                <CardDescription>{t("profile.security.passwordDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <PasswordChangeForm />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("profile.security.sessionsTitle")}</CardTitle>
                <CardDescription>{t("profile.security.sessionsDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{t("profile.security.currentSession")}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date().toLocaleDateString()} • {navigator.userAgent.split('/')[0]}
                      </p>
                    </div>
                    <Badge className="bg-green-600">{t("profile.security.active")}</Badge>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  {t("profile.security.logoutAllSessions")}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-4 mt-6">
            <UserPermissionsPanel 
              userRole={user.role} 
              permissions={permissionsData?.permissions || []} 
              isLoading={permissionsLoading}
            />
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-4 mt-6">
            <UserPreferencesForm 
              preferences={preferencesData || {}} 
              isLoading={preferencesLoading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}