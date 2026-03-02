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
import { format } from "date-fns";
import { useDebounce } from "@/hooks/use-debounce";

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

export default function FoundItems() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("Lost");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [, setLocation] = useLocation();
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

  // Fetch user's registered items
  const { data: userItems } = useQuery<any[]>({
    queryKey: ['/api/items'],
    enabled: !!user,
  });

  // Get initial type from URL params
  // Default query object, override status to only fetch Lost items
  const params = new URLSearchParams(window.location.search);
  const queryObj = {
    ...Object.fromEntries(params.entries()),
    status: 'Lost', // Force status Lost from server
    type: 'found' // Force type found
  };
  const initialType = queryObj.type;

  // Fetch reports based on type and search
  const { data: reports, isLoading } = useQuery<Report[]>({
    queryKey: ['/api/reports', { type: initialType, search: debouncedSearch, ...filters, status: queryObj.status }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('type', 'found'); // Always fetch 'found' reports
      params.append('status', 'Lost'); // Always fetch 'Lost' status reports
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
        // For simplicity in this version, we queue metadata.
        // In a full production app, we'd store Blobs in IndexedDB.
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
      // Handle offline case
      if (res.offline) {
        toast({
          title: "Offline Mode",
          description: "Your report has been queued and will be submitted automatically when you're back online.",
        });
        setOpenDialog(false);
        form.reset();
        return;
      }

      // Invalidate and refetch reports
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
          title: `Found item reported successfully`,
          description: "Your report is pending admin approval.",
        });
        setOpenDialog(false);
      }

      // Reset form
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
  const handleOpenDialog = (type: "found") => {
    form.reset({
      type: type,
      title: '',
      category: 'Other',
      description: '',
      location: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      contactInfo: '',
    } as any);
    setOpenDialog(true);
  };

  // Handle form submission from wizard
  const handleWizardSubmit = (data: any, images: File[]) => {
    reportMutation.mutate({ data, images });
  };

  return (
    <PageLayout>
      <div className="py-8 relative isolate">
        {/* Background Decorative Gradients */}
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] [clip-path:polygon(74.1%_44.1%,100%_61.6%,97.5%_26.9%,85.5%_0.1%,80.7%_2%,72.5%_32.5%,60.2%_62.4%,52.4%_68.1%,47.5%_58.3%,45.2%_34.5%,27.5%_76.7%,0.1%_64.9%,17.9%_100%,27.6%_76.8%,76.1%_97.7%,74.1%_44.1%)]"></div>
        </div>

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div className="max-w-xl">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2 flex items-center gap-2">
                <div className="bg-emerald-100 p-2 rounded-xl"><Check className="h-8 w-8 text-emerald-600 font-black" /></div> Found Something?
              </h1>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                Browse items that others have lost in your community, or report an item you've found to help return it to its owner.
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <Button
                onClick={() => handleOpenDialog("found")}
                className="flex-1 md:flex-none bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
              >
                <Check className="w-4 h-4 mr-2 text-white" /> Report Found Item
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-20">
            {/* Left Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white/70 backdrop-blur-md border border-neutral-200/60 rounded-2xl p-6 lg:sticky lg:top-24 shadow-sm">
                <h3 className="font-bold text-lg mb-4 text-neutral-900 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
                  Filters
                </h3>

                <SearchFilters onFiltersChange={setFilters} orientation="vertical" />
              </div>
            </div>

            {/* Right Main Content */}
            <div className="lg:col-span-3">
              {/* Search Bar */}
              <div className="mb-6 relative group w-full">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-primary/60" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Search by keywords (e.g. Passport, Blue Wallet)..."
                    className="pl-11 h-12 bg-white/90 backdrop-blur-sm border-white/40 shadow-sm rounded-xl focus:ring-primary/40 focus:border-primary/50 text-sm transition-all"
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
                    <p className="mt-3 text-sm text-neutral-500 font-medium animate-pulse">Scanning the directory...</p>
                  </div>
                ) : sortedReports && sortedReports.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {sortedReports.map((report) => (
                      <Card key={report.id} className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-neutral-200/60 bg-white/80 backdrop-blur-md group hover:-translate-y-1 flex flex-row cursor-pointer" onClick={() => setLocation(`/report/${report.id}`)}>
                        <div className={`w-1.5 h-auto ${report.type === 'lost' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                        <CardContent className="p-4 flex flex-col md:flex-row md:items-center w-full gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-2 md:mb-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${report.type === 'lost'
                                ? 'bg-red-50 text-red-600 border border-red-100'
                                : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                }`}>
                                {report.type === 'lost' ? 'Lost' : 'Found'}
                              </span>
                              <span className="text-[10px] font-medium text-neutral-400 md:hidden">
                                {format(new Date(report.date), 'MMM d, yyyy')}
                              </span>
                            </div>

                            <h3 className="text-base font-bold text-neutral-900 line-clamp-1 group-hover:text-primary transition-colors">{report.title}</h3>
                            <p className="mt-1 text-xs text-neutral-600 line-clamp-1 md:line-clamp-2 leading-relaxed">{report.description}</p>
                          </div>

                          <div className="flex items-center justify-between md:flex-col md:items-end md:justify-center md:min-w-[140px] pt-3 md:pt-0 border-t md:border-t-0 md:border-l border-neutral-100 md:pl-4 mt-3 md:mt-0">
                            <div className="flex flex-col gap-1 items-start md:items-end w-full">
                              <span className="hidden md:block text-[10px] font-medium text-neutral-400">
                                {format(new Date(report.date), 'MMM d, yyyy')}
                              </span>
                              <div className="flex items-center text-[11px] font-medium text-neutral-500 w-full justify-start md:justify-end">
                                <span className="truncate max-w-[140px] md:max-w-full text-right">{report.location}</span>
                                <MapPin className="h-3 w-3 text-primary ml-1 shrink-0 hidden md:block" />
                                <MapPin className="h-3 w-3 text-primary mr-1 shrink-0 md:hidden" />
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-neutral-300 md:hidden group-hover:text-primary transition-colors mt-2" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="mt-2 border-dashed border-2 border-neutral-200/70 bg-white/40 backdrop-blur-sm">
                    <CardContent className="p-16 flex flex-col items-center text-center">
                      <div className="h-16 w-16 bg-white rounded-full shadow-sm border border-neutral-100 flex items-center justify-center mb-4">
                        <SearchIcon className="h-6 w-6 text-neutral-300" />
                      </div>
                      <h3 className="text-base font-bold text-neutral-900">No items found</h3>
                      <p className="text-sm text-neutral-500 max-w-sm mt-1">We couldn't find any items matching your current search terms or filters.</p>
                      <Button variant="outline" size="sm" className="mt-5 rounded-lg border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 shadow-sm" onClick={() => setFilters({ category: "All Categories", location: "All Locations", sortBy: "newest", dateFilter: "all" })}>
                        Clear Filters
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Dialog for Found Items */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl p-0 border-0 shadow-2xl">
          <div className="p-6 pb-4 bg-emerald-50/50 border-b border-neutral-100">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <div className="bg-emerald-100 p-1.5 rounded-md"><Check className="h-4 w-4 text-emerald-700 font-bold" /></div> Report a Found Item
              </DialogTitle>
              <DialogDescription className="text-sm mt-1">
                Please provide detailed information to help the owner identify their item.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-2">
            <ReportWizard
              type="found"
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
