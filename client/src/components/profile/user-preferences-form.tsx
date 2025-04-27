import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Moon, Sun, Monitor, Grid3X3, LayoutGrid, Palette, Bell } from "lucide-react";

interface UserPreferencesFormProps {
  preferences: {
    theme?: string;
    layout?: string;
    cardDensity?: string;
    widgetFavorites?: string[];
    notifications?: {
      email?: boolean;
      inApp?: boolean;
    };
  };
  isLoading: boolean;
}

export function UserPreferencesForm({ preferences, isLoading }: UserPreferencesFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [formValues, setFormValues] = useState({
    theme: preferences.theme || 'system',
    layout: preferences.layout || 'default',
    cardDensity: preferences.cardDensity || 'comfortable',
    notifications: {
      email: preferences.notifications?.email !== false,
      inApp: preferences.notifications?.inApp !== false
    }
  });

  // API mutation for updating preferences
  const updatePreferencesMutation = useMutation({
    mutationFn: async (values: typeof formValues) => {
      const response = await apiRequest("PUT", "/api/me/preferences", values);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("profile.preferences.updateSuccess"),
        description: t("profile.preferences.updateSuccessDesc"),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/me/preferences'] });
    },
    onError: (error) => {
      toast({
        title: t("profile.preferences.updateError"),
        description: error.message || t("profile.preferences.updateErrorDesc"),
        variant: "destructive"
      });
    }
  });

  const handleSavePreferences = () => {
    updatePreferencesMutation.mutate(formValues);
  };

  // Handle theme change
  const handleThemeChange = (value: string) => {
    setFormValues((prev) => ({
      ...prev,
      theme: value
    }));

    // For immediate feedback - actually apply theme change to body
    if (value === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (value === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // system - check preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  // Handle layout change
  const handleLayoutChange = (value: string) => {
    setFormValues((prev) => ({
      ...prev,
      layout: value
    }));
  };

  // Handle card density change
  const handleDensityChange = (value: string) => {
    setFormValues((prev) => ({
      ...prev,
      cardDensity: value
    }));
  };

  // Handle notification settings change
  const handleNotificationChange = (key: 'email' | 'inApp', checked: boolean) => {
    setFormValues((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: checked
      }
    }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <Skeleton className="h-4 w-32 mb-3" />
              <div className="flex gap-4">
                <Skeleton className="h-32 w-32" />
                <Skeleton className="h-32 w-32" />
                <Skeleton className="h-32 w-32" />
              </div>
            </div>
            <div>
              <Skeleton className="h-4 w-32 mb-3" />
              <div className="flex gap-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-24" />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("profile.preferences.title")}</CardTitle>
        <CardDescription>{t("profile.preferences.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Theme Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-sm font-medium">{t("profile.preferences.theme")}</h3>
          </div>
          <RadioGroup 
            defaultValue={formValues.theme} 
            value={formValues.theme}
            onValueChange={handleThemeChange}
            className="grid grid-cols-3 gap-4"
          >
            <div>
              <RadioGroupItem 
                value="light" 
                id="theme-light" 
                className="peer sr-only" 
              />
              <Label
                htmlFor="theme-light"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <Sun className="h-6 w-6 mb-3" />
                <span>{t("profile.preferences.light")}</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem 
                value="dark" 
                id="theme-dark" 
                className="peer sr-only" 
              />
              <Label
                htmlFor="theme-dark"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <Moon className="h-6 w-6 mb-3" />
                <span>{t("profile.preferences.dark")}</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem 
                value="system" 
                id="theme-system" 
                className="peer sr-only" 
              />
              <Label
                htmlFor="theme-system"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <Monitor className="h-6 w-6 mb-3" />
                <span>{t("profile.preferences.system")}</span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Layout Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-sm font-medium">{t("profile.preferences.layout")}</h3>
          </div>
          <RadioGroup 
            defaultValue={formValues.layout} 
            value={formValues.layout}
            onValueChange={handleLayoutChange}
            className="grid grid-cols-2 gap-4"
          >
            <div>
              <RadioGroupItem 
                value="default" 
                id="layout-default" 
                className="peer sr-only" 
              />
              <Label
                htmlFor="layout-default"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full"
              >
                <div className="w-full h-20 flex flex-col border rounded mb-2 p-1">
                  <div className="bg-muted/40 h-4 w-full mb-1 rounded"></div>
                  <div className="flex-1 grid grid-cols-3 gap-1">
                    <div className="bg-muted/40 rounded"></div>
                    <div className="bg-muted/40 rounded"></div>
                    <div className="bg-muted/40 rounded"></div>
                  </div>
                </div>
                <span>{t("profile.preferences.defaultLayout")}</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem 
                value="compact" 
                id="layout-compact" 
                className="peer sr-only" 
              />
              <Label
                htmlFor="layout-compact"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full"
              >
                <div className="w-full h-20 flex flex-col border rounded mb-2 p-1">
                  <div className="bg-muted/40 h-3 w-full mb-1 rounded"></div>
                  <div className="flex-1 grid grid-cols-4 gap-1">
                    <div className="bg-muted/40 rounded"></div>
                    <div className="bg-muted/40 rounded"></div>
                    <div className="bg-muted/40 rounded"></div>
                    <div className="bg-muted/40 rounded"></div>
                  </div>
                </div>
                <span>{t("profile.preferences.compactLayout")}</span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Card Density Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-sm font-medium">{t("profile.preferences.cardDensity")}</h3>
          </div>
          <RadioGroup 
            defaultValue={formValues.cardDensity} 
            value={formValues.cardDensity}
            onValueChange={handleDensityChange}
            className="grid grid-cols-2 gap-4"
          >
            <div>
              <RadioGroupItem 
                value="comfortable" 
                id="density-comfortable" 
                className="peer sr-only" 
              />
              <Label
                htmlFor="density-comfortable"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full"
              >
                <div className="w-full h-16 flex flex-col border rounded mb-2 p-2">
                  <div className="bg-muted/40 h-3 w-3/4 mb-2 rounded"></div>
                  <div className="bg-muted/40 h-2 w-full mb-1 rounded"></div>
                  <div className="bg-muted/40 h-2 w-1/2 rounded"></div>
                </div>
                <span>{t("profile.preferences.comfortableDensity")}</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem 
                value="compact" 
                id="density-compact" 
                className="peer sr-only" 
              />
              <Label
                htmlFor="density-compact"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full"
              >
                <div className="w-full h-16 flex flex-col border rounded mb-2 p-1">
                  <div className="bg-muted/40 h-2 w-3/4 mb-1 rounded"></div>
                  <div className="bg-muted/40 h-1.5 w-full mb-1 rounded"></div>
                  <div className="bg-muted/40 h-1.5 w-full mb-1 rounded"></div>
                  <div className="bg-muted/40 h-1.5 w-1/2 rounded"></div>
                </div>
                <span>{t("profile.preferences.compactDensity")}</span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Notification Settings */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-sm font-medium">{t("profile.preferences.notifications")}</h3>
          </div>
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="notify-email" className="flex-1">
                <div className="space-y-0.5">
                  <p>{t("profile.preferences.emailNotifications")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("profile.preferences.emailNotificationsDesc")}
                  </p>
                </div>
              </Label>
              <Switch
                id="notify-email"
                checked={formValues.notifications.email}
                onCheckedChange={(checked) => handleNotificationChange('email', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="notify-inapp" className="flex-1">
                <div className="space-y-0.5">
                  <p>{t("profile.preferences.inAppNotifications")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("profile.preferences.inAppNotificationsDesc")}
                  </p>
                </div>
              </Label>
              <Switch
                id="notify-inapp"
                checked={formValues.notifications.inApp}
                onCheckedChange={(checked) => handleNotificationChange('inApp', checked)}
              />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSavePreferences}
          disabled={updatePreferencesMutation.isPending}
        >
          {updatePreferencesMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("common.saving")}
            </>
          ) : (
            t("profile.preferences.savePreferences")
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}