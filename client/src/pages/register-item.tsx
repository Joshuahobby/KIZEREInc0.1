import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check } from "lucide-react";

// Item categories
const categories = [
  "Electronics",
  "Documents",
  "Jewelry",
  "Accessories",
  "Other"
];

// Item registration steps
const steps = [
  { id: 1, name: "Basic Info" },
  { id: 2, name: "Details" },
  { id: 3, name: "Media" },
  { id: 4, name: "Review" }
];

// Basic info form schema
const basicInfoSchema = z.object({
  name: z.string().min(3, "Item name must be at least 3 characters"),
  category: z.string().min(1, "Please select a category"),
  uniqueIdentifier: z.string().min(1, "Unique identifier is required"),
  description: z.string().optional(),
});

// Details form schema (step 2)
const detailsSchema = z.object({
  brand: z.string().optional(),
  model: z.string().optional(),
  color: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchaseLocation: z.string().optional(),
  value: z.string().optional(),
});

// Media form schema (step 3)
const mediaSchema = z.object({
  imageUrls: z.array(z.string()).optional(),
});

// Combined schema for the entire form
const itemRegistrationSchema = basicInfoSchema.merge(detailsSchema).merge(mediaSchema);

type BasicInfoValues = z.infer<typeof basicInfoSchema>;
type DetailsValues = z.infer<typeof detailsSchema>;
type MediaValues = z.infer<typeof mediaSchema>;
type ItemRegistrationValues = z.infer<typeof itemRegistrationSchema>;

