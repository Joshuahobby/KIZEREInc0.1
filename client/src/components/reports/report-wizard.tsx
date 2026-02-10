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
  ShieldCheck
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

interface ReportWizardProps {
  type: "lost" | "found";
  onSubmit: (data: any, images: File[]) => void;
  isSubmitting: boolean;
}

export function ReportWizard({ type, onSubmit, isSubmitting }: ReportWizardProps) {
  const [step, setStep] = useState(1);
  const [images, setImages] = useState<File[]>([]);

  const schema = type === "lost" ? lostItemReportSchema : foundItemReportSchema;
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
      custodyLocation: "", // Added default value
      challengeQuestion: "", // Added default value
      status: "Open"
    } as any
  });

  const nextStep = async () => {
    const fieldsToValidate = step === 1
      ? ["title", "category", "description"]
      : ["location", "date", "custodyLocation"];

    const isValid = await form.trigger(fieldsToValidate as any);
    if (isValid) setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  return (
    <Card className="border-none shadow-none bg-transparent">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-neutral-500">Step {step} of {totalSteps}</span>
          <span className="text-sm font-bold text-primary">{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => onSubmit(data, images))} className="space-y-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
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

                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex gap-3">
                  <Info className="h-5 w-5 text-blue-600 shrink-0" />
                  <div className="text-xs text-blue-800">
                    {type === 'lost' ? (
                      <p>Reporting a lost item costs **1,000 RWF**. You will be redirected to payment after submission.</p>
                    ) : (
                      <p>Reporting a found item is **FREE**. Your report will be reviewed by an admin before going live.</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-between pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={step === 1 || isSubmitting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {step < totalSteps ? (
              <Button type="button" onClick={nextStep}>
                Next Step
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "font-bold px-8",
                  type === 'lost' ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
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
        </form>
      </Form>
    </Card>
  );
}
