import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
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
import { PageLayout } from "@/components/layout/page-layout";

// Icons
import { User, Settings, ShieldCheck, Bell, Palette, Lock, Phone, Mail, Edit } from "lucide-react";
import { AuthWall } from "@/components/ui/auth-wall";

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
  const { t } = useLanguage();
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
      <PageLayout>
        <div className="container max-w-7xl mx-auto py-20 flex items-center justify-center">
          <AuthWall returnUrl="/profile" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <DashboardHeader
        heading={t("profile.title")}
        text={t("profile.subtitle")}
      >
        {!isEditingProfile && (
          <Button onClick={handleEditProfile} className="h-14 md:h-10 flex items-center gap-2 rounded-2xl md:rounded-xl font-black md:font-bold shadow-premium">
            <Edit className="h-4 w-4" />
            {t("profile.editProfile")}
          </Button>
        )}
      </DashboardHeader>

      <div className="grid gap-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full max-w-[600px] h-14 bg-background/50 backdrop-blur-md border border-border/50 p-1 rounded-2xl relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 rounded-2xl pointer-events-none" />
            <TabsTrigger value="profile" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all h-full z-10">
              <User className="h-4 w-4" />
              {t("profile.tabs.profile")}
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all h-full z-10">
              <Lock className="h-4 w-4" />
              {t("profile.tabs.security")}
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all h-full z-10">
              <Settings className="h-4 w-4" />
              {t("profile.tabs.preferences")}
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4 mt-6">
            {isEditingProfile ? (
              <ProfileEditForm
                user={user as any}
                onCancel={handleCancelEdit}
                onSuccess={handleProfileUpdated}
              />
            ) : (
              <ProfileCard user={user as any} onEdit={handleEditProfile} />
            )}
          </TabsContent>

          {/* Security & Access Tab (merged Security + Permissions) */}
          <TabsContent value="security" className="space-y-6 mt-6">
            <Card className="border-white/10 shadow-premium bg-[#0B0F1A] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-full pointer-events-none"></div>
              <CardHeader className="border-b border-white/5 bg-gradient-to-r from-primary/5 to-transparent pb-6">
                <CardTitle className="flex items-center gap-2 text-xl font-black tracking-tight">
                  <Lock className="h-5 w-5 text-primary" />
                  {t("profile.security.passwordTitle")}
                </CardTitle>
                <CardDescription className="font-bold text-white/50">{t("profile.security.passwordDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <PasswordChangeForm />
              </CardContent>
            </Card>

            <Card className="border-white/10 shadow-premium bg-[#0B0F1A]">
              <CardHeader className="border-b border-white/5 bg-white/5 pb-6">
                <CardTitle className="flex items-center gap-2 text-xl font-black tracking-tight">
                  <ShieldCheck className="h-5 w-5 text-green-500" />
                  {t("profile.security.sessionsTitle")}
                </CardTitle>
                <CardDescription className="font-bold text-white/50">{t("profile.security.sessionsDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="space-y-1">
                      <p className="text-sm font-black text-white">{t("profile.security.currentSession")}</p>
                      <p className="text-xs font-bold text-white/40">
                        {new Date().toLocaleDateString()} • {navigator.userAgent.split('/')[0]}
                      </p>
                    </div>
                    <Badge className="bg-green-600 font-black h-8 px-4 border-none shadow-lg">{t("profile.security.active")}</Badge>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button variant="outline" className="h-14 w-full rounded-2xl border-white/10 bg-white/5 font-black hover:bg-white/10 text-white transition-all">
                  {t("profile.security.logoutAllSessions")}
                </Button>
              </CardFooter>
            </Card>

            <UserPermissionsPanel
              userRole={user.role as any}
              permissions={(permissionsData as any)?.permissions || []}
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
    </PageLayout>
  );
}