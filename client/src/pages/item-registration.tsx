import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { useLocation } from "wouter";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useToast } from "@/hooks/use-toast";
import { insertItemSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getCurrentUser } from "@/lib/firebase";
import { InitializePaymentResponse } from "@/models/payment.model";
import { cn } from "@/lib/utils";

// UI Components
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Item Registration Components
import { BatchImageUpload } from "@/components/item-registration/batch-image-upload";
import { OwnershipChain } from "@/components/item-registration/ownership-chain";
import { QRCodeGenerator } from "@/components/item-registration/qr-code-generator";
import { SmartIDRecognizer } from "@/components/item-registration/smart-id-recognizer";

// Icons
import { 
  AlertCircle,
  ArrowRight, 
  Camera, 
  CheckCircle2, 
  ClipboardCheck, 
  FileText,
  Info,
  Loader2, 
  Package2, 
  QrCode, 
  RotateCcw, 
  SaveIcon, 
  Send, 
  ShieldCheck
} from "lucide-react";

// Define category options
const CATEGORY_OPTIONS = [
  { value: "electronics", label: "Electronics" },
  { value: "documents", label: "Documents" },
  { value: "jewelry", label: "Jewelry" },
  { value: "clothing", label: "Clothing" },
  { value: "accessories", label: "Accessories" },
  { value: "bags", label: "Bags" },
  { value: "other", label: "Other" },
];

// Define subcategory options based on main category
const SUBCATEGORY_OPTIONS = {
  electronics: [
    { value: "phone", label: "Phone" },
    { value: "laptop", label: "Laptop" },
    { value: "tablet", label: "Tablet" },
    { value: "camera", label: "Camera" },
    { value: "headphones", label: "Headphones" },
    { value: "other", label: "Other" },
  ],
  documents: [
    { value: "id_card", label: "ID Card" },
    { value: "passport", label: "Passport" },
    { value: "driver_license", label: "Driver's License" },
    { value: "certificate", label: "Certificate" },
    { value: "other", label: "Other" },
  ],
  jewelry: [
    { value: "ring", label: "Ring" },
    { value: "necklace", label: "Necklace" },
    { value: "bracelet", label: "Bracelet" },
    { value: "watch", label: "Watch" },
    { value: "other", label: "Other" },
  ],
  clothing: [
    { value: "shirt", label: "Shirt" },
    { value: "pants", label: "Pants" },
    { value: "dress", label: "Dress" },
    { value: "jacket", label: "Jacket" },
    { value: "shoes", label: "Shoes" },
    { value: "other", label: "Other" },
  ],
  accessories: [
    { value: "hat", label: "Hat" },
    { value: "glasses", label: "Glasses" },
    { value: "scarf", label: "Scarf" },
    { value: "gloves", label: "Gloves" },
    { value: "other", label: "Other" },
  ],
  bags: [
    { value: "backpack", label: "Backpack" },
    { value: "handbag", label: "Handbag" },
    { value: "wallet", label: "Wallet" },
    { value: "suitcase", label: "Suitcase" },
    { value: "other", label: "Other" },
  ],
  other: [
    { value: "other", label: "Other" },
  ],
};

// Extend the item schema with form-specific validations
const itemRegistrationSchema = insertItemSchema.extend({
  subCategory: z.string().optional()
});

// Type definition for form values
type ItemRegistrationValues = z.infer<typeof itemRegistrationSchema>;

// Type definition for ownership documents
interface OwnershipDocument {
  id: string;
  type: string;
  file: File;
  url?: string;
  date?: string;
  description?: string;
}

