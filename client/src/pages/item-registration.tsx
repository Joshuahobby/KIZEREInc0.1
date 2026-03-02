import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
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
  QrCode,
  Activity,
  ChevronLeft,
  ChevronRight,
  ShieldCheck as Shield
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Hooks & Libs
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { PaymentService } from "@/services/payment.service";
import { DEFAULT_CURRENCY } from "@/config/payment.config";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { PageLayout } from "@/components/layout/page-layout";

// Custom Registration Components
import { SmartIDRecognizer } from "@/components/item-registration/smart-id-recognizer";
import { BatchImageUpload } from "@/components/item-registration/batch-image-upload";
import { OwnershipChain, OwnershipDocument as OwnershipDoc } from "@/components/item-registration/ownership-chain";
import { QRCodeGenerator } from "@/components/item-registration/qr-code-generator";
import { ShareWhatsAppButton } from "@/components/ui/share-whatsapp-button";
import { VoiceHelper } from "@/components/ui/voice-helper";
import { PaymentTrust } from "@/components/ui/payment-trust";

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
  color: z.string().optional(),
  model: z.string().optional(),
  // Ensure name and uniqueIdentifier meet minimum lengths for better data quality
  name: z.string().min(2, "Item name must be at least 2 characters"),
  uniqueIdentifier: z.string().min(3, "Identifier must be at least 3 characters"),
  description: z.string().optional().refine(val => !val || val.length >= 5, {
    message: "Description must be at least 5 characters if provided"
  }),
});

type ItemRegistrationValues = z.infer<typeof formSchema>;

