import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { CommandCenterLayout } from "@/components/layouts/command-center-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  FileText,
  Search,
  PlusCircle,
  RefreshCw,
  Clipboard,
  Map,
  ExternalLink,
  User,
  Tag
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

// Stats Card component for the dashboard
const StatCard = ({ title, value, icon, className = "", color = "blue" }: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  className?: string; 
  color?: string;
}) => {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    blue: {
      bg: "bg-blue-50 dark:bg-blue-950/30",
      text: "text-blue-600 dark:text-blue-400",
      border: "border-blue-100 dark:border-blue-900/50"
    },
    green: {
      bg: "bg-green-50 dark:bg-green-950/30",
      text: "text-green-600 dark:text-green-400",
      border: "border-green-100 dark:border-green-900/50"
    },
    amber: {
      bg: "bg-amber-50 dark:bg-amber-950/30",
      text: "text-amber-600 dark:text-amber-400",
      border: "border-amber-100 dark:border-amber-900/50"
    },
    red: {
      bg: "bg-red-50 dark:bg-red-950/30",
      text: "text-red-600 dark:text-red-400",
      border: "border-red-100 dark:border-red-900/50"
    },
  };
  
  const colors = colorMap[color as keyof typeof colorMap] || colorMap.blue;
  
  return (
    <Card className={`shadow-sm hover:shadow transition-shadow ${colors.border} ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <h3 className="text-2xl font-bold">{value}</h3>
          </div>
          <div className={`p-2 rounded-full ${colors.bg}`}>
            <div className={colors.text}>{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Status badge component for report status
const StatusBadge = ({ status }: { status: string }) => {
  const statusStyles = {
    Open: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300", icon: <AlertCircle className="h-3 w-3 mr-1" /> },
    In_Progress: { color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300", icon: <Clock className="h-3 w-3 mr-1" /> },
    Resolved: { color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
    Closed: { color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300", icon: <FileText className="h-3 w-3 mr-1" /> }
  };
  
  const style = (statusStyles as any)[status] || statusStyles.Open;
  
  return (
    <Badge variant="outline" className={`flex items-center ${style.color}`}>
      {style.icon}
      {status.replace("_", " ")}
    </Badge>
  );
};

// Type badge component for report type
const TypeBadge = ({ type }: { type: string }) => {
  const typeStyles = {
    lost: { color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300", label: "Lost" },
    found: { color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", label: "Found" }
  };
  
  const style = (typeStyles as any)[type] || typeStyles.lost;
  
  return (
    <Badge variant="outline" className={style.color}>
      {style.label}
    </Badge>
  );
};

const ReportStatusChangeDialog = ({ isOpen, onClose, report, onStatusChange }: {
  isOpen: boolean;
  onClose: () => void;
  report: any;
  onStatusChange: () => void;
}) => {
  const { toast } = useToast();
  const [status, setStatus] = useState<string>(report?.status || "Open");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync status if report changes
  useEffect(() => {
    if (report?.status) {
      setStatus(report.status);
    }
  }, [report]);
  
  const handleSubmit = async () => {
    if (!report || !status) return;
    
    setIsSubmitting(true);
    try {
      await adminApi.updateReportStatus(report.id, { status, notes });
      toast({
        title: "Status updated",
        description: `Report status has been updated to ${status}`,
        variant: "default",
      });
      onStatusChange();
      onClose();
    } catch (error) {
      toast({
        title: "Error updating status",
        description: "There was a problem updating the report status.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Update Report Status</AlertDialogTitle>
          <AlertDialogDescription>
            Change the status for report "{report?.title}".
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label htmlFor="status" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Status
            </label>
            <Select 
              value={status} 
              onValueChange={setStatus}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="In_Progress">In Progress</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Admin Notes
            </label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this status change"
              className="min-h-[100px]"
            />
          </div>
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Updating..." : "Update Status"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const ReportDetailDialog = ({ isOpen, onClose, reportId }: {
  isOpen: boolean;
  onClose: () => void;
  reportId: number | null;
}) => {
  const { toast } = useToast();
  const { data: reportData, isLoading } = useQuery({
    queryKey: [`/api/admin/reports/${reportId}`],
    queryFn: () => reportId ? adminApi.getReportById(reportId) : Promise.resolve(null),
    enabled: isOpen && reportId !== null,
  });
  
  const formatDate = (dateString: any) => {
    try {
      return format(new Date(dateString), 'PPP');
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Report Details</AlertDialogTitle>
        </AlertDialogHeader>
        
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : (
          <ScrollArea className="h-[60vh]">
            <div className="space-y-6">
              <div className="flex flex-col space-y-1.5">
                <h2 className="text-xl font-semibold text-primary">{(reportData as any)?.report?.title}</h2>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Report Date: {formatDate((reportData as any)?.report?.date)}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Map className="h-4 w-4" />
                  <span>Location: {(reportData as any)?.report?.location}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(reportData as any)?.report?.status && <StatusBadge status={(reportData as any).report.status} />}
                  {(reportData as any)?.report?.type && <TypeBadge type={(reportData as any).report.type} />}
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Description</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {(reportData as any)?.report?.description}
                </p>
              </div>
              
              {(reportData as any)?.item && (
                <div className="space-y-2 border-t pt-4">
                  <h3 className="text-sm font-medium flex items-center">
                    <Tag className="h-4 w-4 mr-1" />
                    Associated Item
                  </h3>
                  <div className="bg-secondary/30 p-3 rounded-md">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{(reportData as any)?.item?.name}</p>
                        <p className="text-xs text-muted-foreground">Category: {(reportData as any)?.item?.category}</p>
                        <p className="text-xs text-muted-foreground">ID: {(reportData as any)?.item?.uniqueIdentifier}</p>
                      </div>
                      <Badge variant={(reportData as any)?.item?.status === 'Registered' ? 'outline' : 'secondary'}>
                        {(reportData as any)?.item?.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
              
              {(reportData as any)?.user && (
                <div className="space-y-2 border-t pt-4">
                  <h3 className="text-sm font-medium flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    Report Owner
                  </h3>
                  <div className="bg-secondary/30 p-3 rounded-md">
                  <p className="font-medium">{(reportData as any)?.user?.fullName}</p>
                  <p className="text-xs text-muted-foreground">{(reportData as any)?.user?.email}</p>
                  {(reportData as any)?.user?.phoneNumber && (
                    <p className="text-xs text-muted-foreground">Phone: {(reportData as any)?.user?.phoneNumber}</p>
                  )}
                  </div>
                </div>
              )}
              
              <div className="space-y-2 border-t pt-4">
                <h3 className="text-sm font-medium">Contact Information</h3>
                <p className="text-sm text-muted-foreground">
                  {(reportData as any)?.report?.contactInfo || "No contact information provided"}
                </p>
              </div>
              
              <div className="space-y-2 border-t pt-4">
                <h3 className="text-sm font-medium">Report Timeline</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-sm">Reported on {formatDate((reportData as any)?.report?.reportedAt)}</span>
                  </div>
                  {/* Add more timeline entries here as needed */}
                </div>
              </div>
            </div>
          </ScrollArea>
        )}
        
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default function AdminReports() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  // Filters and search state
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    type: "",
    status: "",
    startDate: "",
    endDate: "",
    sortBy: "reportedAt",
    sortOrder: "desc",
  });
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Dialog states
  const [selectedReport, setSelectedReport] = useState(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  
  // Query for report statistics
  const { 
    data: reportStats, 
    isLoading: isLoadingStats 
  } = useQuery({
    queryKey: ['/api/admin/reports/stats'],
    queryFn: adminApi.getReportStats,
  });
  
  // Query for reports with filters
  const {
    data: reportData,
    isLoading: isLoadingReports,
    refetch: refetchReports,
  } = useQuery({
    queryKey: ['/api/admin/reports', page, pageSize, search, filters],
    queryFn: () => adminApi.getReports({
      page,
      limit: pageSize,
      search,
      ...filters
    }) as any,
  });
  
  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    // Convert the special "all" filter values to empty string for the API
    const apiValue = value === 'all_types' || value === 'all_statuses' ? "" : value;
    setFilters(prev => ({ ...prev, [key]: apiValue }));
    // Reset to first page when filters change
    setPage(1);
  };
  
  // Clear all filters
  const clearFilters = () => {
    setFilters({
      type: "",
      status: "",
      startDate: "",
      endDate: "",
      sortBy: "reportedAt",
      sortOrder: "desc",
    });
    setSearch("");
    setPage(1);
  };
  
  // Handle export
  const handleExport = () => {
    adminApi.exportReportsCsv();
    toast({
      title: "Export started",
      description: "Your report data export has been initiated.",
      variant: "default",
    });
  };
  
  // Handle status update dialog
  const openStatusDialog = (report: any) => {
    setSelectedReport(report);
    setIsStatusDialogOpen(true);
  };
  
  // Handle report detail dialog
  const openDetailDialog = (report: any) => {
    setSelectedReport(report);
    setIsDetailDialogOpen(true);
  };
  
  return (
    <CommandCenterLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports Management</h1>
          <p className="text-muted-foreground">
            Manage and track all lost and found reports in the system
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => refetchReports()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh data</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button variant="outline" className="flex items-center gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Reports"
          value={isLoadingStats ? "—" : (reportStats as any)?.totalReports || 0}
          icon={<FileText className="h-5 w-5" />}
          color="blue"
        />
        
        <StatCard
          title="Lost Reports"
          value={isLoadingStats ? "—" : (reportStats as any)?.lostReports || 0}
          icon={<AlertCircle className="h-5 w-5" />}
          color="red"
        />
        
        <StatCard
          title="Found Reports"
          value={isLoadingStats ? "—" : (reportStats as any)?.foundReports || 0}
          icon={<CheckCircle2 className="h-5 w-5" />}
          color="green"
        />
        
        <StatCard
          title="Open Reports"
          value={isLoadingStats ? "—" : (reportStats as any)?.openReports || 0}
          icon={<AlertCircle className="h-5 w-5" />}
          color="amber"
        />
      </div>
      
      {/* Reports Section */}
      <Card className="shadow-sm mb-6">
        <CardHeader className="pb-3">
          <CardTitle>All Reports</CardTitle>
          <CardDescription>
            View, filter, and manage all reports in the system
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search reports by title or description..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 items-center">
              <Select 
                value={filters.type} 
                onValueChange={(value) => handleFilterChange('type', value)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Report Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_types">All Types</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                  <SelectItem value="found">Found</SelectItem>
                </SelectContent>
              </Select>
              
              <Select 
                value={filters.status} 
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_statuses">All Statuses</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In_Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={clearFilters}
                      disabled={!search && Object.values(filters).every(val => val === "" || val === "reportedAt" || val === "desc")}
                    >
                      <Filter className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Clear filters</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          
          {/* Reports Table */}
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/50">
                    <th className="h-10 px-4 text-left font-medium">Title</th>
                    <th className="h-10 px-4 text-left font-medium">Type</th>
                    <th className="h-10 px-4 text-left font-medium">Status</th>
                    <th className="h-10 px-4 text-left font-medium">Location</th>
                    <th className="h-10 px-4 text-left font-medium">Date</th>
                    <th className="h-10 px-4 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingReports ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                        <td className="p-4"><Skeleton className="h-4 w-16" /></td>
                        <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="p-4 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                      </tr>
                    ))
                  ) : ((reportData as any)?.reports || []).length === 0 ? (
                    <tr className="border-t">
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center">
                          <FileText className="h-8 w-8 mb-2 text-muted-foreground/60" />
                          <p>No reports found</p>
                          <p className="text-xs text-muted-foreground/60 mt-1">
                            {search || Object.values(filters).some(val => val !== "" && val !== "reportedAt" && val !== "desc") 
                              ? "Try adjusting your filters"
                              : "There are no reports in the system yet"
                            }
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    ((reportData as any)?.reports || []).map((report: any) => (
                      <tr key={report.id} className="border-t">
                        <td className="p-4 font-medium">{report.title}</td>
                        <td className="p-4">
                          <TypeBadge type={report.type} />
                        </td>
                        <td className="p-4">
                          <StatusBadge status={report.status} />
                        </td>
                        <td className="p-4 max-w-[200px] truncate" title={report.location}>
                          {report.location}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          {format(new Date(report.reportedAt), 'MMM d, yyyy')}
                        </td>
                        <td className="p-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-more-horizontal">
                                  <circle cx="12" cy="12" r="1"></circle>
                                  <circle cx="19" cy="12" r="1"></circle>
                                  <circle cx="5" cy="12" r="1"></circle>
                                </svg>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openDetailDialog(report)}>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openStatusDialog(report)}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Update Status
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Pagination */}
          {reportData && (reportData as any).totalPages > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, (reportData as any).total)} of {(reportData as any).total} reports
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || isLoadingReports}
                >
                  Previous
                </Button>
                <div className="text-sm font-medium">
                  Page {page} of {(reportData as any).totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min((reportData as any).totalPages, p + 1))}
                  disabled={page === (reportData as any).totalPages || isLoadingReports}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Help Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Additional Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="new">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="new">Recent Reports</TabsTrigger>
              <TabsTrigger value="progress">In Progress</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
            </TabsList>
            <TabsContent value="new" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                {isLoadingStats ? "Loading..." : `There are ${(reportStats as any)?.reportsThisWeek || 0} new reports this week.`}
              </p>
            </TabsContent>
            <TabsContent value="progress" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                {isLoadingStats ? "Loading..." : `There are currently ${(reportStats as any)?.inProgressReports || 0} reports being processed.`}
              </p>
            </TabsContent>
            <TabsContent value="resolved" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                {isLoadingStats ? "Loading..." : `${(reportStats as any)?.resolvedReports || 0} reports have been successfully resolved.`}
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Dialogs */}
      {selectedReport && (
        <>
          <ReportStatusChangeDialog 
            isOpen={isStatusDialogOpen}
            onClose={() => setIsStatusDialogOpen(false)}
            report={selectedReport}
            onStatusChange={refetchReports}
          />
          
          <ReportDetailDialog
            isOpen={isDetailDialogOpen}
            onClose={() => setIsDetailDialogOpen(false)}
            reportId={(selectedReport as any).id}
          />
        </>
      )}
    </CommandCenterLayout>
  );
}