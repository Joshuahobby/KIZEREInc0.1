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
  PackageIcon, 
  Plus, 
  Search, 
  DollarSign, 
  Calendar,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function PaymentPackages() {
  const { user, role } = useAuth();
  const isAdmin = role === 'Admin';
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Get toast for notifications
  const { toast } = useToast();
  
  // Fetch payment packages data
  const { data: packages, isLoading, error } = useQuery({
    queryKey: ['/api/admin/payment-packages'],
    enabled: !!user?.id && role === 'Admin', // Only fetch if user is admin
    retry: false, // Don't retry on error
    // Using on-error callback to show toast notification for errors
    onError: (err) => {
      console.error('Error fetching payment packages:', err);
      toast({
        title: 'Error loading payment packages',
        description: err instanceof Error ? err.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    }
  });

  // Placeholder packages data until API is implemented
  const placeholderPackages = [
    {
      id: 1,
      name: 'Basic Registration',
      description: 'Basic item registration package',
      price: 5.99,
      duration: 30, // days
      features: ['Basic registration', 'Email support'],
      status: 'active',
    },
    {
      id: 2,
      name: 'Premium Registration',
      description: 'Premium item registration with enhanced features',
      price: 19.99,
      duration: 90, // days
      features: ['Premium registration', 'Priority support', 'Extended visibility'],
      status: 'active',
    },
    {
      id: 3,
      name: 'Lost Item Report',
      description: 'Package for reporting lost items',
      price: 9.99,
      duration: 60, // days
      features: ['Lost item reporting', 'Email alerts', 'Basic matching'],
      status: 'active',
    },
    {
      id: 4,
      name: 'Premium Lost Item',
      description: 'Advanced lost item reporting with premium features',
      price: 24.99,
      duration: 120, // days
      features: ['Priority lost item reporting', 'SMS alerts', 'Advanced matching', '24/7 support'],
      status: 'active',
    },
    {
      id: 5,
      name: 'Enterprise Package',
      description: 'Complete enterprise solution for organizations',
      price: 99.99,
      duration: 365, // days
      features: ['Unlimited registrations', 'Dedicated support', 'API access', 'Custom branding'],
      status: 'inactive',
    }
  ];

  // Use actual data when available, otherwise use placeholder
  const packagesData = packages || placeholderPackages;

  // Filter packages based on search and active tab
  const filteredPackages = packagesData.filter(pkg => {
    const matchesSearch = pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           pkg.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || pkg.status === activeTab;
    return matchesSearch && matchesTab;
  });

  // Columns for the data table
  const columns = [
    {
      accessorKey: 'name',
      header: 'Package Name',
      cell: ({ row }) => (
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
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span>${row.original.price.toFixed(2)}</span>
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
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : error ? (
              <div className="text-center py-6 text-red-500">
                <p>Error loading payment packages: {error instanceof Error ? error.message : 'Unknown error'}</p>
                <p className="text-sm mt-2">Using placeholder data instead.</p>
              </div>
            ) : (
              <DataTable columns={columns} data={filteredPackages} />
            )}
          </CardContent>
        </Card>

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
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Active Packages</h3>
                  <p className="text-2xl font-bold">
                    {packagesData.filter(pkg => pkg.status === 'active').length}
                  </p>
                </div>
                <div className="bg-primary/5 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Package Revenue</h3>
                  <p className="text-2xl font-bold">$2,456.78</p>
                </div>
                <div className="bg-primary/5 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Most Popular</h3>
                  <p className="text-2xl font-bold">Premium Registration</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}