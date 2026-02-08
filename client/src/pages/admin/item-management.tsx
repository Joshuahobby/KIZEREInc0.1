import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { CommandCenterLayout } from '@/components/layouts/command-center-layout';
import { AdvancedItemFilters, FilterFormValues } from '@/components/item-management/AdvancedItemFilters';

// UI Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { format } from 'date-fns';
import {
  Pencil,
  Trash2,
  Search,
  Filter,
  Package,
  SlidersHorizontal,
  FileSpreadsheet,
  AlertTriangle,
  Plus
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
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

// Date formatter helper
const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), 'MMM d, yyyy');
  } catch (e) {
    return 'Invalid date';
  }
};

export default function AdminItemManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // State for filters and pagination
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('_all_categories');
  const [status, setStatus] = useState('_all_statuses');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [sortBy, setSortBy] = useState('registeredAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Advanced filter states
  const [advancedFilters, setAdvancedFilters] = useState<FilterFormValues>({
    ownerName: '',
    serialNumber: '',
    minValue: '',
    maxValue: '',
    registeredAfter: undefined,
    registeredBefore: undefined,
    location: '',
    hasReports: false,
    reportType: 'any',
  });
  const [activeAdvancedFilters, setActiveAdvancedFilters] = useState(0);

  // Delete and status change modals
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [deleteReason, setDeleteReason] = useState('');

  // Handle advanced filter changes
  const handleAdvancedFilterChange = (filters: FilterFormValues) => {
    // Count number of active filters
    const filterCount = Object.entries(filters).filter(([key, value]) => {
      if (value === undefined || value === null || value === '') return false;
      if (typeof value === 'boolean' && !value) return false;
      if (typeof value === 'string' && value.trim() === '') return false;
      return true;
    }).length;

    console.log('Applied filters:', filters, 'Active count:', filterCount);

    setAdvancedFilters(filters);
    setActiveAdvancedFilters(filterCount);
    setPage(1); // Reset to first page when filters change
  };

  // Clear all advanced filters
  const clearAdvancedFilters = () => {
    setAdvancedFilters({
      ownerName: '',
      serialNumber: '',
      minValue: '',
      maxValue: '',
      registeredAfter: undefined,
      registeredBefore: undefined,
      location: '',
      hasReports: false,
      reportType: 'any',
    });
    setActiveAdvancedFilters(0);
  };

  // Build query parameters including advanced filters
  const queryParams = useMemo(() => {
    let params = new URLSearchParams();

    // Basic filters
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    params.append('search', search);
    if (category !== '_all_categories') params.append('category', category);
    if (status !== '_all_statuses') params.append('status', status);
    params.append('sortBy', sortBy);
    params.append('sortOrder', sortOrder);

    // Advanced filters
    if (advancedFilters.ownerName) params.append('ownerName', advancedFilters.ownerName);
    if (advancedFilters.serialNumber) params.append('serialNumber', advancedFilters.serialNumber);
    if (advancedFilters.minValue) params.append('minValue', advancedFilters.minValue);
    if (advancedFilters.maxValue) params.append('maxValue', advancedFilters.maxValue);
    if (advancedFilters.location) params.append('location', advancedFilters.location);

    // Date filters need special handling to convert to ISO strings
    if (advancedFilters.registeredAfter) {
      params.append('registeredAfter', advancedFilters.registeredAfter.toISOString());
    }
    if (advancedFilters.registeredBefore) {
      params.append('registeredBefore', advancedFilters.registeredBefore.toISOString());
    }

    // Report filters
    if (advancedFilters.hasReports) {
      params.append('hasReports', 'true');
      if (advancedFilters.reportType && advancedFilters.reportType !== 'any') {
        params.append('reportType', advancedFilters.reportType);
      }
    }

    return params.toString();
  }, [page, limit, search, category, status, sortBy, sortOrder, advancedFilters]);

  // Fetch items data with filters
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/admin/items', queryParams],
    queryFn: () =>
      apiRequest(`/api/admin/items?${queryParams}`),
  });

  // Handle status change
  const handleStatusChange = async () => {
    if (!selectedItem || !newStatus) return;

    try {
      await apiRequest(`/api/admin/items/${selectedItem.id}/status`, {
        method: 'PATCH',
        data: {
          status: newStatus,
          notes: statusNotes
        }
      });

      // Show success toast
      toast({
        title: 'Status updated',
        description: `Item ${selectedItem.name} status has been updated to ${newStatus}`,
      });

      // Close dialog and reset state
      setStatusDialogOpen(false);
      setSelectedItem(null);
      setNewStatus('');
      setStatusNotes('');

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/items'] });
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
    if (!selectedItem) return;

    try {
      await apiRequest(`/api/admin/items/${selectedItem.id}`, {
        method: 'DELETE',
        data: {
          reason: deleteReason
        }
      });

      // Show success toast
      toast({
        title: 'Item deleted',
        description: `Item ${selectedItem.name} has been deleted successfully`,
      });

      // Close dialog and reset state
      setDeleteDialogOpen(false);
      setSelectedItem(null);
      setDeleteReason('');

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/items'] });
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
  const openStatusDialog = (item: any, status: string) => {
    setSelectedItem(item);
    setNewStatus(status);
    setStatusDialogOpen(true);
  };

  // Open the delete confirmation dialog
  const openDeleteDialog = (item: any) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  // Table columns definition
  const columns = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }: any) => <span className="font-mono text-xs">{row.getValue('id')}</span>,
    },
    {
      accessorKey: 'name',
      header: 'Item Name',
      cell: ({ row }: any) => (
        <div className="font-medium truncate max-w-[180px]" title={row.getValue('name')}>
          <Link
            href={`/admin/items/${row.getValue('id')}`}
            className="hover:text-primary hover:underline"
          >
            {row.getValue('name')}
          </Link>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }: any) => (
        <Badge variant="outline" className="capitalize">
          {row.getValue('category')}
        </Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => {
        const status = row.getValue('status');
        return (
          <Badge variant="outline" className={getStatusColor(status as string)}>
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'registeredAt',
      header: 'Registered',
      cell: ({ row }: any) => formatDate(row.getValue('registeredAt')),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => {
        const item = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/admin/item-management/${item.id}`)}>
                <Pencil className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => openStatusDialog(item, 'Registered')}>
                <Package className="mr-2 h-4 w-4 text-blue-500" />
                Mark as Registered
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openStatusDialog(item, 'Lost')}>
                <AlertTriangle className="mr-2 h-4 w-4 text-red-500" />
                Mark as Lost
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openStatusDialog(item, 'Found')}>
                <Package className="mr-2 h-4 w-4 text-green-500" />
                Mark as Found
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openStatusDialog(item, 'Recovered')}>
                <Package className="mr-2 h-4 w-4 text-purple-500" />
                Mark as Recovered
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openStatusDialog(item, 'Archived')}>
                <FileSpreadsheet className="mr-2 h-4 w-4 text-gray-500" />
                Archive Item
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => openDeleteDialog(item)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Item
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // If error occurred
  if (error) {
    return (
      <CommandCenterLayout>
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Item Management</CardTitle>
            <CardDescription>View and manage all registered items</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              title="Error loading items"
              description={error instanceof Error ? error.message : "Failed to load items data"}
              variant="error"
              icon={<AlertTriangle className="h-12 w-12" />}
              action={
                <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/items'] })}>
                  Retry
                </Button>
              }
            />
          </CardContent>
        </Card>
      </CommandCenterLayout>
    );
  }

  return (
    <CommandCenterLayout>
      <div className="col-span-4 space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Item Management</CardTitle>
              <CardDescription>View and manage all registered items in the system</CardDescription>
            </div>
            <Button size="sm" onClick={() => navigate('/admin/item-management/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </CardHeader>

          <CardContent>
            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 opacity-50" />
                  <Input
                    placeholder="Search items..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-full pl-9"
                  />
                </div>
              </div>

              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all_categories">All Categories</SelectItem>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="documents">Documents</SelectItem>
                  <SelectItem value="clothing">Clothing</SelectItem>
                  <SelectItem value="jewelry">Jewelry</SelectItem>
                  <SelectItem value="accessories">Accessories</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all_statuses">All Statuses</SelectItem>
                  <SelectItem value="Registered">Registered</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
                  <SelectItem value="Found">Found</SelectItem>
                  <SelectItem value="Recovered">Recovered</SelectItem>
                  <SelectItem value="Archived">Archived</SelectItem>
                </SelectContent>
              </Select>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => { setSortBy('registeredAt'); setSortOrder('desc'); }}>
                    Newest First
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setSortBy('registeredAt'); setSortOrder('asc'); }}>
                    Oldest First
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setSortBy('name'); setSortOrder('asc'); }}>
                    Name (A-Z)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setSortBy('name'); setSortOrder('desc'); }}>
                    Name (Z-A)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <AdvancedItemFilters
                onFilterChange={handleAdvancedFilterChange}
                onClearFilters={clearAdvancedFilters}
                activeFilters={activeAdvancedFilters}
              />

              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setSearch('');
                  setCategory('_all_categories');
                  setStatus('_all_statuses');
                  setSortBy('registeredAt');
                  setSortOrder('desc');
                  clearAdvancedFilters();
                }}
              >
                &times;
              </Button>
            </div>

            {/* Items Table */}
            <DataTable
              columns={columns}
              data={data?.items || []}
              isLoading={isLoading}
              emptyState={{
                title: "No items found",
                description: "No items match your current filters. Try adjusting your search criteria.",
                icon: <Package className="h-12 w-12" />
              }}
              pagination={{
                pageIndex: page - 1,
                pageSize: limit,
                pageCount: data?.totalPages || 1,
                onPageChange: (newPage) => setPage(newPage + 1)
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Item Status</DialogTitle>
            <DialogDescription>
              Change the status of "{selectedItem?.name}" to {newStatus}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Current Status:</span>
              <Badge variant="outline" className={getStatusColor(selectedItem?.status)}>
                {selectedItem?.status}
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
              "{selectedItem?.name}" from the system and notify the owner.
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
    </CommandCenterLayout>
  );
}