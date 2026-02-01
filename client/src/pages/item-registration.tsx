import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
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
  AlertCircle,
  Fingerprint,
  FileImage,
  FileStack,
  QrCode
} from "lucide-react";

// UI Components
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Hooks & Libs
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { PaymentService } from "@/services/payment.service";
import { DEFAULT_CURRENCY } from "@/config/payment.config";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { PageLayout } from "@/components/layout/index";

// Custom Registration Components
import { SmartIDRecognizer } from "@/components/item-registration/smart-id-recognizer";
import { BatchImageUpload } from "@/components/item-registration/batch-image-upload";
import { OwnershipChain, OwnershipDocument as OwnershipDoc } from "@/components/item-registration/ownership-chain";
import { QRCodeGenerator } from "@/components/item-registration/qr-code-generator";

// Schema & Constants
import { insertItemSchema } from "@shared/schema";

const CATEGORIES = [
  "Electronics",
  "Phones",
  "Computers",
  "Documents",
  "Jewelry",
  "Accessories",
  "Clothing",
  "Bags",
  "Keys",
  "Wallets",
  "Transportation",
  "Other"
];

const SUB_CATEGORIES: Record<string, string[]> = {
  Electronics: ["Camera", "Smartwatch", "Headphones", "Other"],
  Phones: ["Smartphone", "Tablet", "Feature Phone", "Other"],
  Computers: ["Laptop", "Desktop", "Monitor", "Other"],
  Documents: ["ID Card", "Passport", "Driver's License", "Certificate", "Other"],
  Jewelry: ["Ring", "Necklace", "Bracelet", "Watch", "Other"],
  Accessories: ["Watch", "Bag", "Wallet", "Glasses", "Other"],
  Clothing: ["Outerwear", "Formal", "Casual", "Sports", "Other"],
  Transportation: ["Bicycle", "Motorcycle", "Car", "Other"],
  Bags: ["Other"],
  Keys: ["Other"],
  Wallets: ["Other"],
  Other: ["Other"],
};

const formSchema = insertItemSchema.omit({ userId: true }).extend({
  subCategory: z.string().optional(),
  // Ensure name and uniqueIdentifier meet minimum lengths for better data quality
  name: z.string().min(2, "Item name must be at least 2 characters"),
  uniqueIdentifier: z.string().min(3, "Identifier must be at least 3 characters"),
  description: z.string().optional().refine(val => !val || val.length >= 10, {
    message: "Description must be at least 10 characters if provided"
  }),
});

type ItemRegistrationValues = z.infer<typeof formSchema>;

