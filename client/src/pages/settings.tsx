import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { PageLayout } from "@/components/layout/page-layout";
import { UserPreferencesForm } from "@/components/profile/user-preferences-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Settings, Bell, Palette, Globe, Lock, Shield, KeyRound, Smartphone } from "lucide-react";
import { PushSubscriptionManager } from "@/components/notifications/push-subscription-manager";
import { AuthWall } from "@/components/ui/auth-wall";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PrivacySettings } from "@/components/settings/privacy-settings";
import TwoFactorSettings from "@/components/settings/two-factor-settings";

export default function SettingsPage() {
    const { t } = useLanguage();
    const { user } = useAuth();

    // Fetch user preferences
    const { data: preferencesData, isLoading: preferencesLoading } = useQuery({
        queryKey: ['/api/me/preferences'],
        enabled: !!user,
    });

    if (!user) {
        return (
            <PageLayout>
                <div className="container max-w-7xl mx-auto py-20 flex items-center justify-center">
                    <AuthWall returnUrl="/settings" />
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout>
            <DashboardHeader
                heading={t("profile.tabs.preferences")}
                text={t("settings_page.subtitle")}
            />

            <div className="grid gap-8">
                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full max-w-[1000px] h-auto bg-slate-900/50 border border-white/10 p-2 rounded-[24px] relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 rounded-[24px] pointer-events-none" />
                        <TabsTrigger value="general" className="flex items-center gap-2 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:shadow-premium transition-all h-12 md:h-14 z-10 font-black text-xs uppercase tracking-widest">
                            <Settings className="h-4 w-4" />
                            {t("settings_page.general")}
                        </TabsTrigger>
                        <TabsTrigger value="notifications" className="flex items-center gap-2 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:shadow-premium transition-all h-12 md:h-14 z-10 font-black text-xs uppercase tracking-widest">
                            <Bell className="h-4 w-4" />
                            {t("settings_page.notifications")}
                        </TabsTrigger>
                        <TabsTrigger value="appearance" className="flex items-center gap-2 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:shadow-premium transition-all h-12 md:h-14 z-10 font-black text-xs uppercase tracking-widest">
                            <Palette className="h-4 w-4" />
                            {t("settings_page.appearance")}
                        </TabsTrigger>
                        <TabsTrigger value="security" className="flex items-center gap-2 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:shadow-premium transition-all h-12 md:h-14 z-10 font-black text-xs uppercase tracking-widest">
                            <Lock className="h-4 w-4" />
                            {t("settings_page.security")}
                        </TabsTrigger>
                        <TabsTrigger value="privacy" className="flex items-center gap-2 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:shadow-premium transition-all h-12 md:h-14 z-10 font-black text-xs uppercase tracking-widest">
                            <Shield className="h-4 w-4" />
                            Privacy
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-4 mt-6">
                        <UserPreferencesForm
                            preferences={preferencesData || {}}
                            isLoading={preferencesLoading}
                        />
                    </TabsContent>

                    <TabsContent value="notifications" className="space-y-4 mt-6">
                        <PushSubscriptionManager />
                    </TabsContent>

                    <TabsContent value="appearance" className="space-y-4 mt-6">
                        <Card className="border-white/10 shadow-premium bg-[#0B0F1A]">
                            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-white/5 pb-6">
                                <CardTitle className="text-2xl font-black tracking-tighter">{t("settings_page.appearance_title")}</CardTitle>
                                <CardDescription className="text-white/40 font-bold">{t("settings_page.appearance_desc")}</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <p className="text-sm font-bold text-white/60">{t("settings_page.appearance_hint")}</p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="security" className="space-y-6 mt-6">
                        <Card className="border-white/10 shadow-premium bg-[#0B0F1A] relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-full pointer-events-none"></div>
                            <CardHeader className="border-b border-white/5 pb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-primary/10 rounded-2xl">
                                        <KeyRound className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-black tracking-tight">{t("settings_page.password_title")}</CardTitle>
                                        <CardDescription className="font-bold text-white/40">{t("settings_page.password_desc")}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="grid gap-3">
                                    <Label htmlFor="current-password" className="text-[10px] font-black uppercase tracking-widest text-white/40">{t("settings_page.current_password")}</Label>
                                    <Input id="current-password" type="password" className="h-14 bg-white/5 border-white/5 rounded-2xl font-black" />
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="new-password" className="text-[10px] font-black uppercase tracking-widest text-white/40">{t("settings_page.new_password")}</Label>
                                    <Input id="new-password" type="password" className="h-14 bg-white/5 border-white/5 rounded-2xl font-black" />
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="confirm-password" className="text-[10px] font-black uppercase tracking-widest text-white/40">{t("settings_page.confirm_password")}</Label>
                                    <Input id="confirm-password" type="password" className="h-14 bg-white/5 border-white/5 rounded-2xl font-black" />
                                </div>
                                <Button className="h-14 w-full md:w-auto mt-4 rounded-2xl font-black bg-primary text-black hover:bg-primary/90 shadow-[0_0_20px_rgba(var(--primary),0.3)]">{t("settings_page.update_password")}</Button>
                            </CardContent>
                        </Card>

                        <TwoFactorSettings className="border-white/10 shadow-premium bg-[#0B0F1A]" />
                    </TabsContent>

                    <TabsContent value="privacy" className="space-y-6 mt-6">
                        <PrivacySettings />
                    </TabsContent>
                </Tabs>
            </div>
        </PageLayout>
    );
}
