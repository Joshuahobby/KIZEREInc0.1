import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// Icons
import {
  ArrowLeft,
  PackageIcon,
  Plus,
  Trash2,
} from 'lucide-react';

// Define the schema for the payment package form
const packageSchema = z.object({
  name: z.string().min(3, {
    message: 'Package name must be at least 3 characters.',
  }),
  description: z.string().min(10, {
    message: 'Description must be at least 10 characters.',
  }),
  price: z.number().min(0, {
    message: 'Price must be a positive number.',
  }),
  duration: z.number().min(1, {
    message: 'Duration must be at least 1 day.',
  }),
  features: z.array(z.string()).min(1, {
    message: 'At least one feature is required.',
  }),
  isActive: z.boolean(),
  packageType: z.enum(['registration', 'report', 'enterprise']),
  priority: z.enum(['low', 'medium', 'high']),
});

// Define the type for form values based on the schema
type PackageFormValues = z.infer<typeof packageSchema>;

// Make a simple API request function
async function apiRequest(method: string, url: string, data?: any) {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined,
    credentials: 'include'
  });

  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorJson = JSON.parse(errorText);
      throw new Error(errorJson.message || 'An error occurred');
    } catch (e) {
      throw new Error(errorText || 'An error occurred');
    }
  }

  return response;
}

export default function CreatePaymentPackage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Define default values for the form
  const defaultValues: PackageFormValues = {
    name: '',
    description: '',
    price: 0,
    duration: 30,
    features: [''],
    isActive: true,
    packageType: 'registration',
    priority: 'medium',
  };

  // Initialize the form
  const form = useForm<PackageFormValues>({
    resolver: zodResolver(packageSchema),
    defaultValues,
    mode: 'onChange',
  });

  // Helper function to add a new feature field
  const addFeature = () => {
    const currentFeatures = form.getValues('features');
    form.setValue('features', [...currentFeatures, '']);
  };

  // Helper function to remove a feature field
  const removeFeature = (index: number) => {
    const currentFeatures = form.getValues('features');
    if (currentFeatures.length > 1) {
      form.setValue(
        'features',
        currentFeatures.filter((_, i) => i !== index)
      );
    }
  };

  // Handle form submission
  const onSubmit = async (data: PackageFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Filter out any empty feature strings
      data.features = data.features.filter(feature => feature.trim() !== '');
      
      await apiRequest('POST', '/api/admin/payment-packages', data);
      
      toast({
        title: 'Package Created',
        description: 'The payment package has been created successfully.',
      });
      
      // Navigate back to packages list using direct window location change
      window.location.href = '/admin/payment-packages';
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create payment package. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4 md:px-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => window.location.href = '/admin/payment-packages'}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Create Payment Package</h1>
            <p className="text-muted-foreground">Create a new payment package for your platform</p>
          </div>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Package Information</CardTitle>
            <CardDescription>
              Define the basic information for this payment package
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Package Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Premium Registration" {...field} />
                        </FormControl>
                        <FormDescription>
                          A clear, descriptive name for the package
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="packageType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Package Type</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="registration" id="registration" />
                              <label htmlFor="registration" className="text-sm font-medium">
                                Registration Package
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="report" id="report" />
                              <label htmlFor="report" className="text-sm font-medium">
                                Report Package
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="enterprise" id="enterprise" />
                              <label htmlFor="enterprise" className="text-sm font-medium">
                                Enterprise Package
                              </label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormDescription>
                          The category this package belongs to
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe what this package offers..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          A detailed description of the package benefits
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (USD)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                              $
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="19.99"
                              className="pl-7"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          The price for this package in USD
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (Days)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="30"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value === '' ? 30 : parseInt(e.target.value, 10))}
                          />
                        </FormControl>
                        <FormDescription>
                          How long this package is valid for
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-medium">Package Features</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addFeature}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Feature
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {form.watch('features').map((_, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <FormField
                          control={form.control}
                          name={`features.${index}`}
                          render={({ field }) => (
                            <FormItem className="flex-1 mb-0">
                              <FormControl>
                                <Input 
                                  placeholder={`Feature ${index + 1}`} 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFeature(index)}
                          disabled={form.watch('features').length <= 1}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Active Status</FormLabel>
                          <FormDescription>
                            Make this package available immediately
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

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority Level</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex space-x-4"
                          >
                            <div className="flex items-center space-x-1">
                              <RadioGroupItem value="low" id="low" />
                              <label htmlFor="low" className="text-sm">Low</label>
                            </div>
                            <div className="flex items-center space-x-1">
                              <RadioGroupItem value="medium" id="medium" />
                              <label htmlFor="medium" className="text-sm">Medium</label>
                            </div>
                            <div className="flex items-center space-x-1">
                              <RadioGroupItem value="high" id="high" />
                              <label htmlFor="high" className="text-sm">High</label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormDescription>
                          Set the priority level for this package
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <CardFooter className="flex justify-end px-0 pt-2">
                  <div className="flex gap-2">
                    <Button variant="outline" type="button" onClick={() => window.location.href = '/admin/payment-packages'}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <PackageIcon className="mr-2 h-4 w-4" />
                          Create Package
                        </>
                      )}
                    </Button>
                  </div>
                </CardFooter>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}