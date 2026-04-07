import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { apiGet, apiPatch } from "@/lib/api";
import { AppLayout } from "@/components/layout/admin-layout";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Store, Shield, Bell, CreditCard, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProfileFormValues {
  name: string;
  email: string;
  phone: string;
  address: string;
  walletPhone: string;
}

export default function RetailerSettings() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profileData, isLoading: isProfileLoading } = useQuery({
    queryKey: ["/api/pos/my-profile"],
    queryFn: () => apiGet<{ profile: any }>("/api/pos/my-profile"),
  });

  const { register, handleSubmit, reset } = useForm<ProfileFormValues>({
    defaultValues: { name: "", email: "", phone: "", address: "" },
  });

  useEffect(() => {
    if (profileData?.profile) {
      const p = profileData.profile;
      reset({
        name: p.name || "",
        email: p.email || "",
        phone: p.phone || "",
        address: p.address || "",
        walletPhone: p.walletPhone || "",
      });
    }
  }, [profileData, reset]);

  const updateMutation = useMutation({
    mutationFn: (values: ProfileFormValues) => apiPatch("/api/pos/my-profile", values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pos/my-profile"] });
      toast({
        title: "Settings Saved",
        description: "Your retailer preferences have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Could not update your profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: ProfileFormValues) => {
    updateMutation.mutate(values);
  };

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="container max-w-5xl mx-auto py-6 space-y-8"
      >
        <DashboardPageHeader
          title={t("pos.settings") || "Retailer Settings"}
          description={t("pos.settingsDesc") || "Manage your store profile, POS configuration, and notifications."}
          actions={
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={updateMutation.isPending}
              className="gap-2 shadow-[0_0_20px_rgba(var(--primary),0.3)]"
            >
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </Button>
          }
        />

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="bg-background/50 backdrop-blur-md shadow-sm border border-border/50 p-1 rounded-2xl mb-6">
            <TabsTrigger value="general" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Store className="h-4 w-4 mr-2" />
              Store Profile
            </TabsTrigger>
            <TabsTrigger value="pos" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <CreditCard className="h-4 w-4 mr-2" />
              POS Configuration
            </TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card className="border-border/50 shadow-premium bg-background/50 backdrop-blur-md rounded-3xl overflow-hidden">
              <CardHeader className="border-b border-border/50 bg-muted/20">
                <CardTitle>Business Information</CardTitle>
                <CardDescription>Public information about your store.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {isProfileLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full rounded-xl" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-6 items-start">
                    <div className="flex-1 space-y-4 w-full">
                      <div className="space-y-2">
                        <Label htmlFor="storeName">Store Name</Label>
                        <Input id="storeName" {...register("name")} className="rounded-xl bg-background border-border/50" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Business Email</Label>
                        <Input id="email" type="email" {...register("email")} className="rounded-xl bg-background border-border/50" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" type="tel" {...register("phone")} className="rounded-xl bg-background border-border/50" />
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-4 border border-border/50 rounded-2xl p-6 bg-muted/10 w-full sm:w-64">
                      <div className="h-32 w-32 rounded-full border-2 border-dashed border-primary/40 flex items-center justify-center bg-background group hover:border-primary transition-colors cursor-pointer relative overflow-hidden">
                        <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
                        <div className="flex flex-col items-center gap-2 text-primary">
                          <Upload className="h-8 w-8" />
                          <span className="text-xs font-bold uppercase">Upload Logo</span>
                        </div>
                      </div>
                      <p className="text-xs text-center text-muted-foreground">Recommended: 512x512px, transparent PNG</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="address">Physical Address</Label>
                  <Input id="address" {...register("address")} disabled={isProfileLoading} className="rounded-xl bg-background border-border/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="walletPhone">MoMo Wallet Number (for commission payouts)</Label>
                  <Input id="walletPhone" type="tel" placeholder="e.g. +250788123456" {...register("walletPhone")} disabled={isProfileLoading} className="rounded-xl bg-background border-border/50" />
                  <p className="text-xs text-muted-foreground">This number will receive your POS commission payouts via Mobile Money.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pos" className="space-y-6">
            <Card className="border-border/50 shadow-premium bg-background/50 backdrop-blur-md rounded-3xl overflow-hidden">
              <CardHeader className="border-b border-border/50 bg-muted/20">
                <CardTitle>POS Defaults</CardTitle>
                <CardDescription>Configure default behaviors for the point of sale interface.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                  <div>
                    <h4 className="font-bold">Auto-Sync Inventory</h4>
                    <p className="text-sm text-muted-foreground">Automatically sync sales with central inventory.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                  <div>
                    <h4 className="font-bold">Require Digital Receipts</h4>
                    <p className="text-sm text-muted-foreground">Force entry of customer phone/email for receipts.</p>
                  </div>
                  <Switch />
                </div>
                <div className="space-y-2 pt-2">
                  <Label htmlFor="currency">Default Currency</Label>
                  <Input id="currency" defaultValue="RWF" disabled className="rounded-xl bg-muted/50 border-border/50 w-full sm:w-64" />
                  <p className="text-xs text-muted-foreground">Currency is fixed based on your regional settings.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="border-border/50 shadow-premium bg-background/50 backdrop-blur-md rounded-3xl overflow-hidden">
              <CardHeader className="border-b border-border/50 bg-muted/20">
                <CardTitle>Alert Preferences</CardTitle>
                <CardDescription>Manage how you want to be notified.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                  <div>
                    <h4 className="font-bold">Stolen Item Alerts</h4>
                    <p className="text-sm text-muted-foreground">Get notified immediately if a scanned item is flagged as stolen.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                  <div>
                    <h4 className="font-bold">Daily Sales Summary</h4>
                    <p className="text-sm text-muted-foreground">Receive an email summary of your daily transactions.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                  <div>
                    <h4 className="font-bold">Low Stock Alerts</h4>
                    <p className="text-sm text-muted-foreground">Warn me when a product variant is running low on inventory.</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
             <Card className="border-border/50 shadow-premium bg-background/50 backdrop-blur-md rounded-3xl overflow-hidden border-destructive/20">
              <CardHeader className="border-b border-destructive/20 bg-destructive/5">
                <CardTitle className="text-destructive">Critical Actions</CardTitle>
                <CardDescription>Actions that could affect your account access.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                 <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold">Two-Factor Authentication</h4>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security to your retailer account.</p>
                  </div>
                  <Button variant="outline" className="w-full sm:w-auto rounded-xl">Enable 2FA</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </AppLayout>
  );
}
