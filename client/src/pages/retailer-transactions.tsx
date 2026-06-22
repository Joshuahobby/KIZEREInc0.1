import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { apiGet } from "@/lib/api";
import { AppLayout } from "@/components/layout/admin-layout";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
  ArrowLeftRight, Download, Search,
  Plus, RefreshCw, AlertTriangle, ChevronLeft, ChevronRight,
  Package, Archive, ShieldAlert, FileText
} from "lucide-react";
import { PurchaseContractModal } from "@/components/pos/PurchaseContractModal";
import Papa from "papaparse";

const PAGE_SIZE = 20;

const EVENT_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; badge: string }> = {
  stock_in: {
    label: "Stock In",
    icon: <Package className="h-4 w-4" />,
    color: "bg-blue-500/10 text-blue-600",
    badge: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  sale: {
    label: "Sale",
    icon: <Plus className="h-4 w-4" />,
    color: "bg-emerald-500/10 text-emerald-600",
    badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  transfer: {
    label: "Transfer",
    icon: <RefreshCw className="h-4 w-4" />,
    color: "bg-indigo-500/10 text-indigo-500",
    badge: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  },
  stolen_report: {
    label: "Stolen Report",
    icon: <ShieldAlert className="h-4 w-4" />,
    color: "bg-destructive/10 text-destructive",
    badge: "",
  },
  recovery: {
    label: "Recovery",
    icon: <Package className="h-4 w-4" />,
    color: "bg-amber-500/10 text-amber-600",
    badge: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  },
  archived: {
    label: "Archived",
    icon: <Archive className="h-4 w-4" />,
    color: "bg-muted text-muted-foreground",
    badge: "bg-muted text-muted-foreground border-border/50",
  },
};

function getEventConfig(event: string) {
  return EVENT_CONFIG[event] ?? {
    label: event.replace(/_/g, " "),
    icon: <AlertTriangle className="h-4 w-4" />,
    color: "bg-muted text-muted-foreground",
    badge: "bg-muted text-muted-foreground border-border/50",
  };
}

export default function RetailerTransactions() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [contractLedgerId, setContractLedgerId] = useState<number | null>(null);

  const queryParams = new URLSearchParams();
  queryParams.set("page", String(page));
  queryParams.set("limit", String(PAGE_SIZE));
  if (eventTypeFilter && eventTypeFilter !== "all") queryParams.set("eventType", eventTypeFilter);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/pos/my-transactions", page, eventTypeFilter],
    queryFn: () =>
      apiGet<{ data: any[]; total: number; totalPages: number; page: number }>(
        `/api/pos/my-transactions?${queryParams.toString()}`
      ),
  });

  const transactions = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  const filtered = transactions.filter((tx: any) => {
    const q = searchTerm.toLowerCase();
    return (
      !q ||
      (tx.productName || "").toLowerCase().includes(q) ||
      (tx.serialNumber || "").toLowerCase().includes(q) ||
      (tx.ownerName || "").toLowerCase().includes(q) ||
      (tx.event || "").toLowerCase().includes(q)
    );
  });

  const handleExportCsv = () => {
    if (transactions.length === 0) return;
    const csv = Papa.unparse(
      transactions.map((tx: any) => ({
        ID: `TXN-${String(tx.id).padStart(6, "0")}`,
        Type: getEventConfig(tx.transactionType ?? tx.event).label,
        Product: tx.productName || `POS-${String(tx.productId).padStart(6, "0")}`,
        Serial: tx.serialNumber || "",
        Customer: tx.ownerName || "",
        Date: format(new Date(tx.timestamp), "yyyy-MM-dd HH:mm:ss"),
        Status: tx.event === "stolen_report" ? "Flagged" : "Completed",
      }))
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `kizere_transactions_${format(new Date(), "yyyyMMdd_HHmm")}.csv`;
    link.click();
  };

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="container max-w-7xl mx-auto py-6 space-y-6"
      >
        <DashboardPageHeader
          title={t("pos.transactions") || "Transaction History"}
          description={t("pos.transactionsDesc") || "View all registrations and sales processed by your store."}
          actions={
            <Button
              variant="outline"
              className="gap-2 shadow-sm border-primary/20 hover:bg-primary/5"
              onClick={handleExportCsv}
              disabled={transactions.length === 0}
            >
              <Download className="h-4 w-4" />
              {t("pos.export") || "Export CSV"}
            </Button>
          }
        />

        <Card className="border-border/50 shadow-premium overflow-hidden bg-background/50 backdrop-blur-md rounded-3xl">
          <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5 text-primary" />
                Transaction History
                {total > 0 && (
                  <Badge variant="outline" className="ml-2 font-mono text-xs font-normal">
                    {total} total
                  </Badge>
                )}
              </CardTitle>
              <div className="flex w-full sm:w-auto items-center gap-2">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by product, serial, or customer..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                    className="pl-9 rounded-xl bg-background border-border/50 shadow-sm"
                  />
                </div>
                <Select
                  value={eventTypeFilter}
                  onValueChange={(v) => { setEventTypeFilter(v); setPage(1); }}
                >
                  <SelectTrigger className="w-[140px] rounded-xl border-border/50 shrink-0">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="sale">Sale</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="stock_in">Stock In</SelectItem>
                    <SelectItem value="stolen_report">Stolen Report</SelectItem>
                    <SelectItem value="recovery">Recovery</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : filtered.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="font-semibold text-xs tracking-wider uppercase pl-6 w-32">ID</TableHead>
                      <TableHead className="font-semibold text-xs tracking-wider uppercase">Type</TableHead>
                      <TableHead className="font-semibold text-xs tracking-wider uppercase">Product</TableHead>
                      <TableHead className="font-semibold text-xs tracking-wider uppercase">Customer</TableHead>
                      <TableHead className="font-semibold text-xs tracking-wider uppercase">Date & Time</TableHead>
                      <TableHead className="font-semibold text-xs tracking-wider uppercase text-right">Status</TableHead>
                      <TableHead className="font-semibold text-xs tracking-wider uppercase text-right pr-6">Contract</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((tx: any, index: number) => {
                      const cfg = getEventConfig(tx.transactionType ?? tx.event);
                      const isStolen = tx.event === "stolen_report";
                      const isStockIn = tx.transactionType === "stock_in";

                      return (
                        <motion.tr
                          key={tx.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, delay: index * 0.03 }}
                          className="group hover:bg-muted/30 transition-colors border-b border-border/50 last:border-0"
                        >
                          {/* ID */}
                          <TableCell className="pl-6 font-mono text-xs text-muted-foreground whitespace-nowrap">
                            TXN-{String(tx.id).padStart(6, "0")}
                          </TableCell>

                          {/* Type */}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`p-2 rounded-xl shrink-0 ${cfg.color}`}>
                                {cfg.icon}
                              </div>
                              <span className="font-semibold text-sm">{cfg.label}</span>
                            </div>
                          </TableCell>

                          {/* Product */}
                          <TableCell>
                            {tx.productName ? (
                              <div>
                                <p className="font-semibold text-sm">{tx.productName}</p>
                                {tx.serialNumber && (
                                  <p className="text-xs font-mono text-muted-foreground">{tx.serialNumber}</p>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground font-mono">
                                POS-{String(tx.productId).padStart(6, "0")}
                              </span>
                            )}
                          </TableCell>

                          {/* Customer */}
                          <TableCell>
                            {isStockIn ? (
                              <span className="text-xs text-muted-foreground italic">Own inventory</span>
                            ) : tx.ownerName ? (
                              <p className="text-sm font-medium">{tx.ownerName}</p>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>

                          {/* Date */}
                          <TableCell className="whitespace-nowrap">
                            <p className="text-sm text-foreground">
                              {format(new Date(tx.timestamp), "MMM d, yyyy")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(tx.timestamp), "HH:mm")}
                            </p>
                          </TableCell>

                          {/* Status */}
                          <TableCell className="text-right">
                            <Badge
                              variant={isStolen ? "destructive" : "outline"}
                              className={`font-bold uppercase tracking-widest text-[10px] ${!isStolen ? cfg.badge : ""}`}
                            >
                              {isStolen ? "Flagged" : "Completed"}
                            </Badge>
                          </TableCell>

                          {/* Contract */}
                          <TableCell className="text-right pr-6">
                            {(tx.event === "sale" || tx.event === "transfer") && !isStockIn ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg"
                                onClick={() => setContractLedgerId(tx.id)}
                              >
                                <FileText className="h-3.5 w-3.5" />
                                Contract
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-16 px-4">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <ArrowLeftRight className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-bold mb-2">No transactions found</h3>
                <p className="text-muted-foreground max-w-sm mx-auto text-sm">
                  {searchTerm
                    ? "No transactions match your search. Try a different product name, serial, or customer."
                    : "Transactions will appear here once items are registered or transferred at your POS."}
                </p>
              </div>
            )}
          </CardContent>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/50">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} &middot; {total} transactions
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
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
