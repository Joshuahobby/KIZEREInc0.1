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
  Search as SearchIcon
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
          title: `${dialogType === 'lost' ? 'Lost' : 'Found'} item reported successfully`,
          description: dialogType === 'found'
            ? "Your report is pending admin approval."
            : "Your report has been submitted.",
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
    <PageLayout>
      <div className="py-8 relative isolate">
        {/* Background Decorative Gradients */}
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] [clip-path:polygon(74.1%_44.1%,100%_61.6%,97.5%_26.9%,85.5%_0.1%,80.7%_2%,72.5%_32.5%,60.2%_62.4%,52.4%_68.1%,47.5%_58.3%,45.2%_34.5%,27.5%_76.7%,0.1%_64.9%,17.9%_100%,27.6%_76.8%,76.1%_97.7%,74.1%_44.1%)]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center md:text-left flex flex-col md:flex-row gap-8 items-center justify-between">
            <div className="max-w-2xl">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-neutral-900 bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-600">
                Lost & Found Hub
              </h1>
              <p className="mt-4 text-lg text-neutral-600">
                Helping Rwanda reunite people with their lost belongings. Report lost items or register what you've found to help others.
              </p>
            </div>
            {/* Search Bar Blocked Out into Hero */}
            <div className="w-full max-w-lg mt-4 md:mt-0 relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-primary/30 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <SearchIcon className="h-5 w-5 text-primary/70" />
                </div>
                <Input
                  type="text"
                  placeholder="Search by keywords (e.g. iPhone, Blue Wallet)..."
                  className="pl-12 h-14 bg-white/90 backdrop-blur-sm border-white/20 shadow-xl rounded-2xl focus:ring-primary/50 focus:border-primary text-base transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4">
            <SearchFilters onFiltersChange={setFilters} />
          </div>

          <div className="mt-10 flex flex-col gap-6 md:flex-row md:gap-6 lg:gap-8">
            {/* Lost Item Card */}
            <Card className="flex-1 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/10 hover:-translate-y-1 border-red-100 bg-white/50 backdrop-blur-sm group cursor-pointer relative" onClick={() => handleOpenDialog("lost")}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-400/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
              <CardContent className="p-8 flex flex-col items-center text-center relative z-10 h-full justify-between">
                <div>
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-red-100 to-red-50 shadow-inner flex items-center justify-center mb-6 mx-auto transform transition-transform group-hover:scale-110 group-hover:rotate-3 duration-300">
                    <AlertTriangle className="h-10 w-10 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-neutral-900">Report Lost Item</h2>
                  <p className="mt-3 text-neutral-600 text-sm leading-relaxed">Did you lose something? Report it here and our system will match it when someone finds it.</p>
                </div>
                <Button
                  className="mt-8 w-full bg-linear-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 shadow-md shadow-red-500/20 text-white rounded-xl h-12 text-md transition-all group-hover:shadow-lg group-hover:shadow-red-500/40"
                >
                  Report Now
                  <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </CardContent>
            </Card>

            {/* Found Item Card */}
            <Card className="flex-1 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1 border-emerald-100 bg-white/50 backdrop-blur-sm group cursor-pointer relative" onClick={() => handleOpenDialog("found")}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
              <CardContent className="p-8 flex flex-col items-center text-center relative z-10 h-full justify-between">
                <div>
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 shadow-inner flex items-center justify-center mb-6 mx-auto transform transition-transform group-hover:scale-110 group-hover:-rotate-3 duration-300">
                    <svg className="h-10 w-10 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-neutral-900">Register Found Item</h2>
                  <p className="mt-3 text-neutral-600 text-sm leading-relaxed">Found something? Securely register it to help us reunite it with its rightful owner.</p>
                </div>
                <Button
                  className="mt-8 w-full bg-linear-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 shadow-md shadow-emerald-500/20 text-white rounded-xl h-12 text-md transition-all group-hover:shadow-lg group-hover:shadow-emerald-500/40"
                >
                  Register Item
                  <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </CardContent>
            </Card>

            {/* Report from My Items Card */}
            {userItems && userItems.length > 0 && (
              <Card className="flex-1 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 border-primary/20 bg-gradient-to-b from-primary/5 to-transparent relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
                <CardContent className="p-8 flex flex-col items-center text-center relative z-10 h-full justify-between">
                  <div>
                    <div className="h-20 w-20 rounded-2xl bg-white shadow-sm border border-primary/10 flex items-center justify-center mb-6 mx-auto transform transition-transform group-hover:scale-110 duration-300">
                      <Plus className="h-10 w-10 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-neutral-900">Report My Item</h2>
                    <p className="mt-3 text-neutral-600 text-sm leading-relaxed">Quickly mark one of your pre-registered belongings as lost. Details are pre-filled.</p>
                  </div>
                  <div className="mt-8 flex flex-wrap justify-center gap-2 w-full">
                    {userItems.slice(0, 3).map(item => (
                      <Button
                        key={item.id}
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog("lost", item)}
                        className="text-xs bg-white text-primary border-primary/20 hover:bg-primary/5 hover:border-primary/40 rounded-full px-4"
                      >
                        {item.name}
                      </Button>
                    ))}
                    {userItems.length > 3 && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-xs text-primary font-medium hover:bg-primary/10 rounded-full px-4">
                            View all {userItems.length}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md border-0 shadow-2xl rounded-2xl">
                          <DialogHeader>
                            <DialogTitle className="text-xl">Select an Item</DialogTitle>
                            <DialogDescription>
                              Choose one of your registered items to create a fast report.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-3 max-h-[400px] overflow-y-auto p-1 mt-2">
                            {userItems.map(item => (
                              <Button
                                key={item.id}
                                variant="outline"
                                className="justify-start h-auto p-4 border border-neutral-200 hover:border-primary/50 hover:bg-primary/5 rounded-xl transition-all w-full text-left font-medium"
                                onClick={() => {
                                  handleOpenDialog("lost", item);
                                }}
                              >
                                {item.name}
                              </Button>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recent Lost & Found Items */}
          <div className="mt-12 mb-20 relative">
            <h2 className="text-2xl leading-6 font-display font-bold text-neutral-900 border-b border-neutral-100 pb-4">Recent Discoveries & Reports</h2>

            {isLoading ? (
              <div className="mt-12 flex flex-col items-center justify-center p-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                  <Loader2 className="h-10 w-10 animate-spin text-primary relative z-10" />
                </div>
                <p className="mt-4 text-neutral-500 font-medium animate-pulse">Scanning the network...</p>
              </div>
            ) : sortedReports && sortedReports.length > 0 ? (
              <div className="mt-8 grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {sortedReports.map((report) => (
                  <Card key={report.id} className="overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 border border-neutral-200/60 bg-white/70 backdrop-blur-md group hover:-translate-y-1">
                    <CardContent className="p-0">
                      <div className={`relative h-2 bg-gradient-to-r w-full ${report.type === 'lost' ? 'from-red-400 to-red-500' : 'from-emerald-400 to-emerald-500'}`} />
                      <div className="p-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${report.type === 'lost'
                              ? 'bg-red-50 text-red-600 ring-1 ring-inset ring-red-500/20'
                              : 'bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-500/20'
                              }`}>
                              {report.type === 'lost' ? 'Missing' : 'Found'}
                            </span>
                            <h3 className="mt-3 text-lg font-bold text-neutral-900 line-clamp-1 group-hover:text-primary transition-colors">{report.title}</h3>
                          </div>
                          <span className="text-xs font-medium text-neutral-400 bg-neutral-50 px-2 py-1 rounded-md">
                            {format(new Date(report.date), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <div className="mt-4 space-y-3">
                          <p className="text-sm text-neutral-600 line-clamp-2 leading-relaxed">{report.description}</p>
                          <div className="flex items-center text-xs font-medium text-neutral-500 pt-2 border-t border-neutral-100">
                            <MapPin className="h-4 w-4 text-primary md:mr-1.5 mr-1" />
                            <span className="truncate">{report.location}</span>
                          </div>
                        </div>
                        <div className="mt-6 pt-2">
                          <Button
                            variant="secondary"
                            className="w-full bg-neutral-50 hover:bg-primary text-neutral-700 hover:text-white border-none shadow-none rounded-xl font-semibold transition-all group-hover:shadow-md"
                            onClick={() => setLocation(`/report/${report.id}`)}
                          >
                            View details
                            <ChevronRight className="ml-1.5 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="mt-8 border-dashed border-2 border-neutral-200 bg-neutral-50/50">
                <CardContent className="p-16 flex flex-col items-center text-center">
                  <div className="h-20 w-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                    <SearchIcon className="h-8 w-8 text-neutral-300" />
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900">No items found</h3>
                  <p className="text-neutral-500 max-w-sm mt-2">We couldn't find any lost or found items matching your current filters.</p>
                  <Button variant="outline" className="mt-6 rounded-xl" onClick={() => setFilters({ category: "All Categories", location: "All Locations", sortBy: "newest", dateFilter: "all" })}>
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Form Dialog for Lost/Found Items */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl p-0 border-0 shadow-2xl">
          <div className={`p-6 pb-4 ${dialogType === "lost" ? "bg-red-50/50" : "bg-emerald-50/50"} border-b border-neutral-100`}>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                {dialogType === "lost" ? (
                  <><AlertTriangle className="h-6 w-6 text-red-600" /> Report a Lost Item</>
                ) : (
                  <><div className="bg-emerald-100 p-1.5 rounded-md"><Check className="h-4 w-4 text-emerald-700 font-bold" /></div> Register a Found Item</>
                )}
              </DialogTitle>
              <DialogDescription className="text-sm mt-1">
                Please provide detailed information. Accurate details increase the chances of a successful match.
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
