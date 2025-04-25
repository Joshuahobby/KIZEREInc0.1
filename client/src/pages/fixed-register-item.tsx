import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PaymentService } from "@/services/payment.service";
import { DEFAULT_CURRENCY } from "@/config/payment.config";
import { cn } from "@/lib/utils";
import { processFileUpload, ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from "@/utils/file-utils";
import { 
  Loader2, 
  Check, 
  CreditCard, 
  Save,
  Upload,
  Camera,
  Calendar,
  Info,
  X,
  Image as ImageIcon,
  Clipboard,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  Barcode,
  AlertCircle
} from "lucide-react";

// Item categories
const categories = [
  "Electronics",
  "Documents",
  "Jewelry",
  "Accessories",
  "Other"
];

// Form sections - Updated to remove details section as it's now combined with basic-info
const sections = [
  { id: "basic-info", name: "Item Information" },
  { id: "media", name: "Media & Documents" },
  { id: "ownership", name: "Ownership Proof" }
];

// Item sub-categories based on main category
const subCategories = {
  Electronics: [
    "Mobile Phone",
    "Laptop",
    "Tablet",
    "Camera",
    "Headphones",
    "Other Electronics",
  ],
  Documents: [
    "ID Card",
    "Passport",
    "Driver's License",
    "Certificate",
    "Other Documents",
  ],
  Jewelry: [
    "Ring",
    "Necklace",
    "Bracelet",
    "Watch",
    "Other Jewelry",
  ],
  Accessories: [
    "Bag",
    "Wallet",
    "Glasses",
    "Key",
    "Other Accessories",
  ],
  Other: [
    "Clothing",
    "Book",
    "Toy",
    "Tool",
    "Miscellaneous",
  ],
};

// Enhanced schema for the item registration form
const itemRegistrationSchema = z.object({
  // Basic Information
  name: z.string().min(3, "Item name must be at least 3 characters"),
  category: z.string().min(1, "Please select a category"),
  subCategory: z.string().optional(),
  uniqueIdentifier: z.string().min(1, "Unique identifier is required"),
  description: z.string().optional(),
  
  // Details for electronics
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  color: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchaseLocation: z.string().optional(),
  value: z.string().optional(),
  warranty: z.string().optional(),
  
  // Details for documents
  documentNumber: z.string().optional(),
  issueAuthority: z.string().optional(),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  
  // Details for jewelry
  material: z.string().optional(),
  weight: z.string().optional(),
  
  // Details for other items
  additionalDetails: z.string().optional(),
  
  // Media & Documents
  imageUrls: z.array(z.string()).default([]),
  receiptImage: z.string().optional(),
  warrantyDocument: z.string().optional(),
  
  // Ownership Proof
  ownershipProof: z.string().optional(),
  ownershipDocumentType: z.string().optional(),
  additionalNotes: z.string().optional(),
});

type ItemRegistrationValues = z.infer<typeof itemRegistrationSchema>;

// Section completion requirement logic
const isSectionComplete = (
  data: Partial<ItemRegistrationValues>,
  section: string
): boolean => {
  switch (section) {
    case "basic-info":
      // Basic info now combined with details
      const hasBasicInfo = Boolean(
        data.name && data.name.length >= 3 &&
        data.category &&
        data.uniqueIdentifier
      );
      
      // Category-specific detail fields check
      let hasDetails = false;
      if (data.category === "Electronics") {
        hasDetails = Boolean(data.brand || data.model || data.serialNumber);
      } else if (data.category === "Documents") {
        hasDetails = Boolean(data.documentNumber || data.issueAuthority);
      } else if (data.category === "Jewelry" || data.category === "Accessories") {
        hasDetails = Boolean(data.color || data.material || data.brand);
      } else if (data.category === "Other") {
        hasDetails = Boolean(data.additionalDetails);
      }
      
      return hasBasicInfo;
    case "media":
      // Consider media complete if at least one image is uploaded
      return (data.imageUrls && data.imageUrls.length > 0) || Boolean(data.receiptImage);
    case "ownership":
      // Consider ownership complete if proof type is selected
      return Boolean(data.ownershipDocumentType);
    default:
      return false;
  }
};

// Calculate form completion percentage
const calculateCompletion = (data: Partial<ItemRegistrationValues>): number => {
  let totalSections = 3; // Item info (combined basic+details), media, ownership
  let completedSections = 0;
  
  if (isSectionComplete(data, "basic-info")) completedSections++;
  if (isSectionComplete(data, "media")) completedSections++;
  if (isSectionComplete(data, "ownership")) completedSections++;
  
  return Math.round((completedSections / totalSections) * 100);
};

export default function FixedRegisterItem() {
  const { toast } = useToast();
  
  // State for UI interactions
  const [expandedSections, setExpandedSections] = useState<string[]>(["basic-info"]);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  const [autoSaving, setAutoSaving] = useState<boolean>(false);
  const [completion, setCompletion] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [paymentRef, setPaymentRef] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Create the form
  const form = useForm<ItemRegistrationValues>({
    resolver: zodResolver(itemRegistrationSchema),
    defaultValues: {
      // Basic Information
      name: "",
      category: "",
      subCategory: "",
      uniqueIdentifier: "",
      description: "",
      
      // Electronics details
      brand: "",
      model: "",
      serialNumber: "",
      color: "",
      purchaseDate: "",
      purchaseLocation: "",
      value: "",
      warranty: "",
      
      // Document details
      documentNumber: "",
      issueAuthority: "",
      issueDate: "",
      expiryDate: "",
      
      // Jewelry details
      material: "",
      weight: "",
      
      // Other items
      additionalDetails: "",
      
      // Media & Documents
      imageUrls: [],
      receiptImage: "",
      warrantyDocument: "",
      
      // Ownership Proof
      ownershipProof: "",
      ownershipDocumentType: "",
      additionalNotes: "",
    },
    mode: "onChange",
  });
  
  const [, setLocation] = useLocation();
  
  // Watch form values for completion calculation
  const watchedValues = form.watch();
  
  useEffect(() => {
    const newCompletion = calculateCompletion(watchedValues);
    setCompletion(newCompletion);
  }, [watchedValues]);
  
  // Auto-save functionality
  useEffect(() => {
    // Clear previous timer
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
    
    // Set new timer for auto-save
    const timer = setTimeout(() => {
      if (form.formState.isDirty) {
        setAutoSaving(true);
        // Simulate saving to local storage
        localStorage.setItem('itemDraft', JSON.stringify(watchedValues));
        
        setTimeout(() => {
          setAutoSaving(false);
        }, 1000);
      }
    }, 3000);
    
    setAutoSaveTimer(timer);
    
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [watchedValues, form.formState.isDirty]);
  
  // Handle accordion toggle
  const toggleSection = (value: string) => {
    setExpandedSections(prev => {
      if (prev.includes(value)) {
        return prev.filter(v => v !== value);
      } else {
        return [...prev, value];
      }
    });
  };
  
  // Refs for file inputs
  const itemImageInputRef = useRef<HTMLInputElement>(null);
  const receiptImageInputRef = useRef<HTMLInputElement>(null);
  const warrantyDocInputRef = useRef<HTMLInputElement>(null);
  const ownershipDocInputRef = useRef<HTMLInputElement>(null);
  
  // State for file upload errors
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  
  // Handle file drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  // Handle file drop
  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setUploadError(null);
    
    // Process files
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setUploading(true);
      
      try {
        const files = Array.from(e.dataTransfer.files);
        
        // Process each file (maximum 5 files)
        const filesToProcess = files.slice(0, 5);
        
        for (const file of filesToProcess) {
          const result = await processFileUpload(file);
          
          if (result.success && result.data) {
            // Update form with the new image
            const currentImages = form.getValues("imageUrls") || [];
            form.setValue("imageUrls", [...currentImages, result.data.url]);
            
            // Set preview image to the most recent upload
            setPreviewImage(result.data.url);
          } else if (result.error) {
            setUploadError(result.error.message);
            break;
          }
        }
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : "Failed to upload files");
      } finally {
        setUploading(false);
      }
    }
  };
  
  // Handle file input change with type safety
  const handleFileInputChange = (fieldName: string) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    
    if (e.target.files && e.target.files.length > 0) {
      setUploading(true);
      
      try {
        const file = e.target.files[0];
        const result = await processFileUpload(file);
        
        if (result.success && result.data) {
          // Special handling based on field name
          if (fieldName === 'itemImages') {
            const currentImages = form.getValues("imageUrls") || [];
            form.setValue("imageUrls", [...currentImages, result.data.url]);
            setPreviewImage(result.data.url);
          } else if (fieldName === 'receiptImage') {
            form.setValue("receiptImage", result.data.url);
          } else if (fieldName === 'warrantyDocument') {
            form.setValue("warrantyDocument", result.data.url);
          } else if (fieldName === 'ownershipProof') {
            form.setValue("ownershipProof", result.data.url);
          }
          
          // Reset the file input so the same file can be selected again if needed
          e.target.value = '';
          
          toast({
            title: "File uploaded",
            description: "Your file has been uploaded successfully",
          });
        } else if (result.error) {
          setUploadError(result.error.message);
        }
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : "Failed to upload file");
      } finally {
        setUploading(false);
      }
    }
  };
  
  // Trigger file input click
  const triggerFileInput = (ref: React.RefObject<HTMLInputElement>) => {
    if (ref.current) {
      ref.current.click();
    }
  };
  
  // Get field visibility based on category
  const shouldShowField = (category: string, fieldName: string): boolean => {
    // No category selected yet, show nothing
    if (!category) return false;
    
    // Fields shown for all categories
    const commonFields = ["uniqueIdentifier", "description"];
    if (commonFields.includes(fieldName)) return true;
    
    // Category-specific fields
    switch (category) {
      case "Electronics":
        return ["brand", "model", "serialNumber", "color", "purchaseDate", "warranty", "value"].includes(fieldName);
      case "Documents":
        return ["issueDate", "expiryDate", "documentNumber", "issueAuthority"].includes(fieldName);
      case "Jewelry":
        return ["material", "weight", "color", "purchaseDate", "value"].includes(fieldName);
      case "Accessories":
        return ["brand", "color", "purchaseDate", "value"].includes(fieldName);
      case "Other":
        return ["color", "purchaseDate", "value", "additionalDetails"].includes(fieldName);
      default:
        return false;
    }
  };
  
  // Get completion status icon for section
  const getSectionIcon = (section: string) => {
    const isComplete = isSectionComplete(watchedValues, section);
    
    if (isComplete) {
      return <Check className="h-5 w-5 text-green-500" />;
    }
    
    return null;
  };
  
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
          // Common fields
          subCategory: data.subCategory,
          additionalNotes: data.additionalNotes,
          
          // Handle fields based on category
          ...(data.category === "Electronics" && {
            brand: data.brand,
            model: data.model,
            serialNumber: data.serialNumber,
            color: data.color,
            purchaseDate: data.purchaseDate,
            purchaseLocation: data.purchaseLocation,
            value: data.value,
            warranty: data.warranty,
          }),
          
          ...(data.category === "Documents" && {
            documentNumber: data.documentNumber,
            issueAuthority: data.issueAuthority,
            issueDate: data.issueDate,
            expiryDate: data.expiryDate,
          }),
          
          ...(data.category === "Jewelry" && {
            material: data.material,
            weight: data.weight,
            color: data.color,
            purchaseDate: data.purchaseDate,
            value: data.value,
          }),
          
          ...(data.category === "Accessories" && {
            brand: data.brand,
            color: data.color,
            purchaseDate: data.purchaseDate,
            value: data.value,
          }),
          
          ...(data.category === "Other" && {
            color: data.color,
            purchaseDate: data.purchaseDate,
            value: data.value,
            additionalDetails: data.additionalDetails,
          }),
          
          // Ownership information
          ownershipDocumentType: data.ownershipDocumentType,
          ownershipProof: data.ownershipProof,
        },
        imageUrls: data.imageUrls || [],
      };
      
      const res = await apiRequest("POST", "/api/items", itemData);
      return await res.json();
    },
    onSuccess: async (item) => {
      // Invalidate and refetch items query to update the list
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      
      toast({
        title: "Item registered successfully",
        description: "Item saved. Proceeding to payment...",
      });
      
      // Initiate payment process for registration fee
      try {
        setPaymentStatus("pending");
        
        // Initialize payment for this item registration
        const payment = await PaymentService.initializePayment({
          type: "registration", // The amount will be taken from central payment config
          itemId: item.id
        });
        
        setPaymentRef(payment.transactionRef);
        setPaymentStatus("success");
        
        // Redirect to payment page
        window.location.href = payment.redirectUrl;
      } catch (error) {
        console.error("Payment initiation failed:", error);
        setPaymentStatus("error");
        
        toast({
          title: "Payment error",
          description: "Failed to initiate payment. Please try again.",
          variant: "destructive",
        });
      }
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
                        {/* Item Information Section (Combined Basic & Details) */}
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
                                          {form.getValues("category") && 
                                            subCategories[form.getValues("category") as keyof typeof subCategories]?.map((subCategory) => (
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
                                            <Barcode className="h-4 w-4 text-neutral-400" />
                                          </div>
                                        </div>
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
                                          placeholder="Describe your item with key details"
                                          className="resize-none h-24"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              
                              {/* Electronic device fields */}
                              {form.getValues("category") === "Electronics" && (
                                <>
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
                                            <Input placeholder="e.g. Samsung, Apple, Sony" {...field} />
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
                                            <Input placeholder="e.g. Galaxy S22, MacBook Pro, WH-1000XM4" {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                  
                                  <div className="sm:col-span-3">
                                    <FormField
                                      control={form.control}
                                      name="serialNumber"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>
                                            Serial Number
                                            <span className="ml-1 text-sm text-neutral-500">(Optional)</span>
                                          </FormLabel>
                                          <FormControl>
                                            <Input placeholder="Device serial number" {...field} />
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
                                            <Input placeholder="e.g. Space Gray, Midnight Blue" {...field} />
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
                                      name="value"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>
                                            Estimated Value
                                            <span className="ml-1 text-sm text-neutral-500">(Optional)</span>
                                          </FormLabel>
                                          <FormControl>
                                            <Input placeholder="e.g. 50000 RWF" {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                </>
                              )}
                              
                              {/* Document fields */}
                              {form.getValues("category") === "Documents" && (
                                <>
                                  <div className="sm:col-span-3">
                                    <FormField
                                      control={form.control}
                                      name="documentNumber"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>
                                            Document Number
                                            <span className="ml-1 text-sm text-neutral-500">(Optional)</span>
                                          </FormLabel>
                                          <FormControl>
                                            <Input placeholder="Document identification number" {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                  
                                  <div className="sm:col-span-3">
                                    <FormField
                                      control={form.control}
                                      name="issueAuthority"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>
                                            Issuing Authority
                                            <span className="ml-1 text-sm text-neutral-500">(Optional)</span>
                                          </FormLabel>
                                          <FormControl>
                                            <Input placeholder="e.g. Ministry of Interior, University" {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                  
                                  <div className="sm:col-span-3">
                                    <FormField
                                      control={form.control}
                                      name="issueDate"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>
                                            Issue Date
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
                                      name="expiryDate"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>
                                            Expiry Date
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
                                </>
                              )}
                              
                              {/* Jewelry fields */}
                              {form.getValues("category") === "Jewelry" && (
                                <>
                                  <div className="sm:col-span-3">
                                    <FormField
                                      control={form.control}
                                      name="material"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>
                                            Material
                                            <span className="ml-1 text-sm text-neutral-500">(Optional)</span>
                                          </FormLabel>
                                          <FormControl>
                                            <Input placeholder="e.g. Gold, Silver, Platinum" {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                  
                                  <div className="sm:col-span-3">
                                    <FormField
                                      control={form.control}
                                      name="weight"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>
                                            Weight
                                            <span className="ml-1 text-sm text-neutral-500">(Optional)</span>
                                          </FormLabel>
                                          <FormControl>
                                            <Input placeholder="e.g. 10g, 2 carats" {...field} />
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
                                            <Input placeholder="e.g. Yellow Gold, Rose Gold" {...field} />
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
                                            <Input placeholder="e.g. 100000 RWF" {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                </>
                              )}
                              
                              {/* Accessories fields */}
                              {form.getValues("category") === "Accessories" && (
                                <>
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
                                            <Input placeholder="e.g. Louis Vuitton, Ray-Ban" {...field} />
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
                                            <Input placeholder="e.g. Black, Brown, Blue" {...field} />
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
                                            <Input placeholder="e.g. 25000 RWF" {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                </>
                              )}
                              
                              {/* Other items fields */}
                              {form.getValues("category") === "Other" && (
                                <>
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
                                            <Input placeholder="e.g. Red, Green, Blue" {...field} />
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
                                            <Input placeholder="e.g. 15000 RWF" {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                  
                                  <div className="sm:col-span-6">
                                    <FormField
                                      control={form.control}
                                      name="additionalDetails"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>
                                            Additional Details
                                            <span className="ml-1 text-sm text-neutral-500">(Optional)</span>
                                          </FormLabel>
                                          <FormControl>
                                            <Textarea
                                              placeholder="Add any other details that might help identify your item"
                                              className="resize-none h-24"
                                              {...field}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                </>
                              )}
                              
                              {/* If no category selected, show message */}
                              {!form.getValues("category") && (
                                <div className="sm:col-span-6 flex justify-center items-center py-8">
                                  <div className="text-center">
                                    <Info className="h-6 w-6 text-neutral-400 mx-auto mb-2" />
                                    <p className="text-neutral-500">Please select a category first</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                        
                        {/* Media & Documents Section */}
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
                              <span>Media & Documents</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-5 pt-2">
                            <div className="space-y-6">
                              {/* Item Images */}
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <h4 className="text-sm font-medium text-neutral-900">Item Images</h4>
                                  <span className="text-xs text-neutral-500">
                                    {watchedValues.imageUrls?.length || 0}/5 images
                                  </span>
                                </div>
                                
                                <div 
                                  className={cn(
                                    "border-2 border-dashed rounded-lg p-6 transition-colors",
                                    isDragging ? "border-primary-300 bg-primary-50" : "border-gray-300",
                                    uploadError ? "border-red-300" : ""
                                  )}
                                  onDragOver={handleDragOver}
                                  onDragLeave={handleDragLeave}
                                  onDrop={handleFileDrop}
                                >
                                  <div className="text-center">
                                    <Camera className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
                                    <h3 className="text-sm font-medium text-neutral-900 mb-1">
                                      {isDragging ? "Drop images here" : "Upload Item Images"}
                                    </h3>
                                    <p className="text-xs text-neutral-500 mb-3">
                                      Drag and drop your images here or click to browse
                                    </p>
                                    
                                    {uploadError && (
                                      <Alert variant="destructive" className="mb-3">
                                        <AlertCircle className="h-4 w-4 mr-2" />
                                        <AlertDescription className="text-xs">
                                          {uploadError}
                                        </AlertDescription>
                                      </Alert>
                                    )}
                                    
                                    <div className="mt-2">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => triggerFileInput(itemImageInputRef)}
                                        disabled={uploading || ((watchedValues.imageUrls?.length || 0) >= 5)}
                                      >
                                        {uploading ? (
                                          <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Uploading...
                                          </>
                                        ) : (
                                          <>
                                            <Upload className="h-4 w-4 mr-2" />
                                            Select Image
                                          </>
                                        )}
                                      </Button>
                                      <input
                                        type="file"
                                        ref={itemImageInputRef}
                                        accept={ALLOWED_IMAGE_TYPES.join(",")}
                                        className="hidden"
                                        onChange={handleFileInputChange("itemImages")}
                                        disabled={uploading || ((watchedValues.imageUrls?.length || 0) >= 5)}
                                      />
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Image Gallery */}
                                {watchedValues.imageUrls && watchedValues.imageUrls.length > 0 && (
                                  <div className="grid grid-cols-3 gap-3 mt-4">
                                    {watchedValues.imageUrls.map((url, index) => (
                                      <div 
                                        key={index} 
                                        className="relative aspect-square rounded-md overflow-hidden border"
                                      >
                                        <img 
                                          src={url} 
                                          alt={`Item image ${index + 1}`} 
                                          className="w-full h-full object-cover"
                                        />
                                        <button
                                          type="button"
                                          className="absolute top-1 right-1 bg-neutral-800 bg-opacity-60 rounded-full p-1"
                                          onClick={() => {
                                            const newImages = [...watchedValues.imageUrls || []];
                                            newImages.splice(index, 1);
                                            form.setValue("imageUrls", newImages);
                                          }}
                                        >
                                          <X className="h-3 w-3 text-white" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              
                              {/* Receipt Image */}
                              <div className="space-y-3">
                                <h4 className="text-sm font-medium text-neutral-900">Receipt (Optional)</h4>
                                <div className="flex items-center">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => triggerFileInput(receiptImageInputRef)}
                                    disabled={uploading}
                                    className="mr-3"
                                  >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload Receipt
                                  </Button>
                                  <input
                                    type="file"
                                    ref={receiptImageInputRef}
                                    accept={ALLOWED_IMAGE_TYPES.join(",")}
                                    className="hidden"
                                    onChange={handleFileInputChange("receiptImage")}
                                    disabled={uploading}
                                  />
                                  
                                  {watchedValues.receiptImage && (
                                    <span className="text-xs text-green-600 flex items-center">
                                      <Check className="h-3 w-3 mr-1" />
                                      Receipt uploaded
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              {/* Warranty Document */}
                              {form.getValues("category") === "Electronics" && (
                                <div className="space-y-3">
                                  <h4 className="text-sm font-medium text-neutral-900">Warranty (Optional)</h4>
                                  <div className="flex items-center">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => triggerFileInput(warrantyDocInputRef)}
                                      disabled={uploading}
                                      className="mr-3"
                                    >
                                      <Upload className="h-4 w-4 mr-2" />
                                      Upload Warranty
                                    </Button>
                                    <input
                                      type="file"
                                      ref={warrantyDocInputRef}
                                      accept={ALLOWED_IMAGE_TYPES.join(",")}
                                      className="hidden"
                                      onChange={handleFileInputChange("warrantyDocument")}
                                      disabled={uploading}
                                    />
                                    
                                    {watchedValues.warrantyDocument && (
                                      <span className="text-xs text-green-600 flex items-center">
                                        <Check className="h-3 w-3 mr-1" />
                                        Warranty uploaded
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                        
                        {/* Ownership Proof Section */}
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
                              <span>Ownership Proof</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-5 pt-2">
                            <div className="space-y-6">
                              <div className="sm:col-span-6">
                                <FormField
                                  control={form.control}
                                  name="ownershipDocumentType"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>
                                        Proof of Ownership Type
                                        <span className="text-red-500 ml-1">*</span>
                                      </FormLabel>
                                      <Select 
                                        value={field.value || ""} 
                                        onValueChange={field.onChange}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select document type" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="purchase_receipt">Purchase Receipt</SelectItem>
                                          <SelectItem value="warranty_card">Warranty Card</SelectItem>
                                          <SelectItem value="bank_statement">Bank Statement</SelectItem>
                                          <SelectItem value="ownership_certificate">Ownership Certificate</SelectItem>
                                          <SelectItem value="other">Other Document</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              
                              <div className="space-y-3">
                                <h4 className="text-sm font-medium text-neutral-900">Upload Proof Document</h4>
                                <div className="flex items-center">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => triggerFileInput(ownershipDocInputRef)}
                                    disabled={uploading || !watchedValues.ownershipDocumentType}
                                    className="mr-3"
                                  >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload Document
                                  </Button>
                                  <input
                                    type="file"
                                    ref={ownershipDocInputRef}
                                    accept={ALLOWED_IMAGE_TYPES.join(",")}
                                    className="hidden"
                                    onChange={handleFileInputChange("ownershipProof")}
                                    disabled={uploading || !watchedValues.ownershipDocumentType}
                                  />
                                  
                                  {!watchedValues.ownershipDocumentType && (
                                    <span className="text-xs text-neutral-500">
                                      Please select document type first
                                    </span>
                                  )}
                                  
                                  {watchedValues.ownershipProof && (
                                    <span className="text-xs text-green-600 flex items-center">
                                      <Check className="h-3 w-3 mr-1" />
                                      Document uploaded
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="sm:col-span-6">
                                <FormField
                                  control={form.control}
                                  name="additionalNotes"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>
                                        Additional Notes
                                        <span className="ml-1 text-sm text-neutral-500">(Optional)</span>
                                      </FormLabel>
                                      <FormControl>
                                        <Textarea
                                          placeholder="Add any relevant notes about ownership"
                                          className="resize-none h-24"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              
                              {/* Payment information block in the ownership section */}
                              <div className="bg-primary-50 p-4 rounded-md">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center">
                                    <div className="bg-primary-50 p-2 rounded-full">
                                      <CreditCard className="h-5 w-5 text-primary-600" />
                                    </div>
                                    <div className="ml-3">
                                      <h5 className="text-sm font-medium text-neutral-900">Item Registration Fee</h5>
                                      <p className="text-xs text-neutral-500">A one-time fee to protect your item</p>
                                    </div>
                                  </div>
                                  <div>
                                    <span className="font-semibold text-lg">2,000 RWF</span>
                                  </div>
                                </div>
                                <p className="mt-3 text-xs text-neutral-500">
                                  When you click "Register Now," you'll be redirected to our secure payment provider.
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
              
              {/* Auto-save indicator */}
              <div className="flex items-center justify-end mt-2">
                {autoSaving ? (
                  <div className="flex items-center text-xs text-neutral-500">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Saving draft...
                  </div>
                ) : (
                  <div className="flex items-center text-xs text-neutral-500">
                    <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                    Draft saved
                  </div>
                )}
              </div>
            </div>
            
            {/* Preview & Progress Section */}
            <div className="md:col-span-1">
              <div className="sticky top-8 space-y-8">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-medium text-sm text-neutral-900 mb-4">Form Progress</h3>
                    <div className="space-y-3">
                      <Card>
                        <CardContent className="p-3">
                          <div className="flex justify-between items-center">
                            <h4 className="text-sm font-medium">Item Information</h4>
                            {isSectionComplete(watchedValues, "basic-info") ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                <Check className="h-3 w-3 mr-1" />
                                Complete
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                Incomplete
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Details removed - merged with Item Information */}
                      
                      <Card>
                        <CardContent className="p-3">
                          <div className="flex justify-between items-center">
                            <h4 className="text-sm font-medium">Media & Documents</h4>
                            {isSectionComplete(watchedValues, "media") ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                <Check className="h-3 w-3 mr-1" />
                                Complete
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                Incomplete
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-3">
                          <div className="flex justify-between items-center">
                            <h4 className="text-sm font-medium">Ownership Proof</h4>
                            {isSectionComplete(watchedValues, "ownership") ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                <Check className="h-3 w-3 mr-1" />
                                Complete
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                Incomplete
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-medium text-sm text-neutral-900 mb-4">Item Preview</h3>
                    {previewImage ? (
                      <div className="aspect-square rounded-md overflow-hidden border mb-4">
                        <img 
                          src={previewImage} 
                          alt="Item preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square rounded-md overflow-hidden border mb-4 flex items-center justify-center bg-gray-50">
                        <ImageIcon className="h-10 w-10 text-neutral-300" />
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-xs font-medium text-neutral-500">Item Name</h4>
                        <p className="text-sm font-medium text-neutral-900">
                          {watchedValues.name || "Not specified yet"}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-medium text-neutral-500">Category</h4>
                        <p className="text-sm font-medium text-neutral-900">
                          {watchedValues.category 
                            ? `${watchedValues.category}${watchedValues.subCategory ? ` - ${watchedValues.subCategory}` : ''}`
                            : "Not specified yet"
                          }
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-medium text-neutral-500">Unique ID</h4>
                        <p className="text-sm font-medium text-neutral-900">
                          {watchedValues.uniqueIdentifier || "Not specified yet"}
                        </p>
                      </div>
                      
                      {watchedValues.description && (
                        <div>
                          <h4 className="text-xs font-medium text-neutral-500">Description</h4>
                          <p className="text-sm text-neutral-700 line-clamp-3">
                            {watchedValues.description}
                          </p>
                        </div>
                      )}
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