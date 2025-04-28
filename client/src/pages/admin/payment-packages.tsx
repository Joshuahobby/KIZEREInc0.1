import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PaymentType, packageStatuses } from "@shared/schema";
import { PaymentPackage } from "@/components/payment/payment-package-selector";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

// Icons
import { Plus, Edit, Trash2, CheckCircle, XCircle, RefreshCw, Archive, AlertTriangle } from "lucide-react";

// Form schema for creating/editing a payment package
const packageFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  type: z.enum(["registration", "lost_report"], {
    required_error: "Package type is required"
  }),
  amount: z.coerce.number().positive("Amount must be a positive number"),
  currency: z.string().default("RWF"),
  features: z.string().transform(str => str.split('\n').filter(s => s.trim().length > 0)),
  isDefault: z.boolean().default(false),
  status: z.enum(["active", "inactive", "archived"], {
    required_error: "Status is required"
  }).default("active"),
  validityDays: z.coerce.number().int().nonnegative("Validity days must be a non-negative integer").optional(),
});

type PackageFormValues = z.infer<typeof packageFormSchema>;

export default function AdminPaymentPackagesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPackage, setSelectedPackage] = useState<PaymentPackage | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("registration");

  // Create form
  const createForm = useForm<PackageFormValues>({
    resolver: zodResolver(packageFormSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "registration" as PaymentType,
      amount: 0,
      currency: "RWF",
      features: [],
      isDefault: false,
      status: "active",
      validityDays: 0
    }
  });

  // Edit form
  const editForm = useForm<PackageFormValues>({
    resolver: zodResolver(packageFormSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "registration" as PaymentType,
      amount: 0,
      currency: "RWF",
      features: [],
      isDefault: false,
      status: "active",
      validityDays: 0
    }
  });

  // Load payment packages
  const { data: packages, isLoading, error } = useQuery({
    queryKey: ['/api/admin/payment-packages'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/payment-packages?includeInactive=true');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch payment packages');
      }
      return response.json() as Promise<PaymentPackage[]>;
    }
  });

  // Create a new payment package
  const createPackageMutation = useMutation({
    mutationFn: async (data: PackageFormValues) => {
      const response = await apiRequest('POST', '/api/admin/payment-packages', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create payment package');
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Package created",
        description: "The payment package has been created successfully",
      });
      setIsCreateDialogOpen(false);
      createForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payment-packages'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to create package",
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: "destructive"
      });
    }
  });

  // Update a payment package
  const updatePackageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: PackageFormValues }) => {
      const response = await apiRequest('PATCH', `/api/admin/payment-packages/${id}`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update payment package');
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Package updated",
        description: "The payment package has been updated successfully",
      });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payment-packages'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update package",
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: "destructive"
      });
    }
  });

  // Delete a payment package
  const deletePackageMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/admin/payment-packages/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete payment package');
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Package deleted",
        description: "The payment package has been deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setSelectedPackage(null);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payment-packages'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete package",
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: "destructive"
      });
    }
  });

  // Change package status
  const updatePackageStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: 'active' | 'inactive' | 'archived' }) => {
      const response = await apiRequest('PATCH', `/api/admin/payment-packages/${id}/status`, { status });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update package status');
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "The package status has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payment-packages'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update status",
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: "destructive"
      });
    }
  });

  // Set default package
  const setDefaultPackageMutation = useMutation({
    mutationFn: async ({ id, type }: { id: number, type: PaymentType }) => {
      const response = await apiRequest('PATCH', `/api/admin/payment-packages/${id}/default`, { isDefault: true });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to set as default package');
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Default package updated",
        description: "The default package has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payment-packages'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to set default package",
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: "destructive"
      });
    }
  });

  // Handle create form submission
  const onCreateSubmit = (data: PackageFormValues) => {
    createPackageMutation.mutate(data);
  };

  // Handle edit form submission
  const onEditSubmit = (data: PackageFormValues) => {
    if (selectedPackage) {
      updatePackageMutation.mutate({ id: selectedPackage.id, data });
    }
  };

  // Open edit dialog with selected package data
  const openEditDialog = (pkg: PaymentPackage) => {
    setSelectedPackage(pkg);
    
    // Convert features array to newline-separated string
    const featuresString = pkg.features.join('\n');
    
    editForm.reset({
      name: pkg.name,
      description: pkg.description || "",
      type: pkg.type,
      amount: Number(pkg.amount),
      currency: pkg.currency,
      features: featuresString,
      isDefault: pkg.isDefault,
      status: pkg.status,
      validityDays: pkg.validityDays || 0
    });
    
    setIsEditDialogOpen(true);
  };

  // Confirm package deletion
  const confirmDelete = (pkg: PaymentPackage) => {
    setSelectedPackage(pkg);
    setIsDeleteDialogOpen(true);
  };

  // Handle package deletion
  const deletePackage = () => {
    if (selectedPackage) {
      deletePackageMutation.mutate(selectedPackage.id);
    }
  };

  // Filter packages by type
  const filteredPackages = packages?.filter(pkg => pkg.type === activeTab);

  // Render loading state
  if (isLoading) {
    return (
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-6">Payment Packages</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-1/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="container py-6">
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error loading payment packages</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'An error occurred while loading payment packages'}
          </AlertDescription>
        </Alert>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/payment-packages'] })}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Payment Packages</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Package
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="registration">Registration Packages</TabsTrigger>
          <TabsTrigger value="lost_report">Lost Report Packages</TabsTrigger>
        </TabsList>
        
        <TabsContent value="registration" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPackages && filteredPackages.length > 0 ? (
              filteredPackages.map(pkg => (
                <PackageCard 
                  key={pkg.id} 
                  package={pkg} 
                  onEdit={() => openEditDialog(pkg)} 
                  onDelete={() => confirmDelete(pkg)}
                  onStatusChange={(status) => updatePackageStatusMutation.mutate({ id: pkg.id, status })}
                  onSetDefault={() => setDefaultPackageMutation.mutate({ id: pkg.id, type: pkg.type })}
                />
              ))
            ) : (
              <div className="col-span-full">
                <Alert className="bg-muted">
                  <AlertTitle>No registration packages found</AlertTitle>
                  <AlertDescription>
                    Create a new package to offer pricing options for item registration.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="lost_report" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPackages && filteredPackages.length > 0 ? (
              filteredPackages.map(pkg => (
                <PackageCard 
                  key={pkg.id} 
                  package={pkg} 
                  onEdit={() => openEditDialog(pkg)} 
                  onDelete={() => confirmDelete(pkg)}
                  onStatusChange={(status) => updatePackageStatusMutation.mutate({ id: pkg.id, status })}
                  onSetDefault={() => setDefaultPackageMutation.mutate({ id: pkg.id, type: pkg.type })}
                />
              ))
            ) : (
              <div className="col-span-full">
                <Alert className="bg-muted">
                  <AlertTitle>No lost report packages found</AlertTitle>
                  <AlertDescription>
                    Create a new package to offer pricing options for lost item reports.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Package Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Payment Package</DialogTitle>
            <DialogDescription>
              Create a new payment package with customized pricing and features
            </DialogDescription>
          </DialogHeader>

          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-4 pr-4">
                  <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Basic Registration Package" {...field} />
                        </FormControl>
                        <FormDescription>
                          A descriptive name for this payment package
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the package benefits and features"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          A brief description of what this package offers
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={createForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Package Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select package type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="registration">Registration</SelectItem>
                              <SelectItem value="lost_report">Lost Report</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The type of service this package is for
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                              <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Package availability status
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={createForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="1" {...field} />
                          </FormControl>
                          <FormDescription>
                            Price of the package in the specified currency
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <FormControl>
                            <Input defaultValue="RWF" {...field} />
                          </FormControl>
                          <FormDescription>
                            Currency code (e.g. RWF, USD)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={createForm.control}
                    name="features"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Features</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter each feature on a new line
e.g. Unlimited item registrations
Premium support
Priority processing"
                            rows={5}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          List of features included in this package (one per line)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="validityDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Validity Period (Days)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="1" {...field} />
                        </FormControl>
                        <FormDescription>
                          Number of days the package is valid for (0 for unlimited)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="isDefault"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Default Package</FormLabel>
                          <FormDescription>
                            Make this the default package for its type
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </ScrollArea>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createPackageMutation.isPending}>
                  {createPackageMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Package'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Package Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Payment Package</DialogTitle>
            <DialogDescription>
              Update the details of this payment package
            </DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-4 pr-4">
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Basic Registration Package" {...field} />
                        </FormControl>
                        <FormDescription>
                          A descriptive name for this payment package
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the package benefits and features"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          A brief description of what this package offers
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Package Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select package type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="registration">Registration</SelectItem>
                              <SelectItem value="lost_report">Lost Report</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The type of service this package is for
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                              <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Package availability status
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="1" {...field} />
                          </FormControl>
                          <FormDescription>
                            Price of the package in the specified currency
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <FormControl>
                            <Input defaultValue="RWF" {...field} />
                          </FormControl>
                          <FormDescription>
                            Currency code (e.g. RWF, USD)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={editForm.control}
                    name="features"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Features</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter each feature on a new line
e.g. Unlimited item registrations
Premium support
Priority processing"
                            rows={5}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          List of features included in this package (one per line)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="validityDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Validity Period (Days)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="1" {...field} />
                        </FormControl>
                        <FormDescription>
                          Number of days the package is valid for (0 for unlimited)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="isDefault"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Default Package</FormLabel>
                          <FormDescription>
                            Make this the default package for its type
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </ScrollArea>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updatePackageMutation.isPending}>
                  {updatePackageMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Package'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this payment package? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPackage && (
            <div className="py-4">
              <p className="font-medium">{selectedPackage.name}</p>
              <p className="text-sm text-muted-foreground mt-1">{selectedPackage.description}</p>
              <div className="flex items-center mt-2 space-x-2">
                <Badge>{selectedPackage.type}</Badge>
                <Badge variant="outline">{selectedPackage.amount} {selectedPackage.currency}</Badge>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deletePackage} disabled={deletePackageMutation.isPending}>
              {deletePackageMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Package'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Package Card Component
function PackageCard({ 
  package: pkg, 
  onEdit, 
  onDelete,
  onStatusChange,
  onSetDefault
}: { 
  package: PaymentPackage;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: 'active' | 'inactive' | 'archived') => void;
  onSetDefault: () => void;
}) {
  return (
    <Card className={`relative ${pkg.status !== 'active' ? 'opacity-75' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center">
              {pkg.name}
              {pkg.isDefault && (
                <Badge variant="secondary" className="ml-2 text-xs">Default</Badge>
              )}
            </CardTitle>
            <CardDescription>{pkg.description}</CardDescription>
          </div>
          <Badge variant={pkg.status === 'active' ? 'default' : pkg.status === 'inactive' ? 'outline' : 'destructive'}>
            {pkg.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-4">{pkg.amount} {pkg.currency}</div>
        
        {pkg.validityDays ? (
          <div className="text-sm text-muted-foreground mb-4">
            Valid for {pkg.validityDays} days
          </div>
        ) : null}
        
        {pkg.features && pkg.features.length > 0 && (
          <div className="space-y-2">
            {pkg.features.map((feature, index) => (
              <div key={index} className="flex items-start text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 shrink-0 mt-0.5" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-col space-y-2">
        <div className="flex space-x-2 w-full">
          <Button onClick={onEdit} variant="outline" className="flex-1">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button onClick={onDelete} variant="destructive" size="icon">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <Separator />
        
        <div className="flex flex-wrap gap-2 w-full">
          {pkg.status === 'active' ? (
            <Button 
              onClick={() => onStatusChange('inactive')} 
              variant="outline" 
              size="sm" 
              className="flex-1"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Deactivate
            </Button>
          ) : pkg.status === 'inactive' ? (
            <Button 
              onClick={() => onStatusChange('active')} 
              variant="outline" 
              size="sm" 
              className="flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Activate
            </Button>
          ) : (
            <Button 
              onClick={() => onStatusChange('active')} 
              variant="outline" 
              size="sm" 
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Restore
            </Button>
          )}
          
          {!pkg.isDefault && pkg.status === 'active' && (
            <Button 
              onClick={onSetDefault} 
              variant="ghost" 
              size="sm" 
              className="flex-1"
            >
              Set as Default
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}