import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPatch, invalidateQueries } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  History, 
  Settings, 
  ShieldAlert, 
  ShieldCheck,
  FileText,
  Calendar,
  Package,
  ArrowRightLeft,
  Loader2
} from "lucide-react";
import { format } from "date-fns";

interface CustomerDetailsDialogProps {
  customerId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerDetailsDialog({ customerId, open, onOpenChange }: CustomerDetailsDialogProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [internalNotes, setInternalNotes] = React.useState("");

  const { data: customerData, isLoading } = useQuery({
    queryKey: ["/api/pos/my-customers", customerId],
    queryFn: () => apiGet<any>(`/api/pos/my-customers/${customerId}`),
    enabled: !!customerId && open,
  });

  const customer = customerData?.customer;

  React.useEffect(() => {
    if (customer?.settings?.internalNotes) {
      setInternalNotes(customer.settings.internalNotes);
    } else {
      setInternalNotes("");
    }
  }, [customer]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: { isBlocked?: boolean; internalNotes?: string }) => {
      return apiPatch(`/api/pos/my-customers/${customerId}/settings`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pos/my-customers", customerId] });
      queryClient.invalidateQueries({ queryKey: ["/api/pos/my-customers"] });
      toast({
        title: t("pos.crm.updateSuccess") || "Settings updated",
        description: t("pos.crm.updateSuccessDesc") || "Customer settings have been saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: t("common.error") || "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleToggleBlock = () => {
    updateSettingsMutation.mutate({ isBlocked: !customer?.settings?.isBlocked });
  };

  const handleSaveNotes = () => {
    updateSettingsMutation.mutate({ internalNotes });
  };

  if (!customerId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !customer ? (
          <div className="p-6 text-center">{t("pos.crm.notFound") || "Customer not found"}</div>
        ) : (
          <>
            <div className="bg-primary/5 p-6 pb-0">
              <DialogHeader className="mb-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-left">
                    <DialogTitle className="text-2xl font-black tracking-tight">{customer.fullName}</DialogTitle>
                    <DialogDescription className="text-sm font-mono flex items-center gap-2 mt-1">
                      ID: CUST-{customer.id}
                      {customer.settings?.isBlocked && (
                        <Badge variant="destructive" className="text-[10px] h-4 font-black px-1.5 uppercase tracking-tighter">
                          {t("pos.crm.blocked") || "Blocked"}
                        </Badge>
                      )}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <Tabs defaultValue="history" className="w-full">
                <TabsList className="w-full justify-start bg-transparent border-b border-border/50 rounded-none h-12 p-0 gap-6">
                  <TabsTrigger 
                    value="history" 
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 h-full font-bold text-sm"
                  >
                    <History className="h-4 w-4 mr-2" />
                    {t("pos.crm.history") || "Purchase History"}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="settings"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 h-full font-bold text-sm"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {t("pos.crm.settings") || "Store Settings"}
                  </TabsTrigger>
                </TabsList>

                <div className="p-6 bg-background">
                  <TabsContent value="history" className="mt-0">
                    <ScrollArea className="h-[400px] pr-4">
                      {customer.history && customer.history.length > 0 ? (
                        <div className="space-y-4">
                          {customer.history.map((item: any) => (
                            <Card key={item.id} className="border-border/50 shadow-sm overflow-hidden group hover:border-primary/30 transition-colors">
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                                      {item.event === "sale" ? <Package className="h-4 w-4" /> : <ArrowRightLeft className="h-4 w-4" />}
                                    </div>
                                    <p className="font-bold text-sm capitalize">{item.event.replace("_", " ")}</p>
                                  </div>
                                  <Badge variant="outline" className="text-[10px] font-mono">
                                    {format(new Date(item.timestamp), "MMM d, yyyy")}
                                  </Badge>
                                </div>
                                <div className="pl-9">
                                  <p className="text-sm font-medium">{item.productName}</p>
                                  <p className="text-xs text-muted-foreground font-mono">{item.serialNumber}</p>
                                  {item.notes && (
                                    <p className="mt-2 text-xs text-muted-foreground italic bg-muted/30 p-2 rounded-lg border-l-2 border-primary/20">
                                      "{item.notes}"
                                    </p>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                          <Package className="h-12 w-12 mb-2 opacity-20" />
                          <p className="text-sm">{t("pos.crm.noHistory") || "No store activity found for this customer."}</p>
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="settings" className="mt-0 space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-2xl border border-border/50 bg-muted/10">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-bold flex items-center gap-2 text-foreground">
                            {customer.settings?.isBlocked ? <ShieldAlert className="h-4 w-4 text-destructive" /> : <ShieldCheck className="h-4 w-4 text-emerald-500" />}
                            {t("pos.crm.blockCustomer") || "Block Customer"}
                          </Label>
                          <p className="text-xs text-muted-foreground max-w-[300px]">
                            {t("pos.crm.blockCustomerDesc") || "Prevent this customer from registering items at your store. This does not affect other retailers."}
                          </p>
                        </div>
                        <Switch 
                          checked={customer.settings?.isBlocked || false} 
                          onCheckedChange={handleToggleBlock}
                          disabled={updateSettingsMutation.isPending}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-bold flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          {t("pos.crm.internalNotes") || "Internal Notes"}
                        </Label>
                        <Textarea 
                          placeholder={t("pos.crm.notesPlaceholder") || "Add private notes about this customer (e.g., payment performance, reliability)..."}
                          className="min-h-[150px] rounded-2xl resize-none border-border/50 bg-muted/5 focus:bg-background transition-colors"
                          value={internalNotes}
                          onChange={(e) => setInternalNotes(e.target.value)}
                        />
                        <div className="flex justify-end">
                          <Button 
                            size="sm" 
                            className="rounded-xl px-6" 
                            onClick={handleSaveNotes}
                            disabled={updateSettingsMutation.isPending || internalNotes === (customer.settings?.internalNotes || "")}
                          >
                            {updateSettingsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t("common.saveChanges") || "Save Notes"}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-border/50" />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">{t("pos.crm.customerSince") || "Customer Since"}</p>
                        <p className="text-sm font-bold flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          {customer.history && customer.history.length > 0 
                            ? format(new Date(customer.history[customer.history.length-1].timestamp), "MMMM yyyy") 
                            : "N/A"
                          }
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">{t("pos.crm.totalRegistrations") || "Total Store Items"}</p>
                        <p className="text-sm font-bold flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary" />
                          {customer.history?.length || 0}
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
