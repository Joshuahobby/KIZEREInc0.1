import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Check,
  MapPin,
  Calendar,
  Info,
  ArrowRight,
  ArrowLeft,
  Camera,
  AlertTriangle,
  Receipt,
  ShieldCheck,
  Banknote
} from "lucide-react";
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
  FormDescription
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BatchImageUpload } from "@/components/item-registration/batch-image-upload";
import { foundItemReportSchema, lostItemReportSchema, itemCategories } from "@shared/schema";
import { cn } from "@/lib/utils";
import { OCRScanner } from "./ocr-scanner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ReportWizardProps {
  type: "lost" | "found";
  onSubmit: (data: any, images: File[]) => void;
  isSubmitting: boolean;
}

export function ReportWizard({ type, onSubmit, isSubmitting }: ReportWizardProps) {
  const [step, setStep] = useState(1);
  const [images, setImages] = useState<File[]>([]);

  // Extend schema for bounty if type is lost
  const baseSchema = type === "lost" ? lostItemReportSchema : foundItemReportSchema;
  const schema = baseSchema.extend({
    bountyAmount: z.coerce.number().min(0).optional()
  });

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      type,
      title: "",
      category: "Other",
      description: "",
      location: "",
      uniqueIdentifier: "",
      date: new Date().toISOString().split("T")[0],
      contactInfo: "",
      custodyLocation: "",
      challengeQuestion: "",
      status: "Open",
      bountyAmount: 0,
      imageUrls: []
    } as any
  });

  // Debug: Log form errors to console
  useEffect(() => {
    if (Object.keys(form.formState.errors).length > 0) {
      console.log("DEBUG: ReportWizard form errors:", form.formState.errors);
    }
  }, [form.formState.errors]);

  const totalSteps = type === 'lost' ? 5 : 4;
  const progress = (step / totalSteps) * 100;

  const nextStep = async () => {
    let fieldsToValidate: string[] = [];
    if (step === 1) fieldsToValidate = ["title", "category", "description", "uniqueIdentifier"];
    else if (step === 2) fieldsToValidate = ["location", "date", "custodyLocation"];
    else if (step === 3) fieldsToValidate = []; // Images are optional
    else if (step === 4) fieldsToValidate = ["contactInfo", "challengeQuestion"];

    const isValid = await form.trigger(fieldsToValidate as any);
    if (isValid) {
      setStep(step + 1);
    }
  };

  const handleFinalSubmit = (e?: React.BaseSyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (step !== totalSteps) {
      return;
    }

    form.handleSubmit((data) => {
      onSubmit(data, images);
    })(e);
  };

  const prevStep = () => setStep(step - 1);

  return (
    <Card className="border-none shadow-none bg-transparent">
      <div className="mb-8 relative pl-2 pr-2">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Step {step} of {totalSteps}</span>
          <span className="text-sm font-black text-primary bg-primary/10 px-3 py-1 rounded-full">{Math.round(progress)}% Complete</span>
        </div>
        <div className="h-2.5 w-full bg-neutral-100 rounded-full overflow-hidden shadow-inner">
          <div
            className={cn(
              "h-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-500 ease-out",
              progress === 20 ? "w-1/5" :
                progress === 25 ? "w-1/4" :
                  progress === 40 ? "w-2/5" :
                    progress === 50 ? "w-1/2" :
                      progress === 60 ? "w-3/5" :
                        progress === 75 ? "w-3/4" :
                          progress === 80 ? "w-4/5" :
                            progress === 100 ? "w-full" : "w-0"
            )}
          />
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <ScrollArea className="h-[450px] pr-4">
                  <div className="space-y-4 pb-4">
                    <div className="space-y-1 mb-4">
                      <h3 className="text-lg font-semibold">Basic Information</h3>
                      <p className="text-sm text-neutral-500">Tell us what you {type === 'lost' ? 'lost' : 'found'}.</p>
                    </div>

                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item Name <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Black Leather Wallet" {...field} />
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
                          <FormLabel>Category <span className="text-red-500">*</span></FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {itemCategories.map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Include distinguishing features like brand, color, scratches, etc."
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Min 10 characters.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="uniqueIdentifier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unique Identifier (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Serial Number, IMEI, ID Number" {...field} />
                          </FormControl>
                          <FormDescription>Helping us find an exact match faster.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </ScrollArea>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <ScrollArea className="h-[450px] pr-4">
                  <div className="space-y-4 pb-4">
                    <div className="space-y-1 mb-4">
                      <h3 className="text-lg font-semibold">Location & Time</h3>
                      <p className="text-sm text-neutral-500">When and where did this happen?</p>
                    </div>

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input placeholder="e.g. Downtown Taxi Park, Near Bank of Kigali" {...field} />
                              <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input type="date" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {type === 'found' && (
                      <FormField
                        control={form.control}
                        name="custodyLocation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Item Custody <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input placeholder="e.g. Left at Security Desk, With me, Police Station" {...field} />
                                <Info className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                              </div>
                            </FormControl>
                            <FormDescription>Where can the owner find the item or meet you?</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </ScrollArea>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <ScrollArea className="h-[450px] pr-4">
                  <div className="space-y-4 pb-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold">Images</h3>
                        <p className="text-sm text-neutral-500">Photos help identify the item faster.</p>
                      </div>
                      <OCRScanner
                        image={images[0] || null}
                        onScanComplete={(data) => {
                          if (data.uniqueIdentifier) form.setValue('uniqueIdentifier', data.uniqueIdentifier);
                          if (data.title && !form.getValues('title')) form.setValue('title', data.title);
                        }}
                      />
                    </div>

                    <BatchImageUpload onImagesChange={setImages} maxFiles={3} />
                    <p className="text-xs text-neutral-400">Max 3 images. JPG, PNG allowed.</p>
                  </div>
                </ScrollArea>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <ScrollArea className="h-[450px] pr-4">
                  <div className="space-y-4 pb-4">
                    <div className="space-y-1 mb-4">
                      <h3 className="text-lg font-semibold">Contact Information</h3>
                      <p className="text-sm text-neutral-500">How should people reach you?</p>
                    </div>

                    <FormField
                      control={form.control}
                      name="contactInfo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Details <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Phone number or specific instructions" {...field} />
                          </FormControl>
                          <FormDescription>
                            {type === 'found'
                              ? "This will be hidden until a claim is verified."
                              : "This will be visible to potential finders."}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {type === 'found' && (
                      <FormField
                        control={form.control}
                        name="challengeQuestion"
                        render={({ field }) => (
                          <FormItem className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
                            <FormLabel className="text-amber-900 font-bold flex items-center gap-2">
                              <ShieldCheck className="h-4 w-4" />
                              Security Challenge Question
                            </FormLabel>
                            <FormDescription className="text-amber-800 text-xs mb-2">
                              Ask something only the real owner would know (e.g. "What is the lock screen wallpaper?").
                            </FormDescription>
                            <FormControl>
                              <Input placeholder="Verification question for claimants..." className="bg-white" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </ScrollArea>
              </motion.div>
            )}

            {step === 5 && type === 'lost' && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <ScrollArea className="h-[450px] pr-4">
                  <div className="space-y-4 pb-4">
                    <div className="space-y-1 mb-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Banknote className="h-5 w-5 text-green-600" />
                        Add a Bounty (Optional)
                      </h3>
                      <p className="text-sm text-neutral-500">Offer a reward to incentivize finders.</p>
                    </div>

                    <div className="p-4 bg-green-50 border border-green-100 rounded-lg mb-4">
                      <p className="text-sm text-green-800">
                        Bounties are held safely in escrow and are <strong>only released</strong> when you confirm receipt of your item via OTP.
                      </p>
                    </div>

                    <FormField
                      control={form.control}
                      name="bountyAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reward Amount (RWF)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type="number"
                                placeholder="e.g. 5000"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">RWF</span>
                            </div>
                          </FormControl>
                          <FormDescription>Leave 0 if you don't want to offer a reward.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex gap-3 mt-6">
                      <Info className="h-5 w-5 text-blue-600 shrink-0" />
                      <div className="text-xs text-blue-800">
                        <p>Reporting a lost item costs **1,000 RWF**.</p>
                        {form.getValues('bountyAmount') > 0 && (
                          <p className="mt-1 font-semibold">
                            Total Payment: {(1000 + (form.getValues('bountyAmount') || 0)).toLocaleString()} RWF
                          </p>
                        )}

                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col gap-4 pt-6 border-t">
            {Object.keys(form.formState.errors).length > 0 && step === totalSteps && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-600 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Please fix the following errors before submitting:
                </p>
                <ul className="list-disc pl-4">
                  {Object.entries(form.formState.errors).map(([field, error]: [string, any]) => (
                    <li key={field}>
                      <span className="font-semibold capitalize">{field.replace(/([A-Z])/g, ' $1')}:</span> {error.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex justify-between items-center w-full bg-neutral-50/50 p-4 -mx-6 -mb-6 mt-2 rounded-b-2xl border-t border-neutral-100">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl border-neutral-200 hover:bg-white hover:shadow-sm"
                onClick={prevStep}
                disabled={step === 1 || isSubmitting}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>

              {step < totalSteps ? (
                <Button key="next-step-btn" type="button" className="rounded-xl shadow-md bg-primary hover:bg-primary/90" onClick={nextStep}>
                  Next Step
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  key="submit-report-btn"
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className={cn(
                    "font-bold px-8 rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95",
                    type === 'lost' ? "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 shadow-red-500/20" : "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 shadow-emerald-500/20"
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      {type === 'lost' ? 'Pay & Submit' : 'Submit Report'}
                      {type === 'lost' ? <Receipt className="ml-2 h-4 w-4" /> : <Check className="ml-2 h-4 w-4" />}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </Card>
  );
}
