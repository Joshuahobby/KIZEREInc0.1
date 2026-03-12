import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PageLayout } from "@/components/layout/page-layout";
import { AuthWall } from "@/components/ui/auth-wall";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Report } from "@shared/schema";
import { OfflineSyncService } from "@/lib/offline-db";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  MapPin,
  Calendar,
  Loader2,
  MapPinned,
  ChevronRight,
  Plus,
  PlusCircle,
  Check,
  Search as SearchIcon,
  PackageSearch,
  ArrowRight,
  Tag as TagIcon,
  Lock,
  User
} from "lucide-react";
import { ReportWizard } from "@/components/reports/report-wizard";
import { ReportDetailDialog } from "@/components/reports/report-detail-dialog";
import { SearchFilters, FilterState } from "@/components/reports/search-filters";
import { PaymentService } from "@/services/payment.service";
import { Badge } from "@/components/ui/badge";
import { ShareWhatsAppButton } from "@/components/ui/share-whatsapp-button";
import { useAuth } from "@/hooks/use-auth";
import { useDebounce } from "@/hooks/use-debounce";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// Report form schema
const reportFormSchema = z.object({
  type: z.string({
    required_error: "Please select a report type",
  }),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().min(3, "Location is required"),
  date: z.string().min(1, "Date is required"),
  contactInfo: z.string().min(5, "Contact information is required"),
});

type ReportFormValues = z.infer<typeof reportFormSchema>;

