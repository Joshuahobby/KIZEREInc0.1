import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { apiGet } from "@/lib/api";
import { AppLayout } from "@/components/layout/admin-layout";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Smartphone, Search, FileText, ShieldCheck, RefreshCw, Package } from "lucide-react";
import { PurchaseContractModal } from "@/components/pos/PurchaseContractModal";

interface PurchaseRecord {
  ledgerId: number;
  event: string;
  timestamp: string;
  purchaseAgreement: string | null;
  productId: number;
  productName: string | null;
  brand: string | null;
  model: string | null;
  category: string | null;
  serialNumber: string | null;
  kizereId: string | null;
  status: string | null;
  retailerName: string | null;
}

export default function MyDevices() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [contractLedgerId, setContractLedgerId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/pos/my-purchase-history"],
    queryFn: () => apiGet<{ success: boolean; history: PurchaseRecord[] }>("/api/pos/my-purchase-history"),
  });

  const records = data?.history || [];

  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    return (
      !q ||
      (r.productName || "").toLowerCase().includes(q) ||
      (r.serialNumber || "").toLowerCase().includes(q) ||
      (r.brand || "").toLowerCase().includes(q) ||
      (r.retailerName || "").toLowerCase().includes(q)
    );
  });

  const statusBadge = (status: string | null) => {
    if (status === "stolen") return <Badge variant="destructive" className="text-[10px]">Stolen</Badge>;
    if (status === "transferred") return <Badge variant="outline" className="text-[10px] border-indigo-500/30 text-indigo-600">Transferred</Badge>;
    return <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600">Active</Badge>;
  };

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="container max-w-5xl mx-auto py-6 space-y-6"
      >
        <DashboardPageHeader
          title={t("devices.myDevices") || "My Registered Devices"}
          description={t("devices.myDevicesDesc") || "All devices you have purchased and registered on KIZERE."}
        />

        <Card className="border-border/50 shadow-premium overflow-hidden bg-background/50 backdrop-blur-md rounded-3xl">
          <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                Purchase History
                {records.length > 0 && (
                  <Badge variant="outline" className="ml-2 font-mono text-xs font-normal">
                    {records.length}
                  </Badge>
                )}
              </CardTitle>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, serial, or store..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 rounded-xl bg-background border-border/50 shadow-sm"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                ))}
              </div>
            ) : filtered.length > 0 ? (
              <div className="divide-y divide-border/50">
                {filtered.map((record, index) => (
                  <motion.div
                    key={record.ledgerId}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.04 }}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors group"
                  >
                    {/* Icon */}
                    <div className="shrink-0 w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                      {record.event === "transfer" ? (
                        <RefreshCw className="h-5 w-5 text-indigo-500" />
                      ) : (
                        <Package className="h-5 w-5 text-emerald-600" />
                      )}
                    </div>

                    {/* Device info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm truncate">
                          {[record.brand, record.productName, record.model].filter(Boolean).join(" · ") || `Device #${record.productId}`}
                        </p>
                        {statusBadge(record.status)}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                        {record.serialNumber && (
                          <p className="text-xs font-mono text-muted-foreground">S/N: {record.serialNumber}</p>
                        )}
                        {record.category && (
                          <p className="text-xs text-muted-foreground">{record.category}</p>
                        )}
                        {record.retailerName && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3 text-emerald-500" />
                            {record.retailerName}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Date */}
                    <div className="shrink-0 text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(record.timestamp), "MMM d, yyyy")}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60">
                        {format(new Date(record.timestamp), "HH:mm")}
                      </p>
                    </div>

                    {/* Contract button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 gap-1.5 text-xs font-semibold border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 rounded-xl"
                      onClick={() => setContractLedgerId(record.ledgerId)}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Contract
                    </Button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 px-4">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-bold mb-2">No devices yet</h3>
                <p className="text-muted-foreground max-w-sm mx-auto text-sm">
                  {search
                    ? "No devices match your search."
                    : "Devices registered to your account through a KIZERE retailer will appear here."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {contractLedgerId && (
        <PurchaseContractModal
          ledgerId={contractLedgerId}
          open={!!contractLedgerId}
          onClose={() => setContractLedgerId(null)}
        />
      )}
    </AppLayout>
  );
}
