import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { AdminLayout } from '@/components/layout/admin-layout';
import { apiRequest } from '@/lib/query-client';
import { motion } from 'framer-motion';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Package,
  ArrowLeft,
  User,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Pencil,
  FileText,
  Clock,
  Calendar,
  MapPin,
  Tag,
  Info,
  Shield,
  ChevronRight,
  Image,
  ClipboardCheck,
  CheckCircle,
  XCircle,
} from 'lucide-react';

// Item status badge component
const ItemStatusBadge = ({ status }: { status: string }) => {
  let variant = 'default';
  
  switch (status) {
    case 'Registered':
      variant = 'default';
      break;
    case 'Lost':
      variant = 'destructive';
      break;
    case 'Found':
      variant = 'success';
      break;
    case 'Recovered':
      variant = 'success';
      break;
    case 'Archived':
      variant = 'outline';
      break;
    default:
      variant = 'default';
  }
  
  return <Badge variant={variant as any}>{status}</Badge>;
};

// Report status badge component
const ReportStatusBadge = ({ status }: { status: string }) => {
  let variant = 'default';
  
  switch (status) {
    case 'Open':
      variant = 'default';
      break;
    case 'In_Progress':
      variant = 'warning';
      break;
    case 'Resolved':
      variant = 'success';
      break;
    case 'Closed':
      variant = 'outline';
      break;
    default:
      variant = 'default';
  }
  
  return <Badge variant={variant as any}>{status.replace('_', ' ')}</Badge>;
};

