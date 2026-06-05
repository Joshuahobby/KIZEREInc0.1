import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { AppLayout } from "@/components/layout/admin-layout";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Store, Shield, Bell, CreditCard, Upload, Loader2, Users, Plus, Trash2, Key, CalendarDays, RefreshCw, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

interface ProfileFormValues {
  name: string;
  email: string;
  phone: string;
  address: string;
  walletPhone: string;
}

interface Cashier {
  id: string;
  name: string;
  pin: string;
  isActive: boolean;
}

function SubscriptionTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [momoPhone, setMomoPhone] = React.useState("");
  const [renewing, setRenewing] = React.useState(false);
  const [pendingRef, setPendingRef] = React.useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/pos/my-subscription"],
    queryFn: () => apiGet<{ success: boolean; subscription: any }>("/api/pos/my-subscription"),
  });

  const sub = data?.subscription;

  const PLAN_COLORS: Record<string, string> = {
    basic: "bg-slate-500/10 text-slate-600 border-slate-300",
    standard: "bg-blue-500/10 text-blue-600 border-blue-300",
    premium: "bg-emerald-500/10 text-emerald-600 border-emerald-300",
    enterprise: "bg-purple-500/10 text-purple-600 border-purple-300",
  };

  const handleRenew = async () => {
    if (!momoPhone.trim()) return;
    setRenewing(true);
    try {
      const res = await apiPost<any>("/api/pos/my-subscription/renew", { phoneNumber: momoPhone.trim() });
      if (res.success) {
        setPendingRef(res.transactionRef);
        toast({ title: "Payment Initiated", description: "Check your phone for the MoMo prompt." });
      }
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setRenewing(false);
    }
  };

  // Poll for renewal completion
  React.useEffect(() => {
    if (!pendingRef) return;
    const timer = setTimeout(async () => {
      try {
        const res = await apiGet<any>(`/api/payments/verify/${pendingRef}`);
        if (res.status === "COMPLETED") {
          toast({ title: "Subscription Renewed!", description: "Your plan has been extended by 1 year." });
          setPendingRef(null);
          setMomoPhone("");
          queryClient.invalidateQueries({ queryKey: ["/api/pos/my-subscription"] });
        } else {
          setPendingRef(prev => prev); // re-trigger effect
        }
      } catch {
        setPendingRef(prev => prev);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [pendingRef, queryClient, toast]);

  if (isLoading) return <Skeleton className="h-48 w-full rounded-3xl" />;

  const isExpired = sub && !sub.isActive && sub.plan !== "basic";
  const isExpiringSoon = sub && sub.isActive && sub.daysLeft !== null && sub.daysLeft <= 30 && sub.plan !== "basic";

  return (
    <Card className="border-border/50 shadow-premium bg-background/50 backdrop-blur-md rounded-3xl overflow-hidden">
      <CardHeader className="border-b border-border/50 bg-muted/20">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Subscription
            </CardTitle>
            <CardDescription>Your KIZERE retailer plan and renewal status.</CardDescription>
          </div>
          <Badge className={`capitalize font-bold text-xs border ${PLAN_COLORS[sub?.plan ?? "basic"]}`}>
            {sub?.plan ?? "basic"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Status Row */}
        <div className="flex flex-wrap gap-4">
          {sub?.plan === "basic" ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Basic plan — always active, no expiry
            </div>
          ) : isExpired ? (
            <div className="flex items-center gap-2 text-sm text-destructive font-semibold">
              <AlertTriangle className="h-4 w-4" />
              Subscription expired — POS features may be limited
            </div>
          ) : isExpiringSoon ? (
            <div className="flex items-center gap-2 text-sm text-amber-600 font-semibold">
              <Clock className="h-4 w-4" />
              Expiring in {sub.daysLeft} days
            </div>
          ) : sub?.isActive ? (
            <div className="flex items-center gap-2 text-sm text-emerald-600 font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              Active — {sub.daysLeft !== null ? `${sub.daysLeft} days remaining` : "No expiry"}
            </div>
          ) : null}

          {sub?.expiresAt && (
            <div className="text-sm text-muted-foreground">
              Expires: <span className="font-semibold">{format(new Date(sub.expiresAt), "MMM d, yyyy")}</span>
            </div>
          )}
        </div>

        {/* Renew section — hidden for basic plan */}
        {sub?.plan !== "basic" && (
          <div className="border border-border/50 rounded-2xl p-5 space-y-4 bg-muted/10">
            <div>
              <h4 className="font-semibold text-sm">Renew Annual Subscription</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Adds 1 year from today (or stacks on remaining time). Payment via MoMo.
              </p>
            </div>
            {pendingRef ? (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Awaiting MoMo confirmation...
                <Button variant="ghost" size="sm" onClick={() => setPendingRef(null)} className="text-xs">
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex gap-3">
                <Input
                  placeholder="MoMo phone e.g. 0788123456"
                  value={momoPhone}
                  onChange={e => setMomoPhone(e.target.value)}
                  className="rounded-xl max-w-xs"
                  type="tel"
                />
                <Button
                  onClick={handleRenew}
                  disabled={renewing || !momoPhone.trim()}
                  className="rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {renewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Renew
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function RetailerSettings() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, refreshUser } = useAuth();
  
  const [cashiers, setCashiers] = React.useState<Cashier[]>([]);
  const [newCashierName, setNewCashierName] = React.useState("");
  const [newCashierPin, setNewCashierPin] = React.useState("");
  const isInitialized = React.useRef(false);

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
      
      // Load cashiers from user preferences ONLY ONCE or if user changes
      if (user?.preferences?.cashiers && !isInitialized.current) {
        setCashiers(user.preferences.cashiers);
        isInitialized.current = true;
      }
    }
  }, [profileData, reset, user]);

  const updateMutation = useMutation({
    mutationFn: (values: ProfileFormValues) => apiPatch("/api/pos/my-profile", {
      ...values,
      preferences: {
        ...user?.preferences,
        cashiers
      }
    }),
    onSuccess: async () => {
      await refreshUser();
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

  const addCashier = () => {
    if (!newCashierName.trim() || !newCashierPin.match(/^\d{4,6}$/)) {
      toast({
        title: "Invalid Input",
        description: "Please provide a name and a 4-6 digit numeric PIN.",
        variant: "destructive"
      });
      return;
    }

    const newCashier: Cashier = {
      id: Math.random().toString(36).substring(2, 9),
      name: newCashierName.trim(),
      pin: newCashierPin,
      isActive: true
    };

    setCashiers([...cashiers, newCashier]);
    setNewCashierName("");
    setNewCashierPin("");
    toast({
      title: "Cashier Added",
      description: "Remember to save your changes to permanentely store the new cashier."
    });
  };

  const removeCashier = (id: string) => {
    setCashiers(cashiers.filter(c => c.id !== id));
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
            <TabsTrigger value="cashiers" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="h-4 w-4 mr-2" />
              Cashiers
            </TabsTrigger>
            <TabsTrigger value="subscription" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <CalendarDays className="h-4 w-4 mr-2" />
              Subscription
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

          <TabsContent value="cashiers" className="space-y-6">
            <Card className="border-border/50 shadow-premium bg-background/50 backdrop-blur-md rounded-3xl overflow-hidden">
              <CardHeader className="border-b border-border/50 bg-muted/20">
                <CardTitle>Cashier Sub-Accounts</CardTitle>
                <CardDescription>Manage staff accounts for the POS terminal. Each cashier requires a unique PIN.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid gap-4 sm:grid-cols-[1fr_120px_auto] items-end border-b border-border/50 pb-6">
                  <div className="space-y-2">
                    <Label htmlFor="cashierName">Full Name</Label>
                    <Input 
                      id="cashierName" 
                      placeholder="e.g. Jean Pierre" 
                      value={newCashierName}
                      onChange={(e) => setNewCashierName(e.target.value)}
                      className="rounded-xl bg-background border-border/50" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cashierPin">PIN (4-6 digits)</Label>
                    <Input 
                      id="cashierPin" 
                      type="password" 
                      maxLength={6}
                      placeholder="****"
                      value={newCashierPin}
                      onChange={(e) => setNewCashierPin(e.target.value)}
                      className="rounded-xl bg-background border-border/50" 
                    />
                  </div>
                  <Button onClick={addCashier} className="rounded-xl gap-2 h-10">
                    <Plus className="h-4 w-4" />
                    Add Cashier
                  </Button>
                </div>

                <div className="space-y-4">
                  {cashiers.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground bg-muted/5 rounded-2xl border border-dashed border-border/50">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>No cashiers added yet.</p>
                      <p className="text-xs">Add cashiers to enable PIN-based terminal locking and auditing.</p>
                    </div>
                  ) : (
                    cashiers.map((cashier) => (
                      <div key={cashier.id} className="flex items-center justify-between p-4 bg-muted/10 rounded-2xl border border-border/50 group">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {cashier.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold">{cashier.name}</p>
                            <div className="flex items-center text-xs text-muted-foreground gap-2">
                              <Key className="h-3 w-3" />
                              <span>PIN Active</span>
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeCashier(cashier.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
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

          <TabsContent value="subscription" className="space-y-6">
            <SubscriptionTab />
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
