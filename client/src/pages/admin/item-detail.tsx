import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { apiRequest, queryClient } from '@/lib/query-client';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import CommandCenter from '@/pages/admin/command-center';
import { format } from 'date-fns';

// UI Components
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  FileSpreadsheet,
  Gift,
  Info,
  MapPin,
  Package,
  Phone,
  Tag,
  Trash2,
  UserCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';

// Item status badge color mapping
const getStatusColor = (status: string) => {
  switch (status) {
    case 'Registered':
      return 'bg-blue-500/10 text-blue-500 border-blue-200';
    case 'Lost':
      return 'bg-red-500/10 text-red-500 border-red-200';
    case 'Found':
      return 'bg-green-500/10 text-green-500 border-green-200';
    case 'Recovered':
      return 'bg-purple-500/10 text-purple-500 border-purple-200';
    case 'Archived':
      return 'bg-gray-500/10 text-gray-500 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Format dates with proper handling of invalid dates
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'N/A';
  try {
    return format(new Date(dateString), 'MMMM d, yyyy');
  } catch (e) {
    return 'Invalid date';
  }
};

// Get the owner initials from a name
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

export default function AdminItemDetail() {
  const { id } = useParams<{ id: string }>();
  const itemId = parseInt(id);
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Status change and delete dialogs
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [deleteReason, setDeleteReason] = useState('');

  // Fetch item details
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/admin/items/${itemId}`],
    queryFn: () => apiRequest(`/api/admin/items/${itemId}`),
    enabled: !isNaN(itemId),
  });

  // Handle status change
  const handleStatusChange = async () => {
    if (!data?.item || !newStatus) return;
    
    try {
      await apiRequest({
        url: `/api/admin/items/${itemId}/status`,
        method: 'PATCH',
        data: {
          status: newStatus,
          notes: statusNotes
        }
      });
      
      // Show success toast
      toast({
        title: 'Status updated',
        description: `Item ${data.item.name} status has been updated to ${newStatus}`,
      });
      
      // Close dialog and reset state
      setStatusDialogOpen(false);
      setNewStatus('');
      setStatusNotes('');
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/admin/items/${itemId}`] });
    } catch (error) {
      console.error('Failed to update status:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to update status',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    }
  };

  // Handle item deletion
  const handleDelete = async () => {
    if (!data?.item) return;
    
    try {
      await apiRequest({
        url: `/api/admin/items/${itemId}`,
        method: 'DELETE',
        data: {
          reason: deleteReason
        }
      });
      
      // Show success toast
      toast({
        title: 'Item deleted',
        description: `Item ${data.item.name} has been deleted successfully`,
      });
      
      // Navigate back to item management
      navigate('/admin/item-management');
    } catch (error) {
      console.error('Failed to delete item:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to delete item',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    }
  };

  // Open the status change dialog
  const openStatusDialog = (status: string) => {
    setNewStatus(status);
    setStatusDialogOpen(true);
  };

  // Show error state if item ID is invalid
  if (isNaN(itemId)) {
    return (
      <CommandCenter>
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Item Details</CardTitle>
            <CardDescription>View and manage item details</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              title="Invalid Item ID"
              description="The item ID provided is not valid. Please check the URL and try again."
              variant="error"
              icon={<AlertTriangle className="h-12 w-12" />}
              action={
                <Button onClick={() => navigate('/admin/item-management')}>
                  Back to Item Management
                </Button>
              }
            />
          </CardContent>
        </Card>
      </CommandCenter>
    );
  }

  // Show error state if loading failed
  if (error) {
    return (
      <CommandCenter>
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Item Details</CardTitle>
            <CardDescription>View and manage item details</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              title="Error loading item"
              description={error instanceof Error ? error.message : "Failed to load item details"}
              variant="error"
              icon={<AlertTriangle className="h-12 w-12" />}
              action={
                <Button onClick={() => queryClient.invalidateQueries({ queryKey: [`/api/admin/items/${itemId}`] })}>
                  Retry
                </Button>
              }
            />
          </CardContent>
        </Card>
      </CommandCenter>
    );
  }

  // Item details and owner info from the fetched data
  const item = data?.item;
  const owner = data?.owner;
  const reports = data?.reports || [];

  return (
    <CommandCenter>
      <div className="col-span-4 space-y-6">
        {/* Back button */}
        <Button
          variant="outline"
          className="mb-4"
          onClick={() => navigate('/admin/item-management')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Item Management
        </Button>

        {isLoading ? (
          // Loading skeleton state
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        ) : (
          <>
            {/* Main Item Details */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{item?.name}</CardTitle>
                    <CardDescription>Item #{item?.id}</CardDescription>
                  </div>
                  <Badge variant="outline" className={getStatusColor(item?.status)}>
                    {item?.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left column - Basic info */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Basic Information</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Category:</span>
                        </div>
                        <span className="text-sm font-medium capitalize">{item?.category || 'N/A'}</span>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Registered:</span>
                        </div>
                        <span className="text-sm font-medium">{formatDate(item?.registeredAt)}</span>
                        
                        <div className="flex items-center gap-2">
                          <Gift className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Value:</span>
                        </div>
                        <span className="text-sm font-medium">
                          {item?.estimatedValue ? `$${item.estimatedValue.toFixed(2)}` : 'N/A'}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Location:</span>
                        </div>
                        <span className="text-sm font-medium">
                          {item?.lastKnownLocation || 'Not specified'}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                      <p className="text-sm">
                        {item?.description || 'No description provided'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Right column - Owner info */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Owner Information</h3>
                    
                    {owner ? (
                      <div className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            {owner.avatarUrl ? (
                              <AvatarImage src={owner.avatarUrl} alt={owner.fullName || owner.username} />
                            ) : null}
                            <AvatarFallback>{getInitials(owner.fullName || owner.username)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{owner.fullName || owner.username}</p>
                            <p className="text-sm text-muted-foreground">{owner.email}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>Phone:</span>
                          </div>
                          <span className="font-medium">{owner.phoneNumber || 'Not provided'}</span>
                          
                          <div className="flex items-center gap-2">
                            <UserCircle className="h-4 w-4 text-muted-foreground" />
                            <span>User ID:</span>
                          </div>
                          <span className="font-medium">{owner.id}</span>
                          
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="h-4 py-0">Status</Badge>
                          </div>
                          <span className="font-medium capitalize">{owner.status}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full">
                        <EmptyState
                          title="Owner information unavailable"
                          description="Owner details could not be retrieved or do not exist"
                          variant="warning"
                          size="sm"
                        />
                      </div>
                    )}
                    
                    {/* Item identifiers section */}
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Item Identifiers</h3>
                      <div className="border rounded-lg p-3 space-y-2">
                        {item?.serialNumber && (
                          <div className="grid grid-cols-2 text-sm">
                            <span className="text-muted-foreground">Serial Number:</span>
                            <span className="font-medium font-mono">{item.serialNumber}</span>
                          </div>
                        )}
                        
                        {item?.modelNumber && (
                          <div className="grid grid-cols-2 text-sm">
                            <span className="text-muted-foreground">Model Number:</span>
                            <span className="font-medium font-mono">{item.modelNumber}</span>
                          </div>
                        )}
                        
                        {!item?.serialNumber && !item?.modelNumber && (
                          <p className="text-sm text-muted-foreground">No unique identifiers provided</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Reports section with tabs */}
                {reports.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Related Reports</h3>
                    <Tabs defaultValue="all">
                      <TabsList className="mb-2">
                        <TabsTrigger value="all">All Reports ({reports.length})</TabsTrigger>
                        <TabsTrigger value="lost">Lost Reports ({reports.filter(r => r.type === 'lost').length})</TabsTrigger>
                        <TabsTrigger value="found">Found Reports ({reports.filter(r => r.type === 'found').length})</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="all" className="space-y-2">
                        {reports.map((report) => (
                          <ReportCard key={report.id} report={report} />
                        ))}
                      </TabsContent>
                      
                      <TabsContent value="lost" className="space-y-2">
                        {reports.filter(r => r.type === 'lost').map((report) => (
                          <ReportCard key={report.id} report={report} />
                        ))}
                        {reports.filter(r => r.type === 'lost').length === 0 && (
                          <EmptyState
                            title="No lost reports"
                            description="This item has no lost reports"
                            variant="subtle"
                            size="sm"
                          />
                        )}
                      </TabsContent>
                      
                      <TabsContent value="found" className="space-y-2">
                        {reports.filter(r => r.type === 'found').map((report) => (
                          <ReportCard key={report.id} report={report} />
                        ))}
                        {reports.filter(r => r.type === 'found').length === 0 && (
                          <EmptyState
                            title="No found reports"
                            description="This item has no found reports"
                            variant="subtle"
                            size="sm"
                          />
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => openStatusDialog('Registered')}>
                    <Package className="mr-2 h-4 w-4 text-blue-500" />
                    Mark as Registered
                  </Button>
                  <Button variant="outline" onClick={() => openStatusDialog('Lost')}>
                    <AlertTriangle className="mr-2 h-4 w-4 text-red-500" />
                    Mark as Lost
                  </Button>
                  <Button variant="outline" onClick={() => openStatusDialog('Found')}>
                    <Info className="mr-2 h-4 w-4 text-green-500" />
                    Mark as Found
                  </Button>
                  <Button variant="outline" onClick={() => openStatusDialog('Recovered')}>
                    <Package className="mr-2 h-4 w-4 text-purple-500" />
                    Mark as Recovered
                  </Button>
                  <Button variant="outline" onClick={() => openStatusDialog('Archived')}>
                    <FileSpreadsheet className="mr-2 h-4 w-4 text-gray-500" />
                    Archive
                  </Button>
                </div>
                
                <Button 
                  variant="destructive" 
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Item
                </Button>
              </CardFooter>
            </Card>
          </>
        )}
      </div>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Item Status</DialogTitle>
            <DialogDescription>
              Change the status of "{item?.name}" to {newStatus}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Current Status:</span>
              <Badge variant="outline" className={getStatusColor(item?.status)}>
                {item?.status}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">New Status:</span>
              <Badge variant="outline" className={getStatusColor(newStatus)}>
                {newStatus}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium">
                Notes
              </label>
              <Textarea
                id="notes"
                placeholder="Add notes about this status change (optional)"
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusChange}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the item
              "{item?.name}" from the system and notify the owner.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-2 py-4">
            <label htmlFor="deleteReason" className="text-sm font-medium">
              Reason for deletion
            </label>
            <Textarea
              id="deleteReason"
              placeholder="Please provide a reason for deleting this item"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
            />
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CommandCenter>
  );
}

// Report card component for displaying reports
function ReportCard({ report }: { report: any }) {
  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-base">{report.title}</CardTitle>
            <CardDescription>Report #{report.id}</CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={report.type === 'lost' ? 'destructive' : 'default'}>
              {report.type === 'lost' ? 'Lost' : 'Found'}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {report.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="py-2">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Date:</span>
          </div>
          <span>{formatDate(report.date)}</span>
          
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Location:</span>
          </div>
          <span>{report.location || 'Not specified'}</span>
          
          <div className="col-span-2">
            <span className="text-muted-foreground">Description:</span>
            <p className="mt-1">{report.description || 'No description provided'}</p>
          </div>
          
          {report.contactInfo && (
            <>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Contact Info:</span>
              </div>
              <span>{report.contactInfo}</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}