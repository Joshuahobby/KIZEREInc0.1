import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { AdminLayout } from '@/components/layout/admin-layout';
import { apiRequest } from '@/lib/query-client';
import { motion } from 'framer-motion';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Package,
  PlusCircle,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
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

// Item management page
export default function AdminItemManagement() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for filters and pagination
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [sortBy, setSortBy] = useState('registeredAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // State for dialogs
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  
  // Fetch items data with pagination, filtering, and sorting
  const {
    data: itemsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['/api/admin/items', page, pageSize, search, category, status, sortBy, sortOrder],
    queryFn: () => apiRequest(`/api/admin/items?page=${page}&limit=${pageSize}&search=${search}&category=${category}&status=${status}&sortBy=${sortBy}&sortOrder=${sortOrder}`),
  });
  
  // Mutation for updating item status
  const updateItemStatusMutation = useMutation({
    mutationFn: (data: { itemId: number, status: string, notes?: string }) => 
      apiRequest({
        url: `/api/admin/items/${data.itemId}/status`,
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
      setSelectedItem(null);
      setNewStatus('');
      setStatusNotes('');
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
    mutationFn: (data: { itemId: number, reason?: string }) => 
      apiRequest({
        url: `/api/admin/items/${data.itemId}`,
        method: 'DELETE',
        data: { reason: data.reason }
      }),
    onSuccess: () => {
      toast({
        title: 'Item deleted',
        description: 'The item has been successfully deleted.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/items'] });
      setDeleteDialogOpen(false);
      setSelectedItem(null);
      setDeleteReason('');
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
    if (!selectedItem || !newStatus) return;
    
    updateItemStatusMutation.mutate({
      itemId: selectedItem.id,
      status: newStatus,
      notes: statusNotes
    });
  };
  
  // Handle item deletion
  const handleItemDelete = () => {
    if (!selectedItem) return;
    
    deleteItemMutation.mutate({
      itemId: selectedItem.id,
      reason: deleteReason
    });
  };
  
  // Handle sort toggle
  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };
  
  // Columns for the data table
  const columns = [
    {
      header: "ID",
      accessorKey: "id",
      cell: ({ row }: any) => <span className="text-xs font-mono">#{row.original.id}</span>
    },
    {
      header: ({ column }: any) => (
        <Button
          variant="ghost"
          onClick={() => toggleSort('name')}
          className="-ml-4 h-8"
        >
          Name
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      accessorKey: "name",
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          <div className="text-xs text-muted-foreground">{row.original.uniqueIdentifier}</div>
        </div>
      )
    },
    {
      header: ({ column }: any) => (
        <Button
          variant="ghost"
          onClick={() => toggleSort('category')}
          className="-ml-4 h-8"
        >
          Category
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      accessorKey: "category",
      cell: ({ row }: any) => (
        <div className="capitalize">{row.original.category}</div>
      )
    },
    {
      header: ({ column }: any) => (
        <Button
          variant="ghost"
          onClick={() => toggleSort('status')}
          className="-ml-4 h-8"
        >
          Status
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      accessorKey: "status",
      cell: ({ row }: any) => <ItemStatusBadge status={row.original.status} />
    },
    {
      header: ({ column }: any) => (
        <Button
          variant="ghost"
          onClick={() => toggleSort('registeredAt')}
          className="-ml-4 h-8"
        >
          Registered
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      accessorKey: "registeredAt",
      cell: ({ row }: any) => (
        <div className="text-sm">
          {new Date(row.original.registeredAt).toLocaleDateString()}
        </div>
      )
    },
    {
      id: "actions",
      cell: ({ row }: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigate(`/admin/items/${row.original.id}`)}>
              <Eye className="h-4 w-4 mr-2" />
              View details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              setSelectedItem(row.original);
              setNewStatus(row.original.status);
              setStatusDialogOpen(true);
            }}>
              <Pencil className="h-4 w-4 mr-2" />
              Update status
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={() => {
                setSelectedItem(row.original);
                setDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
  
  // Render loading state
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="container py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Item Management</h1>
          </div>
          
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="rounded-md border">
              <Skeleton className="h-[400px] w-full" />
            </div>
            <Skeleton className="h-10 w-full max-w-[200px] mx-auto" />
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
          <EmptyState
            icon={<AlertTriangle className="h-10 w-10 text-destructive" />}
            title="Error loading items"
            description={error instanceof Error ? error.message : "Failed to load items data"}
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
  
  // Determine if there are no items or no matching search results
  const hasItems = itemsData && itemsData.items && itemsData.items.length > 0;
  const hasNoMatchingResults = search || category || status;
  
  return (
    <AdminLayout>
      <div className="container py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold">Item Management</h1>
          <Button onClick={() => navigate('/admin/items/new')}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add New Item
          </Button>
        </div>
        
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            <h2 className="text-sm font-medium">Filters</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9"
              />
            </div>
            
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                <SelectItem value="Electronics">Electronics</SelectItem>
                <SelectItem value="Jewelry">Jewelry</SelectItem>
                <SelectItem value="Documents">Documents</SelectItem>
                <SelectItem value="Accessories">Accessories</SelectItem>
                <SelectItem value="Clothing">Clothing</SelectItem>
                <SelectItem value="Bags">Bags</SelectItem>
                <SelectItem value="Keys">Keys</SelectItem>
                <SelectItem value="Wallets">Wallets</SelectItem>
                <SelectItem value="Phones">Phones</SelectItem>
                <SelectItem value="Computers">Computers</SelectItem>
                <SelectItem value="Transportation">Transportation</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="Registered">Registered</SelectItem>
                <SelectItem value="Lost">Lost</SelectItem>
                <SelectItem value="Found">Found</SelectItem>
                <SelectItem value="Recovered">Recovered</SelectItem>
                <SelectItem value="Archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Results */}
        {!hasItems ? (
          <EmptyState
            icon={<Package className="h-10 w-10 text-primary/70" />}
            title={hasNoMatchingResults ? "No matching items found" : "No items registered yet"}
            description={
              hasNoMatchingResults
                ? "Try adjusting your search filters to find what you're looking for"
                : "Items registered on the platform will appear here"
            }
            action={
              hasNoMatchingResults ? (
                <Button variant="outline" onClick={() => {
                  setSearch('');
                  setCategory('');
                  setStatus('');
                }}>
                  Clear filters
                </Button>
              ) : (
                <Button onClick={() => navigate('/admin/items/new')}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add First Item
                </Button>
              )
            }
          />
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead key={column.accessorKey || column.id}>
                        {column.header && typeof column.header === 'function'
                          ? column.header({ column })
                          : column.header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemsData.items.map((item: any) => (
                    <TableRow key={item.id}>
                      {columns.map((column) => (
                        <TableCell key={column.accessorKey || column.id}>
                          {column.cell && typeof column.cell === 'function'
                            ? column.cell({ row: { original: item } })
                            : item[column.accessorKey as string]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination */}
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="text-sm text-muted-foreground">
                Showing {((page - 1) * pageSize) + 1}-
                {Math.min(page * pageSize, itemsData.total)} of {itemsData.total} items
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(itemsData.totalPages, p + 1))}
                  disabled={page === itemsData.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Item Status</DialogTitle>
            <DialogDescription>
              Change the status of "{selectedItem?.name}" to reflect its current state.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select value={newStatus} onValueChange={setNewStatus} defaultValue={selectedItem?.status}>
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
              disabled={updateItemStatusMutation.isPending || !newStatus || newStatus === selectedItem?.status}
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
              "{selectedItem?.name}" and remove it from our servers.
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