import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { PageLayout } from "@/components/layout/page-layout";
import { UserPreferencesForm } from "@/components/profile/user-preferences-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Bell, Palette, Globe } from "lucide-react";

export default function SettingsPage() {
    const { t } = useLanguage();
    const { user } = useAuth();

    // Fetch user preferences
    const { data: preferencesData, isLoading: preferencesLoading } = useQuery({
        queryKey: ['/api/me/preferences'],
        enabled: !!user,
    });

    return (
        <PageLayout>
            <DashboardHeader
                heading={t("profile.tabs.preferences")}
                text="Manage your platform settings and preferences"
            />

            <div className="grid gap-8">
                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 max-w-[600px]">
                        <TabsTrigger value="general" className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            General
                        </TabsTrigger>
                        <TabsTrigger value="notifications" className="flex items-center gap-2">
                            <Bell className="h-4 w-4" />
                            Notifications
                        </TabsTrigger>
                        <TabsTrigger value="appearance" className="flex items-center gap-2">
                            <Palette className="h-4 w-4" />
                            Appearance
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-4 mt-6">
                        <UserPreferencesForm
                            preferences={preferencesData || {}}
                            isLoading={preferencesLoading}
                        />
                    </TabsContent>

                    <TabsContent value="notifications" className="space-y-4 mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Notification Settings</CardTitle>
                                <CardDescription>Manage how you receive alerts and updates.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">Notification settings are currently managed within the General Preferences tab.</p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="appearance" className="space-y-4 mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Appearance Settings</CardTitle>
                                <CardDescription>Customize the look and feel of the application.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">Theme settings are currently managed within the General Preferences tab.</p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </PageLayout>
    );
}
