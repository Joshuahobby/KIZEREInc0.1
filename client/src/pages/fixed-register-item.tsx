import React, { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertItemSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { InitializePaymentResponse } from "@/models/payment.model";
import { cn } from "@/lib/utils";
import { OwnershipDocument as OwnershipDoc } from "@/components/item-registration/ownership-chain";

// UI Components
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

// Lucide Icons
import {
  Loader2,
  RefreshCw,
  ArrowRight,
  InfoIcon,
  FileImage,
  FileStack,
  QrCode,
  Check,
  Fingerprint,
  Search,
  CreditCard,
} from "lucide-react";

// Our custom components for new features
import { SmartIDRecognizer } from "@/components/item-registration/smart-id-recognizer";
import { BatchImageUpload } from "@/components/item-registration/batch-image-upload";
import { OwnershipChain } from "@/components/item-registration/ownership-chain";
import { QRCodeGenerator } from "@/components/item-registration/qr-code-generator";

// Form validation schema based on the shared schema
const formSchema = insertItemSchema.extend({
  // Add client-side specific validations here
  name: z.string().min(2, { message: "Item name is too short" }).max(100),
  description: z.string().optional(),
  uniqueIdentifier: z.string().min(4, { message: "Identifier must be at least 4 characters" }),
  // Add subCategory for UI logic
  subCategory: z.string().optional(),
  // We'll handle file validation separately
});

// Form values type
type ItemRegistrationValues = z.infer<typeof formSchema>;

// Categories and sub-categories for the form
const categories = [
  "Electronics",
  "Documents",
  "Accessories",
  "Clothing",
  "Other"
];

// Sub-categories based on parent category
const subCategories = {
  Electronics: [
    "Smartphone",
    "Laptop",
    "Camera",
    "Tablet",
    "Smartwatch",
    "Other"
  ],
  Documents: [
    "ID Card",
    "Passport",
    "Driver's License",
    "Certificate",
    "Other"
  ],
  Accessories: [
    "Jewelry",
    "Watch",
    "Bag",
    "Wallet",
    "Other"
  ],
  Clothing: [
    "Outerwear",
    "Formal",
    "Casual",
    "Sports",
    "Other"
  ],
  Other: [
    "Miscellaneous"
  ]
};

export default function RegisterItem() {
  // Form state
  const [expandedSections, setExpandedSections] = useState<string[]>(["basic-info"]);
  const [itemImages, setItemImages] = useState<File[]>([]);
  const [ownershipDocuments, setOwnershipDocuments] = useState<OwnershipDoc[]>([]);
  const [completion, setCompletion] = useState(0);
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  
  // Toast notifications
  const { toast } = useToast();
  
  // Form initialization with react-hook-form and zod validation
  const form = useForm<ItemRegistrationValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "Other" as any,
      subCategory: "",
      uniqueIdentifier: "",
      description: "",
      status: "Registered",
    },
    mode: "onChange",
  });
  
  // Watch form values for determining completion percentage
  const watchedValues = form.watch();
  
  // Toggle accordion sections
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      if (prev.includes(section)) {
        return prev.filter(s => s !== section);
      } else {
        return [...prev, section];
      }
    });
  };
  
  // Calculate form completion percentage
  useEffect(() => {
    setCompletion(calculateCompletion(watchedValues, itemImages, ownershipDocuments));
  }, [watchedValues, itemImages, ownershipDocuments]);
  
  // Helper function to check if a section is complete
  const isSectionComplete = (
    values: any, 
    section: string
  ): boolean => {
    switch (section) {
      case "basic-info":
        return !!values.name && 
               !!values.category && 
               !!values.uniqueIdentifier && 
               (!!values.description || values.description === "");
      case "media":
        return itemImages.length > 0;
      case "ownership":
        return ownershipDocuments.length > 0;
      default:
        return false;
    }
  };
  
  // Helper function to get appropriate icon for each section
  const getSectionIcon = (section: string) => {
    const isComplete = isSectionComplete(watchedValues, section);
    
    switch (section) {
      case "basic-info":
        return isComplete ? <Check className="h-4 w-4 text-green-600" /> : <InfoIcon className="h-4 w-4 text-gray-500" />;
      case "media":
        return isComplete ? <Check className="h-4 w-4 text-green-600" /> : <FileImage className="h-4 w-4 text-gray-500" />;
      case "ownership":
        return isComplete ? <Check className="h-4 w-4 text-green-600" /> : <FileStack className="h-4 w-4 text-gray-500" />;
      case "qrcode":
        return <QrCode className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };
  
  // Calculate overall completion percentage
  function calculateCompletion(
    values: any,
    images: File[],
    documents: OwnershipDoc[]
  ): number {
    let totalFields = 0;
    let completedFields = 0;
    
    // Basic info section (weight: 50%)
    totalFields += 5;
    if (values.name) completedFields += 1;
    if (values.category) completedFields += 1;
    if (values.subCategory) completedFields += 1;
    if (values.uniqueIdentifier) completedFields += 1;
    if (values.description !== undefined) completedFields += 1;
    
    // Media section (weight: 25%)
    if (images.length > 0) {
      completedFields += 1.25;
    }
    totalFields += 1.25;
    
    // Ownership documents (weight: 25%)
    if (documents.length > 0) {
      completedFields += 1.25;
    }
    totalFields += 1.25;
    
    return Math.min(100, Math.round((completedFields / totalFields) * 100));
  }
  
  // Handle smart ID detection from OCR
  const handleIdentifierDetected = (value: string) => {
    form.setValue("uniqueIdentifier", value, { shouldValidate: true });
  };
  
  // Item registration mutation
  const registerMutation = useMutation({
    mutationFn: async (data: ItemRegistrationValues) => {
      // Step 1: Upload images first if there are any
      let imageUrls: string[] = [];
      
      if (itemImages.length > 0) {
        const formData = new FormData();
        itemImages.forEach((file, index) => {
          formData.append('images', file);
        });
        
        // Upload images
        const uploadRes = await fetch('/api/upload/images', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadRes.ok) throw new Error("Failed to upload images");
        const uploadResponse = await uploadRes.json();
        
        imageUrls = uploadResponse.urls;
      }
      
      // Step 2: Upload ownership documents if there are any
      let documentUrls: { type: string; url: string; date: string; description: string }[] = [];
      
      if (ownershipDocuments.length > 0) {
        const formData = new FormData();
        ownershipDocuments.forEach((doc, index) => {
          formData.append('documents', doc.file);
          formData.append(`documentInfo${index}`, JSON.stringify({
            type: 'ownership_document',
            title: doc.title,
            date: doc.date,
            description: doc.description
          }));
        });
        
        // Upload documents
        const uploadRes = await fetch('/api/upload/documents', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadRes.ok) throw new Error("Failed to upload documents");
        const uploadResponse = await uploadRes.json();
        
        documentUrls = uploadResponse.documents;
      }
      
      // Step 3: Register the item with image and document URLs
      const registrationResponse = await apiRequest<{ itemId: number }>('/api/items', {
        method: 'POST',
        data: {
          ...data,
          images: imageUrls,
          documents: documentUrls,
        },
      });
      
      // Step 4: Initialize payment for the registration
      const payment = await apiRequest<InitializePaymentResponse>('/api/payments/initialize', {
        method: 'POST',
        data: {
          type: 'registration',
          itemId: registrationResponse.itemId,
        },
      });
      
      setPaymentRef(payment.transactionRef);
      setPaymentStatus("success");
      
      // Redirect to payment page
      window.location.href = payment.redirectUrl;
    },
    onError: (error: Error) => {
      console.error("Item registration error:", error);
      
      toast({
        title: "Registration failed",
        description: error.message || "Failed to register item. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (data: ItemRegistrationValues) => {
    registerMutation.mutate(data);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-neutral-900">Register Your Item</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Protect your valuable possessions by registering them in our secure digital registry.
            </p>
          </div>
          
          {/* Floating Progress & Action Bar */}
          <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 max-w-md mr-4">
                  <div className="flex items-center">
                    <div className="w-full">
                      <div className="flex justify-between text-xs text-neutral-500 mb-1">
                        <span>Form Completion</span>
                        <span>{completion}%</span>
                      </div>
                      <Progress value={completion} className="h-2" />
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => form.reset()}
                    disabled={registerMutation.isPending}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                  
                  <Button 
                    type="button"
                    onClick={() => form.handleSubmit(onSubmit)()}
                    disabled={registerMutation.isPending || completion < 100}
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Register Now
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Form Container */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
            {/* Form Section */}
            <div className="md:col-span-2">
              <Form {...form}>
                <form className="space-y-6">
                  <Card>
                    <CardContent className="p-6">
                      <Accordion
                        type="multiple"
                        value={expandedSections}
                        onValueChange={setExpandedSections}
                        className="space-y-4"
                      >
                        {/* Item Information Section */}
                        <AccordionItem
                          value="basic-info"
                          className={cn(
                            "border rounded-lg overflow-hidden", 
                            isSectionComplete(watchedValues, "basic-info") 
                              ? "border-green-200 bg-green-50" 
                              : "border-gray-200"
                          )}
                        >
                          <AccordionTrigger 
                            onClick={(e) => {
                              e.preventDefault();
                              toggleSection("basic-info");
                            }}
                            className="px-4 py-3 hover:no-underline"
                          >
                            <div className="flex items-center">
                              <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center mr-3",
                                isSectionComplete(watchedValues, "basic-info") 
                                  ? "bg-green-100" 
                                  : "bg-gray-100"
                              )}>
                                {getSectionIcon("basic-info") || <span>1</span>}
                              </div>
                              <span>Item Information</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-5 pt-2">
                            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                              {/* Basic Information Fields */}
                              <div className="sm:col-span-6">
                                <FormField
                                  control={form.control}
                                  name="name"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>
                                        Item Name
                                        <span className="text-red-500 ml-1">*</span>
                                      </FormLabel>
                                      <FormControl>
                                        <Input placeholder="e.g. iPhone 13 Pro, Passport, Gold Necklace" {...field} />
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
                                      <FormLabel>
                                        Category
                                        <span className="text-red-500 ml-1">*</span>
                                      </FormLabel>
                                      <Select 
                                        value={field.value} 
                                        onValueChange={(value) => {
                                          field.onChange(value);
                                          // Reset subcategory when category changes
                                          form.setValue("subCategory", "");
                                        }}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select a category" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {categories.map((category) => (
                                            <SelectItem key={category} value={category}>
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
                              
                              <div className="sm:col-span-3">
                                <FormField
                                  control={form.control}
                                  name="subCategory"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>
                                        Sub-Category
                                        <span className="ml-1 text-sm text-neutral-500">(Optional)</span>
                                      </FormLabel>
                                      <Select 
                                        value={field.value} 
                                        onValueChange={field.onChange}
                                        disabled={!form.getValues("category")}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select a sub-category" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {form.getValues("category") && (subCategories as any)[form.getValues("category")]?.map((subCategory: string) => (
                                              <SelectItem key={subCategory} value={subCategory}>
                                                {subCategory}
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
                                        <span className="text-red-500 ml-1">*</span>
                                        <span className="ml-1 text-sm text-neutral-500">
                                          (IMEI, Serial Number, Document ID, etc.)
                                        </span>
                                      </FormLabel>
                                      <FormControl>
                                        <div className="relative">
                                          <Input placeholder="Enter unique identifier" {...field} />
                                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <Fingerprint className="h-4 w-4 text-gray-400" />
                                          </div>
                                        </div>
                                      </FormControl>
                                      <FormMessage />
                                      <div className="mt-2">
                                        <SmartIDRecognizer 
                                           onIdentifierSelected={handleIdentifierDetected}
                                         />
                                      </div>
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
                                          placeholder="Describe your item with key details" 
                                          className="min-h-[100px]"
                                          {...field} 
                                          value={field.value || ''}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                        
                        {/* Media & Images Section */}
                        <AccordionItem
                          value="media"
                          className={cn(
                            "border rounded-lg overflow-hidden", 
                            isSectionComplete(watchedValues, "media") 
                              ? "border-green-200 bg-green-50" 
                              : "border-gray-200"
                          )}
                        >
                          <AccordionTrigger 
                            onClick={(e) => {
                              e.preventDefault();
                              toggleSection("media");
                            }}
                            className="px-4 py-3 hover:no-underline"
                          >
                            <div className="flex items-center">
                              <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center mr-3",
                                isSectionComplete(watchedValues, "media") 
                                  ? "bg-green-100" 
                                  : "bg-gray-100"
                              )}>
                                {getSectionIcon("media") || <span>2</span>}
                              </div>
                              <span>Media & Images</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-5 pt-2">
                            <div className="space-y-4">
                              <h4 className="text-sm font-medium">Upload Item Images</h4>
                              <p className="text-sm text-gray-500">
                                Add multiple photos of your item from different angles. Clear photos help with identification.
                              </p>
                              
                               <BatchImageUpload 
                                 onImagesChange={setItemImages}
                                 maxFiles={5}
                               />
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                        
                        {/* Ownership Verification Section */}
                        <AccordionItem
                          value="ownership"
                          className={cn(
                            "border rounded-lg overflow-hidden", 
                            isSectionComplete(watchedValues, "ownership") 
                              ? "border-green-200 bg-green-50" 
                              : "border-gray-200"
                          )}
                        >
                          <AccordionTrigger 
                            onClick={(e) => {
                              e.preventDefault();
                              toggleSection("ownership");
                            }}
                            className="px-4 py-3 hover:no-underline"
                          >
                            <div className="flex items-center">
                              <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center mr-3",
                                isSectionComplete(watchedValues, "ownership") 
                                  ? "bg-green-100" 
                                  : "bg-gray-100"
                              )}>
                                {getSectionIcon("ownership") || <span>3</span>}
                              </div>
                              <span>Ownership Verification</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-5 pt-2">
                            <div className="space-y-4">
                              <h4 className="text-sm font-medium">Ownership Documentation</h4>
                              <p className="text-sm text-gray-500">
                                Upload documents that prove your ownership, such as receipts, warranties, or certificates.
                              </p>
                              
                               <OwnershipChain 
                                 onDocumentsChange={setOwnershipDocuments}
                               />
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                        
                        {/* QR Code Generator Section */}
                        <AccordionItem
                          value="qrcode"
                          className="border rounded-lg overflow-hidden border-gray-200"
                        >
                          <AccordionTrigger 
                            onClick={(e) => {
                              e.preventDefault();
                              toggleSection("qrcode");
                            }}
                            className="px-4 py-3 hover:no-underline"
                          >
                            <div className="flex items-center">
                              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                                {getSectionIcon("qrcode") || <span>4</span>}
                              </div>
                              <span>QR Code Generator</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-5 pt-2">
                            <div className="space-y-4">
                              <h4 className="text-sm font-medium">Generate Item QR Code</h4>
                              <p className="text-sm text-gray-500">
                                After registration, a unique QR code will be generated for your item. 
                                This can be printed and attached to your item for easy identification.
                              </p>
                              
                               <QRCodeGenerator
                                 itemIdentifier={watchedValues.uniqueIdentifier || "PENDING"}
                                 itemName={watchedValues.name || "Your Item"}
                               />
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                        
                        {/* Registration Fee Section */}
                        <AccordionItem
                          value="payment"
                          className="border rounded-lg overflow-hidden border-gray-200"
                        >
                          <AccordionTrigger 
                            onClick={(e) => {
                              e.preventDefault();
                              toggleSection("payment");
                            }}
                            className="px-4 py-3 hover:no-underline"
                          >
                            <div className="flex items-center">
                              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                                <CreditCard className="h-4 w-4 text-gray-500" />
                              </div>
                              <span>Registration Fee</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-5 pt-2">
                            <div className="space-y-4">
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <h4 className="text-sm font-medium text-amber-800 flex items-center">
                                  <InfoIcon className="h-4 w-4 mr-2" />
                                  Registration Fee Information
                                </h4>
                                <p className="mt-2 text-sm text-amber-700">
                                  A registration fee of 2,000 RWF is required to complete the registration process.
                                  This fee helps us maintain the registry and provide secure identification services.
                                </p>
                                <div className="mt-4 bg-white rounded border border-amber-100 p-3">
                                  <div className="flex justify-between text-sm">
                                    <span className="font-medium">Registration Fee:</span>
                                    <span>2,000 RWF</span>
                                  </div>
                                  <div className="flex justify-between text-xs text-amber-700 mt-1">
                                    <span>Service Fee:</span>
                                    <span>Included</span>
                                  </div>
                                  <div className="flex justify-between font-medium text-sm mt-3 pt-2 border-t">
                                    <span>Total:</span>
                                    <span>2,000 RWF</span>
                                  </div>
                                </div>
                                <p className="mt-3 text-xs text-amber-700">
                                  You'll be redirected to our secure payment gateway after submitting this form.
                                </p>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>
                  </Card>
                </form>
              </Form>
            </div>
            
            {/* Preview & Sidebar Section */}
            <div className="md:col-span-1">
              <div className="space-y-6 sticky top-6">
                {/* Preview Card */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-medium mb-4">Item Preview</h3>
                    
                    <div className="space-y-4">
                      {/* Item Details */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Item</h4>
                        <p className="text-lg font-medium mt-1">
                          {watchedValues.name || "Item Name"}
                        </p>
                      </div>
                      
                      {/* Category */}
                      <div className="flex space-x-2">
                        {watchedValues.category && (
                          <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                            {watchedValues.category}
                          </div>
                        )}
                        {watchedValues.subCategory && (
                          <div className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                            {watchedValues.subCategory}
                          </div>
                        )}
                      </div>
                      
                      {/* Identifier */}
                      {watchedValues.uniqueIdentifier && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Identifier</h4>
                          <p className="font-mono text-sm bg-gray-100 p-2 rounded mt-1">
                            {watchedValues.uniqueIdentifier}
                          </p>
                        </div>
                      )}
                      
                      {/* Description */}
                      {watchedValues.description && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Description</h4>
                          <p className="text-sm text-gray-700 mt-1">
                            {watchedValues.description.length > 100
                              ? `${watchedValues.description.substring(0, 100)}...`
                              : watchedValues.description}
                          </p>
                        </div>
                      )}
                      
                      {/* Image Count */}
                      {itemImages.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Images</h4>
                          <div className="flex items-center mt-1 space-x-1">
                            <div className="bg-gray-100 text-gray-700 rounded-full px-2 py-0.5 text-xs">
                              {itemImages.length} image{itemImages.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Document Count */}
                      {ownershipDocuments.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Ownership Documents</h4>
                          <div className="flex items-center mt-1 space-x-1">
                            <div className="bg-gray-100 text-gray-700 rounded-full px-2 py-0.5 text-xs">
                              {ownershipDocuments.length} document{ownershipDocuments.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Progress Card */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-medium mb-2">Registration Progress</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Complete all required sections to register your item.
                    </p>
                    
                    <div className="space-y-4">
                      {/* Progress steps */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center mr-2",
                              isSectionComplete(watchedValues, "basic-info") 
                                ? "bg-green-100" 
                                : "bg-gray-100"
                            )}>
                              {isSectionComplete(watchedValues, "basic-info") 
                                ? <Check className="h-4 w-4 text-green-600" /> 
                                : <span className="text-xs">1</span>}
                            </div>
                            <span className="text-sm">Item Information</span>
                          </div>
                          {isSectionComplete(watchedValues, "basic-info") 
                            ? <span className="text-xs text-green-600">Completed</span>
                            : <span className="text-xs text-amber-600">In progress</span>}
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center mr-2",
                              isSectionComplete(watchedValues, "media") 
                                ? "bg-green-100" 
                                : "bg-gray-100"
                            )}>
                              {isSectionComplete(watchedValues, "media") 
                                ? <Check className="h-4 w-4 text-green-600" /> 
                                : <span className="text-xs">2</span>}
                            </div>
                            <span className="text-sm">Media & Images</span>
                          </div>
                          {isSectionComplete(watchedValues, "media") 
                            ? <span className="text-xs text-green-600">Completed</span>
                            : <span className="text-xs text-gray-500">Required</span>}
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center mr-2",
                              isSectionComplete(watchedValues, "ownership") 
                                ? "bg-green-100" 
                                : "bg-gray-100"
                            )}>
                              {isSectionComplete(watchedValues, "ownership") 
                                ? <Check className="h-4 w-4 text-green-600" /> 
                                : <span className="text-xs">3</span>}
                            </div>
                            <span className="text-sm">Ownership Verification</span>
                          </div>
                          {isSectionComplete(watchedValues, "ownership") 
                            ? <span className="text-xs text-green-600">Completed</span>
                            : <span className="text-xs text-gray-500">Required</span>}
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center mr-2">
                              <CreditCard className="h-4 w-4 text-gray-500" />
                            </div>
                            <span className="text-sm">Payment</span>
                          </div>
                          <span className="text-xs text-gray-500">After submission</span>
                        </div>
                      </div>
                      
                      {/* Overall progress */}
                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Overall Completion</span>
                          <span>{completion}%</span>
                        </div>
                        <Progress value={completion} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}