export default function AdminItemDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Dialog states
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  
  // Fetch item details
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['/api/admin/items', id],
    queryFn: () => apiRequest(`/api/admin/items/${id}`),
    enabled: !!id,
  });
  
  // Extract data
  const item = data?.item;
  const owner = data?.owner;
  const reports = data?.reports || [];
  
  // Mutation for updating item status
  const updateItemStatusMutation = useMutation({
    mutationFn: (data: { status: string, notes?: string }) => 
      apiRequest({
        url: `/api/admin/items/${id}/status`,
        method: 'PATCH',
        data: { 
          status: data.status,
          notes: data.notes
        }
      }),
    onSuccess: () => {
      toast({
        title: 'Status updated',
        description: 'The item status has been successfully updated.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/items'] });
      setStatusDialogOpen(false);
      setNewStatus('');
      setStatusNotes('');
      refetch();
    },
    onError: (err: any) => {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update item status.',
        variant: 'destructive',
      });
    },
  });
  
  // Mutation for deleting an item
  const deleteItemMutation = useMutation({
    mutationFn: (reason?: string) => 
      apiRequest({
        url: `/api/admin/items/${id}`,
        method: 'DELETE',
        data: { reason }
      }),
    onSuccess: () => {
      toast({
        title: 'Item deleted',
        description: 'The item has been successfully deleted.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/items'] });
      setDeleteDialogOpen(false);
      navigate('/admin/item-management');
    },
    onError: (err: any) => {
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete item.',
        variant: 'destructive',
      });
    },
  });
  
  // Handle status update
  const handleStatusUpdate = () => {
    if (!newStatus) return;
    
    updateItemStatusMutation.mutate({
      status: newStatus,
      notes: statusNotes
    });
  };
  
  // Handle item deletion
  const handleItemDelete = () => {
    deleteItemMutation.mutate(deleteReason);
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="container py-6">
          <div className="flex items-center gap-2 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/item-management')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Skeleton className="h-8 w-64" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }
  
  // Render error state
  if (isError) {
    return (
      <AdminLayout>
        <div className="container py-6">
          <div className="flex items-center gap-2 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/item-management')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Item Details</h1>
          </div>
          
          <EmptyState
            icon={<AlertTriangle className="h-10 w-10 text-destructive" />}
            title="Error loading item details"
            description={error instanceof Error ? error.message : "Failed to load item details"}
            action={
              <Button onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try again
              </Button>
            }
            variant="error"
          />
        </div>
      </AdminLayout>
    );
  }
  
  // Render not found state
  if (!item) {
    return (
      <AdminLayout>
        <div className="container py-6">
          <div className="flex items-center gap-2 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/item-management')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Item Details</h1>
          </div>
          
          <EmptyState
            icon={<Package className="h-10 w-10 text-muted-foreground" />}
            title="Item not found"
            description="The item you're looking for doesn't exist or has been deleted"
            action={
              <Button variant="default" onClick={() => navigate('/admin/item-management')}>
                Return to Item Management
              </Button>
            }
          />
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="container py-6">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/item-management')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold truncate">{item.name}</h1>
          <ItemStatusBadge status={item.status} />
        </div>
        
        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Item details card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-xl">Item Information</CardTitle>
                  <CardDescription>Details about the item and its registration</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setNewStatus(item.status);
                      setStatusDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Update Status
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-10">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-muted-foreground">Name</Label>
                      <p className="font-medium">{item.name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Category</Label>
                      <p className="font-medium capitalize">{item.category}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Unique Identifier</Label>
                      <p className="font-medium">{item.uniqueIdentifier}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-muted-foreground">Registration Date</Label>
                      <p className="font-medium">{new Date(item.registeredAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Last Updated</Label>
                      <p className="font-medium">{new Date(item.updatedAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Location</Label>
                      <p className="font-medium">{item.location || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="mt-1">{item.description || 'No description provided'}</p>
                </div>
                
                {/* Item details display */}
                {item.details && Object.keys(item.details).length > 0 && (
                  <div className="mt-6">
                    <Label className="text-muted-foreground mb-2 block">Additional Details</Label>
                    <div className="bg-muted/50 p-4 rounded-md">
                      <pre className="text-sm whitespace-pre-wrap">
                        {JSON.stringify(item.details, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Item images */}
            {item.imageUrls && item.imageUrls.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">Images</CardTitle>
                  <CardDescription>Photos of the item</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {item.imageUrls.map((url: string, index: number) => (
                      <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
                        <img 
                          src={url} 
                          alt={`${item.name} - image ${index + 1}`} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Associated reports */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Associated Reports</CardTitle>
                <CardDescription>Lost and found reports related to this item</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {reports.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.map((report: any) => (
                        <TableRow key={report.id}>
                          <TableCell className="font-mono text-xs">#{report.id}</TableCell>
                          <TableCell>
                            <Badge variant={report.type === 'lost' ? 'destructive' : 'success'} className="capitalize">
                              {report.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{report.title}</TableCell>
                          <TableCell>{new Date(report.date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <ReportStatusBadge status={report.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No reports associated with this item</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar content area */}
          <div className="space-y-6">
            {/* Owner information */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Owner Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {owner ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      {owner.avatarUrl ? (
                        <img
                          src={owner.avatarUrl}
                          alt={owner.fullName}
                          className="h-14 w-14 rounded-full"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-8 w-8 text-primary/80" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium text-lg">{owner.fullName}</h3>
                        <p className="text-sm text-muted-foreground">{owner.email}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Role</span>
                        <span className="text-sm font-medium">{owner.role}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <Badge variant={owner.status === 'active' ? 'success' : 'outline'} className="capitalize">
                          {owner.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Phone</span>
                        <span className="text-sm font-medium">{owner.phoneNumber || 'Not provided'}</span>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => navigate(`/admin/users/${owner.id}`)}
                    >
                      View User Profile
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <User className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Owner information not available</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Item Status Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Status Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="relative border-l-2 border-muted pl-6 pb-2 space-y-6">
                  {/* This would ideally be populated from a status history array */}
                  {/* For now we'll create a simplified version */}
                  <div className="relative">
                    <div className="absolute -left-[25px] w-4 h-4 rounded-full bg-primary"></div>
                    <div>
                      <p className="font-medium">Item Registered</p>
                      <time className="text-sm text-muted-foreground">{new Date(item.registeredAt).toLocaleString()}</time>
                    </div>
                  </div>
                  
                  {item.status !== 'Registered' && (
                    <div className="relative">
                      <div className="absolute -left-[25px] w-4 h-4 rounded-full bg-primary"></div>
                      <div>
                        <p className="font-medium">Changed to {item.status}</p>
                        <time className="text-sm text-muted-foreground">{new Date(item.updatedAt).toLocaleString()}</time>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Quick Actions Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Admin Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.navigator.clipboard.writeText(item.uniqueIdentifier)}
                >
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  Copy Unique Identifier
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    setNewStatus('Lost');
                    setStatusDialogOpen(true);
                  }}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Mark as Lost
                </Button>
                <Button 
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setNewStatus('Found');
                    setStatusDialogOpen(true);
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Found
                </Button>
                <Button 
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setNewStatus('Recovered');
                    setStatusDialogOpen(true);
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Recovered
                </Button>
                <Button 
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setNewStatus('Archived');
                    setStatusDialogOpen(true);
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Archive Item
                </Button>
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Item
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Item Status</DialogTitle>
            <DialogDescription>
              Change the status of "{item.name}" to reflect its current state.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select value={newStatus} onValueChange={setNewStatus} defaultValue={item.status}>
                <SelectTrigger id="status" className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Registered">Registered</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
                  <SelectItem value="Found">Found</SelectItem>
                  <SelectItem value="Recovered">Recovered</SelectItem>
                  <SelectItem value="Archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                placeholder="Reason for status change (optional)"
                className="col-span-3"
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleStatusUpdate} 
              disabled={updateItemStatusMutation.isPending || !newStatus || newStatus === item.status}
            >
              {updateItemStatusMutation.isPending && (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the item 
              "{item.name}" and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reason" className="text-right">
                Reason
              </Label>
              <Textarea
                id="reason"
                placeholder="Reason for deletion (optional)"
                className="col-span-3"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
              />
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleItemDelete}
              disabled={deleteItemMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteItemMutation.isPending && (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete Item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}