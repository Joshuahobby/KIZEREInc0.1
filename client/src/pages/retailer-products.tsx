import React, { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { AppLayout } from "@/components/layout/admin-layout";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Package,
  Search,
  MoreHorizontal,
  Archive,
  ShieldAlert,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Plus,
  History,
  X,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";

// Types
interface PosProduct {
  id: number;
  serialNumber: string;
  name: string;
  category: string;
  status: string;
  registrationDate: string;
  sku: string | null;
  currentOwnerId: number;
  retailerId: number;
  metadata: any;
}

interface PaginatedResponse {
  success: boolean;
  data: PosProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Status badge with appropriate color
function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    registered: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    transferred: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
    stolen: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
    archived: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800",
  };

  return (
    <Badge
      variant="outline"
      className={`text-[10px] capitalize font-semibold ${variants[status] || ""}`}
    >
      {status}
    </Badge>
  );
}

export default function RetailerProducts() {
  const { t } = useLanguage();
  const { user: _user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Search & filter state
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  const debouncedSearch = useDebounce(searchInput, 300);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: "archive" | "report-stolen" | "recover";
    productId: number;
    productName: string;
  }>({ open: false, action: "archive", productId: 0, productName: "" });

  // Build query params
  const queryParams = new URLSearchParams();
  queryParams.set("page", String(page));
  queryParams.set("limit", String(limit));
  if (debouncedSearch) queryParams.set("search", debouncedSearch);
  if (category && category !== "all") queryParams.set("category", category);
  if (status && status !== "all") queryParams.set("status", status);

  const { data, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ["/api/pos/my-products/search", page, debouncedSearch, category, status],
    queryFn: () => apiRequest(`/api/pos/my-products/search?${queryParams.toString()}`),
  });

  // Fetch categories for filter dropdown
  const { data: statsData } = useQuery<{ success: boolean; stats: { productsByCategory: { category: string; count: number }[] } }>({
    queryKey: ["/api/pos/my-stats"],
  });
  const categories = statsData?.stats?.productsByCategory?.map(c => c.category) || [];

  // Product action mutations
  const archiveMutation = useMutation({
    mutationFn: (productId: number) =>
      apiRequest(`/api/pos/products/${productId}/archive`, { method: "PATCH" }),
    onSuccess: () => {
      toast({ title: t("pos.inventory.archiveSuccess") || "Product archived successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/pos/my-products/search"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pos/my-stats"] });
    },
    onError: (error: any) => {
      toast({
        title: t("pos.error") || "Error",
        description: error.message || "Failed to archive product",
        variant: "destructive",
      });
    },
  });

  const reportStolenMutation = useMutation({
    mutationFn: (productId: number) =>
      apiRequest(`/api/pos/products/${productId}/report-stolen`, { method: "POST" }),
    onSuccess: () => {
      toast({ title: t("pos.inventory.stolenSuccess") || "Product reported as stolen" });
      queryClient.invalidateQueries({ queryKey: ["/api/pos/my-products/search"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pos/my-stats"] });
    },
    onError: (error: any) => {
      toast({
        title: t("pos.error") || "Error",
        description: error.message || "Failed to report product",
        variant: "destructive",
      });
    },
  });

  const recoverMutation = useMutation({
    mutationFn: (productId: number) =>
      apiRequest(`/api/pos/products/${productId}/recover`, { method: "POST" }),
    onSuccess: () => {
      toast({ title: t("pos.inventory.recoverSuccess") || "Product recovered successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/pos/my-products/search"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pos/my-stats"] });
    },
    onError: (error: any) => {
      toast({
        title: t("pos.error") || "Error",
        description: error.message || "Failed to recover product",
        variant: "destructive",
      });
    },
  });

  const handleConfirmAction = useCallback(() => {
    const { action, productId } = confirmDialog;
    switch (action) {
      case "archive":
        archiveMutation.mutate(productId);
        break;
      case "report-stolen":
        reportStolenMutation.mutate(productId);
        break;
      case "recover":
        recoverMutation.mutate(productId);
        break;
    }
    setConfirmDialog(prev => ({ ...prev, open: false }));
  }, [confirmDialog, archiveMutation, reportStolenMutation, recoverMutation]);

  const isMutating = archiveMutation.isPending || reportStolenMutation.isPending || recoverMutation.isPending;

  // Reset page when filters change
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearchInput("");
    setCategory("all");
    setStatus("all");
    setPage(1);
  };

  const hasActiveFilters = searchInput || category !== "all" || status !== "all";

  const products = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  const confirmLabels: Record<string, { title: string; description: string; action: string; variant: string }> = {
    archive: {
      title: t("pos.inventory.confirmArchive") || "Archive Product",
      description: t("pos.inventory.confirmArchiveDesc") || "This will archive the product. It can no longer be transferred. Are you sure?",
      action: t("pos.inventory.archive") || "Archive",
      variant: "default",
    },
    "report-stolen": {
      title: t("pos.inventory.confirmStolen") || "Report Product Stolen",
      description: t("pos.inventory.confirmStolenDesc") || "This will mark the product as stolen and block all transfers. Are you sure?",
      action: t("pos.inventory.reportStolen") || "Report Stolen",
      variant: "destructive",
    },
    recover: {
      title: t("pos.inventory.confirmRecover") || "Recover Product",
      description: t("pos.inventory.confirmRecoverDesc") || "This will mark the stolen product as recovered and restore it to active status. Are you sure?",
      action: t("pos.inventory.recover") || "Recover",
      variant: "default",
    },
  };

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="container max-w-7xl mx-auto py-6 space-y-6"
      >
        <DashboardPageHeader
          title={t("pos.inventory.title") || "Product Inventory"}
          description={t("pos.inventory.description") || "Search, manage, and track all products registered through your POS terminal"}
          actions={
            <Button onClick={() => navigate("/pos")} className="gap-2">
              <Plus className="h-4 w-4" />
              {t("pos.registerProduct") || "Register Product"}
            </Button>
          }
        />

        {/* Search & Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("pos.inventory.searchPlaceholder") || "Search by serial number, name, or SKU..."}
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={category} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder={t("pos.category") || "Category"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("pos.inventory.allCategories") || "All Categories"}</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder={t("pos.status") || "Status"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("pos.inventory.allStatuses") || "All Statuses"}</SelectItem>
                  <SelectItem value="registered">{t("pos.inventory.statusRegistered") || "Registered"}</SelectItem>
                  <SelectItem value="transferred">{t("pos.inventory.statusTransferred") || "Transferred"}</SelectItem>
                  <SelectItem value="stolen">{t("pos.inventory.statusStolen") || "Stolen"}</SelectItem>
                  <SelectItem value="archived">{t("pos.inventory.statusArchived") || "Archived"}</SelectItem>
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button variant="ghost" size="icon" onClick={clearFilters} className="shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {hasActiveFilters && !isLoading && (
              <p className="text-xs text-muted-foreground mt-2">
                {t("pos.inventory.showing") || "Showing"} {products.length} {t("pos.inventory.of") || "of"} {total} {t("pos.inventory.results") || "results"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">{t("pos.inventory.id") || "ID"}</TableHead>
                        <TableHead className="text-xs">{t("pos.serial") || "Serial"}</TableHead>
                        <TableHead className="text-xs">{t("pos.productName") || "Name"}</TableHead>
                        <TableHead className="text-xs hidden md:table-cell">{t("pos.category") || "Category"}</TableHead>
                        <TableHead className="text-xs hidden sm:table-cell">{t("pos.inventory.registered") || "Registered"}</TableHead>
                        <TableHead className="text-xs">{t("pos.status") || "Status"}</TableHead>
                        <TableHead className="text-xs w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id} className="group">
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            KZR-{String(product.id).padStart(6, "0")}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {product.serialNumber}
                          </TableCell>
                          <TableCell className="font-medium text-sm max-w-[200px] truncate">
                            {product.name}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                            {product.category}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                            {format(new Date(product.registrationDate), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={product.status} />
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" disabled={isMutating}>
                                  {isMutating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => navigate(`/pos?product=${product.id}`)}
                                  className="gap-2"
                                >
                                  <History className="h-4 w-4" />
                                  {t("pos.inventory.viewHistory") || "View History"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {product.status !== "archived" && product.status !== "stolen" && (
                                  <DropdownMenuItem
                                    onClick={() => setConfirmDialog({
                                      open: true,
                                      action: "archive",
                                      productId: product.id,
                                      productName: product.name,
                                    })}
                                    className="gap-2"
                                  >
                                    <Archive className="h-4 w-4" />
                                    {t("pos.inventory.archive") || "Archive"}
                                  </DropdownMenuItem>
                                )}
                                {product.status !== "stolen" && product.status !== "archived" && (
                                  <DropdownMenuItem
                                    onClick={() => setConfirmDialog({
                                      open: true,
                                      action: "report-stolen",
                                      productId: product.id,
                                      productName: product.name,
                                    })}
                                    className="gap-2 text-red-600 focus:text-red-600"
                                  >
                                    <ShieldAlert className="h-4 w-4" />
                                    {t("pos.inventory.reportStolen") || "Report Stolen"}
                                  </DropdownMenuItem>
                                )}
                                {product.status === "stolen" && (
                                  <DropdownMenuItem
                                    onClick={() => setConfirmDialog({
                                      open: true,
                                      action: "recover",
                                      productId: product.id,
                                      productName: product.name,
                                    })}
                                    className="gap-2 text-green-600 focus:text-green-600"
                                  >
                                    <ShieldCheck className="h-4 w-4" />
                                    {t("pos.inventory.recover") || "Recover"}
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t mt-4">
                    <p className="text-sm text-muted-foreground">
                      {t("pos.inventory.page") || "Page"} {page} {t("pos.inventory.of") || "of"} {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className="gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        {t("pos.inventory.prev") || "Prev"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="gap-1"
                      >
                        {t("pos.inventory.next") || "Next"}
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-10 w-10 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-1">
                  {hasActiveFilters
                    ? (t("pos.inventory.noResults") || "No products match your filters")
                    : (t("pos.noProducts") || "No products registered yet.")}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {hasActiveFilters
                    ? (t("pos.inventory.tryDifferent") || "Try adjusting your search or filter criteria")
                    : (t("pos.welcomeDesc") || "Start registering products through the POS terminal.")}
                </p>
                {hasActiveFilters ? (
                  <Button variant="outline" onClick={clearFilters} className="gap-2">
                    <X className="h-4 w-4" />
                    {t("pos.inventory.clearFilters") || "Clear Filters"}
                  </Button>
                ) : (
                  <Button onClick={() => navigate("/pos")} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t("pos.registerFirstProduct") || "Register Your First Product"}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Confirmation Dialog */}
        <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{confirmLabels[confirmDialog.action]?.title}</AlertDialogTitle>
              <AlertDialogDescription>
                <span className="font-medium text-foreground">{confirmDialog.productName}</span>
                <br />
                {confirmLabels[confirmDialog.action]?.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel") || "Cancel"}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmAction}
                className={confirmDialog.action === "report-stolen" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
              >
                {confirmLabels[confirmDialog.action]?.action}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </AppLayout>
  );
}
