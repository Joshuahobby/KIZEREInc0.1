import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PageLayout } from "@/components/layout/page-layout";
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
  Check,
  Search as SearchIcon,
  PackageSearch,
  ArrowRight,
  Lock,
  User
} from "lucide-react";
import { ReportWizard } from "@/components/reports/report-wizard";
import { ReportDetailDialog } from "@/components/reports/report-detail-dialog";
import { SearchFilters, FilterState } from "@/components/reports/search-filters";
import { PaymentService } from "@/services/payment.service";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useDebounce } from "@/hooks/use-debounce";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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

      // 3. Handle payment for lost items
      if (data.type === 'lost' && report.paymentStatus !== 'successful') {
        const payment = await PaymentService.initializePayment({
          type: "lost_report",
          reportId: report.id
        });
        return { report, payment };
      }

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

      if (res.payment?.paymentUrl) {
        toast({
          title: "Payment Required",
          description: "Redirecting to secure payment page...",
        });
        window.location.href = res.payment.paymentUrl;
      } else {
        toast({
          title: `${dialogType === 'lost' ? 'Lost' : 'Found'} item reported successfully`,
          description: dialogType === 'found'
            ? "Your report is pending admin approval."
            : "Your report has been submitted.",
        });
        setOpenDialog(false);
      }
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
      <div className="py-8 relative isolate overflow-hidden">
        {/* Background Decorative Gradients - Enhanced for depth */}
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary/30 to-[#9089fc]/20 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] [clip-path:polygon(74.1%_44.1%,100%_61.6%,97.5%_26.9%,85.5%_0.1%,80.7%_2%,72.5%_32.5%,60.2%_62.4%,52.4%_68.1%,47.5%_58.3%,45.2%_34.5%,27.5%_76.7%,0.1%_64.9%,17.9%_100%,27.6%_76.8%,76.1%_97.7%,74.1%_44.1%)]"></div>
        </div>
        <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]" aria-hidden="true">
          <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-primary/20 to-secondary/10 opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem] [clip-path:polygon(74.1%_44.1%,100%_61.6%,97.5%_26.9%,85.5%_0.1%,80.7%_2%,72.5%_32.5%,60.2%_62.4%,52.4%_68.1%,47.5%_58.3%,45.2%_34.5%,27.5%_76.7%,0.1%_64.9%,17.9%_100%,27.6%_76.8%,76.1%_97.7%,74.1%_44.1%)]"></div>
        </div>

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section - Compact and Inline */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-border/50 pb-6 mb-8 mt-2">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70">
                {t('directoryPage.title')}
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground font-medium">
                {t('directoryPage.subtitle')}
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <Button
                onClick={() => handleOpenDialog("lost")}
                variant="destructive"
                className="flex-1 md:flex-none h-11 rounded-xl shadow-lg shadow-red-500/20 font-bold"
              >
                <AlertTriangle className="w-4 h-4 mr-2" /> {t('directoryPage.reportLost')}
              </Button>
              <Button
                onClick={() => handleOpenDialog("found")}
                className="flex-1 md:flex-none h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 font-bold"
              >
                <Check className="w-4 h-4 mr-2 text-white" /> {t('directoryPage.reportFound')}
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Horizontal Filter Bar at Top */}
            <div className="w-full">
              <SearchFilters onFiltersChange={setFilters} orientation="horizontal" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-20">
              {/* Left Sidebar only for Quick Report (My Items) */}
              {userItems && userItems.length > 0 && (
                <div className="lg:col-span-1">
                  <div className="bg-white/70 backdrop-blur-md border border-neutral-200/60 rounded-2xl p-6 lg:sticky lg:top-24 shadow-sm">
                    <h3 className="font-bold text-sm mb-1 text-neutral-900 flex items-center justify-between">
                      Quick Report
                      <Badge variant="secondary" className="bg-primary/10 text-primary">{userItems.length}</Badge>
                    </h3>
                    <p className="text-[11px] text-neutral-500 mb-4 leading-snug">Report one of your registered items as lost.</p>

                    <div className="grid gap-2">
                      {userItems.slice(0, 3).map(item => (
                        <Button
                          key={item.id}
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog("lost", item)}
                          className="h-9 justify-between text-xs bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 rounded-lg w-full transition-all"
                        >
                          <span className="truncate">{item.name}</span>
                          <ArrowRight className="ml-2 h-3 w-3 shrink-0 text-neutral-400" />
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Right Main Content */}
              <div className={cn(userItems && userItems.length > 0 ? "lg:col-span-3" : "lg:col-span-4")}>
                {/* Search Bar - Highlighted */}
                <div className="mb-6 relative group w-full">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-secondary/20 rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <SearchIcon className="h-5 w-5 text-primary" />
                    </div>
                    <Input
                      type="text"
                      placeholder={t('directoryPage.searchPlaceholder')}
                      className="pl-12 h-14 bg-background/60 backdrop-blur-xl border-border/40 shadow-inner rounded-2xl focus:ring-primary/30 focus:border-primary/40 text-lg transition-all placeholder:text-muted-foreground/50"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Items Grid */}
                <div className="relative min-h-[400px]">
                  {!user ? (
                    <Card className="mt-2 border-dashed border-2 border-muted/50 bg-background/40 backdrop-blur-lg rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5">
                      <CardContent className="p-20 flex flex-col items-center text-center">
                        <div className="relative h-24 w-24 mb-6 bg-gradient-to-br from-background to-muted/30 rounded-[2rem] shadow-xl border border-border/60 flex items-center justify-center">
                          <Lock className="h-10 w-10 text-primary/60" />
                        </div>
                        <h3 className="text-2xl font-black text-foreground mb-3">{t('directoryPage.loginRequired') || 'Authentication Required'}</h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-8 font-medium leading-relaxed">
                          {t('directoryPage.loginRequiredDesc') || 'For data security and privacy, the reported items directory is only accessible to authenticated users. Please log in to view and search the directory.'}
                        </p>
                        <Button
                          size="lg"
                          className="rounded-xl px-8"
                          onClick={() => window.location.href = `/auth?returnUrl=${encodeURIComponent(window.location.pathname)}`}
                        >
                          <User className="mr-2 h-4 w-4" />
                          {t('auth.signIn') || 'Sign In'}
                        </Button>
                      </CardContent>
                    </Card>
                  ) : isLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary relative z-10" />
                      <p className="mt-3 text-sm text-neutral-500 font-bold animate-pulse">{t('directoryPage.loadingReports') || 'Loading reports...'}</p>
                    </div>
                  ) : sortedReports && sortedReports.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {sortedReports.map((report) => (
                        <Card key={report.id} className="overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-border/50 bg-background/60 backdrop-blur-lg group hover:-translate-y-2 flex flex-col cursor-pointer rounded-[1.5rem]" onClick={() => setLocation(`/report/${report.id}`)}>
                          <div className={`h-1.5 w-full ${report.type === 'lost' ? 'bg-gradient-to-r from-red-500 to-orange-400' : 'bg-gradient-to-r from-emerald-500 to-teal-400'}`} />
                          <CardContent className="p-6 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest leading-none ${report.type === 'lost'
                                ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                }`}>
                                {report.type === 'lost' ? t('searchFilters.lost') : t('searchFilters.found')}
                              </span>
                              <span className="text-[10px] font-bold text-muted-foreground/60 flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {format(new Date(report.date), 'MMM d, yyyy')}
                              </span>
                            </div>

                            <h3 className="text-lg font-black text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-300">{report.title}</h3>
                            <p className="mt-2.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed flex-1 font-medium italic opacity-80">{report.description}</p>

                            <div className="mt-5 pt-5 border-t border-border/30 flex items-center justify-between">
                              <div className="flex items-center text-[11px] font-bold text-foreground/70">
                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center mr-2 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                  <MapPin className="h-3 w-3" />
                                </div>
                                <span className="truncate max-w-[150px]">{report.location}</span>
                              </div>
                              <div className="h-8 w-8 rounded-full bg-muted/30 flex items-center justify-center group-hover:bg-primary group-hover:text-white group-hover:translate-x-1 transition-all duration-500">
                                <ChevronRight className="h-4 w-4" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="mt-2 border-dashed border-2 border-muted/50 bg-background/40 backdrop-blur-lg rounded-[2.5rem] overflow-hidden shadow-2xl shadow-primary/5">
                      <CardContent className="p-20 flex flex-col items-center text-center">
                        <div className="relative mb-8">
                          <div className="absolute -inset-4 bg-primary/10 rounded-full blur-2xl animate-pulse"></div>
                          <div className="relative h-24 w-24 bg-gradient-to-br from-background to-muted/30 rounded-[2rem] shadow-xl border border-border/60 flex items-center justify-center transform rotate-3 hover:rotate-0 transition-transform duration-500">
                            <PackageSearch className="h-12 w-12 text-primary/40" />
                          </div>
                        </div>
                        <h3 className="text-2xl font-black text-foreground mb-2">{t('directoryPage.noReports')}</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-10 leading-relaxed font-medium">
                          {t('directoryPage.noReportsHint')}
                        </p>

                        <Button
                          variant="outline"
                          size="lg"
                          className="rounded-2xl border-border/60 bg-background/50 hover:bg-background text-foreground shadow-sm px-8 h-12 transition-all hover:scale-105 active:scale-95"
                          onClick={() => setFilters({ category: "All Categories", location: "All Locations", sortBy: "newest", dateFilter: "all" })}
                        >
                          {t('searchFilters.clearAll')}
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl p-0 border-0 shadow-2xl">
          <div className={`p-6 pb-4 ${dialogType === "lost" ? "bg-red-50/50" : "bg-emerald-50/50"} border-b border-neutral-100`}>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                {dialogType === "lost" ? (
                  <><AlertTriangle className="h-6 w-6 text-red-600" /> {t('directoryPage.reportLost')}</>
                ) : (
                  <><div className="bg-emerald-100 p-1.5 rounded-md"><Check className="h-4 w-4 text-emerald-700 font-bold" /></div> {t('directoryPage.reportFound')}</>
                )}
              </DialogTitle>
              <DialogDescription className="text-sm mt-1">
                {dialogType === "lost" ? t('directoryPage.reportLostDesc') : t('directoryPage.reportFoundDesc')}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-2">
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
    </PageLayout >
  );
}