export default function ItemRegistration() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // State for tracking the form steps and file uploads
  const [isLoading, setIsLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [ownershipDocuments, setOwnershipDocuments] = useState<OwnershipDocument[]>([]);
  const [generatedQRCode, setGeneratedQRCode] = useState<string | null>(null);
  const [detectedIdentifier, setDetectedIdentifier] = useState<string | null>(null);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [registeredItemId, setRegisteredItemId] = useState<number | null>(null);
  
  // Initialize form with default values
  const form = useForm<ItemRegistrationValues>({
    resolver: zodResolver(itemRegistrationSchema),
    defaultValues: {
      name: "",
      category: "",
      subCategory: "",
      uniqueIdentifier: "",
      description: "",
      status: "registered",
      imageUrls: [],
      details: {},
      location: "",
      userId: 0
    }
  });
  
  // Watch for form value changes
  const watchedValues = useWatch({
    control: form.control,
    name: ["category", "name", "description", "uniqueIdentifier"]
  });
  
  // Set user ID when component mounts
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      form.setValue("userId", parseInt(user.uid) || 1); // Fallback to 1 if uid is not a number
    } else {
      // Handle case where user is not logged in
      toast({
        title: "Authentication required",
        description: "You need to be logged in to register an item.",
        variant: "destructive"
      });
      navigate("/login");
    }
  }, []);
  
  // Item registration mutation
  const registerItem = useMutation({
    mutationFn: async (data: ItemRegistrationValues) => {
      setIsLoading(true);
      
      try {
        // First, upload images if any
        if (imageFiles.length > 0) {
          const formData = new FormData();
          imageFiles.forEach((file) => {
            formData.append("files", file);
          });
          
          const uploadResponse = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
          
          if (!uploadResponse.ok) {
            throw new Error("Failed to upload images");
          }
          
          const { urls } = await uploadResponse.json();
          setImageUrls(urls);
          data.imageUrls = urls;
        }
        
        // Then, upload ownership documents if any
        if (ownershipDocuments.length > 0) {
          const docFormData = new FormData();
          ownershipDocuments.forEach((doc) => {
            docFormData.append("files", doc.file);
            docFormData.append("documentTypes", doc.type);
            if (doc.date) docFormData.append("dates", doc.date);
            if (doc.description) docFormData.append("descriptions", doc.description);
          });
          
          const docUploadResponse = await fetch("/api/upload/documents", {
            method: "POST",
            body: docFormData,
          });
          
          if (!docUploadResponse.ok) {
            throw new Error("Failed to upload documents");
          }
          
          const { documents } = await docUploadResponse.json();
          // Store document references in the item details
          data.details = {
            ...data.details,
            ownershipDocuments: documents
          };
        }
        
        // Store subcategory in details
        if (data.subCategory) {
          data.details = {
            ...data.details,
            subCategory: data.subCategory
          };
          // Remove subCategory as it's not part of the item schema
          delete (data as any).subCategory;
        }
        
        // Finally, register the item
        const response = await apiRequest("/api/items", {
          method: "POST",
          data,
        });
        
        setRegisteredItemId(response.itemId);
        setRegistrationComplete(true);
        
        // Redirect to payment if needed
        if (response.requiresPayment) {
          const paymentResponse = await apiRequest<InitializePaymentResponse>("/api/payments/initialize", {
            method: "POST",
            data: {
              itemId: response.itemId,
              amount: response.registrationFee,
              type: "registration"
            },
          });
          
          if (paymentResponse.redirectUrl) {
            window.location.href = paymentResponse.redirectUrl;
          }
        }
        
        return response;
      } catch (error) {
        console.error("Error registering item:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: () => {
      toast({
        title: t("item_register_success"),
        description: "Your item has been registered successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  });
  
  // Form submission handler
  const onSubmit = (data: ItemRegistrationValues) => {
    registerItem.mutate(data);
  };
  
  // Handler for smart ID recognition results
  const handleIdentifierDetected = (identifier: string) => {
    setDetectedIdentifier(identifier);
    form.setValue("uniqueIdentifier", identifier);
  };
  
  // Handler for batch image upload
  const handleImagesChange = (files: File[]) => {
    setImageFiles(files);
    // Create temporary URLs for preview
    const urls = files.map(file => URL.createObjectURL(file));
    setImageUrls(urls);
  };
  
  // Handler for ownership documents
  const handleDocumentsChange = (documents: OwnershipDocument[]) => {
    setOwnershipDocuments(documents);
  };
  
  // Handler for QR code generation (called after item is registered)
  const handleQRCodeGenerated = (svgString: string) => {
    setGeneratedQRCode(svgString);
  };
  
  // Calculate form completion percentage
  const calculateProgress = () => {
    const requiredFields = ["name", "category", "uniqueIdentifier"];
    const filledFields = requiredFields.filter(field => !!form.getValues(field as any));
    
    // Add points for images
    const hasImages = imageFiles.length > 0;
    
    // Calculate percentage
    return Math.round(((filledFields.length + (hasImages ? 1 : 0)) / (requiredFields.length + 1)) * 100);
  };
  
  // Get appropriate form fields based on category
  const getCategorySpecificFields = () => {
    const category = form.watch("category");
    
    switch (category) {
      case "electronics":
        return (
          <>
            <FormField
              control={form.control}
              name="uniqueIdentifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("item_serial_number")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. SN12345678" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="details.brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("item_brand")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Samsung, Apple" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="details.model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("item_model")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. iPhone 13, Galaxy S21" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="details.color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("item_color")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Black, Silver" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="pt-4">
              <SmartIDRecognizer onIdentifierDetected={handleIdentifierDetected} />
            </div>
          </>
        );
      
      case "documents":
        return (
          <>
            <FormField
              control={form.control}
              name="uniqueIdentifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Number</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. ID12345678" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="details.issueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="details.expiryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiry Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
      
      case "jewelry":
        return (
          <>
            <FormField
              control={form.control}
              name="uniqueIdentifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serial Number</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. SN12345678 (if any)" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="details.material"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Material</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Gold, Silver, Platinum" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="details.weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weight (grams)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} placeholder="e.g. 12.5" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
      
      default:
        return (
          <FormField
            control={form.control}
            name="uniqueIdentifier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unique Identifier</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Any unique identifier for this item" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
    }
  };
  
  // Render Success View after registration
  const renderSuccessView = () => (
    <div className="flex flex-col items-center justify-center py-10 space-y-6">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
        <CheckCircle2 className="w-8 h-8 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-center">Registration Complete!</h2>
      <p className="text-center text-muted-foreground max-w-md">
        Your item has been successfully registered. You can now generate a QR code for easy identification.
      </p>
      
      {registeredItemId && (
        <Card className="w-full max-w-lg">
          <CardContent className="p-6">
            <QRCodeGenerator 
              itemId={registeredItemId} 
              itemName={form.getValues("name")}
              onQRCodeGenerated={handleQRCodeGenerated}
            />
          </CardContent>
        </Card>
      )}
      
      <div className="flex space-x-4">
        <Button onClick={() => navigate("/dashboard")} variant="outline">
          Go to Dashboard
        </Button>
        <Button onClick={() => {
          setRegistrationComplete(false);
          form.reset();
          setImageFiles([]);
          setImageUrls([]);
          setOwnershipDocuments([]);
          setGeneratedQRCode(null);
          setDetectedIdentifier(null);
        }}>
          Register Another Item
        </Button>
      </div>
    </div>
  );
  
  // Render main form
  const renderRegistrationForm = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Form sections on the left */}
          <div className="space-y-6 md:col-span-2">
            <Accordion type="single" collapsible defaultValue="basic-info" className="w-full">
              {/* Basic Information Section */}
              <AccordionItem value="basic-info" className="border rounded-lg">
                <AccordionTrigger className="px-4 py-2 hover:bg-muted/50">
                  <div className="flex items-center space-x-2">
                    <Package2 className="w-5 h-5" />
                    <span className="font-medium">{t("item_basic_info")}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2 space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("item_name")}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter item name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("item_category")}</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              // Reset subcategory when category changes
                              form.setValue("subCategory", "");
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CATEGORY_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {form.watch("category") && (
                      <FormField
                        control={form.control}
                        name="subCategory"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("item_subcategory")}</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select subcategory" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {SUBCATEGORY_OPTIONS[form.watch("category") as keyof typeof SUBCATEGORY_OPTIONS]?.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("item_description")}</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Describe the item, including any distinguishing features"
                            className="min-h-[100px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("item_location")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Current location of the item"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>
              
              {/* Item Details Section */}
              <AccordionItem value="details" className="border rounded-lg">
                <AccordionTrigger className="px-4 py-2 hover:bg-muted/50">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span className="font-medium">{t("item_details")}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2 space-y-4">
                  {/* Render fields based on selected category */}
                  {getCategorySpecificFields()}
                </AccordionContent>
              </AccordionItem>
              
              {/* Images Section */}
              <AccordionItem value="images" className="border rounded-lg">
                <AccordionTrigger className="px-4 py-2 hover:bg-muted/50">
                  <div className="flex items-center space-x-2">
                    <Camera className="w-5 h-5" />
                    <span className="font-medium">{t("item_images")}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2">
                  <BatchImageUpload
                    onChange={handleImagesChange}
                    maxFiles={5}
                    acceptedFileTypes={["image/jpeg", "image/png", "image/webp"]}
                    maxFileSizeMB={5}
                  />
                </AccordionContent>
              </AccordionItem>
              
              {/* Ownership Documents Section */}
              <AccordionItem value="documents" className="border rounded-lg">
                <AccordionTrigger className="px-4 py-2 hover:bg-muted/50">
                  <div className="flex items-center space-x-2">
                    <ClipboardCheck className="w-5 h-5" />
                    <span className="font-medium">{t("ownership_title")}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2">
                  <OwnershipChain onChange={handleDocumentsChange} />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Register Item <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Live preview on the right */}
          <div className="md:col-span-1">
            <div className="sticky top-20 space-y-6">
              <Card>
                <CardContent className="p-4">
                  <h3 className="mb-2 font-medium flex items-center">
                    <Info className="w-4 h-4 mr-2" />
                    Registration Progress
                  </h3>
                  <Progress value={calculateProgress()} className="h-2 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {calculateProgress()}% complete
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <h3 className="mb-3 font-medium">Item Preview</h3>
                  
                  <div className="space-y-3">
                    {/* Item Images */}
                    {imageUrls.length > 0 && (
                      <div className="relative aspect-video overflow-hidden rounded-md bg-muted">
                        <img
                          src={imageUrls[0]}
                          alt="Item preview"
                          className="object-cover w-full h-full"
                        />
                        {imageUrls.length > 1 && (
                          <div className="absolute top-2 right-2 bg-background/80 text-foreground rounded-md px-2 py-1 text-xs">
                            +{imageUrls.length - 1} more
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Item details */}
                    <div className="space-y-2">
                      <h4 className="font-medium">
                        {watchedValues.name || "Unnamed Item"}
                      </h4>
                      
                      {watchedValues.category && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Category: </span>
                          <span className="font-medium capitalize">{watchedValues.category}</span>
                          {form.watch("subCategory") && (
                            <> / <span className="capitalize">{form.watch("subCategory")}</span></>
                          )}
                        </p>
                      )}
                      
                      {watchedValues.uniqueIdentifier && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">ID: </span>
                          <span className="font-medium">{watchedValues.uniqueIdentifier}</span>
                        </p>
                      )}
                      
                      {watchedValues.description && (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {watchedValues.description}
                        </p>
                      )}
                    </div>
                    
                    {/* Ownership Documents */}
                    {ownershipDocuments.length > 0 && (
                      <div className="border-t pt-2 mt-2">
                        <p className="text-sm font-medium mb-1">Ownership Documents</p>
                        <ul className="text-xs space-y-1">
                          {ownershipDocuments.map((doc) => (
                            <li key={doc.id} className="flex items-center">
                              <ShieldCheck className="w-3 h-3 mr-1 text-green-600" />
                              {doc.type}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Tips Card */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="mb-2 font-medium flex items-center">
                    <Info className="w-4 h-4 mr-2" />
                    Tips
                  </h3>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Add clear photos from multiple angles</li>
                    <li>• Include any unique identifiers or serial numbers</li>
                    <li>• Upload ownership proof documents if available</li>
                    <li>• Be specific in your description</li>
                  </ul>
                </CardContent>
              </Card>
              
              {/* Smart ID detection result */}
              {detectedIdentifier && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle>Identifier Detected</AlertTitle>
                  <AlertDescription>
                    Successfully detected: <span className="font-medium">{detectedIdentifier}</span>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{t("item_register_title")}</h1>
          <p className="text-muted-foreground">
            Register your item for safekeeping and recovery in case it gets lost
          </p>
        </div>
        
        {registrationComplete ? renderSuccessView() : renderRegistrationForm()}
      </main>
      <Footer />
    </div>
  );
}