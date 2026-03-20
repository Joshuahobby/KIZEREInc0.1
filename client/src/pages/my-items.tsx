import { Item, ItemStatus } from "@shared/schema";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PlusCircle, Search, Package, AlertTriangle, X, Eye,
  Calendar, Tag as TagIcon, MapPin, Activity, LayoutGrid, List, MoreVertical, Edit2, CheckCircle, CreditCard
} from "lucide-react";
import { PageLayout } from "@/components/layout";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { ItemSkeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
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
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { AuthWall } from "@/components/ui/auth-wall";
import { apiRequest } from "@/lib/queryClient";
import { ReportRegisteredItemDialog } from "@/components/reports/report-registered-item-dialog";
import { PaymentModal } from "@/components/payment/payment-modal";

// Status badge variations based on item status
const getStatusBadgeVariant = (status: ItemStatus) => {
  switch (status) {
    case 'Pending_Payment':
      return 'warning';
    case 'Registered':
      return 'outline';
    case 'Lost':
      return 'destructive';
    case 'Found':
      return 'success';
    case 'Recovered':
      return 'success';
    case 'Archived':
      return 'secondary';
    default:
      return 'default';
  }
};

export default function MyItemsPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const [statusTab, setStatusTab] = React.useState<ItemStatus | "all">("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState<"newest" | "oldest" | "alpha">("newest");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 8;

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, statusTab, searchQuery, sortBy]);

  // Report lost dialog state
  const [reportItem, setReportItem] = React.useState<Item | null>(null);
  const [isReportDialogOpen, setIsReportDialogOpen] = React.useState(false);

  // Mark found dialog state
  const [itemToMarkFound, setItemToMarkFound] = React.useState<Item | null>(null);
  const [isMarkFoundDialogOpen, setIsMarkFoundDialogOpen] = React.useState(false);
  const [paymentItem, setPaymentItem] = React.useState<Item | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's items
  const { data: items, isLoading, error } = useQuery<Item[]>({
    queryKey: ["/api/items"],
    queryFn: async () => {
      return apiRequest('/api/items');
    },
    enabled: !!user?.id
  });

  const markAsFoundMutation = useMutation({
    mutationFn: async (itemId: number) => {
      await apiRequest(`/api/items/${itemId}/mark-found`, { method: 'POST' });
    },
    onSuccess: () => {
      toast({ title: "Item updated", description: "Your item has been marked as recovered." });
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      setIsMarkFoundDialogOpen(false);
      setItemToMarkFound(null);
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Failed to update item", description: err.message });
    }
  });

  const handleMarkFound = (item: Item) => {
    setItemToMarkFound(item);
    setIsMarkFoundDialogOpen(true);
  };

  // Filter and Sort items
  const filteredItems = items?.filter(item => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch = !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());

    // Filter by tab
    const matchesTab = statusTab === "all" ||
      (statusTab === "Registered" && item.status === "Registered") ||
      (statusTab === "Lost" && item.status === "Lost") ||
      (statusTab === "Recovered" && (item.status === "Recovered" || item.status === "Found"));

    return matchesCategory && matchesSearch && matchesTab;
  }).sort((a, b) => {
    if (sortBy === "newest") return new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime();
    if (sortBy === "oldest") return new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime();
    if (sortBy === "alpha") return a.name.localeCompare(b.name);
    return 0;
  }) || [];

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Get unique categories from items for the filter dropdown
  const uniqueCategories = items ? Array.from(new Set(items.map(item => item.category))) : [];

  const handleReportLost = (itemId: number) => {
    const itemToReport = items?.find(i => i.id === itemId);
    if (itemToReport) {
      setReportItem(itemToReport);
      setIsReportDialogOpen(true);
    }
  };

  const handleViewItem = (itemId: number) => {
    navigate(`/items/${itemId}`);
  };

  if (!user) {
    return (
      <PageLayout>
        <div className="container max-w-7xl mx-auto py-20 flex items-center justify-center">
          <AuthWall returnUrl="/my-items" />
        </div>
      </PageLayout>
    );
  }

  if (isLoading) {
    return (
      <PageLayout>
        <div className="container max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1">
              <div className="h-10 w-48 bg-muted animate-pulse rounded-lg" />
              <div className="h-4 w-64 bg-muted animate-pulse rounded-lg" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <ItemSkeleton key={i} />
            ))}
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div className="container max-w-6xl mx-auto">
          <EmptyState
            icon={<X className="h-12 w-12 text-destructive" />}
            title="Failed to load items"
            description="We couldn't load your registered items. Please try again later."
            action={
              <Button onClick={() => window.location.reload()} variant="default">
                Try Again
              </Button>
            }
            variant="error"
          />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6 py-4 sm:py-6 animate-in fade-in duration-700">
        {/* Header Section - Zero-Waste Mobile Layout */}
        <div className="flex justify-between items-center pb-2">
          <div className="space-y-0.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              My Items
            </h1>
          </div>

          <Button
            onClick={() => navigate("/register-item")}
            className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
            size="sm"
          >
            <PlusCircle className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-xs sm:text-sm font-bold">New Item</span>
          </Button>
        </div>


        {/* Single Inlined Filter Row - Easy & Direct */}
        <div className="relative group w-full max-w-xl mx-auto mb-1">
          <div className="relative flex items-center gap-1 p-1 bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-border/50 rounded-full shadow-sm">
            {/* Search */}
            <div className="flex-1 relative flex items-center">
              <Search className="absolute left-3 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full h-8 pl-8 bg-transparent border-none focus-visible:ring-0 text-[12px] font-medium placeholder:text-muted-foreground"
              />
            </div>

            <div className="w-px h-4 bg-muted/20" />

            {/* Direct Selects */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-auto h-8 px-2 border-none bg-transparent rounded-full text-[10px] font-black uppercase tracking-wider">
                <TagIcon className="h-3 w-3 sm:mr-1 text-primary opacity-40 shrink-0" />
                <span className="hidden sm:inline">
                  <SelectValue placeholder="Cat" />
                </span>
              </SelectTrigger>
              <SelectContent className="rounded-2xl bg-background/95 border-muted/20">
                <SelectItem value="all" className="text-xs">All Categories</SelectItem>
                {["Electronics", "Jewelry", "Documents", "Accessories", "Clothing", "Bags", "Keys", "Wallets", "Phones", "Computers", "Transportation", "Other"].map(cat => (
                  <SelectItem key={cat} value={cat} className="text-xs">{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="w-px h-4 bg-muted/20" />

            <div className="flex items-center gap-0.5 px-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("list")}
                className={cn(
                  "h-7 w-7 rounded-full transition-all",
                  viewMode === "list" ? "bg-primary/20 text-primary" : "text-muted-foreground/40 hover:text-foreground"
                )}
              >
                <List className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "h-7 w-7 rounded-full transition-all",
                  viewMode === "grid" ? "bg-primary/20 text-primary" : "text-muted-foreground/40 hover:text-foreground"
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Status Pill Tabs - Centered & Ultra-Slim */}
        <div className="flex items-center gap-2 pb-2 overflow-x-auto no-scrollbar mask-fade-right justify-center sticky top-20 z-20 backdrop-blur-md bg-background/50 py-2 rounded-full">
          {[
            { id: 'all', label: 'All', count: items?.length || 0 },
            { id: 'Pending_Payment', label: 'Pending', count: items?.filter(i => i.status === "Pending_Payment").length || 0 },
            { id: 'Registered', label: 'Reg', count: items?.filter(i => i.status === "Registered").length || 0 },
            { id: 'Lost', label: 'Lost', count: items?.filter(i => i.status === "Lost").length || 0 },
            { id: 'Recovered', label: 'Rec', count: items?.filter(i => i.status === "Recovered" || i.status === "Found").length || 0 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusTab(tab.id as any)}
              className="relative px-3 sm:px-4 py-1.5 text-[9px] sm:text-[10px] font-black tracking-widest uppercase transition-all duration-300 outline-none group shrink-0"
            >
              <AnimatePresence>
                {statusTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary/10 sm:bg-primary shadow-sm rounded-full border border-primary/20 sm:border-none"
                    transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
                  />
                )}
              </AnimatePresence>
              <span className={cn(
                "relative z-10 transition-colors duration-300 flex items-center gap-1.5",
                statusTab === tab.id ? "text-primary-foreground sm:text-primary-foreground drop-shadow-sm" : "text-muted-foreground/70 hover:text-foreground dark:text-slate-400 dark:hover:text-slate-200"
              )}>
                {tab.label}
                <span className={cn(
                  "text-[9px] py-0.5 px-1.5 rounded-full transition-colors duration-300 font-bold",
                  statusTab === tab.id ? "bg-white/20 text-white dark:bg-black/20 dark:text-white" : "bg-muted text-muted-foreground"
                )}>
                  {tab.count}
                </span>
              </span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="min-h-[300px]">
          <ItemsGrid
            items={paginatedItems}
            viewMode={viewMode}
            onReportLost={handleReportLost}
            onMarkFound={handleMarkFound}
            onViewItem={handleViewItem}
            hasActiveFilters={selectedCategory !== 'all' || searchQuery !== '' || statusTab !== 'all'}
            onClearFilters={() => {
              setSelectedCategory('all');
              setSearchQuery('');
              setStatusTab('all');
            }}
            onPayNow={(item) => {
              setPaymentItem(item);
              setIsPaymentModalOpen(true);
            }}
          />
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-full shadow-sm bg-background/50 backdrop-blur-sm border-border/40"
            >
              Previous
            </Button>
            <div className="flex items-center gap-1 mx-2">
              {Array.from({ length: totalPages }).map((_, i) => {
                // Show at most 5 page buttons
                if (
                  totalPages > 5 &&
                  i !== 0 &&
                  i !== totalPages - 1 &&
                  Math.abs(currentPage - 1 - i) > 1
                ) {
                  if (Math.abs(currentPage - 1 - i) === 2) {
                    return <span key={i} className="text-muted-foreground text-xs">...</span>;
                  }
                  return null;
                }

                return (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={cn(
                      "w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-all",
                      currentPage === i + 1
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:bg-muted dark:hover:bg-slate-800"
                    )}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-full shadow-sm bg-background/50 backdrop-blur-sm border-border/40"
            >
              Next
            </Button>
          </div>
        )}

        {paymentItem && (
          <PaymentModal
            open={isPaymentModalOpen}
            onOpenChange={setIsPaymentModalOpen}
            paymentDetails={{
              type: 'registration',
              itemId: paymentItem.id,
            }}
            onPaymentSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/items"] });
            }}
          />
        )}

        {/* Mark Found Dialog */}
        <AlertDialog open={isMarkFoundDialogOpen} onOpenChange={setIsMarkFoundDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Mark "{itemToMarkFound?.name}" as found?</AlertDialogTitle>
              <AlertDialogDescription>
                This will update the item status to "Recovered" and resolve any active lost reports.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  if (itemToMarkFound) markAsFoundMutation.mutate(itemToMarkFound.id);
                }}
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={markAsFoundMutation.isPending}
              >
                {markAsFoundMutation.isPending ? "Updating..." : "Mark Found"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Report Lost Dialog */}
        {reportItem && (
          <ReportRegisteredItemDialog
            item={reportItem}
            open={isReportDialogOpen}
            onOpenChange={setIsReportDialogOpen}
          />
        )}
      </div>
    </PageLayout>
  );
}

interface ItemsGridProps {
  items: Item[];
  viewMode: "grid" | "list";
  onReportLost: (itemId: number) => void;
  onMarkFound: (item: Item) => void;
  onViewItem: (itemId: number) => void;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  onPayNow: (item: Item) => void;
}

function ItemsGrid({ items, viewMode, onReportLost, onMarkFound, onViewItem, hasActiveFilters, onClearFilters, onPayNow }: ItemsGridProps) {
  const [, navigate] = useLocation();

  if (items.length === 0) {
    return (
      <div className="py-8 sm:py-20 flex flex-col items-center justify-center animate-in slide-in-from-bottom-4 duration-500 px-4">
        <div className="relative mb-6 group">
          <motion.div
            className="absolute -inset-10 bg-gradient-to-br from-primary/20 to-blue-500/10 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="relative h-20 w-20 sm:h-24 sm:w-24 bg-muted/40 rounded-2xl sm:rounded-3xl flex items-center justify-center border border-muted/30 backdrop-blur-xl shadow-2xl"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Package className="h-10 w-10 sm:h-12 sm:w-12 text-primary/40" />
          </motion.div>
        </div>
        <h3 className="text-lg sm:text-2xl font-black tracking-tight mb-2 text-center bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/60">
          No items found
        </h3>
        <p className="text-xs sm:text-base text-muted-foreground max-w-sm text-center mb-6 px-4 opacity-70 font-medium">
          {hasActiveFilters
            ? "Your current filters aren't returning any results."
            : "You don't have any registered possessions yet."}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-colors duration-300"
            >
              Reset Filters
            </button>
          )}
          <Button
            variant="default"
            onClick={() => navigate("/register-item")}
            className="rounded-full px-8 h-10 sm:h-12 bg-primary hover:bg-primary/90 font-bold transition-all shadow-xl shadow-primary/20"
          >
            <PlusCircle className="mr-2 h-4 w-4 text-white" />
            Register Item
          </Button>
        </div>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="space-y-3 pb-20">
        <AnimatePresence mode="popLayout">
          {items.map(item => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="overflow-hidden bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-border/40 dark:border-white/10 hover:border-primary/30 dark:hover:border-white/20 transition-all duration-300 group shadow-sm">
                <div
                  className="p-3 flex items-center gap-4 cursor-pointer"
                  onClick={() => navigate(`/items/${item.id}`)}
                >
                  {/* Small Thumbnail */}
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden shrink-0 bg-muted/20 dark:bg-muted/10 border border-muted/30 relative flex items-center justify-center p-1.5">
                    {item.imageUrls && item.imageUrls.length > 0 ? (
                      <img
                        src={item.imageUrls[0]}
                        alt={item.name}
                        width={80}
                        height={80}
                        loading="lazy"
                        decoding="async"
                        className="object-contain w-full h-full mix-blend-multiply dark:mix-blend-normal group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="h-6 w-6 text-muted-foreground/20" />
                      </div>
                    )}
                    {/* Visual Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />
                  </div>

                  {/* Name & Subtitle */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm sm:text-base font-black tracking-tight truncate group-hover:text-primary transition-colors">
                        {item.name}
                      </h3>
                      <Badge
                        className={cn(
                          "sm:hidden text-[8px] px-2 py-0.5 border font-black uppercase tracking-widest flex items-center gap-1 shadow-sm backdrop-blur-md",
                          item.status === 'Pending_Payment' && "bg-amber-100 text-amber-700 dark:bg-black/70 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
                          item.status === 'Registered' && "bg-blue-100 text-blue-700 dark:bg-black/70 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
                          item.status === 'Lost' && "bg-red-100 text-destructive dark:bg-black/80 dark:text-destructive border-destructive/30 animate-pulse",
                          (item.status === 'Recovered' || item.status === 'Found') && "bg-emerald-100 text-emerald-700 dark:bg-black/70 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
                        )}
                      >
                        <div className={cn(
                          "h-1 w-1 rounded-full",
                          item.status === 'Pending_Payment' && "bg-amber-400",
                          item.status === 'Registered' && "bg-blue-400",
                          item.status === 'Lost' && "bg-destructive",
                          (item.status === 'Recovered' || item.status === 'Found') && "bg-emerald-400"
                        )} />
                        {item.status === 'Pending_Payment' ? 'Unpaid' : item.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <div className="flex items-center text-[10px] font-black text-muted-foreground/50 tracking-widest uppercase">
                        <TagIcon className="h-2.5 w-2.5 mr-1 text-primary/40" />
                        {item.category}
                      </div>
                      {item.uniqueIdentifier && (
                        <div className="hidden md:flex items-center text-[10px] text-primary/40 font-black tracking-tighter uppercase px-1.5 py-0.5 rounded-md bg-primary/5 border border-primary/10">
                          ID: {item.uniqueIdentifier.substring(0, 12)}...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-2 sm:gap-4">
                    <Badge
                      className={cn(
                        "hidden sm:flex shadow-sm backdrop-blur-md transition-all duration-300 font-black text-[9px] uppercase tracking-widest px-2.5 py-1.5 border items-center gap-1.5",
                        item.status === 'Pending_Payment' && "bg-amber-100 text-amber-700 dark:bg-black/70 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
                        item.status === 'Registered' && "bg-blue-100 text-blue-700 dark:bg-black/70 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
                        item.status === 'Lost' && "bg-red-100 text-destructive dark:bg-black/80 dark:text-destructive border-destructive/30 animate-pulse",
                        (item.status === 'Recovered' || item.status === 'Found') && "bg-emerald-100 text-emerald-700 dark:bg-black/70 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
                        item.status === 'Archived' && "bg-muted text-muted-foreground dark:bg-black/70 dark:border-white/10"
                      )}
                    >
                      <div className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        item.status === 'Pending_Payment' && "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]",
                        item.status === 'Registered' && "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]",
                        item.status === 'Lost' && "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.6)]",
                        (item.status === 'Recovered' || item.status === 'Found') && "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]",
                        item.status === 'Archived' && "bg-muted-foreground"
                      )} />
                      {item.status === 'Pending_Payment' ? 'Unpaid' : item.status}
                    </Badge>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-primary/5 hover:text-primary"
                        onClick={() => onViewItem(item.id)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-primary/5 hover:text-primary"
                        onClick={() => navigate(`/items/${item.id}/edit`)}
                        title="Edit"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      {item.status === 'Pending_Payment' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                          onClick={() => onPayNow(item)}
                          title="Pay Now"
                        >
                          <CreditCard className="h-4 w-4" />
                        </Button>
                      )}
                      {item.status === 'Registered' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                          onClick={() => onReportLost(item.id)}
                          title="Report Loss"
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </Button>
                      )}
                      {item.status === 'Lost' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                          onClick={() => onMarkFound(item)}
                          title="Mark as Found"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 pb-20">
      <AnimatePresence mode="popLayout">
        {items.map(item => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="group"
          >
            <Card
              className="h-full flex flex-col overflow-hidden bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-border/40 dark:border-white/10 hover:border-primary/30 dark:hover:border-white/20 transition-all duration-500 hover:-translate-y-1 hover:shadow-premium group cursor-pointer"
              onClick={() => navigate(`/items/${item.id}`)}
            >
              {/* Image Header */}
              <div className="relative h-48 sm:h-52 w-full overflow-hidden rounded-t-xl bg-slate-50 dark:bg-slate-800/50 flex flex-col justify-center items-center p-4">
                {item.imageUrls && item.imageUrls.length > 0 ? (
                  <img
                    src={item.imageUrls[0]}
                    alt={item.name}
                    width={400}
                    height={200}
                    loading="lazy"
                    decoding="async"
                    className="object-contain w-full h-full mix-blend-multiply dark:mix-blend-normal transition-transform duration-1000 group-hover:scale-110 drop-shadow-md"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Package className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/20 group-hover:scale-110 transition-transform duration-700" />
                  </div>
                )}

                {/* Visual Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Status badge */}
                <div className="absolute top-3 right-3">
                  <Badge
                    className={cn(
                      "shadow-xl backdrop-blur-md transition-all duration-300 font-black text-[9px] uppercase tracking-widest px-2.5 py-1.5 border flex items-center gap-1.5 z-10",
                      item.status === 'Pending_Payment' && "bg-white/95 text-amber-600 dark:bg-black/70 dark:text-amber-400 border-amber-500/20",
                      item.status === 'Registered' && "bg-white/95 text-blue-600 dark:bg-black/70 dark:text-blue-400 border-blue-500/20",
                      item.status === 'Lost' && "bg-red-50 text-destructive dark:bg-black/80 dark:text-destructive animate-pulse border-destructive/30",
                      (item.status === 'Recovered' || item.status === 'Found') && "bg-white/95 text-emerald-600 dark:bg-black/70 dark:text-emerald-400 border-emerald-500/20",
                      item.status === 'Archived' && "bg-muted text-muted-foreground dark:bg-black/70 dark:border-white/10"
                    )}
                  >
                    <div className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      item.status === 'Pending_Payment' && "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]",
                      item.status === 'Registered' && "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]",
                      item.status === 'Lost' && "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.6)]",
                      (item.status === 'Recovered' || item.status === 'Found') && "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]",
                      item.status === 'Archived' && "bg-muted-foreground"
                    )} />
                    {item.status === 'Pending_Payment' ? 'Unpaid' : item.status}
                  </Badge>
                </div>

                {/* Quick view button on hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-full h-9 px-5 backdrop-blur-md bg-white/20 text-white border border-white/30 hover:bg-white/40 font-bold transition-all"
                    onClick={() => onViewItem(item.id)}
                  >
                    <Eye className="h-3.5 w-3.5 mr-2" />
                    Details
                  </Button>
                </div>
              </div>

              <CardHeader className="p-4 pb-4">
                <CardTitle className="text-base sm:text-lg font-black line-clamp-1 group-hover:text-primary transition-colors duration-300">
                  {item.name}
                </CardTitle>
                <div className="flex items-center text-[10px] font-black text-muted-foreground/50 tracking-widest uppercase mt-1">
                  <TagIcon className="h-3 w-3 mr-1.5 text-primary/50" />
                  {item.category}
                </div>
              </CardHeader>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
