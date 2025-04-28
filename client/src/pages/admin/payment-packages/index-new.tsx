import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/ui/data-table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, 
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

// Payment package interface matching our database schema
interface PaymentPackage {
  id: number;
  name: string;
  description: string | null;
  type: 'registration' | 'lost_report';
  amount: number | string;
  currency: string;
  status: 'active' | 'inactive' | 'archived';
  isDefault: boolean;
  features: string[] | null;
  validityDays: number | null;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string | null;
}

// Interface for formatted packages (used for display)
interface FormattedPackage {
  id: number;
  name: string;
  description: string;
  type: 'registration' | 'lost_report';
  price: number;
  currency: string;
  duration: number;
  features: string[];
  status: string;
}

export default function PaymentPackages() {
  const { user, role, isAuthenticated } = useAuth();
  const isAdmin = role === 'Admin';
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();

  // Fetch payment packages
  const { 
    data: paymentPackages, 
    isLoading, 
    error,
    refetch 
  } = useQuery<PaymentPackage[]>({
    queryKey: ['/api/admin/payment-packages'],
    enabled: isAuthenticated && isAdmin,
  });

  // Format package data for display
  const formatPackageData = (pkg: PaymentPackage): FormattedPackage => {
    // Process features field based on its type
    let featuresArray: string[] = [];
    
    if (pkg.features) {
      if (Array.isArray(pkg.features)) {
        featuresArray = pkg.features;
      } else if (typeof pkg.features === 'string') {
        try {
          // Try to parse JSON string
          const parsed = JSON.parse(pkg.features);
          featuresArray = Array.isArray(parsed) ? parsed : [String(pkg.features)];
        } catch {
          featuresArray = [pkg.features];
        }
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
      type: pkg.type,
      price: typeof pkg.amount === 'string' ? parseFloat(pkg.amount) : Number(pkg.amount),
      currency: pkg.currency,
      duration: pkg.validityDays || 30,
      features: featuresArray,
      status: pkg.status
    };
  };

  // Format and filter packages
  const formattedPackages: FormattedPackage[] = paymentPackages 
    ? paymentPackages.map(formatPackageData)
    : [];
  
  const filteredPackages = formattedPackages.filter(pkg => {
    const matchesSearch = pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         pkg.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || pkg.status === activeTab;
    return matchesSearch && matchesTab;
  });

  // Table columns
  const columns = [
    {
      accessorKey: 'name',
      header: 'Package Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Package className="h-4 w-4 text-primary" />
          </div>
          <div className="font-medium">{row.original.name}</div>
        </div>
      ),
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.price.toFixed(2)} {row.original.currency}</span>
        </div>
      ),
    },
    {
      accessorKey: 'duration',
      header: 'Duration',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.duration} days</span>
        </div>
      ),
    },
    {
      accessorKey: 'features',
      header: 'Features',
      cell: ({ row }) => (
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
      cell: ({ row }) => {
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
      cell: ({ row }) => {
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
      cell: ({ row }) => {
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
              <DropdownMenuItem onClick={() => window.location.href = `/admin/payment-packages/${row.original.id}`}>
                View details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = `/admin/payment-packages/edit/${row.original.id}`}>
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

  // Access denied state
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">Authentication Required</h1>
          <p className="text-muted-foreground mb-4">Please sign in to access this page.</p>
          <Button onClick={() => window.location.href = '/login'}>Sign In</Button>
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
    <AdminLayout>
      <div className="container mx-auto p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Payment Packages</h1>
            <p className="text-muted-foreground">Manage and configure payment packages for your platform</p>
          </div>
          <Button 
            className="mt-4 md:mt-0" 
            onClick={() => window.location.href = '/admin/payment-packages/new'}
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
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : error ? (
              <div className="text-center py-6">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-red-500 mb-2">Error Loading Payment Packages</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {error instanceof Error ? error.message : 'Unknown error occurred'}
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => refetch()} 
                >
                  Retry
                </Button>
              </div>
            ) : filteredPackages.length > 0 ? (
              <DataTable columns={columns} data={filteredPackages} />
            ) : (
              <div className="text-center py-10">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Packages Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'No packages match your search criteria.' : 'You haven\'t created any payment packages yet.'}
                </p>
                <Button onClick={() => window.location.href = '/admin/payment-packages/new'}>
                  Create Your First Package
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {formattedPackages.length > 0 && (
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Package Statistics</CardTitle>
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
    </AdminLayout>
  );
}