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
  const { t, language, setLanguage, getLanguages } = useLanguage();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Available languages for the application
  const availableLanguages = getLanguages().map(lang => ({
    value: lang.code,
    label: lang.name
  }));

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
    { value: "RWF", label: "Rwandan Franc (RWF)" },
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
    <Card className="border-white/10 shadow-premium bg-[#0B0F1A]">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-white/5 pb-6">
        <CardTitle className="text-2xl font-black tracking-tighter">{t("profile.preferences.title")}</CardTitle>
        <CardDescription className="font-bold text-white/40">{t("profile.preferences.description")}</CardDescription>
      </CardHeader>
      <CardContent className="pt-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid gap-8">
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">{t("profile.preferences.appearance")}</h3>
                <Separator className="bg-white/5" />
                <div className="grid gap-4 md:grid-cols-2 mt-4">
                  <FormField
                    control={form.control}
                    name="theme"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-white/40">{t("profile.preferences.theme")}</FormLabel>
                        <Select
                          disabled={isSaving}
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-14 bg-white/5 border-white/5 rounded-2xl font-black text-white focus:ring-primary/20 transition-all">
                              <SelectValue placeholder={t("profile.preferences.selectTheme")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#0B0F1A] border-white/10 rounded-2xl">
                            <SelectItem value="light" className="h-12 font-bold focus:bg-primary focus:text-black">{t("profile.preferences.themes.light")}</SelectItem>
                            <SelectItem value="dark" className="h-12 font-bold focus:bg-primary focus:text-black">{t("profile.preferences.themes.dark")}</SelectItem>
                            <SelectItem value="system" className="h-12 font-bold focus:bg-primary focus:text-black">{t("profile.preferences.themes.system")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-white/20 font-bold italic">
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
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-white/40">{t("profile.preferences.language")}</FormLabel>
                        <Select
                          disabled={isSaving}
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-14 bg-white/5 border-white/5 rounded-2xl font-black text-white focus:ring-primary/20 transition-all">
                              <SelectValue placeholder={t("profile.preferences.selectLanguage")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#0B0F1A] border-white/10 rounded-2xl">
                            {availableLanguages.map((language) => (
                              <SelectItem key={language.value} value={language.value} className="h-12 font-bold focus:bg-primary focus:text-black">
                                {language.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-white/20 font-bold italic">
                          {t("profile.preferences.languageDescription")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">{t("profile.preferences.notifications")}</h3>
                <Separator className="bg-white/5" />
                <div className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="notifications.email"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-2xl border border-white/5 p-4 bg-white/5 h-auto md:h-20 transition-all hover:bg-white/10">
                        <div className="space-y-1">
                          <FormLabel className="text-sm font-black text-white uppercase tracking-wider">
                            {t("profile.preferences.emailNotifications")}
                          </FormLabel>
                          <FormDescription className="text-xs font-bold text-white/30">
                            {t("profile.preferences.emailNotificationsDesc")}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isSaving}
                            className="scale-110"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notifications.sms"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-2xl border border-white/5 p-4 bg-white/5 h-auto md:h-20 transition-all hover:bg-white/10">
                        <div className="space-y-1">
                          <FormLabel className="text-sm font-black text-white uppercase tracking-wider">
                            {t("profile.preferences.smsNotifications")}
                          </FormLabel>
                          <FormDescription className="text-xs font-bold text-white/30">
                            {t("profile.preferences.smsNotificationsDesc")}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isSaving}
                            className="scale-110"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notifications.push"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-2xl border border-white/5 p-4 bg-white/5 h-auto md:h-20 transition-all hover:bg-white/10">
                        <div className="space-y-1">
                          <FormLabel className="text-sm font-black text-white uppercase tracking-wider">
                            {t("profile.preferences.pushNotifications")}
                          </FormLabel>
                          <FormDescription className="text-xs font-bold text-white/30">
                            {t("profile.preferences.pushNotificationsDesc")}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isSaving}
                            className="scale-110"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">{t("profile.preferences.dashboardSettings")}</h3>
                <Separator className="bg-white/5" />
                <div className="grid gap-4 md:grid-cols-2 mt-4">
                  <FormField
                    control={form.control}
                    name="dashboardLayout"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-white/40">{t("profile.preferences.layout")}</FormLabel>
                        <Select
                          disabled={isSaving}
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-14 bg-white/5 border-white/5 rounded-2xl font-black text-white outline-none ring-offset-background transition-all">
                              <SelectValue placeholder={t("profile.preferences.selectLayout")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#0B0F1A] border-white/10 rounded-2xl">
                            <SelectItem value="default" className="h-12 font-bold">{t("profile.preferences.layouts.default")}</SelectItem>
                            <SelectItem value="compact" className="h-12 font-bold">{t("profile.preferences.layouts.compact")}</SelectItem>
                            <SelectItem value="wide" className="h-12 font-bold">{t("profile.preferences.layouts.wide")}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-white/20 font-bold italic">
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
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-white/40">Dashboard Style</FormLabel>
                        <Select
                          disabled={isSaving}
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-14 bg-white/5 border-white/5 rounded-2xl font-black text-white outline-none ring-offset-background transition-all">
                              <SelectValue placeholder="Select a dashbaord style" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#0B0F1A] border-white/10 rounded-2xl">
                            <SelectItem value="standard" className="h-12 font-bold">Standard (Default)</SelectItem>
                            <SelectItem value="classic" className="h-12 font-bold">Classic (Detailed)</SelectItem>
                            <SelectItem value="command_center" className="h-12 font-bold">Command Center (Admin Focus)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-white/20 font-bold italic">
                          Choose your preferred dashboard experience for immediate redirection after login.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">{t("profile.preferences.regionalization")}</h3>
                <Separator className="bg-white/5" />
                <div className="grid gap-4 md:grid-cols-2 mt-4">
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-white/40">{t("profile.preferences.currency")}</FormLabel>
                        <Select
                          disabled={isSaving}
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-14 bg-white/5 border-white/5 rounded-2xl font-black text-white outline-none ring-offset-background transition-all">
                              <SelectValue placeholder={t("profile.preferences.selectCurrency")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#0B0F1A] border-white/10 rounded-2xl max-h-[300px]">
                            {currencies.map((currency) => (
                              <SelectItem key={currency.value} value={currency.value} className="h-12 font-bold">
                                {currency.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-white/20 font-bold italic">
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
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-white/40">{t("profile.preferences.timezone")}</FormLabel>
                        <Select
                          disabled={isSaving}
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-14 bg-white/5 border-white/5 rounded-2xl font-black text-white outline-none ring-offset-background transition-all">
                              <SelectValue placeholder={t("profile.preferences.selectTimezone")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#0B0F1A] border-white/10 rounded-2xl max-h-[300px]">
                            {timezones.map((timezone) => (
                              <SelectItem key={timezone.value} value={timezone.value} className="h-12 font-bold">
                                {timezone.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-white/20 font-bold italic">
                          {t("profile.preferences.timezoneDescription")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            <CardFooter className="flex justify-end pt-8 px-0 border-t border-white/5 mt-8">
              <Button
                type="submit"
                disabled={isSaving || !form.formState.isDirty}
                className="h-14 w-full md:w-auto px-10 rounded-2xl font-black bg-primary text-black hover:bg-primary/90 shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all"
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