export default function ItemRegistrationPage({ params }: { params?: { id?: string } }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // UI State
  const [currentStep, setCurrentStep] = useState(0);
  const [itemImages, setItemImages] = useState<File[]>([]);
  const [ownershipDocuments, setOwnershipDocuments] = useState<OwnershipDoc[]>([]);
  const [completion, setCompletion] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [registeredItemData, setRegisteredItemData] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Form initialization
  const form = useForm<ItemRegistrationValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "Other" as any,
      subCategory: "",
      color: "",
      model: "",
      uniqueIdentifier: "",
      description: "",
      status: "Registered",
      imageUrls: [],
      details: {},
    },
    mode: "onChange",
  });

  const watchedName = useWatch({ control: form.control, name: "name" });
  const watchedCategory = useWatch({ control: form.control, name: "category" });
  const watchedIdentifier = useWatch({ control: form.control, name: "uniqueIdentifier" });
  const watchedDescription = useWatch({ control: form.control, name: "description" });



  const isEditMode = !!params?.id;
  const itemId = params?.id;
  const [existingImages, setExistingImages] = useState<string[]>([]);

  // Fetch item details if in edit mode
  const { data: existingItem, isLoading: isLoadingItem } = useQuery({
    queryKey: [`/api/items/${itemId}`],
    queryFn: () => apiRequest(`/api/items/${itemId}`),
    enabled: !!itemId
  });

  // Populate form when item data is loaded
  useEffect(() => {
    if (existingItem) {
      console.log("[Registration] Pre-filling form with item data:", existingItem);
      form.reset({
        name: existingItem.name,
        category: existingItem.category,
        subCategory: existingItem.details?.subCategory || "",
        uniqueIdentifier: existingItem.uniqueIdentifier,
        description: existingItem.description || "",
        status: existingItem.status,
        imageUrls: existingItem.imageUrls || [],
        details: existingItem.details || {},
      });
      setExistingImages(existingItem.imageUrls || []);

      if (existingItem.details?.ownershipDocuments && Array.isArray(existingItem.details.ownershipDocuments)) {
        try {
          const docs = existingItem.details.ownershipDocuments.map((doc: any, index: number) => ({
            id: `existing-${index}`,
            file: null,
            url: doc.url || doc, // Handle if it's object with url or just string
            title: doc.title || "Existing Document",
            date: doc.date || "",
            description: doc.description || ""
          }));
          setOwnershipDocuments(docs);
        } catch (e) {
          console.error("Failed to parse existing ownership documents", e);
        }
      }
      // Skip to review step or media step? Maybe just stay at 0.
    }
  }, [existingItem, form]);
  useEffect(() => {
    if (isEditMode) return;
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

    if (watchedName) completedFields++;
    if (watchedCategory) completedFields++;
    if (watchedIdentifier) completedFields++;
    if (watchedDescription && watchedDescription.length >= 10) completedFields++;
    if (itemImages.length > 0) completedFields++;
    if (ownershipDocuments.length > 0) completedFields++;

    // Weight essential fields more if needed, but for now just count
    setCompletion(Math.round((completedFields / totalFields) * 100));
  }, [watchedName, watchedCategory, watchedIdentifier, watchedDescription, itemImages, ownershipDocuments]);

  // Auto-save draft
  useEffect(() => {
    const timer = setTimeout(() => {
      if (form.formState.isDirty) {
        setAutoSaving(true);
        const values = form.getValues();
        localStorage.setItem('itemRegistrationDraft', JSON.stringify(values));
        setTimeout(() => setAutoSaving(false), 1000);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [watchedName, watchedCategory, watchedIdentifier, watchedDescription, form.formState.isDirty]);

  // Monitor form errors
  useEffect(() => {
    if (Object.keys(form.formState.errors).length > 0) {
      console.debug("[Registration] Form validation errors:", form.formState.errors);
    }
  }, [form.formState.errors]);

  useEffect(() => {
    console.debug(`[Registration] Completion: ${completion}%`);
  }, [completion]);

  const prevStep = (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const nextStep = (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (currentStep < 2) setCurrentStep(currentStep + 1);
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

      // 1. Upload new images
      let uploadedImageUrls: string[] = [];
      if (itemImages.length > 0) {
        const formData = new FormData();
        itemImages.forEach(file => formData.append('images', file));

        const { urls } = await apiRequest<{ urls: string[] }>('/api/upload/images', {
          method: 'POST',
          data: formData
        });

        console.log("[Registration] Images uploaded:", urls);
        uploadedImageUrls = urls;
      }

      // Combine existing images with new ones
      const finalImageUrls = [...existingImages, ...uploadedImageUrls];

      // 2. Upload ownership documents
      let uploadedDocUrls: any[] = [];
      const newDocs = ownershipDocuments.filter(doc => doc.file !== null);
      const existingDocs = ownershipDocuments.filter(doc => doc.file === null).map(doc => ({
        url: doc.url,
        title: doc.title,
        date: doc.date,
        description: doc.description
      }));

      if (newDocs.length > 0) {
        const formData = new FormData();
        newDocs.forEach((doc, i) => {
          if (doc.file) {
            formData.append('documents', doc.file);
            formData.append(`documentInfo${i}`, JSON.stringify({
              title: doc.title,
              date: doc.date,
              description: doc.description
            }));
          }
        });
        const { documents } = await apiRequest<{ documents: any[] }>('/api/upload/documents', {
          method: 'POST',
          data: formData
        });
        console.log("[Registration] Documents uploaded:", documents);
        uploadedDocUrls = documents;
      }

      const finalDocUrls = [...existingDocs, ...uploadedDocUrls];

      // 3. Register or Update Item
      const { subCategory, color, model, ...rootData } = data;
      const apiEndpoint = isEditMode && itemId ? `/api/items/${itemId}` : '/api/items';
      const method = isEditMode ? 'PUT' : 'POST';

      const itemResponse = await apiRequest<any>(apiEndpoint, {
        method,
        data: {
          ...rootData,
          imageUrls: finalImageUrls,
          details: {
            ...(data.details as any),
            subCategory,
            color,
            model,
            ownershipDocuments: finalDocUrls
          }
        }
      });
      console.log(`[Registration] Item ${isEditMode ? 'updated' : 'created'}:`, itemResponse);

      // 4. Initialize Payment (Only for new registrations)
      let paymentResponse: { paymentUrl: string | null } = { paymentUrl: null };
      if (!isEditMode) {
        console.log("[Registration] Initializing payment for item:", itemResponse.id);
        paymentResponse = await PaymentService.initializePayment({
          type: "registration",
          itemId: itemResponse.id
        });
      }

      return { item: itemResponse, payment: paymentResponse };
    },
    onSuccess: (data) => {
      // Invalidate general list
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });

      // If editing, invalidate specific item details to ensure fresh data is fetched
      if (itemId) {
        queryClient.invalidateQueries({ queryKey: [`/api/items/${itemId}`] });
      }

      localStorage.removeItem('itemRegistrationDraft');

      toast({
        title: isEditMode ? "Success!" : "Item Registered",
        description: isEditMode ? "Item updated successfully." : "Redirecting to payment...",
        variant: "default",
        duration: 3000,
      });

      if (!isEditMode && data.payment.paymentUrl) {
        window.location.href = data.payment.paymentUrl;
      } else if (!isEditMode) {
        // Show success screen for new items
        setRegisteredItemData(data.item);
        setShowSuccess(true);
      } else {
        // Small delay for edits
        setTimeout(() => {
          setLocation(`/items/${itemId}`);
        }, 500);
      }
    },
    onError: (error: Error) => {
      console.error("[Registration] Mutation error:", error);
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

  if (isEditMode && isLoadingItem) {
    return (
      <PageLayout>
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse">Loading item details...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (showSuccess) {
    return (
      <PageLayout>
        <div className="min-h-[70vh] flex flex-col items-center py-12 px-3 bg-gradient-to-b from-background to-muted/5">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full mx-auto py-12 px-6 bg-background rounded-3xl border border-muted/20 shadow-2xl text-center space-y-8"
          >
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
              <Check className="h-10 w-10" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight mb-2">{t("registration.success.title")}</h2>
              <p
                className="text-muted-foreground text-sm leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: t("registration.success.congrats", { itemName: registeredItemData?.name })
                }}
              />
            </div>

            <div className="p-6 bg-muted/5 rounded-2xl border border-dashed border-muted/20 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">{t("registration.success.label_title")}</p>
              <div className="bg-white p-4 rounded-xl shadow-lg inline-block mx-auto border border-primary/10">
                <QRCodeGenerator
                  itemIdentifier={registeredItemData?.uniqueIdentifier}
                  itemName={registeredItemData?.name}
                  showHeader={false}
                  size={160}
                />
              </div>
              <p className="text-[11px] text-muted-foreground italic">
                {t("registration.success.label_hint")}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <ShareWhatsAppButton
                itemName={registeredItemData?.name || 'My Item'}
                itemUrl={`${window.location.origin}/items/${registeredItemData?.id}`}
                message={t("common.shareSuccessMessage", {
                  itemName: registeredItemData?.name || 'My Item',
                  itemUrl: `${window.location.origin}/items/${registeredItemData?.id}`
                })}
                className="h-12 rounded-2xl text-base font-bold w-full"
                size="lg"
              />
              <Button
                onClick={() => setLocation("/dashboard")}
                className="h-14 rounded-2xl text-base font-black uppercase tracking-widest shadow-lg shadow-primary/20"
              >
                {t("registration.success.go_dashboard")}
              </Button>
              <p className="text-[10px] text-muted-foreground opacity-60">
                {t("registration.success.footer")}
              </p>
            </div>
          </motion.div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="min-h-[70vh] flex flex-col items-center py-2 px-3 sm:py-6 bg-gradient-to-b from-background to-muted/5">
        <div className="w-full max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Form Content */}
            <div className="lg:col-span-8">
              {/* Stepper - Desktop Only */}
              <div className="hidden lg:block mb-8 px-2 max-w-sm h-14 relative">
                <div className="flex justify-between items-center relative h-full">
                  <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted/30 -translate-y-1/2 z-0" />
                  <motion.div
                    className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 z-0"
                    initial={{ width: "0%" }}
                    animate={{ width: `${(currentStep / 2) * 100}%` }}
                  />
                  {[0, 1, 2].map((step) => (
                    <div key={step} className="relative z-10 flex flex-col items-center">
                      <motion.div
                        animate={{
                          scale: currentStep === step ? 1.15 : 1
                        }}
                        className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-colors duration-500 shadow-sm",
                          currentStep >= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                          currentStep === step && "ring-4 ring-primary/20"
                        )}
                      >
                        {currentStep > step ? <Check className="h-3.5 w-3.5" /> : `0${step + 1}`}
                      </motion.div>
                      <div className="absolute -bottom-6 flex justify-center w-20">
                        <span className={cn(
                          "text-[8px] font-bold uppercase tracking-widest transition-colors duration-300",
                          currentStep === step ? "text-primary" : "text-muted-foreground"
                        )}>
                          {step === 0 && "Info"}
                          {step === 1 && "Media"}
                          {step === 2 && "Review"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Form {...form}>
                <form
                  id="item-registration-form"
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <AnimatePresence mode="wait">
                    {currentStep === 0 && (
                      <motion.div
                        key="step-info"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-5 bg-background/50 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-muted/20 shadow-lg"
                      >
                        <div className="flex items-center gap-3 mb-1">
                          <div className="p-2.5 bg-primary/10 rounded-xl">
                            <Barcode className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h2 className="text-lg font-extrabold tracking-tight">{isEditMode ? t("registration.edit_title") : t("registration.main_details")}</h2>
                            <p className="text-[10px] text-muted-foreground">{t("registration.subtitle")}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                  {t("registration.item_name")}
                                  <Badge variant="outline" className="text-[8px] py-0 px-1 border-primary/20 text-primary uppercase">{t("registration.required")}</Badge>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder={t("registration.item_name_placeholder")}
                                    className="h-12 bg-muted/10 border-muted/20 focus:border-primary/40 rounded-2xl text-base font-medium shadow-inner"
                                    {...field}
                                  />
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
                                <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t("registration.item_category")}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-12 bg-muted/10 border-muted/20 rounded-2xl text-base font-medium">
                                      <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="rounded-2xl">
                                    {CATEGORIES.map((c) => (
                                      <SelectItem key={c} value={c} className="rounded-xl">{c}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="uniqueIdentifier"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center justify-between mb-2">
                                <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t("registration.item_uuid")}</FormLabel>
                                <VoiceHelper text={t("registration.voice_uuid_hint")} />
                              </div>
                              <div className="space-y-4">
                                <FormControl>
                                  <div className="relative">
                                    <Input
                                      placeholder={t("registration.item_serial_placeholder")}
                                      className="h-12 pl-12 bg-muted/10 border-muted/20 focus:border-primary/40 rounded-2xl text-base font-bold tracking-widest"
                                      {...field}
                                      disabled={isEditMode}
                                    />
                                    {isEditMode ? (
                                      <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground opacity-70" />
                                    ) : (
                                      <Activity className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary opacity-50" />
                                    )}
                                  </div>
                                </FormControl>

                                <div className="p-3 bg-primary/5 rounded-2xl border border-dashed border-primary/20">
                                  <div className="flex items-center justify-between mb-3">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-primary/60">{t("registration.item_fast_track")}</span>
                                    <Badge className="bg-primary text-[7px] px-1.5 h-4 uppercase">Smart AI</Badge>
                                  </div>
                                  <SmartIDRecognizer onIdentifierSelected={handleIdentifierDetected} showHeader={false} />
                                </div>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="pt-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowOptionalFields(!showOptionalFields)}
                            className="text-[10px] font-bold uppercase tracking-widest text-primary/60 hover:text-primary p-0"
                          >
                            {showOptionalFields ? "- Hide Details" : "+ Add Notes & Markings (Optional)"}
                          </Button>
                        </div>

                        <AnimatePresence>
                          {showOptionalFields && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden space-y-4 pt-4"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name="subCategory"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Detailed Type / Model</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="e.g. Galaxy S22, Laptop"
                                          className="h-10 bg-muted/10 border-muted/20 rounded-xl text-sm"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="color"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Color</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="e.g. Midnight Black"
                                          className="h-10 bg-muted/10 border-muted/20 rounded-xl text-sm"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Notes / Unique Markings</FormLabel>
                                    <FormControl>
                                      <Textarea
                                        placeholder="Describe any scratches, special features, or markings..."
                                        className="min-h-[80px] bg-muted/10 border-muted/20 rounded-xl text-sm resize-none"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}

                    {currentStep === 1 && (
                      <motion.div
                        key="step-media"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-6"
                      >
                        <div className="bg-background/50 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-muted/20 shadow-lg space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-500">
                              <ImageIcon className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h2 className="text-lg font-extrabold tracking-tight">{t("registration.item_visual_assets")}</h2>
                                <VoiceHelper text={t("registration.voice_photos_hint")} />
                              </div>
                              <p className="text-[10px] text-muted-foreground">{t("registration.item_upload_photos")}</p>
                            </div>
                          </div>
                          <div className="p-1 rounded-2xl border border-dashed border-muted/30">
                            {existingImages.length > 0 && (
                              <div className="mb-4 p-4 bg-muted/5 rounded-xl">
                                <h3 className="text-xs font-bold uppercase tracking-widest mb-3 opacity-70">{t("registration.item_existing_images")}</h3>
                                <div className="grid grid-cols-4 gap-3">
                                  {existingImages.map((url, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group">
                                      <img src={url} alt="Item" className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button
                                          type="button"
                                          variant="destructive"
                                          size="icon"
                                          className="h-6 w-6"
                                          onClick={() => setExistingImages(prev => prev.filter((_, i) => i !== idx))}
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            <BatchImageUpload onImagesChange={setItemImages} maxFiles={5 - existingImages.length} showHeader={false} />
                          </div>
                        </div>

                        <div className="bg-background/50 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-muted/20 shadow-lg space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-500">
                              <FileStack className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h2 className="text-lg font-extrabold tracking-tight">{t("registration.item_ownership_proof")}</h2>
                                <VoiceHelper text={t("registration.voice_ownership_hint")} />
                              </div>
                              <p className="text-[10px] text-muted-foreground">{t("registration.item_ownership_docs")}</p>
                            </div>
                          </div>
                          <div className="p-1 rounded-2xl">
                            <OwnershipChain
                              onDocumentsChange={setOwnershipDocuments}
                              initialDocuments={ownershipDocuments}
                              showHeader={false}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {currentStep === 2 && (
                      <motion.div
                        key="step-review"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-6"
                      >
                        <div className="bg-primary/5 border border-primary/20 p-6 rounded-3xl relative overflow-hidden">
                          <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                            <div className="bg-white p-4 rounded-2xl shadow-md border border-primary/10">
                              <QRCodeGenerator
                                itemIdentifier={watchedIdentifier}
                                itemName={watchedName || "Pending"}
                                showHeader={false}
                                size={140}
                              />
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{t("registration.review.label_title")}</p>
                              <h3 className="text-2xl font-black tracking-tight text-foreground">
                                {watchedName || "Unnamed Item"}
                              </h3>
                              <div className="flex items-center justify-center gap-2 pt-1">
                                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 rounded-full text-[10px] font-bold">
                                  {watchedCategory}
                                </Badge>
                                <span className="text-[10px] font-bold text-muted-foreground">ID: {watchedIdentifier}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-background border border-muted/20 p-6 rounded-3xl shadow-sm space-y-5">
                          <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground border-b border-muted/10 pb-3">{t("registration.review.summary_title")}</h4>

                          <div className="space-y-3">
                            <div className="flex justify-between items-center group">
                              <span className="text-xs text-muted-foreground font-bold">{t("registration.review.info_level")}</span>
                              <div className="flex items-center gap-2">
                                <Progress value={completion} className="h-1 w-20" />
                                <span className="text-[10px] font-black text-primary">{completion}%</span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-muted-foreground font-bold">{t("registration.review.protection_fee")}</span>
                              <span className="text-xl font-black tracking-tighter">2,000 RWF</span>
                            </div>
                            <div className="p-3 bg-emerald-500/5 rounded-xl flex items-center gap-3">
                              <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                              <p className="text-[9px] font-medium leading-relaxed text-muted-foreground italic">{t("registration.review.lifetime_badge")}</p>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-muted/10">
                            <PaymentTrust />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </Form>
            </div>

            {/* Navigation & Summary Panel (Desktop) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="hidden lg:block sticky top-24 space-y-6">
                <div className="bg-background/40 backdrop-blur-md p-5 rounded-2xl border border-muted/20 shadow-lg">
                  <h3 className="text-[10px] font-black uppercase tracking-widest mb-3 opacity-30">{t("registration.review.guide_title")}</h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                    {currentStep === 0 && t("registration.review.guide_step1")}
                    {currentStep === 1 && t("registration.review.guide_step2")}
                    {currentStep === 2 && t("registration.review.guide_step3")}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  {currentStep < 2 ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      disabled={currentStep === 0 && !watchedName}
                      className="h-14 rounded-2xl text-base font-black uppercase tracking-widest shadow-lg shadow-primary/20 group"
                    >
                      {t("common.continue")}
                      <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      form="item-registration-form"
                      disabled={completion < 40 || registerMutation.isPending}
                      className="h-14 rounded-2xl text-base font-black uppercase tracking-widest shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90"
                    >
                      {registerMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : (isEditMode ? t("common.saveChanges") : t("common.complete_registration"))}
                    </Button>
                  )}
                  {currentStep > 0 ? (
                    <Button type="button" variant="ghost" onClick={prevStep} className="font-bold opacity-60 hover:opacity-100 text-xs">
                      {t("common.back")}
                    </Button>
                  ) : isEditMode && (
                    <Button type="button" variant="ghost" onClick={() => setLocation(`/items/${itemId}`)} className="font-bold opacity-60 hover:opacity-100 text-xs text-destructive hover:text-destructive">
                      {t("common.cancel_edit")}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Bar (Mobile only) */}
      {isMounted && !showSuccess && typeof document !== 'undefined' && createPortal(
        <div className="lg:hidden fixed bottom-6 left-4 right-4 z-[100]">
          <div className="bg-background/80 backdrop-blur-2xl p-3 rounded-full border border-white/10 shadow-2xl flex items-center gap-2 max-w-md mx-auto">
            {currentStep > 0 && (
              <Button type="button" variant="outline" size="icon" onClick={prevStep} className="rounded-full h-12 w-12 shrink-0 bg-background/50 border-muted/20">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}

            {currentStep < 2 ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={currentStep === 0 && !watchedName}
                className="flex-1 h-12 rounded-full text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20"
              >
                {t("common.continue")}
                <ChevronRight className="ml-1.5 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                form="item-registration-form"
                disabled={completion < 40 || registerMutation.isPending}
                className="flex-1 h-12 rounded-full text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20 bg-primary"
              >
                {registerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (isEditMode ? t("common.saveChanges") : t("common.finish"))}
              </Button>
            )}
          </div>
        </div>,
        document.body
      )}
    </PageLayout>
  );
}