export default function ItemRegistrationPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // UI State
  const [expandedSections, setExpandedSections] = useState<string[]>(["basic-info"]);
  const [itemImages, setItemImages] = useState<File[]>([]);
  const [ownershipDocuments, setOwnershipDocuments] = useState<OwnershipDoc[]>([]);
  const [completion, setCompletion] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [autoSaving, setAutoSaving] = useState(false);

  // Form initialization
  const form = useForm<ItemRegistrationValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "Other" as any,
      subCategory: "",
      uniqueIdentifier: "",
      description: "",
      status: "Registered",
      imageUrls: [],
      details: {},
    },
    mode: "onChange",
  });

  const watchedValues = form.watch();

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('itemRegistrationDraft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        // Reset form with saved values if they exist
        Object.entries(parsed).forEach(([key, value]) => {
          if (value) form.setValue(key as any, value);
        });
      } catch (e) {
        console.error("Failed to load draft", e);
      }
    }
  }, []);

  // Calculate completion percentage
  useEffect(() => {
    let totalFields = 6;
    let completedFields = 0;
    
    if (watchedValues.name) completedFields++;
    if (watchedValues.category) completedFields++;
    if (watchedValues.uniqueIdentifier) completedFields++;
    if (watchedValues.description && watchedValues.description.length >= 10) completedFields++;
    if (itemImages.length > 0) completedFields++;
    if (ownershipDocuments.length > 0) completedFields++;
    
    // Weight essential fields more if needed, but for now just count
    setCompletion(Math.round((completedFields / totalFields) * 100));
  }, [watchedValues, itemImages, ownershipDocuments]);

  // Auto-save draft
  useEffect(() => {
    const timer = setTimeout(() => {
      if (form.formState.isDirty) {
        setAutoSaving(true);
        localStorage.setItem('itemRegistrationDraft', JSON.stringify(watchedValues));
        setTimeout(() => setAutoSaving(false), 1000);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [watchedValues, form.formState.isDirty]);

  // Monitor form errors
  useEffect(() => {
    if (Object.keys(form.formState.errors).length > 0) {
      console.warn("[Registration] Form validation errors:", form.formState.errors);
    }
  }, [form.formState.errors]);

  useEffect(() => {
    console.log(`[Registration] Completion: ${completion}%`);
  }, [completion]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };


  const isSectionComplete = (section: string): boolean => {
    switch (section) {
      case "basic-info":
        return !!watchedValues.name && !!watchedValues.category && !!watchedValues.uniqueIdentifier;
      case "media":
        return itemImages.length > 0;
      case "ownership":
        return ownershipDocuments.length > 0;
      default:
        return false;
    }
  };

  const getSectionIcon = (section: string, index: number) => {
    if (isSectionComplete(section)) {
      return <Check className="h-4 w-4 text-green-500" />;
    }
    return <span className="text-xs font-bold">{index}</span>;
  };

  // OCR/Smart ID detection handler
  const handleIdentifierDetected = (value: string) => {
    form.setValue("uniqueIdentifier", value, { shouldValidate: true });
    toast({
      title: "ID Detected",
      description: `Detected unique identifier: ${value}`,
    });
  };

  const registerMutation = useMutation({
    mutationFn: async (data: ItemRegistrationValues) => {
      console.log("[Registration] Starting submission...", data);
      // 1. Upload images
      let uploadedImageUrls: string[] = [];
      if (itemImages.length > 0) {
        const formData = new FormData();
        itemImages.forEach(file => formData.append('images', file));
        const uploadRes = await fetch('/api/upload/images', { 
          method: 'POST', 
          body: formData,
          credentials: 'include'
        });
        if (!uploadRes.ok) throw new Error("Failed to upload images");
        const { urls } = await uploadRes.json();
        console.log("[Registration] Images uploaded:", urls);
        uploadedImageUrls = urls;
      }

      // 2. Upload ownership documents
      let uploadedDocUrls: any[] = [];
      if (ownershipDocuments.length > 0) {
        const formData = new FormData();
        ownershipDocuments.forEach((doc, i) => {
          formData.append('documents', doc.file);
          formData.append(`documentInfo${i}`, JSON.stringify({
            title: doc.title,
            date: doc.date,
            description: doc.description
          }));
        });
        const docRes = await fetch('/api/upload/documents', { 
          method: 'POST', 
          body: formData,
          credentials: 'include'
        });
        if (!docRes.ok) throw new Error("Failed to upload documents");
        const { documents } = await docRes.json();
        console.log("[Registration] Documents uploaded:", documents);
        uploadedDocUrls = documents;
      }

      // 3. Register Item
      const itemResponse = await apiRequest<any>('/api/items', {
        method: 'POST',
        data: {
          ...data,
          imageUrls: uploadedImageUrls,
          details: {
            ...(data.details as any),
            subCategory: data.subCategory,
            ownershipDocuments: uploadedDocUrls
          }
        }
      });
      console.log("[Registration] Item created:", itemResponse);

      // 4. Initialize Payment
      console.log("[Registration] Initializing payment for item:", itemResponse.id);
      const paymentResponse = await PaymentService.initializePayment({
        type: "registration",
        itemId: itemResponse.id
      });

      return { item: itemResponse, payment: paymentResponse };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      localStorage.removeItem('itemRegistrationDraft');
      
      toast({
        title: "Item Registered",
        description: "Redirecting to payment...",
      });

      if (data.payment.paymentUrl) {
        window.location.href = data.payment.paymentUrl;
      } else {
        setLocation("/dashboard");
      }
    },
    onError: (error: Error) => {
      console.error("[Registration] Mutation error:", error);
      setPaymentStatus("error");
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register item. Please try again.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: ItemRegistrationValues) => {
    registerMutation.mutate(data);
  };

  return (
    <PageLayout>
      <div className="container max-w-5xl mx-auto py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
                {t('common.register_item')}
              </h1>
              <p className="text-neutral-500 mt-2">
                {t('landing.heroSubtitle')}
              </p>
            </div>
            {autoSaving && (
              <div className="flex items-center text-xs text-neutral-400 bg-neutral-50 px-3 py-1 rounded-full border">
                <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                {t('registration.item_draft_saved')}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-24">
            {/* Left: Form Content */}
            <div className="lg:col-span-2 space-y-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <Accordion
                    type="multiple"
                    value={expandedSections}
                    onValueChange={setExpandedSections}
                    className="space-y-4"
                  >
                    {/* Step 1: Basic Info & OCR */}
                    <AccordionItem value="basic-info" className="border rounded-xl bg-white overflow-hidden shadow-sm">
                      <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-neutral-50/50">
                        <div className="flex items-center space-x-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors",
                            isSectionComplete("basic-info") ? "bg-green-500 border-green-500 text-white" : "border-neutral-200"
                          )}>
                            {getSectionIcon("basic-info", 1)}
                          </div>
                          <span className="font-semibold text-lg text-neutral-800">{t('registration.report_item_details')}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 py-4 space-y-6 border-t bg-neutral-50/30">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('registration.item_name')} <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. MacBook Pro M2, Rolex Datejust" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('registration.item_category')} <span className="text-red-500">*</span></FormLabel>
                              <Select 
                                onValueChange={(val) => {
                                  field.onChange(val);
                                  form.setValue('subCategory', ''); // Reset subcategory on category change
                                }} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={t('registration.item_category')} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {CATEGORIES.map((c) => (
                                    <SelectItem key={c} value={c}>
                                      {t(`registration.item_category_${c.toLowerCase()}`, c)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {watchedValues.category && (
                          <FormField
                            control={form.control}
                            name="subCategory"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('registration.item_subcategory')} <span className="text-red-500">*</span></FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder={t('registration.item_subcategory')} />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {SUB_CATEGORIES[watchedValues.category as keyof typeof SUB_CATEGORIES]?.map((sc) => (
                                      <SelectItem key={sc} value={sc}>
                                        {t(`registration.item_subcategory_${sc.toLowerCase().replace(/ /g, '_').replace(/'/g, '')}`, sc)}
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
                          name="uniqueIdentifier"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('registration.item_uuid')} <span className="text-red-500">*</span></FormLabel>
                              <div className="space-y-3">
                                <FormControl>
                                  <div className="relative">
                                    <Input placeholder="IMEI, Serial Number, or Document ID" {...field} />
                                    <Fingerprint className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                                  </div>
                                </FormControl>
                                <FormDescription>{t('registration.item_registration_description')}</FormDescription>
                                <FormMessage />
                                
                                  <div className="p-4 bg-neutral-50/50 border rounded-lg border-neutral-200">
                                    <SmartIDRecognizer onIdentifierSelected={handleIdentifierDetected} showHeader={false} />
                                  </div>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('registration.item_description')}</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Provide distinguishable features (scratches, repairs, markings)..." 
                                  className="min-h-[100px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </AccordionContent>
                    </AccordionItem>

                    {/* Step 2: Media */}
                    <AccordionItem value="media" className="border rounded-xl bg-white overflow-hidden shadow-sm">
                      <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-neutral-50/50">
                        <div className="flex items-center space-x-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors",
                            isSectionComplete("media") ? "bg-green-500 border-green-500 text-white" : "border-neutral-200"
                          )}>
                            {getSectionIcon("media", 2)}
                          </div>
                          <span className="font-semibold text-lg text-neutral-800">{t('registration.item_images')}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 py-4 space-y-4 border-t bg-neutral-50/30">
                        <BatchImageUpload onImagesChange={setItemImages} maxFiles={5} showHeader={false} />
                      </AccordionContent>
                    </AccordionItem>

                    {/* Step 3: Ownership */}
                    <AccordionItem value="ownership" className="border rounded-xl bg-white overflow-hidden shadow-sm">
                      <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-neutral-50/50">
                        <div className="flex items-center space-x-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors",
                            isSectionComplete("ownership") ? "bg-green-500 border-green-500 text-white" : "border-neutral-200"
                          )}>
                            {getSectionIcon("ownership", 3)}
                          </div>
                          <span className="font-semibold text-lg text-neutral-800">{t('registration.ownership_title')}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 py-4 space-y-4 border-t bg-neutral-50/30">
                        <OwnershipChain onDocumentsChange={setOwnershipDocuments} showHeader={false} />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </form>
              </Form>
            </div>

            {/* Right: Summary & Action Sidebar */}
            <div className="space-y-6 lg:sticky lg:top-28 self-start z-30">
              <Card className="border-neutral-200 shadow-xl overflow-hidden shadow-lg">
                <CardHeader className="bg-neutral-900 text-white py-3 lg:py-4">
                  <CardTitle className="text-lg">{t('registration.item_registration_summary')}</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-500">{t('registration.item_progress')}</span>
                      <span className="font-medium">{completion}%</span>
                    </div>
                    <Progress value={completion} className="h-1.5" />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm py-2 border-b">
                      <span className="text-neutral-500">{t('registration.item_name')}</span>
                      <span className="font-medium truncate max-w-[120px]">{watchedValues.name || "-"}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm py-2 border-b">
                      <span className="text-neutral-500">{t('registration.item_category')}</span>
                      <span className="font-medium text-sky-600">{t(`registration.item_category_${watchedValues.category?.toLowerCase()}`, watchedValues.category) || "-"}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm py-2 border-b">
                      <span className="text-neutral-500">{t('registration.item_images')}</span>
                      <span className="font-medium">{itemImages.length} uploaded</span>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">{t('registration.item_register_fee')}</span>
                      <span className="text-lg font-bold text-amber-900">2,000 RWF</span>
                    </div>
                    <p className="text-[10px] text-amber-700">{t('registration.item_fee_description')}</p>
                  </div>

                  <Button 
                    className="w-full h-12 text-lg font-bold shadow-md bg-neutral-900 hover:bg-neutral-800"
                    disabled={completion < 40 || registerMutation.isPending}
                    onClick={() => {
                      console.log("[Registration] Submit button clicked. Completion:", completion);
                      form.handleSubmit(onSubmit, (errors) => {
                        console.error("[Registration] Form submission blocked by validation errors:", errors);
                      })();
                    }}
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {t('common.processing')}
                      </>
                    ) : (
                      <>
                        {t('common.complete_registration')}
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </CardContent>
                <CardFooter className="px-6 py-4 bg-neutral-50 border-t flex flex-col gap-2">
                   <div className="flex items-center text-xs text-neutral-500">
                     <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                     {t('registration.item_ssl_secured')}
                   </div>
                   <div className="flex items-center text-xs text-neutral-500">
                     <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                     {t('registration.item_verified_certificate')}
                   </div>
                </CardFooter>
              </Card>
              {/* QR Code Preview (Only shown if at least identifier is present) */}
              {watchedValues.uniqueIdentifier && (
                <Card className="border-dashed border-2 bg-neutral-50/50">
                  <CardContent className="p-6">
                    <h3 className="text-sm font-bold mb-4 flex items-center">
                      <QrCode className="h-4 w-4 mr-2" />
                      {t('registration.item_qr_preview')}
                    </h3>
                    <QRCodeGenerator 
                      itemIdentifier={watchedValues.uniqueIdentifier} 
                      itemName={watchedValues.name || "Pending Registration"}
                      showHeader={false}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </PageLayout>
  );
}