export default function RegisterItem() {
  const [step, setStep] = useState(1);
  const { toast } = useToast();
  
  // Create the form
  const form = useForm<ItemRegistrationValues>({
    resolver: zodResolver(itemRegistrationSchema),
    defaultValues: {
      name: "",
      category: "",
      uniqueIdentifier: "",
      description: "",
      brand: "",
      model: "",
      color: "",
      purchaseDate: "",
      purchaseLocation: "",
      value: "",
      imageUrls: [],
    },
    mode: "onChange",
  });
  
  // Item registration mutation
  const registerMutation = useMutation({
    mutationFn: async (data: ItemRegistrationValues) => {
      // Prepare item data
      const itemData = {
        name: data.name,
        category: data.category,
        uniqueIdentifier: data.uniqueIdentifier,
        description: data.description,
        // Store additional details in the details JSON field
        details: {
          brand: data.brand,
          model: data.model,
          color: data.color,
          purchaseDate: data.purchaseDate,
          purchaseLocation: data.purchaseLocation,
          value: data.value,
        },
        imageUrls: data.imageUrls || [],
      };
      
      const res = await apiRequest("POST", "/api/items", itemData);
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate and refetch items query to update the list
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      
      toast({
        title: "Item registered successfully",
        description: "Your item has been added to the database.",
      });
      
      // Reset form and go back to step 1
      form.reset();
      setStep(1);
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Failed to register item. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Handle next step
  const handleNextStep = async () => {
    // Validate current step
    let isValid = false;
    
    if (step === 1) {
      isValid = await form.trigger(["name", "category", "uniqueIdentifier", "description"]);
    } else if (step === 2) {
      isValid = await form.trigger(["brand", "model", "color", "purchaseDate", "purchaseLocation", "value"]);
    } else if (step === 3) {
      isValid = await form.trigger(["imageUrls"]);
    }
    
    if (isValid) {
      setStep(Math.min(4, step + 1));
    }
  };
  
  // Handle previous step
  const handlePreviousStep = () => {
    setStep(Math.max(1, step - 1));
  };
  
  // Handle form submission (in final step)
  const onSubmit = (data: ItemRegistrationValues) => {
    registerMutation.mutate(data);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-display font-semibold text-neutral-900">Register New Item</h1>
            <p className="mt-1 text-sm text-neutral-500">Create a record for your valuable item to protect it.</p>
            
            <Card className="mt-6">
              <CardContent className="pt-6">
                {/* Progress Steps */}
                <div className="mb-8 flex justify-between relative">
                  {/* Progress Bar */}
                  <div className="absolute top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
                  
                  {/* Step Indicators */}
                  {steps.map((s) => (
                    <div key={s.id} className="relative z-10 flex flex-col items-center">
                      <div 
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          s.id === step
                            ? "bg-primary-600 text-white"
                            : s.id < step
                              ? "bg-primary-600 text-white"
                              : "bg-gray-200 text-neutral-500"
                        }`}
                      >
                        {s.id < step ? <Check className="h-5 w-5" /> : <span className="font-medium">{s.id}</span>}
                      </div>
                      <p className={`mt-2 text-sm font-medium ${
                        s.id === step ? "text-neutral-900" : "text-neutral-500"
                      }`}>{s.name}</p>
                    </div>
                  ))}
                </div>
                
                {/* Form Steps */}
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)}>
                    {/* Step 1: Basic Info */}
                    {step === 1 && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                          <div className="sm:col-span-3">
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Item Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g. MacBook Pro, iPhone, National ID" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="sm:col-span-3">
                            <FormField
                              control={form.control}
                              name="category"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Category</FormLabel>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {categories.map((category) => (
                                        <SelectItem key={category} value={category.toLowerCase()}>
                                          {category}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="sm:col-span-6">
                            <FormField
                              control={form.control}
                              name="uniqueIdentifier"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    Unique Identifier
                                    <span className="ml-1 text-sm text-neutral-500">(Serial number, ID number, etc.)</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g. SN12345678, ID-12345" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="sm:col-span-6">
                            <FormField
                              control={form.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    Description
                                    <span className="ml-1 text-sm text-neutral-500">(Optional)</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Enter any additional details or distinguishing features"
                                      className="min-h-[100px]"
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Step 2: Details */}
                    {step === 2 && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                          <div className="sm:col-span-3">
                            <FormField
                              control={form.control}
                              name="brand"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    Brand
                                    <span className="ml-1 text-sm text-neutral-500">(Optional)</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g. Apple, Samsung, Toyota" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="sm:col-span-3">
                            <FormField
                              control={form.control}
                              name="model"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    Model
                                    <span className="ml-1 text-sm text-neutral-500">(Optional)</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g. iPhone 13, A123456" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="sm:col-span-3">
                            <FormField
                              control={form.control}
                              name="color"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    Color
                                    <span className="ml-1 text-sm text-neutral-500">(Optional)</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g. Black, Silver, Blue" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="sm:col-span-3">
                            <FormField
                              control={form.control}
                              name="purchaseDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    Purchase Date
                                    <span className="ml-1 text-sm text-neutral-500">(Optional)</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="sm:col-span-3">
                            <FormField
                              control={form.control}
                              name="purchaseLocation"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    Purchase Location
                                    <span className="ml-1 text-sm text-neutral-500">(Optional)</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g. Amazon, Best Buy, Local Store" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="sm:col-span-3">
                            <FormField
                              control={form.control}
                              name="value"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    Estimated Value
                                    <span className="ml-1 text-sm text-neutral-500">(Optional)</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g. $1000" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Step 3: Media */}
                    {step === 3 && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                          <div className="sm:col-span-6">
                            <p className="text-neutral-700 mb-2">Upload Images</p>
                            <p className="text-sm text-neutral-500 mb-4">
                              This feature will be implemented in a future update. For now, you can continue without uploading images.
                            </p>
                            
                            <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center">
                              <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <p className="mt-1 text-sm text-neutral-500">
                                Drag and drop image files here, or click to select files
                              </p>
                              <p className="text-xs text-neutral-400">
                                PNG, JPG, JPEG up to 5MB
                              </p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-4"
                                disabled
                              >
                                Upload Images
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Step 4: Review */}
                    {step === 4 && (
                      <div className="space-y-6">
                        <div className="bg-gray-50 p-4 rounded-md">
                          <h3 className="text-lg font-medium text-neutral-900 mb-4">Review Item Information</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium text-neutral-500">Basic Information</h4>
                              <div className="mt-2 space-y-2">
                                <div>
                                  <span className="text-sm font-medium text-neutral-900">Item Name:</span>
                                  <span className="text-sm text-neutral-700 ml-2">{form.getValues("name")}</span>
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-neutral-900">Category:</span>
                                  <span className="text-sm text-neutral-700 ml-2">
                                    {form.getValues("category").charAt(0).toUpperCase() + form.getValues("category").slice(1)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-neutral-900">Unique Identifier:</span>
                                  <span className="text-sm text-neutral-700 ml-2">{form.getValues("uniqueIdentifier")}</span>
                                </div>
                                {form.getValues("description") && (
                                  <div>
                                    <span className="text-sm font-medium text-neutral-900">Description:</span>
                                    <p className="text-sm text-neutral-700 mt-1">{form.getValues("description")}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-medium text-neutral-500">Additional Details</h4>
                              <div className="mt-2 space-y-2">
                                {form.getValues("brand") && (
                                  <div>
                                    <span className="text-sm font-medium text-neutral-900">Brand:</span>
                                    <span className="text-sm text-neutral-700 ml-2">{form.getValues("brand")}</span>
                                  </div>
                                )}
                                {form.getValues("model") && (
                                  <div>
                                    <span className="text-sm font-medium text-neutral-900">Model:</span>
                                    <span className="text-sm text-neutral-700 ml-2">{form.getValues("model")}</span>
                                  </div>
                                )}
                                {form.getValues("color") && (
                                  <div>
                                    <span className="text-sm font-medium text-neutral-900">Color:</span>
                                    <span className="text-sm text-neutral-700 ml-2">{form.getValues("color")}</span>
                                  </div>
                                )}
                                {form.getValues("purchaseDate") && (
                                  <div>
                                    <span className="text-sm font-medium text-neutral-900">Purchase Date:</span>
                                    <span className="text-sm text-neutral-700 ml-2">{form.getValues("purchaseDate")}</span>
                                  </div>
                                )}
                                {form.getValues("purchaseLocation") && (
                                  <div>
                                    <span className="text-sm font-medium text-neutral-900">Purchase Location:</span>
                                    <span className="text-sm text-neutral-700 ml-2">{form.getValues("purchaseLocation")}</span>
                                  </div>
                                )}
                                {form.getValues("value") && (
                                  <div>
                                    <span className="text-sm font-medium text-neutral-900">Estimated Value:</span>
                                    <span className="text-sm text-neutral-700 ml-2">{form.getValues("value")}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Form Navigation */}
                    <div className="flex justify-end mt-8">
                      {step > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handlePreviousStep}
                          className="mr-4"
                        >
                          Previous
                        </Button>
                      )}
                      
                      {step < 4 ? (
                        <Button
                          type="button"
                          onClick={handleNextStep}
                        >
                          Next
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Registering...
                            </>
                          ) : (
                            "Register Item"
                          )}
                        </Button>
                      )}
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
