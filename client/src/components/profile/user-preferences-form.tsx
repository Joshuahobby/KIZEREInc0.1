import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { UserPreferences } from "@/types/user";

// UI Components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

// Define the form schema
const preferencesFormSchema = z.object({
  theme: z.enum(["light", "dark", "system"], {
    required_error: "Please select a theme",
  }),
  language: z.string({
    required_error: "Please select a language",
  }),
  notifications: z.object({
    email: z.boolean().default(true),
    sms: z.boolean().default(false),
    push: z.boolean().default(true),
  }),
  dashboardLayout: z.enum(["default", "compact", "wide"], {
    required_error: "Please select a dashboard layout",
  }),
  dashboardStyle: z.enum(["standard", "classic", "command_center"], {
    required_error: "Please select a dashboard style",
  }),
  currency: z.string({
    required_error: "Please select a currency",
  }),
  timezone: z.string({
    required_error: "Please select a timezone",
  }),
});

type PreferencesFormValues = z.infer<typeof preferencesFormSchema>;

interface UserPreferencesFormProps {
  preferences: Partial<UserPreferences>;
  isLoading: boolean;
}

export function UserPreferencesForm({ preferences, isLoading }: UserPreferencesFormProps) {
  const { t, language, setLanguage } = useLanguage();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Available languages for the application
  const availableLanguages = [
    { value: "en", label: "English" },
    { value: "fr", label: "Français" },
    { value: "es", label: "Español" },
    { value: "de", label: "Deutsch" },
    { value: "pt", label: "Português" },
    { value: "ar", label: "العربية" },
  ];

  // Timezones - limited selection for simplicity
  const timezones = [
    { value: "UTC", label: "UTC" },
    { value: "America/New_York", label: "Eastern Time (US & Canada)" },
    { value: "America/Chicago", label: "Central Time (US & Canada)" },
    { value: "America/Denver", label: "Mountain Time (US & Canada)" },
    { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
    { value: "Europe/London", label: "London" },
    { value: "Europe/Paris", label: "Paris" },
    { value: "Asia/Tokyo", label: "Tokyo" },
    { value: "Australia/Sydney", label: "Sydney" },
  ];

  // Currencies - limited selection for simplicity
  const currencies = [
    { value: "USD", label: "US Dollar ($)" },
    { value: "EUR", label: "Euro (€)" },
    { value: "GBP", label: "British Pound (£)" },
    { value: "JPY", label: "Japanese Yen (¥)" },
    { value: "CAD", label: "Canadian Dollar (C$)" },
    { value: "AUD", label: "Australian Dollar (A$)" },
    { value: "NGN", label: "Nigerian Naira (₦)" },
    { value: "GHS", label: "Ghanaian Cedi (GH₵)" },
  ];

  // Set up the form with default values from the preferences
  const form = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesFormSchema),
    defaultValues: {
      theme: (preferences?.theme as "light" | "dark" | "system") || "system",
      language: preferences?.language || language || "en",
      notifications: {
        email: preferences?.notifications?.email ?? true,
        sms: preferences?.notifications?.sms ?? false,
        push: preferences?.notifications?.push ?? true,
      },
      dashboardLayout: (preferences?.dashboardLayout as "default" | "compact" | "wide") || "default",
      dashboardStyle: (preferences?.dashboardStyle as "standard" | "classic" | "command_center") || "standard",
      currency: preferences?.currency || "USD",
      timezone: preferences?.timezone || "UTC",
    },
  });

  // Set up mutation for updating preferences
  const mutation = useMutation({
    mutationFn: (data: PreferencesFormValues) => {
      return apiRequest('/api/me/preferences', {
        method: 'PUT',
        data
      });
    },
    onSuccess: () => {
      toast({
        title: t("profile.preferences.saveSuccess"),
        description: t("profile.preferences.saveSuccessDesc"),
      });
      // Update the language if it was changed
      const newLanguage = form.getValues().language;
      if (newLanguage !== language) {
        setLanguage(newLanguage as any);
      }
      // Refresh preferences data
      queryClient.invalidateQueries({ queryKey: ['/api/me/preferences'] });
    },
    onError: (error) => {
      console.error("Error updating preferences:", error);
      toast({
        title: t("profile.preferences.saveError"),
        description: (error as Error)?.message || t("profile.preferences.saveErrorDesc"),
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSaving(false);
    },
  });

  // Handle form submission
  const onSubmit = (data: PreferencesFormValues) => {
    setIsSaving(true);
    mutation.mutate(data);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-24 ml-auto" />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("profile.preferences.title")}</CardTitle>
        <CardDescription>{t("profile.preferences.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid gap-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">{t("profile.preferences.appearance")}</h3>
                <Separator />
                <div className="grid gap-4 md:grid-cols-2 mt-4">
                  <FormField
                    control={form.control}
                    name="theme"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("profile.preferences.theme")}</FormLabel>
                        <Select 
                          disabled={isSaving}
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("profile.preferences.selectTheme")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="light">{t("profile.preferences.themes.light")}</SelectItem>
                            <SelectItem value="dark">{t("profile.preferences.themes.dark")}</SelectItem>
                            <SelectItem value="system">{t("profile.preferences.themes.system")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {t("profile.preferences.themeDescription")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("profile.preferences.language")}</FormLabel>
                        <Select 
                          disabled={isSaving}
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("profile.preferences.selectLanguage")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableLanguages.map((language) => (
                              <SelectItem key={language.value} value={language.value}>
                                {language.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {t("profile.preferences.languageDescription")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">{t("profile.preferences.notifications")}</h3>
                <Separator />
                <div className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="notifications.email"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-md border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            {t("profile.preferences.emailNotifications")}
                          </FormLabel>
                          <FormDescription>
                            {t("profile.preferences.emailNotificationsDesc")}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isSaving}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notifications.sms"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-md border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            {t("profile.preferences.smsNotifications")}
                          </FormLabel>
                          <FormDescription>
                            {t("profile.preferences.smsNotificationsDesc")}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isSaving}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notifications.push"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-md border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            {t("profile.preferences.pushNotifications")}
                          </FormLabel>
                          <FormDescription>
                            {t("profile.preferences.pushNotificationsDesc")}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isSaving}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">{t("profile.preferences.dashboardSettings")}</h3>
                <Separator />
                <div className="grid gap-4 md:grid-cols-2 mt-4">
                  <FormField
                    control={form.control}
                    name="dashboardLayout"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("profile.preferences.layout")}</FormLabel>
                        <Select 
                          disabled={isSaving}
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("profile.preferences.selectLayout")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="default">{t("profile.preferences.layouts.default")}</SelectItem>
                            <SelectItem value="compact">{t("profile.preferences.layouts.compact")}</SelectItem>
                            <SelectItem value="wide">{t("profile.preferences.layouts.wide")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {t("profile.preferences.layoutDescription")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dashboardStyle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dashboard Style</FormLabel>
                        <Select 
                          disabled={isSaving}
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a dashbaord style" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="standard">Standard (Default)</SelectItem>
                            <SelectItem value="classic">Classic (Detailed)</SelectItem>
                            <SelectItem value="command_center">Command Center (Admin Focus)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose your preferred dashboard experience for immediate redirection after login.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">{t("profile.preferences.regionalization")}</h3>
                <Separator />
                <div className="grid gap-4 md:grid-cols-2 mt-4">
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("profile.preferences.currency")}</FormLabel>
                        <Select 
                          disabled={isSaving}
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("profile.preferences.selectCurrency")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {currencies.map((currency) => (
                              <SelectItem key={currency.value} value={currency.value}>
                                {currency.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {t("profile.preferences.currencyDescription")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("profile.preferences.timezone")}</FormLabel>
                        <Select 
                          disabled={isSaving}
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("profile.preferences.selectTimezone")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {timezones.map((timezone) => (
                              <SelectItem key={timezone.value} value={timezone.value}>
                                {timezone.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {t("profile.preferences.timezoneDescription")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
            
            <CardFooter className="flex justify-end gap-2 px-0">
              <Button
                type="submit"
                disabled={isSaving || !form.formState.isDirty}
              >
                {isSaving ? t("common.saving") : t("common.saveChanges")}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}