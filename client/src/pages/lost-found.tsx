import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
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
  ChevronRight
} from "lucide-react";
import { format } from "date-fns";

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
  const { toast } = useToast();
  
  // Get initial type from URL params
  const params = new URLSearchParams(location.split('?')[1]);
  const initialType = params.get('type') || '';
  
  // Fetch reports based on type
  const { data: reports, isLoading } = useQuery<Report[]>({
    queryKey: ['/api/reports', { type: initialType }],
    queryFn: async () => {
      const endpoint = `/api/reports${initialType ? `?type=${initialType}` : ''}`;
      const res = await fetch(endpoint, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch reports');
      return res.json();
    },
  });
  
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
    mutationFn: async (data: ReportFormValues) => {
      const res = await apiRequest("POST", "/api/reports", data);
      return res.json();
    },
    onSuccess: () => {
      // Invalidate and refetch reports
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      
      // Show success toast
      toast({
        title: `${dialogType === 'lost' ? 'Lost' : 'Found'} item reported successfully`,
        description: "Your report has been submitted and is now visible to others.",
      });
      
      // Reset form and close dialog
      form.reset();
      setOpenDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Report submission failed",
        description: error.message || "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Handle dialog open for lost or found items
  const handleOpenDialog = (type: "lost" | "found") => {
    setDialogType(type);
    form.setValue('type', type);
    setOpenDialog(true);
  };
  
  // Handle form submission
  const onSubmit = (data: ReportFormValues) => {
    // Convert date string to ISO format timestamp
    const submissionData = {
      ...data,
      date: new Date(data.date).toISOString()
    };
    
    reportMutation.mutate(submissionData);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-display font-semibold text-neutral-900">Lost & Found</h1>
            <p className="mt-1 text-sm text-neutral-500">Report lost items or register items you've found.</p>

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
            </div>
            
            {/* Recent Lost & Found Items */}
            <div className="mt-8">
              <h2 className="text-lg leading-6 font-display font-medium text-neutral-900">Recent Lost & Found Items</h2>
              
              {isLoading ? (
                <div className="mt-4 flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                </div>
              ) : reports && reports.length > 0 ? (
                <div className="mt-4 grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {reports.map((report) => (
                    <Card key={report.id} className="overflow-hidden shadow border border-gray-200">
                      <CardContent className="p-0">
                        <div className="p-5">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                report.type === 'lost' 
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
                            <a href={`#report-details-${report.id}`} className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500">
                              View details
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </a>
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
      </main>
      
      {/* Form Dialog for Lost/Found Items */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogType === "lost" ? "Report Lost Item" : "Register Found Item"}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name/Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Black Wallet, iPhone 13, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Provide detailed description of the item including any distinguishing features" 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {dialogType === "lost" ? "Where did you lose it?" : "Where did you find it?"}
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Kigali Bus Station, Nyamirambo area" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {dialogType === "lost" ? "When did you lose it?" : "When did you find it?"}
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="contactInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Information</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Phone number or email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-3 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={reportMutation.isPending}
                  className={dialogType === "lost" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                >
                  {reportMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Report"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
}
