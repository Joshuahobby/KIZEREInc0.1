import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { apiGet, apiPost } from "@/lib/api";
import { AppLayout } from "@/components/layout/admin-layout";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Wallet, ChevronLeft, ChevronRight, Send,
  Clock, CheckCircle2, XCircle, Loader2, RefreshCw, AlertTriangle
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  pending:    { label: "Pending",    className: "bg-amber-500/10 text-amber-600 border-amber-500/20",    icon: <Clock className="h-3 w-3" /> },
  queued:     { label: "Queued",     className: "bg-blue-500/10 text-blue-600 border-blue-500/20",       icon: <RefreshCw className="h-3 w-3" /> },
  processing: { label: "Processing", className: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  paid:       { label: "Paid",       className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: <CheckCircle2 className="h-3 w-3" /> },
  failed:     { label: "Failed",     className: "bg-destructive/10 text-destructive border-destructive/20", icon: <XCircle className="h-3 w-3" /> },
};

const PAGE_SIZE = 25;

export default function AdminCommissionsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["/api/pos/admin/commissions", page, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (statusFilter !== "all") params.set("status", statusFilter);
      return apiGet<{ data: any[]; total: number; totalPages: number; page: number }>(
        `/api/pos/admin/commissions?${params}`
      );
    },
  });

  const payMutation = useMutation({
    mutationFn: (id: number) => apiPost(`/api/pos/my-commissions/${id}/pay`, {}),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/pos/admin/commissions"] });
      toast({ title: "Payout initiated", description: `Commission #${id} sent to PawaPay.` });
    },
    onError: (err: any) => {
      toast({ title: "Payout failed", description: err.message, variant: "destructive" });
    },
  });

  const commissions = data?.data || [];
  const total       = data?.total || 0;
  const totalPages  = data?.totalPages || 1;

  // Summary counts from current page — full counts need a separate query but this is a useful approximation
  const queuedCount = commissions.filter((c: any) => c.status === "queued").length;

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="container max-w-7xl mx-auto py-6 space-y-6"
      >
        <DashboardPageHeader
          title="Commission Payouts"
          description="Review and process retailer MoMo commission payouts."
          actions={
            <div className="flex items-center gap-3">
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-36 rounded-xl border-border/50 bg-background/50">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="queued">Queued</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        />

        {/* Summary bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Records",    value: total,        color: "bg-muted/40" },
            { label: "Queued (this page)", value: queuedCount, color: "bg-blue-500/10" },
          ].map(s => (
            <Card key={s.label} className={`border-border/50 rounded-2xl ${s.color}`}>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{s.label}</p>
                <p className="text-2xl font-black mt-1">{isLoading ? "—" : s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border/50 shadow-premium bg-background/50 backdrop-blur-md rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wallet className="h-5 w-5 text-primary" />
              All Retailer Commissions
              <Badge variant="outline" className="ml-2 font-mono text-xs font-normal">{total} total</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
              </div>
            ) : commissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Wallet className="h-12 w-12 mb-3 opacity-20" />
                <p className="font-semibold">No commissions found</p>
                <p className="text-sm">Commissions are recorded when a retailer registers a sale with a transaction value.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="pl-6 font-semibold text-xs tracking-wider uppercase">ID</TableHead>
                      <TableHead className="font-semibold text-xs tracking-wider uppercase">Retailer</TableHead>
                      <TableHead className="font-semibold text-xs tracking-wider uppercase">Wallet</TableHead>
                      <TableHead className="font-semibold text-xs tracking-wider uppercase text-right">Txn Value</TableHead>
                      <TableHead className="font-semibold text-xs tracking-wider uppercase text-right">Commission</TableHead>
                      <TableHead className="font-semibold text-xs tracking-wider uppercase">Status</TableHead>
                      <TableHead className="font-semibold text-xs tracking-wider uppercase">Date</TableHead>
                      <TableHead className="font-semibold text-xs tracking-wider uppercase pr-6 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissions.map((c: any, i: number) => {
                      const cfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.pending;
                      const canPay = c.status === "queued";
                      const isPaying = payMutation.isPending && payMutation.variables === c.id;

                      return (
                        <motion.tr
                          key={c.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: i * 0.02 }}
                          className="group hover:bg-muted/30 transition-colors border-b border-border/50 last:border-0"
                        >
                          <TableCell className="pl-6 font-mono text-xs text-muted-foreground">
                            #{String(c.id).padStart(5, "0")}
                          </TableCell>
                          <TableCell>
                            <p className="font-semibold text-sm">{c.retailerName || `Retailer #${c.retailerId}`}</p>
                          </TableCell>
                          <TableCell>
                            {c.payoutDestination || c.walletPhone ? (
                              <p className="font-mono text-xs">{c.payoutDestination || c.walletPhone}</p>
                            ) : (
                              <span className="text-xs text-destructive flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" /> Not set
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {Number(c.transactionValue).toLocaleString()} {c.currency}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm font-bold text-emerald-600">
                            {Number(c.commissionAmount).toLocaleString()} {c.currency}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`gap-1 font-semibold text-[11px] ${cfg.className}`}>
                              {cfg.icon}{cfg.label}
                            </Badge>
                            {c.failureReason && (
                              <p className="text-[10px] text-destructive mt-1 max-w-[160px] truncate" title={c.failureReason}>
                                {c.failureReason}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {c.createdAt ? format(new Date(c.createdAt), "MMM d, yyyy") : "—"}
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            {canPay ? (
                              <Button
                                size="sm"
                                className="rounded-xl gap-1 h-8"
                                onClick={() => payMutation.mutate(c.id)}
                                disabled={isPaying}
                              >
                                {isPaying ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                                Pay Now
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
            )}
          </CardContent>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/50">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} &middot; {total} commissions
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="rounded-xl"
                  onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                  <ChevronLeft className="h-4 w-4 mr-1" />Prev
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                  Next<ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </motion.div>
    </AppLayout>
  );
}
