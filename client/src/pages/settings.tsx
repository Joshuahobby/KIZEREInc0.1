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
                    <TabsList className="grid grid-cols-4 w-full max-w-[800px] h-14 bg-background/50 backdrop-blur-md border border-border/50 p-1 rounded-2xl relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 rounded-2xl pointer-events-none" />
                        <TabsTrigger value="general" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all h-full z-10">
                            <Settings className="h-4 w-4" />
                            {t("settings_page.general")}
                        </TabsTrigger>
                        <TabsTrigger value="notifications" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all h-full z-10">
                            <Bell className="h-4 w-4" />
                            {t("settings_page.notifications")}
                        </TabsTrigger>
                        <TabsTrigger value="appearance" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all h-full z-10">
                            <Palette className="h-4 w-4" />
                            {t("settings_page.appearance")}
                        </TabsTrigger>
                        <TabsTrigger value="security" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all h-full z-10">
                            <Lock className="h-4 w-4" />
                            {t("settings_page.security")}
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
                        <Card className="border-border/50 shadow-lg bg-background/60 backdrop-blur-xl">
                            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border/50 pb-6">
                                <CardTitle>{t("settings_page.appearance_title")}</CardTitle>
                                <CardDescription>{t("settings_page.appearance_desc")}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">{t("settings_page.appearance_hint")}</p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="security" className="space-y-6 mt-6">
                        <Card className="border-primary/20 shadow-lg bg-primary/5 backdrop-blur-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-bl-full pointer-events-none"></div>
                            <CardHeader className="border-b border-primary/10 pb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <KeyRound className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle>{t("settings_page.password_title")}</CardTitle>
                                        <CardDescription>{t("settings_page.password_desc")}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="current-password">{t("settings_page.current_password")}</Label>
                                    <Input id="current-password" type="password" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="new-password">{t("settings_page.new_password")}</Label>
                                    <Input id="new-password" type="password" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="confirm-password">{t("settings_page.confirm_password")}</Label>
                                    <Input id="confirm-password" type="password" />
                                </div>
                                <Button className="mt-2">{t("settings_page.update_password")}</Button>
                            </CardContent>
                        </Card>

                        <Card className="border-border/50 shadow-lg bg-background/60 backdrop-blur-xl">
                            <CardHeader className="border-b border-border/50 bg-muted/20 pb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                        <Smartphone className="h-5 w-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <CardTitle>{t("settings_page.twofa_title")}</CardTitle>
                                        <CardDescription>{t("settings_page.twofa_desc")}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/30">
                                    <div className="flex items-center gap-3">
                                        <Shield className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-bold">{t("settings_page.authenticator_app")}</p>
                                            <p className="text-xs text-muted-foreground">{t("settings_page.authenticator_desc")}</p>
                                        </div>
                                    </div>
                                    <Badge variant="secondary">{t("settings_page.disabled")}</Badge>
                                </div>
                                <Button variant="outline" className="w-full">{t("settings_page.enable_2fa")}</Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </PageLayout>
    );
}
