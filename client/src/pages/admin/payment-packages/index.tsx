import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/admin-layout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/ui/data-table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Package as PackageIcon, 
  Plus, 
  Search, 
  DollarSign, 
  Calendar,
  MoreHorizontal,
  AlertCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Payment package interfaces
interface PaymentPackage {
  id: number;
  name: string;
  description: string | null;
  type: string;
  amount: number | string;
  currency: string;
  status: string;
  isDefault: boolean;
  features: any;
  validityDays: number | null;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string | null;
}

// Formatted package for table display
interface FormattedPackage {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: number;
  features: string[];
  status: string;
  type: string;
}

export default function PaymentPackages() {
  const { user, role, isAuthenticated } = useAuth();
  const isAdmin = role === 'Admin';
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isDirectFetching, setIsDirectFetching] = useState(false);
  const [directFetchedData, setDirectFetchedData] = useState<PaymentPackage[] | null>(null);
  const [directFetchError, setDirectFetchError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const queryClient = useQueryClient();

  // Get toast for notifications
  const { toast } = useToast();
  
  // Log authentication state for debugging
  useEffect(() => {
    console.log('Authentication state:', { 
      isAuthenticated, 
      userId: user?.id,
      userRole: role, 
      isAdmin 
    });
  }, [user, role, isAuthenticated, isAdmin]);
  
  // Fetch payment packages data using TanStack Query
  const { 
    data: packages, 
    isLoading, 
    error,
    refetch 
  } = useQuery<PaymentPackage[]>({
    queryKey: ['/api/admin/payment-packages'],
    enabled: !!user?.id && role === 'Admin',
    staleTime: 60000, // 1 minute
    retry: 1
  });

  // Handle errors for the query
  useEffect(() => {
    if (error) {
      console.error('Error fetching payment packages:', error);
      toast({
        title: 'Error loading payment packages',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
      
      // If TanStack Query fails, try direct fetch as fallback
      if (!isDirectFetching && !directFetchedData) {
        fetchDirectly();
      }
    }
  }, [error, isDirectFetching, directFetchedData]);

  // Alternative direct fetch method if the query fails
  const fetchDirectly = async () => {
    if (isDirectFetching) return;
    
    try {
      setIsDirectFetching(true);
      const response = await fetch('/api/admin/payment-packages', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch packages: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Direct fetch successful:', data);
      setDirectFetchedData(data);
      setDirectFetchError(null);
      
      // Update the query cache with this data
      queryClient.setQueryData(['/api/admin/payment-packages'], data);
      
    } catch (err) {
      console.error('Direct fetch error:', err);
      setDirectFetchError(err instanceof Error ? err.message : 'Failed to fetch payment packages');
    } finally {
      setIsDirectFetching(false);
    }
  };
  
  // Manual retry using direct API fetch
  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      const data = await apiRequest<PaymentPackage[]>('/api/admin/payment-packages');
      setDirectFetchedData(data);
      setDirectFetchError(null);
      queryClient.setQueryData(['/api/admin/payment-packages'], data);
      toast({
        title: 'Success',
        description: 'Payment packages loaded successfully',
      });
    } catch (err) {
      console.error('Retry error:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to fetch payment packages',
        variant: 'destructive',
      });
    } finally {
      setIsRetrying(false);
    }
  };

  // Use directly fetched data or packages from react-query
  const packagesData = directFetchedData || packages;

  // Format the packages data for display
  const formatPackageData = (pkg: PaymentPackage): FormattedPackage => {
    // Process features field - can be array, string, object, or null
    let featuresArray: string[] = [];
    
    if (pkg.features) {
      if (Array.isArray(pkg.features)) {
        featuresArray = pkg.features;
      } else if (typeof pkg.features === 'string') {
        try {
          // Try to parse if it's a JSON string
          const parsed = JSON.parse(pkg.features);
          featuresArray = Array.isArray(parsed) ? parsed : [String(pkg.features)];
        } catch {
          // If not valid JSON, treat as a single feature
          featuresArray = [pkg.features];
        }
      } else if (typeof pkg.features === 'object') {
        // Handle object format
        featuresArray = Object.values(pkg.features).map(v => String(v));
      }
    }
    
    // Ensure we have at least one feature
    if (featuresArray.length === 0) {
      featuresArray = ['Basic package'];
    }
    
    return {
      id: pkg.id,
      name: pkg.name,
      description: pkg.description || '',
      price: typeof pkg.amount === 'string' ? parseFloat(pkg.amount) : Number(pkg.amount),
      duration: pkg.validityDays || 30,
      features: featuresArray,
      status: pkg.status,
      type: pkg.type
    };
  };

  // Map package data to consistent format if we have data
  const formattedPackages: FormattedPackage[] = packagesData 
    ? packagesData.map(formatPackageData)
    : [];
  
  // Filter packages based on search and active tab
  const filteredPackages = formattedPackages.filter(pkg => {
    const matchesSearch = pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          pkg.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || pkg.status === activeTab;
    return matchesSearch && matchesTab;
  });

  // Columns for the data table
  const columns: any[] = [
    {
      accessorKey: 'name',
      header: 'Package Name',
      cell: ({ row }: { row: { original: FormattedPackage } }) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <PackageIcon className="h-4 w-4 text-primary" />
          </div>
          <div className="font-medium">{row.original.name}</div>
        </div>
      ),
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }: { row: { original: FormattedPackage } }) => (
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span>${row.original.price.toFixed(2)}</span>
        </div>
      ),
    },
    {
      accessorKey: 'duration',
      header: 'Duration',
      cell: ({ row }: { row: { original: FormattedPackage } }) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.duration} days</span>
        </div>
      ),
    },
    {
      accessorKey: 'features',
      header: 'Features',
      cell: ({ row }: { row: { original: FormattedPackage } }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.features.slice(0, 2).map((feature, index) => (
            <Badge key={index} variant="outline" className="bg-primary/5">
              {feature}
            </Badge>
          ))}
          {row.original.features.length > 2 && (
            <Badge variant="outline" className="bg-muted/20">
              +{row.original.features.length - 2} more
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }: { row: { original: FormattedPackage } }) => {
        const type = row.original.type;
        return (
          <Badge variant="outline" className="bg-primary/10 text-primary">
            {type === 'registration' ? 'Registration' : 'Lost Report'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: FormattedPackage } }) => {
        const status = row.original.status;
        return (
          <Badge
            className={
              status === 'active'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            }
          >
            {status === 'active' ? 'Active' : 'Inactive'}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }: { row: { original: FormattedPackage } }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigate(`/admin/payment-packages/${row.original.id}`)}>
                View details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/admin/payment-packages/edit/${row.original.id}`)}>
                Edit package
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className={row.original.status === 'active' ? 'text-red-600' : 'text-green-600'}
                onClick={() => console.log('Toggle status for', row.original.id)}
              >
                {row.original.status === 'active' ? 'Deactivate' : 'Activate'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">Authentication Required</h1>
          <p className="text-muted-foreground mb-4">Please sign in to access this page.</p>
          <Button onClick={() => navigate('/login')}>Sign In</Button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Payment Packages</h1>
            <p className="text-muted-foreground">Manage and configure payment packages for your platform</p>
          </div>
          <Button 
            className="mt-4 md:mt-0" 
            onClick={() => navigate('/admin/payment-packages/new')}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Package
          </Button>
        </div>

        <div className="mb-6 gap-4 flex flex-col md:flex-row items-center justify-between">
          <div className="relative w-full md:w-auto flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search packages..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Tabs defaultValue="all" className="w-full md:w-auto" onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All Packages</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Card>
          <CardHeader className="pb-1">
            <CardTitle>Payment Packages</CardTitle>
            <CardDescription>
              View and manage all available payment packages
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && !directFetchedData ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (error || directFetchError) && !packagesData ? (
              <div className="text-center py-6">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-red-500 mb-2">Error Loading Payment Packages</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {directFetchError || (error instanceof Error ? error.message : 'Unknown error')}
                </p>
                <Button 
                  variant="outline" 
                  onClick={handleRetry} 
                  disabled={isRetrying}
                >
                  {isRetrying ? 'Retrying...' : 'Retry Loading Packages'}
                </Button>
              </div>
            ) : filteredPackages.length > 0 ? (
              <DataTable columns={columns} data={filteredPackages} />
            ) : (
              <div className="text-center py-10">
                <PackageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Packages Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'No packages match your search criteria.' : 'You haven\'t created any payment packages yet.'}
                </p>
                <Button onClick={() => navigate('/admin/payment-packages/new')}>
                  Create Your First Package
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {packagesData && packagesData.length > 0 && (
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Package Statistics</CardTitle>
                <CardDescription>
                  Overview of package usage and performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Packages</h3>
                    <p className="text-2xl font-bold">
                      {formattedPackages.length}
                    </p>
                  </div>
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Active Packages</h3>
                    <p className="text-2xl font-bold">
                      {formattedPackages.filter(pkg => pkg.status === 'active').length}
                    </p>
                  </div>
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Package Types</h3>
                    <p className="text-2xl font-bold">
                      {new Set(formattedPackages.map(pkg => pkg.type)).size}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}