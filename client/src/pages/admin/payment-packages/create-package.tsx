import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, ArrowLeft, Save, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

// Define Zod schema for form validation
const packageSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  description: z.string().optional(),
  type: z.enum(['registration', 'lost_report']),
  amount: z.string()
    .refine(val => !isNaN(parseFloat(val)), { message: "Amount must be a valid number" })
    .refine(val => parseFloat(val) > 0, { message: "Amount must be greater than 0" }),
  currency: z.string().min(1, { message: "Currency is required" }),
  validityDays: z.string()
    .refine(val => !isNaN(parseInt(val)), { message: "Validity days must be a valid number" })
    .refine(val => parseInt(val) >= 0, { message: "Validity days must be 0 or greater" })
    .optional(),
  isDefault: z.boolean().default(false),
  features: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive']).default('active'),
});

// Infer the type from our schema
type PackageFormValues = z.infer<typeof packageSchema>;
import { apiRequest } from '@/lib/queryClient';

export default function CreatePaymentPackage() {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [features, setFeatures] = useState<string[]>(["Basic registration"]);
  const [featureInput, setFeatureInput] = useState("");

  // Define default values for the form
  const defaultValues: PackageFormValues = {
    name: "",
    description: "",
    type: "registration",
    amount: "0",
    currency: "USD",
    validityDays: "365",
    isDefault: false,
    features: features,
    status: "active",
  };

  // Initialize the form
  const form = useForm<PackageFormValues>({
    resolver: zodResolver(packageSchema),
    defaultValues,
  });

  // Create mutation
  const mutation = useMutation({
    mutationFn: async (data: PackageFormValues) => {
      // Convert numeric string values to numbers
      const payload = {
        ...data,
        amount: parseFloat(data.amount),
        validityDays: data.validityDays ? parseInt(data.validityDays) : undefined,
        createdBy: user?.id,
      };
      
      return await apiRequest('/api/admin/payment-packages', { method: 'POST', data: payload });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment package created successfully",
        variant: "default",
      });
      // Redirect back to packages list
      window.location.href = '/admin/payment-packages';
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating package",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = async (data: PackageFormValues) => {
    // Add the current features to the data
    data.features = features;
    await mutation.mutate(data);
  };

  // Handle adding a new feature
  const addFeature = () => {
    if (featureInput.trim() && !features.includes(featureInput.trim())) {
      setFeatures([...features, featureInput.trim()]);
      setFeatureInput("");
    }
  };

  // Handle removing a feature
  const removeFeature = (feature: string) => {
    setFeatures(features.filter(f => f !== feature));
  };

  // Access denied state
  if (!isAuthenticated || user?.role !== 'Admin') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">Authentication Required</h1>
          <p className="mb-4">You must be logged in as an administrator to access this page.</p>
          <Button onClick={() => window.location.href = '/login'}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin/payment-packages">Payment Packages</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>Create Package</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Payment Package</h1>
          <p className="text-muted-foreground">
            Configure a new payment package for your platform
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => window.location.href = '/admin/payment-packages'}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Packages
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Package Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Package Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Premium Registration" {...field} />
                      </FormControl>
                      <FormDescription>
                        A descriptive name for this payment package
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Package Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select package type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="registration">Item Registration</SelectItem>
                          <SelectItem value="lost_report">Lost Item Report</SelectItem>
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
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Package Price</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.01" 
                          placeholder="19.99" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        The price for this package (numeric value only)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound</SelectItem>
                          <SelectItem value="NGN">NGN - Nigerian Naira</SelectItem>
                          <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                          <SelectItem value="GHS">GHS - Ghanaian Cedi</SelectItem>
                          <SelectItem value="ZAR">ZAR - South African Rand</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Currency for package pricing
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="validityDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Validity (Days)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          placeholder="365" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        How many days this package remains valid
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Whether this package is available for purchase
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Default Package</FormLabel>
                        <FormDescription>
                          Make this the default package for this type
                        </FormDescription>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe package benefits and features..." 
                            className="min-h-24"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Detailed description of what this package includes
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-4">
                <div>
                  <FormLabel>Package Features</FormLabel>
                  <FormDescription>
                    Add key features that will be displayed to users
                  </FormDescription>
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., Priority support"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addFeature();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button type="button" onClick={addFeature}>
                    Add
                  </Button>
                </div>

                <div>
                  {features.length > 0 ? (
                    <ul className="space-y-2">
                      {features.map((feature, index) => (
                        <li key={index} className="flex items-center justify-between bg-muted/40 p-2 rounded">
                          <span>{feature}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFeature(feature)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center p-4 border border-dashed rounded-md text-muted-foreground">
                      No features added yet
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.location.href = '/admin/payment-packages'}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Package
                    </>
                  )}
                </Button>
              </div>
              
              {mutation.isError && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {mutation.error instanceof Error ? mutation.error.message : 'An unknown error occurred'}
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}