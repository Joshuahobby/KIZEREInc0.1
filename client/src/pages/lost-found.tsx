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
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Report } from "@shared/schema";
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
    sortBy: "newest"
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
      // 1. Upload images if any
      let imageUrls: string[] = [];
      if (images.length > 0) {
        const formData = new FormData();
        images.forEach(img => formData.append('images', img));
        const uploadRes = await fetch('/api/upload/images', { method: 'POST', body: formData });
        if (!uploadRes.ok) throw new Error("Image upload failed");
        const { urls } = await uploadRes.json();
        imageUrls = urls;
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
    onSuccess: (res) => {
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
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">Lost & Found Hub</h1>
          <p className="mt-2 text-neutral-500 max-w-2xl">Helping Rwanda reunite people with their lost belongings. Report lost items or register what you've found to help others.</p>

          {/* Search Bar */}
          <div className="mt-8 relative max-w-xl">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-neutral-400" />
            </div>
            <Input
              type="text"
              placeholder="Search by keywords (e.g. iPhone, Blue Wallet, Passport)..."
              className="pl-10 h-12 shadow-sm border-neutral-200 focus:ring-primary focus:border-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="mt-4">
            <SearchFilters onFiltersChange={setFilters} />
          </div>

          <div className="mt-6 flex flex-col gap-6 md:flex-row md:gap-8">
            {/* Lost Item Card */}
            <Card className="flex-1">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <AlertTriangle className="h-10 w-10 text-red-600" />
                </div>
                <h2 className="text-xl font-medium text-neutral-900">Report Lost Item</h2>
                <p className="mt-2 text-neutral-500 text-sm">Did you lose something? Report it here and we'll notify you if someone finds it.</p>
                <Button
                  onClick={() => handleOpenDialog("lost")}
                  className="mt-6 bg-red-600 hover:bg-red-700 focus:ring-red-500"
                >
                  Report Lost Item
                </Button>
              </CardContent>
            </Card>

            {/* Found Item Card */}
            <Card className="flex-1">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <svg className="h-10 w-10 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <h2 className="text-xl font-medium text-neutral-900">Register Found Item</h2>
                <p className="mt-2 text-neutral-500 text-sm">Found something? Register it here and help reunite the item with its owner.</p>
                <Button
                  onClick={() => handleOpenDialog("found")}
                  className="mt-6 bg-green-600 hover:bg-green-700 focus:ring-green-500"
                >
                  Register Found Item
                </Button>
              </CardContent>
            </Card>

            {/* Report from My Items Card */}
            {userItems && userItems.length > 0 && (
              <Card className="flex-1 border-primary/20 bg-primary/5">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Plus className="h-10 w-10 text-primary" />
                  </div>
                  <h2 className="text-xl font-medium text-neutral-900">Report from My Items</h2>
                  <p className="mt-2 text-neutral-500 text-sm">Quickly report one of your registered items as lost. Details will be pre-filled.</p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {userItems.slice(0, 3).map(item => (
                      <Button
                        key={item.id}
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog("lost", item)}
                        className="text-xs"
                      >
                        {item.name}
                      </Button>
                    ))}
                    {userItems.length > 3 && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="link" size="sm" className="text-xs text-primary">
                            View all {userItems.length} items
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Select an Item to Report</DialogTitle>
                            <DialogDescription>
                              Choose one of your registered items to create a report.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-2 max-h-[400px] overflow-y-auto p-1">
                            {userItems.map(item => (
                              <Button
                                key={item.id}
                                variant="ghost"
                                className="justify-start h-auto p-4 border border-neutral-100 hover:border-primary/50"
                                onClick={() => {
                                  handleOpenDialog("lost", item);
                                }}
                              >
                                <div className="text-left font-medium">{item.name}</div>
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
          <div className="mt-8">
            <h2 className="text-lg leading-6 font-display font-medium text-neutral-900">Recent Lost & Found Items</h2>

            {isLoading ? (
              <div className="mt-4 flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              </div>
            ) : sortedReports && sortedReports.length > 0 ? (
              <div className="mt-4 grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {sortedReports.map((report) => (
                  <Card key={report.id} className="overflow-hidden shadow border border-gray-200">
                    <CardContent className="p-0">
                      <div className="p-5">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${report.type === 'lost'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                              }`}>
                              {report.type === 'lost' ? 'Lost' : 'Found'}
                            </span>
                            <h3 className="mt-2 text-lg font-medium text-neutral-900">{report.title}</h3>
                          </div>
                          <span className="text-xs text-neutral-500">
                            {format(new Date(report.date), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <div className="mt-3 space-y-2">
                          <p className="text-sm text-neutral-600 line-clamp-2">{report.description}</p>
                          <div className="flex items-center text-xs text-neutral-500">
                            <MapPin className="h-4 w-4 text-neutral-400 mr-1" />
                            <span>{report.location}</span>
                          </div>
                        </div>
                        <div className="mt-5">
                          <Button
                            variant="link"
                            className="p-0 h-auto text-primary-600 font-bold hover:text-primary-500"
                            onClick={() => setLocation(`/report/${report.id}`)}
                          >
                            View details
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="mt-4">
                <CardContent className="p-8 text-center">
                  <p className="text-neutral-500">No recent lost or found items to display.</p>
                  <p className="text-sm text-neutral-400 mt-2">Be the first to report a lost or found item.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Form Dialog for Lost/Found Items */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogType === "lost" ? "Report Lost Item" : "Register Found Item"}
            </DialogTitle>
            <DialogDescription>
              Please provide the details to help us {dialogType === "lost" ? "find" : "return"} the item.
            </DialogDescription>
          </DialogHeader>

          <ReportWizard
            type={dialogType || "found"}
            onSubmit={handleWizardSubmit}
            isSubmitting={reportMutation.isPending}
          />
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
