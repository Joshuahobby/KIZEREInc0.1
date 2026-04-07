import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { apiGet } from "@/lib/api";
import { AppLayout } from "@/components/layout/admin-layout";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ArrowLeftRight, Download, Search, Filter, Plus, RefreshCw, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 20;

export default function RetailerTransactions() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/pos/my-transactions", page],
    queryFn: () => apiGet<{ data: any[]; total: number; totalPages: number; page: number }>(`/api/pos/my-transactions?page=${page}&limit=${PAGE_SIZE}`),
  });

  const transactions = data?.data || [];
  const totalPages = data?.totalPages || 1;

  const filteredActivity = transactions.filter((act: any) =>
    (act.productName || act.event || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(act.productId).includes(searchTerm)
  );

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
          title={t("pos.transactions") || "Transactions"}
          description={t("pos.transactionsDesc") || "Monitor all registrations, transfers, and sales."}
          actions={
            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2 shadow-sm border-primary/20 hover:bg-primary/5">
                <Download className="h-4 w-4" />
                {t("pos.export") || "Export CSV"}
              </Button>
            </div>
          }
        />

        <Card className="border-border/50 shadow-premium overflow-hidden bg-background/50 backdrop-blur-md rounded-3xl">
          <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5 text-primary" />
                Transaction History
              </CardTitle>
              <div className="flex w-full sm:w-auto items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 rounded-xl bg-background border-border/50 shadow-sm"
                  />
                </div>
                <Button variant="outline" size="icon" className="shrink-0 rounded-xl">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-xl" />
                ))}
              </div>
            ) : filteredActivity.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="font-semibold text-xs tracking-wider uppercase pl-6">ID</TableHead>
                      <TableHead className="font-semibold text-xs tracking-wider uppercase">Type</TableHead>
                      <TableHead className="font-semibold text-xs tracking-wider uppercase">Reference</TableHead>
                      <TableHead className="font-semibold text-xs tracking-wider uppercase">Date & Time</TableHead>
                      <TableHead className="font-semibold text-xs tracking-wider uppercase text-right pr-6">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredActivity.map((activity: any, index: number) => {
                      const isStolen = activity.event === "stolen_report";
                      const isTransfer = activity.event === "transfer";
                      
                      return (
                        <motion.tr
                          key={activity.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="group hover:bg-muted/30 transition-colors border-b border-border/50 last:border-0"
                        >
                          <TableCell className="pl-6 font-mono text-xs text-muted-foreground">
                            TXN-{activity.id.toString().padStart(6, "0")}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl flex items-center justify-center shrink-0 ${
                                isStolen ? "bg-destructive/10 text-destructive" :
                                isTransfer ? "bg-indigo-500/10 text-indigo-500" :
                                "bg-emerald-500/10 text-emerald-500"
                              }`}>
                                {isStolen ? <AlertTriangle className="h-4 w-4" /> :
                                 isTransfer ? <RefreshCw className="h-4 w-4" /> :
                                 <Plus className="h-4 w-4" />}
                              </div>
                              <div>
                                <p className="font-bold text-sm capitalize">{activity.event.replace("_", " ")}</p>
                                {activity.notes && (
                                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">{activity.notes}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm shadow-sm bg-muted/40 px-2 py-1 rounded inline-block mt-3">
                            KZR-{String(activity.productId).padStart(6, "0")}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(activity.timestamp), "MMM d, yyyy")}
                            <span className="block text-xs opacity-70">{format(new Date(activity.timestamp), "HH:mm")}</span>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <Badge variant={isStolen ? "destructive" : "outline"} className={`
                              font-bold uppercase tracking-widest text-[10px]
                              ${!isStolen ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : ""}
                            `}>
                              {isStolen ? "Flagged" : "Completed"}
                            </Badge>
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
                  There are no transactions matching your search criteria. Try adjusting your filters or wait for new activity.
                </p>
              </div>
            )}
          </CardContent>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/50">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
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
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </motion.div>
    </AppLayout>
  );
}
