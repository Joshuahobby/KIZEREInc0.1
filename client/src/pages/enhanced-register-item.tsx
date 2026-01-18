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

// Form sections
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

export default function EnhancedRegisterItem() {
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
      
      const item = await apiRequest<any>("/api/items", { method: "POST", data: itemData });
      return item;
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
        
        // Store payment reference for later verification
        setPaymentRef(payment.transactionRef);
        
        // Redirect to Flutterwave payment page
        window.location.href = payment.paymentUrl;
      } catch (error) {
        setPaymentStatus("error");
        
        toast({
          title: "Payment initiation failed",
          description: error instanceof Error ? error.message : "Failed to initiate payment. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Failed to register item. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Payment verification mutation
  const verifyPaymentMutation = useMutation({
    mutationFn: async (transactionRef: string) => {
      return await PaymentService.verifyPayment(transactionRef);
    },
    onSuccess: (data) => {
      setPaymentStatus("success");
      
      toast({
        title: "Payment verified",
        description: "Your payment has been verified successfully.",
      });
      
      // Reset form and redirect to dashboard
      form.reset();
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      setPaymentStatus("error");
      
      toast({
        title: "Payment verification failed",
        description: error.message || "Failed to verify payment. Please contact support.",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (data: ItemRegistrationValues) => {
    // Remove draft from local storage
    localStorage.removeItem('itemDraft');
    // Submit the form
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
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-10">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between">
              <div className="flex items-center space-x-4 w-full sm:w-1/2 mb-3 sm:mb-0">
                <div className="w-full">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium text-neutral-700">Completion</span>
                    <span className="text-xs font-medium text-neutral-700">{completion}%</span>
                  </div>
                  <Progress value={completion} className="h-2" />
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // Save draft logic would go here
                    localStorage.setItem('itemDraft', JSON.stringify(form.getValues()));
                    toast({
                      title: "Draft saved",
                      description: "Your registration form has been saved as a draft.",
                    });
                  }}
                  disabled={registerMutation.isPending}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Draft
                </Button>
                
                <Button
                  type="button"
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={
                    registerMutation.isPending ||
                    paymentStatus === "pending" ||
                    completion < 75 // Allow submission at 75% completion
                  }
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Register Now
                      {registerMutation.isPending ? null : (
                        <CreditCard className="ml-2 h-4 w-4" />
                      )}
                    </>
                  )}
                </Button>
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
                                      <FormLabel className="flex items-center">
                                        Item Name
                                        <span className="text-red-500 ml-1">*</span>
                                      </FormLabel>
                                      <FormControl>
                                        <Input placeholder="e.g. National ID Card, Samsung Galaxy S21" {...field} />
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
                                      <FormLabel className="flex items-center">
                                        Category
                                        <span className="text-red-500 ml-1">*</span>
                                      </FormLabel>
                                      <Select
                                        onValueChange={(value) => {
                                          field.onChange(value);
                                          // Reset subcategory when category changes
                                          form.setValue("subCategory", "");
                                          
                                          // Reset category-specific fields
                                          form.resetField("brand");
                                          form.resetField("model");
                                          form.resetField("serialNumber");
                                          form.resetField("color");
                                          form.resetField("documentNumber");
                                          form.resetField("issueAuthority");
                                          form.resetField("issueDate");
                                          form.resetField("expiryDate");
                                          form.resetField("material");
                                          form.resetField("weight");
                                          form.resetField("additionalDetails");
                                        }}
                                        defaultValue={field.value}
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
                                      </FormLabel>
                                      <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
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
                                      <FormLabel className="flex items-center">
                                        Unique Identifier
                                        <span className="text-red-500 ml-1">*</span>
                                        <div className="relative ml-2 group">
                                          <Info className="h-4 w-4 text-neutral-400" />
                                          <div className="absolute left-0 bottom-6 hidden group-hover:block bg-white p-2 rounded shadow-lg w-60 text-xs z-10">
                                            For Electronics: IMEI, Serial Number<br />
                                            For Documents: Document Number, ID Number<br />
                                            For Jewelry: Hallmark, Serial Number<br />
                                            For Other Items: Any unique identifier
                                          </div>
                                        </div>
                                      </FormLabel>
                                      <div className="flex">
                                        <FormControl>
                                          <Input 
                                            className="rounded-r-none" 
                                            placeholder="e.g. IMEI, Serial Number, Document ID" 
                                            {...field} 
                                          />
                                        </FormControl>
                                        <Button 
                                          type="button" 
                                          variant="outline"
                                          className="rounded-l-none border-l-0"
                                        >
                                          <Barcode className="h-4 w-4" />
                                        </Button>
                                      </div>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              
                              {/* Category-specific detail fields */}
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
                                            <Input placeholder="e.g. Galaxy S21, iPhone 13" {...field} />
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
                                            <Input placeholder="e.g. SN1234567890" {...field} />
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
                                          <div className="flex">
                                            <FormControl>
                                              <Input 
                                                type="date" 
                                                className="rounded-r-none"
                                                {...field} 
                                              />
                                            </FormControl>
                                            <Button 
                                              type="button" 
                                              variant="outline"
                                              className="rounded-l-none border-l-0"
                                            >
                                              <Calendar className="h-4 w-4" />
                                            </Button>
                                          </div>
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
                                            <Input placeholder="e.g. 50,000 RWF" {...field} />
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
                                            <Input placeholder="e.g. ID1234567890" {...field} />
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
                                            <Input placeholder="e.g. Government of Rwanda" {...field} />
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
                                          <div className="flex">
                                            <FormControl>
                                              <Input 
                                                type="date" 
                                                className="rounded-r-none"
                                                {...field} 
                                              />
                                            </FormControl>
                                            <Button 
                                              type="button" 
                                              variant="outline"
                                              className="rounded-l-none border-l-0"
                                            >
                                              <Calendar className="h-4 w-4" />
                                            </Button>
                                          </div>
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
                                          <div className="flex">
                                            <FormControl>
                                              <Input 
                                                type="date" 
                                                className="rounded-r-none"
                                                {...field} 
                                              />
                                            </FormControl>
                                            <Button 
                                              type="button" 
                                              variant="outline"
                                              className="rounded-l-none border-l-0"
                                            >
                                              <Calendar className="h-4 w-4" />
                                            </Button>
                                          </div>
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
                                            <Input placeholder="e.g. 5 grams" {...field} />
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
                                            <Input placeholder="e.g. 50,000 RWF" {...field} />
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
                                            <Input placeholder="e.g. Nike, Gucci, Ray-Ban" {...field} />
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
                                            <Input placeholder="e.g. Black, Brown, Red" {...field} />
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
                                            <Input placeholder="e.g. 15,000 RWF" {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                </>
                              )}
                              
                              {/* Other fields */}
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
                                            <Input placeholder="e.g. Red, Blue, Green" {...field} />
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
                                            <Input placeholder="e.g. 10,000 RWF" {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                </>
                              )}
                              
                              {/* Show description field for all categories */}
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
                                            <Input placeholder="e.g. Galaxy S21, iPhone 13" {...field} />
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
                                            <Input placeholder="e.g. SN1234567890" {...field} />
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
                                          <div className="flex">
                                            <FormControl>
                                              <Input 
                                                type="date" 
                                                className="rounded-r-none"
                                                {...field} 
                                              />
                                            </FormControl>
                                            <Button 
                                              type="button" 
                                              variant="outline"
                                              className="rounded-l-none border-l-0"
                                            >
                                              <Calendar className="h-4 w-4" />
                                            </Button>
                                          </div>
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
                                            <Input placeholder="e.g. Kigali Mall, Amazon" {...field} />
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
                                            <Input placeholder="e.g. 50,000 RWF" {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                  
                                  <div className="sm:col-span-3">
                                    <FormField
                                      control={form.control}
                                      name="warranty"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>
                                            Warranty Information
                                            <span className="ml-1 text-sm text-neutral-500">(Optional)</span>
                                          </FormLabel>
                                          <FormControl>
                                            <Input placeholder="e.g. 2 years, expires Dec 2023" {...field} />
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
                                            <Input placeholder="e.g. ID1234567890" {...field} />
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
                                            <Input placeholder="e.g. Government of Rwanda" {...field} />
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
                                          <div className="flex">
                                            <FormControl>
                                              <Input 
                                                type="date" 
                                                className="rounded-r-none"
                                                {...field} 
                                              />
                                            </FormControl>
                                            <Button 
                                              type="button" 
                                              variant="outline"
                                              className="rounded-l-none border-l-0"
                                            >
                                              <Calendar className="h-4 w-4" />
                                            </Button>
                                          </div>
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
                                          <div className="flex">
                                            <FormControl>
                                              <Input 
                                                type="date" 
                                                className="rounded-r-none"
                                                {...field} 
                                              />
                                            </FormControl>
                                            <Button 
                                              type="button" 
                                              variant="outline"
                                              className="rounded-l-none border-l-0"
                                            >
                                              <Calendar className="h-4 w-4" />
                                            </Button>
                                          </div>
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
                                            <Input placeholder="e.g. 5 grams" {...field} />
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
                                      name="purchaseDate"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>
                                            Purchase Date
                                            <span className="ml-1 text-sm text-neutral-500">(Optional)</span>
                                          </FormLabel>
                                          <div className="flex">
                                            <FormControl>
                                              <Input 
                                                type="date" 
                                                className="rounded-r-none"
                                                {...field} 
                                              />
                                            </FormControl>
                                            <Button 
                                              type="button" 
                                              variant="outline"
                                              className="rounded-l-none border-l-0"
                                            >
                                              <Calendar className="h-4 w-4" />
                                            </Button>
                                          </div>
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
                                            <Input placeholder="e.g. 50,000 RWF" {...field} />
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
                                            <Input placeholder="e.g. Nike, Gucci, Ray-Ban" {...field} />
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
                                            <Input placeholder="e.g. Black, Brown, Red" {...field} />
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
                                          <div className="flex">
                                            <FormControl>
                                              <Input 
                                                type="date" 
                                                className="rounded-r-none"
                                                {...field} 
                                              />
                                            </FormControl>
                                            <Button 
                                              type="button" 
                                              variant="outline"
                                              className="rounded-l-none border-l-0"
                                            >
                                              <Calendar className="h-4 w-4" />
                                            </Button>
                                          </div>
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
                                            <Input placeholder="e.g. 15,000 RWF" {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                </>
                              )}
                              
                              {/* Other fields */}
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
                                            <Input placeholder="e.g. Red, Blue, Green" {...field} />
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
                                            Purchase/Acquisition Date
                                            <span className="ml-1 text-sm text-neutral-500">(Optional)</span>
                                          </FormLabel>
                                          <div className="flex">
                                            <FormControl>
                                              <Input 
                                                type="date" 
                                                className="rounded-r-none"
                                                {...field} 
                                              />
                                            </FormControl>
                                            <Button 
                                              type="button" 
                                              variant="outline"
                                              className="rounded-l-none border-l-0"
                                            >
                                              <Calendar className="h-4 w-4" />
                                            </Button>
                                          </div>
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
                                            <Input placeholder="e.g. 10,000 RWF" {...field} />
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
                                              placeholder="Any other important details about this item"
                                              className="h-20"
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
                                    <p className="text-neutral-500">Please select a category in the Basic Information section first</p>
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
                                {getSectionIcon("media") || <span>3</span>}
                              </div>
                              <span>Media & Documents</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-5 pt-2">
                            <div className="space-y-6">
                              <div>
                                <h4 className="text-sm font-medium mb-2">Item Images</h4>
                                <div 
                                  className={cn(
                                    "border-2 border-dashed rounded-md p-6",
                                    isDragging ? "border-primary-500 bg-primary-50" : uploading ? "border-primary-300 bg-primary-50" : "border-gray-300",
                                    "transition-colors duration-200"
                                  )}
                                  onDragOver={handleDragOver}
                                  onDragLeave={handleDragLeave}
                                  onDrop={handleFileDrop}
                                >
                                  <div className="flex flex-col items-center justify-center">
                                    {uploading ? (
                                      <>
                                        <Loader2 className="h-12 w-12 text-primary-500 animate-spin" />
                                        <p className="mt-2 text-sm text-neutral-600">
                                          Uploading image...
                                        </p>
                                      </>
                                    ) : (
                                      <>
                                        <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                                        <p className="mt-1 text-sm text-neutral-500">
                                          Drag and drop image files here, or click to select files
                                        </p>
                                        <p className="text-xs text-neutral-400">
                                          PNG, JPG, JPEG up to 5MB
                                        </p>
                                        <input
                                          ref={itemImageInputRef}
                                          type="file"
                                          accept="image/png,image/jpeg,image/jpg,image/gif"
                                          className="hidden"
                                          onChange={handleFileInputChange('itemImages')}
                                        />
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="mt-4 cursor-pointer"
                                          onClick={() => triggerFileInput(itemImageInputRef)}
                                          disabled={uploading}
                                        >
                                          <Upload className="mr-2 h-4 w-4" />
                                          Upload Images
                                        </Button>
                                        
                                        <div className="mt-4 flex items-center space-x-2">
                                          <span className="text-xs text-neutral-500">or</span>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-primary-600"
                                            onClick={() => triggerFileInput(itemImageInputRef)}
                                            disabled={uploading}
                                          >
                                            <Camera className="mr-2 h-4 w-4" />
                                            Take Photo
                                          </Button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Upload error message */}
                                {uploadError && (
                                  <Alert variant="destructive" className="mt-3">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                      {uploadError}
                                    </AlertDescription>
                                  </Alert>
                                )}
                                
                                {/* Image Previews */}
                                {watchedValues.imageUrls && watchedValues.imageUrls.length > 0 && (
                                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {watchedValues.imageUrls.map((image, index) => (
                                      <div key={index} className="relative group">
                                        <div className="border rounded-md overflow-hidden aspect-square">
                                          <img 
                                            src={image} 
                                            alt={`Preview ${index + 1}`} 
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                        <Button
                                          type="button"
                                          variant="destructive"
                                          size="icon"
                                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={() => {
                                            const currentImages = [...form.getValues("imageUrls")];
                                            currentImages.splice(index, 1);
                                            form.setValue("imageUrls", currentImages);
                                          }}
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                                <div>
                                  <h4 className="text-sm font-medium mb-2">Receipt Image (Optional)</h4>
                                  <div className="border-2 border-dashed border-gray-300 rounded-md p-4 flex flex-col items-center justify-center">
                                    <Clipboard className="mx-auto h-8 w-8 text-gray-400" />
                                    <p className="mt-1 text-xs text-neutral-500">
                                      Upload a receipt image
                                    </p>
                                    <input
                                      ref={receiptImageInputRef}
                                      type="file"
                                      accept="image/png,image/jpeg,image/jpg,image/gif"
                                      className="hidden"
                                      onChange={handleFileInputChange('receiptImage')}
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="mt-2 cursor-pointer text-xs"
                                      onClick={() => triggerFileInput(receiptImageInputRef)}
                                    >
                                      Upload Receipt
                                    </Button>
                                  </div>
                                  {watchedValues.receiptImage && (
                                    <div className="mt-2 flex items-center text-xs text-green-600">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Receipt uploaded successfully
                                    </div>
                                  )}
                                </div>
                                
                                {form.getValues("warranty") && (
                                  <div>
                                    <h4 className="text-sm font-medium mb-2">Warranty Document (Optional)</h4>
                                    <div className="border-2 border-dashed border-gray-300 rounded-md p-4 flex flex-col items-center justify-center">
                                      <Clipboard className="mx-auto h-8 w-8 text-gray-400" />
                                      <p className="mt-1 text-xs text-neutral-500">
                                        Upload warranty document
                                      </p>
                                      <input
                                        ref={warrantyDocInputRef}
                                        type="file"
                                        accept="image/png,image/jpeg,image/jpg,image/gif,.pdf"
                                        className="hidden"
                                        onChange={handleFileInputChange('warrantyDocument')}
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="mt-2 cursor-pointer text-xs"
                                        onClick={() => triggerFileInput(warrantyDocInputRef)}
                                      >
                                        Upload Document
                                      </Button>
                                    </div>
                                    {watchedValues.warrantyDocument && (
                                      <div className="mt-2 flex items-center text-xs text-green-600">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Warranty document uploaded successfully
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
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
                                {getSectionIcon("ownership") || <span>4</span>}
                              </div>
                              <span>Ownership Proof</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-5 pt-2">
                            <div className="space-y-6">
                              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                                <div className="sm:col-span-6">
                                  <FormField
                                    control={form.control}
                                    name="ownershipDocumentType"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>
                                          Ownership Proof Type
                                        </FormLabel>
                                        <Select
                                          onValueChange={field.onChange}
                                          defaultValue={field.value}
                                        >
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select document type" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="receipt">Purchase Receipt</SelectItem>
                                            <SelectItem value="certificate">Certificate of Ownership</SelectItem>
                                            <SelectItem value="manual">User Manual with Serial Number</SelectItem>
                                            <SelectItem value="warranty">Warranty Card</SelectItem>
                                            <SelectItem value="other">Other Document</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                                
                                <div className="sm:col-span-6">
                                  <h4 className="text-sm font-medium mb-2">Upload Ownership Document</h4>
                                  <div className="border-2 border-dashed border-gray-300 rounded-md p-4 flex flex-col items-center justify-center">
                                    {uploading ? (
                                      <>
                                        <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
                                        <p className="mt-1 text-xs text-neutral-600">
                                          Uploading document...
                                        </p>
                                      </>
                                    ) : (
                                      <>
                                        <Clipboard className="mx-auto h-8 w-8 text-gray-400" />
                                        <p className="mt-1 text-xs text-neutral-500">
                                          Upload a document that proves your ownership
                                        </p>
                                        <input
                                          ref={ownershipDocInputRef}
                                          type="file"
                                          accept="image/png,image/jpeg,image/jpg,image/gif,.pdf"
                                          className="hidden"
                                          onChange={handleFileInputChange('ownershipProof')}
                                        />
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="mt-2 cursor-pointer"
                                          disabled={!form.getValues("ownershipDocumentType") || uploading}
                                          onClick={() => triggerFileInput(ownershipDocInputRef)}
                                        >
                                          Upload Document
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                  {watchedValues.ownershipProof && (
                                    <div className="mt-2 flex items-center text-xs text-green-600">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Ownership document uploaded successfully
                                    </div>
                                  )}
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
                                            placeholder="Add any additional notes regarding ownership"
                                            className="resize-none h-24"
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
                          </AccordionContent>
                        </AccordionItem>
                        
                        {/* Payment information block in the ownership section */}
                        <div className="mt-8 bg-white p-5 rounded-md border border-gray-100">
                          <h4 className="text-sm font-medium text-neutral-900 mb-4">Registration Fee</h4>
                          <div className="flex items-center justify-between">
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
            
            {/* Preview Section */}
            <div className="md:col-span-1">
              <div className="sticky top-8">
                <h3 className="text-lg font-medium mb-4">Item Preview</h3>
                
                <Card>
                  <CardContent className="p-4">
                    {(!watchedValues.name && !watchedValues.category) ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-neutral-700 font-medium">Item Preview</h3>
                        <p className="text-sm text-neutral-500 mt-1">
                          Fill in the form to see a preview of your item
                        </p>
                      </div>
                    ) : (
                      <div>
                        {/* Preview image */}
                        <div className="aspect-square bg-gray-100 rounded-md overflow-hidden mb-4">
                          {watchedValues.imageUrls && watchedValues.imageUrls.length > 0 ? (
                            <img
                              src={watchedValues.imageUrls[0]}
                              alt={watchedValues.name || "Item preview"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-12 w-12 text-gray-300" />
                            </div>
                          )}
                        </div>
                        
                        {/* Item details */}
                        <div className="space-y-2">
                          <h3 className="font-medium text-lg text-neutral-900">
                            {watchedValues.name || "Unnamed Item"}
                          </h3>
                          
                          <div className="flex space-x-2">
                            {watchedValues.category && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                {watchedValues.category}
                              </span>
                            )}
                            {watchedValues.subCategory && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {watchedValues.subCategory}
                              </span>
                            )}
                          </div>
                          
                          {watchedValues.uniqueIdentifier && (
                            <div>
                              <span className="text-xs text-neutral-500">Unique ID:</span>
                              <span className="text-sm font-medium ml-1">
                                {watchedValues.uniqueIdentifier}
                              </span>
                            </div>
                          )}
                          
                          {(watchedValues.brand || watchedValues.model) && (
                            <div>
                              <span className="text-xs text-neutral-500">
                                {watchedValues.brand && watchedValues.model 
                                  ? "Brand/Model:" 
                                  : watchedValues.brand 
                                    ? "Brand:" 
                                    : "Model:"}
                              </span>
                              <span className="text-sm font-medium ml-1">
                                {watchedValues.brand && watchedValues.model 
                                  ? `${watchedValues.brand} / ${watchedValues.model}`
                                  : watchedValues.brand || watchedValues.model}
                              </span>
                            </div>
                          )}
                          
                          {watchedValues.value && (
                            <div>
                              <span className="text-xs text-neutral-500">Value:</span>
                              <span className="text-sm font-medium ml-1">{watchedValues.value}</span>
                            </div>
                          )}
                          
                          {watchedValues.description && (
                            <div className="mt-3">
                              <span className="text-xs text-neutral-500 block mb-1">Description:</span>
                              <p className="text-sm text-neutral-600">
                                {watchedValues.description.length > 100
                                  ? `${watchedValues.description.slice(0, 100)}...`
                                  : watchedValues.description}
                              </p>
                            </div>
                          )}
                          
                          {/* Registration status */}
                          <div className="pt-3 mt-3 border-t border-gray-100">
                            <div className="flex items-center">
                              <div className="w-2 h-2 rounded-full bg-yellow-400 mr-2" />
                              <span className="text-xs text-neutral-500">Registration in progress</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Completion cards */}
                <div className="mt-4 space-y-3">
                  <Card>
                    <CardContent className="p-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium">Basic Information</h4>
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
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}