import { useState } from "react";
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
  ArrowRight
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

  // Get initial type from URL params
  const params = new URLSearchParams(location.split('?')[1]);
  const initialType = params.get('type') || '';

  // Fetch reports based on type and search
  const { data: reports, isLoading } = useQuery<Report[]>({
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
  });

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

  // Handle form submission from wizard
  const handleWizardSubmit = (data: any, images: File[]) => {
    reportMutation.mutate({ data, images });
  };

  return (
    <PageLayout hideSidebar={true}>
      <div className="py-8 relative isolate">
        {/* Background Decorative Gradients */}
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] [clip-path:polygon(74.1%_44.1%,100%_61.6%,97.5%_26.9%,85.5%_0.1%,80.7%_2%,72.5%_32.5%,60.2%_62.4%,52.4%_68.1%,47.5%_58.3%,45.2%_34.5%,27.5%_76.7%,0.1%_64.9%,17.9%_100%,27.6%_76.8%,76.1%_97.7%,74.1%_44.1%)]"></div>
        </div>

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section - Compact and Inline */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-neutral-200/70 pb-6 mb-8 mt-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900">
                {t('directoryPage.title')}
              </h1>
              <p className="mt-1 text-sm text-neutral-500 font-medium">
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
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-primary/10 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <SearchIcon className="h-5 w-5 text-primary/60" />
                    </div>
                    <Input
                      type="text"
                      placeholder={t('directoryPage.searchPlaceholder')}
                      className="pl-11 h-12 bg-white border-neutral-200 shadow-sm rounded-2xl focus:ring-primary/20 focus:border-primary/30 text-base transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Items Grid */}
                <div className="relative min-h-[400px]">
                  {isLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary relative z-10" />
                      <p className="mt-3 text-sm text-neutral-500 font-bold animate-pulse">{t('directoryPage.allReports')}</p>
                    </div>
                  ) : sortedReports && sortedReports.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {sortedReports.map((report) => (
                        <Card key={report.id} className="overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-neutral-200/60 bg-white/90 backdrop-blur-md group hover:-translate-y-1 flex flex-col cursor-pointer" onClick={() => setLocation(`/report/${report.id}`)}>
                          <div className={`h-1 w-full ${report.type === 'lost' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                          <CardContent className="p-5 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${report.type === 'lost'
                                ? 'bg-red-50 text-red-600 border border-red-100'
                                : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                }`}>
                                {report.type === 'lost' ? t('searchFilters.lost') : t('searchFilters.found')}
                              </span>
                              <span className="text-[10px] font-bold text-neutral-400">
                                {format(new Date(report.date), 'MMM d, yyyy')}
                              </span>
                            </div>

                            <h3 className="text-base font-black text-neutral-900 line-clamp-1 group-hover:text-primary transition-colors">{report.title}</h3>
                            <p className="mt-2 text-xs text-neutral-500 line-clamp-2 leading-relaxed flex-1">{report.description}</p>

                            <div className="mt-4 pt-4 border-t border-neutral-50 flex items-center justify-between">
                              <div className="flex items-center text-[11px] font-bold text-neutral-600">
                                <MapPin className="h-3.5 w-3.5 text-primary mr-1.5 shrink-0" />
                                <span className="truncate max-w-[150px]">{report.location}</span>
                              </div>
                              <Button variant="ghost" size="icon" className="h-8 w-8 p-0 rounded-full group-hover:bg-primary/10 group-hover:text-primary">
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="mt-2 border-dashed border-2 border-neutral-200/70 bg-white/40 backdrop-blur-sm rounded-3xl overflow-hidden">
                      <CardContent className="p-16 flex flex-col items-center text-center">
                        <div className="h-20 w-20 bg-white rounded-3xl shadow-xl shadow-neutral-200/50 border border-neutral-100 flex items-center justify-center mb-6 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                          <PackageSearch className="h-10 w-10 text-neutral-300" />
                        </div>
                        <h3 className="text-xl font-black text-neutral-900">{t('directoryPage.noReports')}</h3>
                        <p className="text-sm text-neutral-500 max-w-sm mt-2 font-medium">{t('directoryPage.noReportsHint')}</p>

                        <div className="flex flex-wrap gap-3 mt-8">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl border-neutral-200 text-neutral-600 hover:bg-white hover:text-neutral-900 shadow-sm"
                            onClick={() => setFilters({ category: "All Categories", location: "All Locations", sortBy: "newest", dateFilter: "all" })}
                          >
                            {t('searchFilters.clearAll')}
                          </Button>
                        </div>
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
    </PageLayout>
  );
}