export default function LostFound() {
  const [location, setLocation] = useLocation();
  const [dialogType, setDialogType] = useState<"lost" | "found" | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    category: "All Categories",
    location: "All Locations",
    sortBy: "newest",
    dateFilter: "all"
  });
  const debouncedSearch = useDebounce(searchQuery, 300);
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useTranslation();

  // Fetch user's registered items
  const { data: userItems } = useQuery<any[]>({
    queryKey: ['/api/items'],
    enabled: !!user,
  });

  // Get initial type from URL params - use window.location.search to get current query string
  const [initialType, setInitialType] = useState(() => {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get('type') || '';
  });

  // Re-sync initialType when location changes
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const newType = searchParams.get('type') || '';
    if (newType !== initialType) {
      setInitialType(newType);
    }
  }, [location, initialType]);

  // Fetch reports based on type and search
  const { data: reportsData, isLoading } = useQuery<any>({
    queryKey: ['/api/reports', { type: initialType, search: debouncedSearch, ...filters }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (initialType) params.append('type', initialType);
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (filters.category !== 'All Categories') params.append('category', filters.category);
      if (filters.location !== 'All Locations') params.append('location', filters.location);
      if (filters.dateFilter !== 'all') params.append('dateFilter', filters.dateFilter);

      const endpoint = `/api/reports?${params.toString()}`;
      const res = await fetch(endpoint, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch reports');
      return res.json();
    },
    enabled: !!user,
  });

  const reports = reportsData?.reports || [];

  // Sort reports locally
  const sortedReports = reports ? [...reports].sort((a, b) => {
    if (filters.sortBy === 'newest') {
      return new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime();
    } else if (filters.sortBy === 'oldest') {
      return new Date(a.reportedAt).getTime() - new Date(b.reportedAt).getTime();
    }
    return 0; // relevance (default order from API)
  }) : [];

  // Form for lost/found items
  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      type: '',
      title: '',
      description: '',
      location: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      contactInfo: '',
    },
  });

  // Mutation for creating a report
  const reportMutation = useMutation({
    mutationFn: async ({ data, images }: { data: any, images: File[] }) => {
      // Check if offline
      if (!navigator.onLine) {
        console.log("[LostFound] Offline detected, queuing report...");
        await OfflineSyncService.queue('CREATE_REPORT', data);
        return { offline: true };
      }

      // 1. Upload images if any
      let imageUrls: string[] = [];
      if (images.length > 0) {
        const formData = new FormData();
        images.forEach(img => formData.append('images', img));
        const uploadRes = await apiRequest<{ urls: string[] }>('/api/upload/images', {
          method: 'POST',
          data: formData
        });
        imageUrls = uploadRes.urls;
      }

      // 2. Create the report
      const report = await apiRequest<any>("/api/reports", {
        method: "POST",
        data: { ...data, imageUrls }
      });

      // 3. Payment will be handled separately via PaymentModal
      // PawaPay Direct Deposit requires phone number + USSD approval,
      // so payment is initiated from the dashboard/payment modal after report creation.
      return { report };
    },
    onSuccess: (res: any) => {
      if (res.offline) {
        toast({
          title: "Offline Mode",
          description: "Your report has been queued and will be submitted automatically when you're back online.",
        });
        setOpenDialog(false);
        form.reset();
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });

      toast({
        title: `${dialogType === 'lost' ? 'Lost' : 'Found'} item reported successfully`,
        description: dialogType === 'found'
          ? "Your report is pending admin approval."
          : "Your report has been submitted. Proceed to payment from your dashboard.",
      });
      setOpenDialog(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Submission failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle dialog open for lost or found items
  const handleOpenDialog = (type: "lost" | "found", prefillData?: any) => {
    if (!user) {
      window.location.href = `/auth?returnUrl=${encodeURIComponent(window.location.pathname)}&action=report-${type}`;
      return;
    }
    setDialogType(type);
    form.reset({
      type: type,
      title: prefillData?.name || '',
      category: prefillData?.category || 'Other',
      description: prefillData?.description || '',
      location: prefillData?.location || '',
      date: format(new Date(), 'yyyy-MM-dd'),
      contactInfo: '',
      itemId: prefillData?.id || undefined,
      uniqueIdentifier: prefillData?.uniqueIdentifier || '',
    } as any);
    setOpenDialog(true);
  };

  // Check for action param to auto-open dialog
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const action = searchParams.get('action');

    if (action === 'report-lost' && !openDialog && !dialogType) {
      handleOpenDialog('lost');
      // Clean up URL so it doesn't reopen on refresh
      window.history.replaceState({}, '', window.location.pathname);
    } else if (action === 'report-found' && !openDialog && !dialogType) {
      handleOpenDialog('found');
      window.history.replaceState({}, '', window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, openDialog, dialogType]);

  // Handle form state restoration after login
  useEffect(() => {
    const savedData = localStorage.getItem('pending_report_wizard');
    if (savedData && user) {
      try {
        const { data, type: savedType } = JSON.parse(savedData);
        setDialogType(savedType);
        form.reset(data);
        setOpenDialog(true);
        localStorage.removeItem('pending_report_wizard');

        toast({
          title: "Wizard Restored",
          description: "We've restored your progress. You can now submit your report.",
        });
      } catch (e) {
        console.error("Failed to restore wizard state", e);
        localStorage.removeItem('pending_report_wizard');
      }
    }
  }, [user]);

  // Handle form submission from wizard
  const handleWizardSubmit = (data: any, images: File[]) => {
    reportMutation.mutate({ data, images });
  };

  return (
    <PageLayout hideSidebar={false} defaultSidebarCollapsed={true}>
      <div className="py-12 md:py-20 bg-background min-h-screen text-foreground transition-colors duration-500">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          {!user ? (
            <div className="flex items-center justify-center py-20">
              <AuthWall returnUrl="/lost-found" />
            </div>
          ) : (
            <>
              {/* Vercel-inspired Premium Hero */}
              <div className="flex flex-col items-center justify-center text-center pb-16 relative w-full mx-auto overflow-hidden">
                {/* Subtle Hero Spotlight */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] h-[300px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />

                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-heading font-bold tracking-tighter text-foreground mb-8 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                  {t('directoryPage.title')}
                </h1>
                <p className="max-w-3xl lg:max-w-none text-lg md:text-xl text-muted-foreground font-medium mb-8 opacity-80 leading-relaxed tracking-tight animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-200">
                  {t('directoryPage.subtitle')}
                </p>

                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-300">
                  <span className="h-px w-8 bg-border/60" />
                  <button
                    onClick={() => handleOpenDialog("found")}
                    className="text-sm font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-2 group"
                  >
                    <span>Found something?</span>
                    <PlusCircle className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                  </button>
                  <span className="h-px w-8 bg-border/60" />
                </div>
              </div>

              {/* Clean Command Center */}
              <div className="mb-12">
                <div className="glass shadow-premium rounded-2xl p-4 md:p-6 transition-all">
                  <div className="flex flex-col gap-6">
                    {/* Search Bar */}
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <SearchIcon className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      </div>
                      <Input
                        type="text"
                        placeholder={t('directoryPage.searchPlaceholder')}
                        className="pl-12 pr-28 h-12 bg-background/50 border-border/40 rounded-xl focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary text-base transition-all placeholder:text-muted-foreground/60 font-medium shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <div className="absolute inset-y-0 right-1 flex items-center">
                        <Button
                          size="sm"
                          className="h-10 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-semibold"
                          onClick={() => {
                            // Search is automatic via debounce, but this provides visual feedback
                            toast({
                              title: t('directoryPage.searchButton'),
                              description: `${t('common.search')}...`,
                              duration: 1500,
                            });
                          }}
                        >
                          {t('directoryPage.searchButton')}
                        </Button>
                      </div>
                    </div>

                    {/* Filters */}
                    <SearchFilters onFiltersChange={setFilters} orientation="horizontal" />
                  </div>
                </div>
              </div>

              <div className="space-y-12 pb-24">
                {/* Vercel-style Quick Report Cards */}
                {userItems && userItems.length > 0 && (
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-6 px-1">
                      <h3 className="font-semibold text-lg text-zinc-900 tracking-tight">Your Registry</h3>
                      <Badge variant="outline" className="border-zinc-200 text-zinc-600 font-medium bg-white px-2.5 py-0.5 rounded-full">{userItems.length} Total</Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {userItems.slice(0, 4).map(item => (
                        <div
                          key={item.id}
                          onClick={() => handleOpenDialog("lost", item)}
                          className="group bg-card/60 backdrop-blur-sm border border-border/40 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:border-primary/40 hover:shadow-premium flex flex-col justify-between min-h-[160px] relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="h-9 w-9 rounded-xl bg-secondary/10 border border-border/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300">
                              <TagIcon className="w-4.5 h-4.5" />
                            </div>
                            <div className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20 opacity-0 transform translate-y-1 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                              Report Lost
                            </div>
                          </div>
                          <div className="relative z-10">
                            <h4 className="font-heading font-bold text-foreground truncate tracking-tight">{item.name}</h4>
                            <p className="text-muted-foreground text-sm line-clamp-1 mt-1 font-medium opacity-70">{item.description || 'Verified Asset'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Items Space Grid */}
                <div className="w-full">
                  {!user ? (
                    <AuthWall returnUrl="/lost-found" />
                  ) : isLoading ? (
                    <div className="w-full py-32 flex flex-col items-center justify-center space-y-4">
                      <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                      <p className="text-zinc-500 text-sm animate-pulse font-medium">
                        {t('directoryPage.loadingReports') || "Scanning registry..."}
                      </p>
                    </div>
                  ) : sortedReports && sortedReports.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                      {sortedReports.map((report) => (
                        <div
                          key={report.id}
                          onClick={() => setLocation(`/report/${report.id}`)}
                          className="group bg-card border border-border/40 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-premium hover:border-primary/40 flex flex-col min-h-[300px] relative"
                        >
                          <div className={`h-1.5 w-full ${report.type === 'lost' ? 'bg-destructive' : 'bg-emerald-500'} relative z-10`} />

                          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                          <div className="p-5 flex flex-col flex-1">
                            <div className="flex justify-between items-start w-full mb-4">
                              <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-[0.1em] uppercase border ${report.type === 'lost'
                                ? 'bg-destructive/10 text-destructive border-destructive/20'
                                : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                } relative z-10`}>
                                {report.type === 'lost' ? t('searchFilters.lost') : t('searchFilters.found')}
                              </div>

                              <div onClick={(e) => e.stopPropagation()} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <ShareWhatsAppButton
                                  itemName={report.title}
                                  itemUrl={`${window.location.origin}/report/${report.id}`}
                                  compact={true}
                                />
                              </div>
                            </div>

                            <div className="mt-auto relative z-10">
                              <h3 className="text-xl font-heading font-bold tracking-tight text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">{report.title}</h3>

                              <p className="text-sm text-muted-foreground line-clamp-2 font-medium leading-relaxed mb-6 opacity-80">
                                {report.description}
                              </p>

                              <div className="flex items-center justify-between text-muted-foreground text-xs font-bold pt-4 border-t border-border/40">
                                <span className="flex items-center truncate max-w-[140px]">
                                  <MapPin className="w-3.5 h-3.5 mr-1.5 text-primary/70" />
                                  {report.location}
                                </span>
                                <span className="flex items-center shrink-0">
                                  <Calendar className="w-3.5 h-3.5 mr-1.5 text-primary/70" />
                                  {format(new Date(report.date), 'MMM d, yy')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="w-full rounded-3xl border border-border/10 bg-card/60 backdrop-blur-xl p-16 md:p-24 flex flex-col items-center text-center shadow-premium relative overflow-hidden transition-all duration-300">
                      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

                      <div className="relative mb-8 group">
                        <motion.div
                          className="absolute -inset-8 bg-gradient-to-br from-primary/10 to-blue-500/10 rounded-full blur-2xl pointer-events-none"
                          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <motion.div
                          className="relative h-20 w-20 rounded-2xl bg-secondary/10 border border-border/20 flex items-center justify-center backdrop-blur-md shadow-2xl"
                          animate={{ y: [0, -8, 0] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <PackageSearch className="w-10 h-10 text-muted-foreground/80 group-hover:text-primary transition-colors duration-500" />
                        </motion.div>
                      </div>

                      <h3 className="text-2xl font-heading font-bold tracking-tight text-foreground mb-3 relative z-10">
                        {t('directoryPage.noReports')}
                      </h3>
                      <p className="text-muted-foreground text-base max-w-sm mb-10 font-medium leading-relaxed opacity-80 relative z-10">
                        {t('directoryPage.noReportsHint')}
                      </p>

                      <Button
                        variant="premium"
                        className="h-11 px-8 rounded-full font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform duration-300 relative z-10"
                        onClick={() => setFilters({ category: "All Categories", location: "All Locations", sortBy: "newest", dateFilter: "all" })}
                      >
                        {t('searchFilters.clearAll')}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-xl max-h-[95vh] overflow-hidden flex flex-col rounded-3xl p-0 border border-border/50 dark:border-white/10 shadow-premium dark:shadow-[0_0_50px_-12px_rgba(255,255,255,0.1)] bg-background/95 dark:bg-zinc-950/90 backdrop-blur-xl focus:outline-none">
          <div className="p-6 pb-2">
            <DialogHeader>
              <div className="flex items-center gap-4 mb-2">
                <div className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center transition-colors shadow-lg",
                  dialogType === "lost"
                    ? "bg-red-500/10 text-red-600 dark:text-red-500 border border-red-500/20"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20"
                )}>
                  {dialogType === "lost" ? <AlertTriangle className="h-6 w-6" /> : <Check className="h-6 w-6" />}
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold tracking-tight text-foreground dark:text-white leading-none mb-1.5">
                    {dialogType === "lost" ? t('directoryPage.reportLost') : t('directoryPage.reportFound')}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground dark:text-zinc-400 font-medium leading-relaxed max-w-[280px]">
                    {dialogType === "lost" ? t('directoryPage.reportLostDesc') : t('directoryPage.reportFoundDesc')}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6 pt-0">
            <ReportWizard
              type={dialogType || "found"}
              onSubmit={handleWizardSubmit}
              isSubmitting={reportMutation.isPending}
            />
          </div>
        </DialogContent>
      </Dialog>

      <ReportDetailDialog
        report={selectedReport}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </PageLayout>
  );
}
