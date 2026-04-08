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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
  Upload,
  Scan,
  Printer,
  Download,
  FileText,
  CheckCircle2
} from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { BulkImportModal } from "@/components/retailer/BulkImportModal";
import { BarcodeScanner } from "@/components/pos/barcode-scanner";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkReceiptPrinter, BulkReceiptPrinterHandle } from "@/components/pos/BulkReceiptPrinter";
import Papa from "papaparse";

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
  ownerName: string;
  ownerNationalId: string | null;
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

  const [registerOpen, setRegisterOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  
  // Power features state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [historyProductId, setHistoryProductId] = useState<number | null>(null);
  const bulkPrintRef = useRef<BulkReceiptPrinterHandle>(null);

  const [formData, setFormData] = useState({ 
    serialNumber: "", 
    name: "", 
    brand: "", 
    model: "", 
    category: "Other", 
    sku: "" 
  });

  useEffect(() => {
    if (window.location.search.includes("add=true")) {
      setRegisterOpen(true);
      // Remove query param to prevent re-opening on manual refresh
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

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
  const registerMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("/api/pos/register", { method: "POST", data }),
    onSuccess: () => {
      toast({ title: "Product Registered", description: "Product added to your inventory successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/pos/my-products/search"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pos/my-stats"] });
      setRegisterOpen(false);
      setFormData({ 
        serialNumber: "", 
        name: "", 
        brand: "", 
        model: "", 
        category: "Other", 
        sku: "" 
      });
    },
    onError: (err: any) => {
      const isSecurityAlert = err.message?.toUpperCase().includes("SECURITY ALERT");
      toast({ 
        title: isSecurityAlert ? "🚨 Security Alert" : "Failed to register", 
        description: err.message, 
        variant: "destructive",
        duration: isSecurityAlert ? 10000 : 5000 // Show security alerts longer
      });
    }
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.serialNumber || !formData.name) return;
    
    if (!_user?.id) {
      toast({ 
        title: "Session Error", 
        description: "Your session appears to be incomplete. Please refresh and try again.", 
        variant: "destructive" 
      });
      return;
    }

    registerMutation.mutate({
      ...formData,
      ownerId: _user.id // Now guaranteed to be defined
    });
  };

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

  // Bulk actions logic
  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map(p => p.id)));
    }
  };

  const handleBulkPrint = () => {
    if (selectedIds.size === 0) return;
    bulkPrintRef.current?.print();
  };

  const handleBulkExport = () => {
    const selectedProducts = products.filter(p => selectedIds.has(p.id));
    const csv = Papa.unparse(selectedProducts.map(p => ({
      ID: `POS-${String(p.id).padStart(6, '0')}`,
      Name: p.name,
      Serial: p.serialNumber,
      SKU: p.sku || 'N/A',
      Category: p.category,
      Status: p.status,
      Owner: p.ownerName,
      OwnerID: p.ownerNationalId || 'N/A',
      RegisteredAt: format(new Date(p.registrationDate), 'yyyy-MM-dd HH:mm:ss')
    })));
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `kizere_inventory_export_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`;
    link.click();
    toast({ title: "Export Complete", description: `Exported ${selectedProducts.length} items to CSV.` });
  };

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
            <div className="flex gap-2">
              <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2 border-primary/20 text-primary hover:bg-primary/10">
                    <Plus className="h-4 w-4" />
                    Add to Inventory
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add to Inventory</DialogTitle>
                    <DialogDescription>
                      Register a new product to your business inventory. You can transfer it to a customer later via the POS Terminal.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleRegister} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="serialNumber">{t("pos.inventory.scanBarcode")}</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input 
                            id="serialNumber" 
                            value={formData.serialNumber} 
                            onChange={(e) => setFormData({...formData, serialNumber: e.target.value})} 
                            required 
                            placeholder={t("pos.inventory.serialPlaceholder")} 
                          />
                        </div>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => setIsScannerOpen(true)}
                          className="hidden sm:flex gap-2"
                        >
                          <Scan className="h-4 w-4" />
                          {t("pos.inventory.scanBtn")}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">{t("pos.inventory.productNameLabel")}</Label>
                      <Input 
                        id="name" 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})} 
                        required 
                        placeholder="e.g. Samsung Galaxy S24" 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="brand">{t("pos.inventory.brandLabel")}</Label>
                        <Input 
                          id="brand" 
                          value={formData.brand} 
                          onChange={(e) => setFormData({...formData, brand: e.target.value})} 
                          placeholder={t("pos.inventory.brandPlaceholder")} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="model">{t("pos.inventory.modelLabel")}</Label>
                        <Input 
                          id="model" 
                          value={formData.model} 
                          onChange={(e) => setFormData({...formData, model: e.target.value})} 
                          placeholder={t("pos.inventory.modelPlaceholder")} 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">{t("pos.category")}</Label>
                        <Select 
                          value={formData.category} 
                          onValueChange={(val) => setFormData({...formData, category: val})}
                        >
                          <SelectTrigger id="category">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Electronics">Electronics</SelectItem>
                            <SelectItem value="Phones">Phones</SelectItem>
                            <SelectItem value="Computers">Computers</SelectItem>
                            <SelectItem value="Vehicles">Vehicles</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sku">{t("pos.inventory.skuLabel")}</Label>
                        <Input 
                          id="sku" 
                          value={formData.sku} 
                          onChange={(e) => setFormData({...formData, sku: e.target.value})} 
                          placeholder={t("pos.inventory.skuPlaceholder")} 
                        />
                      </div>
                    </div>

                    <DialogFooter className="pt-4">
                      <Button type="button" variant="outline" onClick={() => setRegisterOpen(false)}>{t("common.cancel")}</Button>
                      <Button type="submit" disabled={registerMutation.isPending || !formData.serialNumber || !formData.name}>
                        {registerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Package className="h-4 w-4 mr-2" />}
                        {t("pos.inventory.addProduct")}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              <Button 
                variant="outline" 
                onClick={() => setIsBulkImportOpen(true)}
                className="gap-2 border-primary/20 text-primary hover:bg-primary/10"
              >
                <Upload className="h-4 w-4" />
                {t("pos.inventory.bulkUpload") || "Bulk Upload"}
              </Button>
              <Button onClick={() => navigate("/pos")} className="gap-2 shadow-sm">
                <Plus className="h-4 w-4" />
                {t("pos.openTerminal") || "POS Terminal"}
              </Button>
            </div>
          }
        />

        <Tabs defaultValue="inventory" className="space-y-6">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="inventory" className="gap-2">
                <Package className="h-4 w-4" />
                Inventory
              </TabsTrigger>
              <TabsTrigger value="alerts" className="gap-2 text-amber-600 data-[state=active]:text-amber-700">
                <ShieldAlert className="h-4 w-4" />
                Security Alerts
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="inventory" className="space-y-6">
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

        {/* Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-slate-800 rounded-full py-3 px-6 shadow-2xl flex items-center gap-6"
          >
            <div className="flex items-center gap-2 pr-4 border-r border-slate-800">
              <span className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white">
                {selectedIds.size}
              </span>
              <span className="text-sm font-medium text-slate-300">Selected</span>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-slate-300 hover:text-white" 
                onClick={handleBulkPrint}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Receipts
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-slate-300 hover:text-white"
                onClick={handleBulkExport}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-slate-500 hover:text-slate-300"
                onClick={() => setSelectedIds(new Set())}
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}

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
                        <TableHead className="w-[40px]">
                          <Checkbox 
                            checked={selectedIds.size === products.length && products.length > 0} 
                            onCheckedChange={toggleSelectAll}
                          />
                        </TableHead>
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
                        <TableRow key={product.id} className={`group ${selectedIds.has(product.id) ? "bg-primary/5" : ""}`}>
                          <TableCell>
                            <Checkbox 
                              checked={selectedIds.has(product.id)} 
                              onCheckedChange={() => toggleSelect(product.id)}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            POS-{String(product.id).padStart(6, "0")}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {product.serialNumber}
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <div className="flex flex-col">
                              <span className="font-medium text-sm truncate">{product.name}</span>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                                {product.ownerName}
                              </span>
                            </div>
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
                                  onClick={() => setHistoryProductId(product.id)}
                                  className="gap-2"
                                >
                                  <History className="h-4 w-4" />
                                  {t("pos.inventory.viewHistory") || "View History"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    // Single print
                                    const next = new Set<number>();
                                    next.add(product.id);
                                    // We need to wait for state to update or just trigger it with the list
                                    // But since BulkReceiptPrinter takes a list, we'll just use a temp trigger
                                    setSelectedIds(next);
                                    setTimeout(() => bulkPrintRef.current?.print(), 100);
                                  }}
                                  className="gap-2"
                                >
                                  <Printer className="h-4 w-4" />
                                  Print Receipt
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
                  <Button onClick={() => setRegisterOpen(true)} className="gap-2">
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

        <BulkImportModal 
          open={isBulkImportOpen} 
          onOpenChange={setIsBulkImportOpen} 
        />

        <BarcodeScanner
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScan={(serial) => {
            setFormData(prev => ({ ...prev, serialNumber: serial }));
            setIsScannerOpen(false);
          }}
        />

        <ProductHistoryDialog 
          productId={historyProductId} 
          onClose={() => setHistoryProductId(null)} 
        />

        <BulkReceiptPrinter 
          ref={bulkPrintRef} 
          products={products.filter(p => selectedIds.has(p.id))} 
        />
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <SecurityAlertsTab />
          </TabsContent>
        </Tabs>
      </motion.div>
    </AppLayout>
  );
}

// Inline Sub-component for Product History
function ProductHistoryDialog({ productId, onClose }: { productId: number | null, onClose: () => void }) {
  const { t } = useLanguage();
  
  const { data, isLoading } = useQuery<{ success: boolean; history: any[] }>({
    queryKey: ["/api/pos/products", productId, "history"],
    queryFn: () => apiRequest(`/api/pos/products/${productId}/history`),
    enabled: !!productId,
  });

  return (
    <Dialog open={!!productId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Product Ownership History
          </DialogTitle>
          <DialogDescription>
            Full audit trail and ledger of transfers for this asset.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : data?.history && data.history.length > 0 ? (
            <div className="relative space-y-6">
              <div className="absolute left-[17px] top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-800" />
              {data.history.map((entry, i) => (
                <div key={entry.id} className="relative pl-10">
                  <div className={`absolute left-0 top-1 w-9 h-9 rounded-full flex items-center justify-center z-10 
                    ${entry.event === 'registration' ? 'bg-blue-100 text-blue-600' : 
                      entry.event === 'transfer' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'}`}>
                    {entry.event === 'registration' ? <Plus className="h-4 w-4" /> : 
                     entry.event === 'transfer' ? <RefreshCw className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-sm capitalize">{entry.event}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(entry.timestamp), "MMM d, yyyy HH:mm")}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {entry.notes || (entry.event === 'registration' ? "Initial registration in system" : "Ownership transferred")}
                    </p>
                    {entry.toUserId && (
                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 text-[10px]">
                        <span className="text-slate-500">Destination:</span>
                        <Badge variant="outline" className="text-[9px]">User #{entry.toUserId}</Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <History className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No history entries found for this product.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Missing Lucide import for internal component
import { RefreshCw } from "lucide-react";

// Inline component for Security Alerts
function SecurityAlertsTab() {
  const { data, isLoading } = useQuery<{ alerts: any[] }>({
    queryKey: ["/api/pos/security-alerts"],
    queryFn: () => apiRequest("/api/pos/security-alerts")
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!data?.alerts || data.alerts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <ShieldCheck className="h-10 w-10 mb-4 opacity-20" />
          <h3 className="text-lg font-semibold text-foreground mb-1">No Active Threats</h3>
          <p className="text-sm">Your inventory is secure. No security alerts have been triggered recently.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {data.alerts.map(alert => (
        <Card key={alert.id} className={alert.severity === 'high' ? 'border-red-200 bg-red-50/30' : 'border-amber-200 bg-amber-50/30'}>
          <CardContent className="p-4 flex gap-4">
            <div className={`p-2 rounded-full shrink-0 h-min ${alert.severity === 'high' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h4 className="font-semibold text-sm">{alert.alertType.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</h4>
                <Badge variant="outline" className={alert.severity === 'high' ? 'border-red-200 text-red-700 bg-red-50' : 'border-amber-200 text-amber-700 bg-amber-50'}>
                  {alert.severity} priority
                </Badge>
              </div>
              <p className="text-sm text-foreground/80 mt-1">{alert.description}</p>
              <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 font-mono bg-background px-2 py-1 rounded-md border"><Package className="h-3 w-3" /> {alert.product.serialNumber}</span>
                <span className="flex items-center gap-1 bg-background px-2 py-1 rounded-md border"><History className="h-3 w-3" /> {format(new Date(alert.createdAt), "MMM d, HH:mm")}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
