import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, UserPlus, ShieldCheck, Camera, CheckCircle2, Phone, Mail, Send, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { BatchImageUpload } from "@/components/item-registration/batch-image-upload";

const assistedUserSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(10, "Valid phone number is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  consentGiven: z.boolean().refine((val) => val === true, {
    message: "Physical consent is mandatory for assisted registration",
  }),
}).refine((data) => {
  return data.username === data.phoneNumber || data.username === data.email;
}, {
  message: "Username must match either the Phone Number or Email Address",
  path: ["username"],
});

type AssistedUserValues = z.infer<typeof assistedUserSchema>;

interface AssistedUserCreationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type DialogStep = "form" | "confirm" | "otp";

export function AssistedUserCreationDialog({ isOpen, onClose }: AssistedUserCreationDialogProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [step, setStep] = React.useState<DialogStep>("form");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [images, setImages] = React.useState<File[]>([]);
  const [pendingUserId, setPendingUserId] = React.useState<number | null>(null);
  const [pendingUserData, setPendingUserData] = React.useState<AssistedUserValues | null>(null);
  const [otpCode, setOtpCode] = React.useState("");
  const [otpChannel, setOtpChannel] = React.useState<string>("");
  const [otpMaskedContact, setOtpMaskedContact] = React.useState<string>("");

  const form = useForm<AssistedUserValues>({
    resolver: zodResolver(assistedUserSchema),
    defaultValues: {
      fullName: "",
      username: "",
      email: "",
      phoneNumber: "",
      password: "",
      consentGiven: false,
    },
  });

  /**
   * Step 1: Validate + create user in PENDING state (no OTP sent)
   */
  async function onSubmit(data: AssistedUserValues) {
    if (images.length === 0) {
      toast({
        title: "ID Required",
        description: "Please capture or upload the user's identification document.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload ID document
      const formData = new FormData();
      images.forEach(img => formData.append('images', img));
      const uploadRes = await fetch('/api/upload/images', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!uploadRes.ok) throw new Error("ID Document upload failed");
      const { urls } = await uploadRes.json();

      // 2. Create user (validates uniqueness, NO OTP sent)
      const result = await apiRequest("/api/agent/users", {
        method: "POST",
        data: {
          ...data,
          role: "Subscriber",
          verificationDocuments: { id_image: urls[0] },
        },
      });

      setPendingUserId(result.id);
      setPendingUserData(data);
      setStep("confirm"); // Go to confirmation step

      toast({
        title: "User Created Successfully",
        description: "All checks passed. You may now send the verification code.",
      });
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create user account.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * Step 2: Agent confirms and triggers OTP sending
   */
  async function onSendOtp() {
    if (!pendingUserId) return;

    setIsSubmitting(true);
    try {
      const result = await apiRequest(`/api/agent/users/${pendingUserId}/send-otp`, {
        method: "POST",
      });

      setOtpChannel(result.channel || "");
      setOtpMaskedContact(result.maskedContact || "");
      setStep("otp");

      toast({
        title: "Verification Code Sent",
        description: result.message || "Code sent successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to Send Code",
        description: error.message || "Failed to send verification code.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * Step 3: Verify OTP and activate user
   */
  async function onVerifyOtp() {
    if (!pendingUserId || otpCode.length < 6) return;

    setIsSubmitting(true);
    try {
      await apiRequest("/api/agent/users/verify", {
        method: "POST",
        data: {
          userId: pendingUserId,
          code: otpCode,
        },
      });

      toast({
        title: "Account Activated",
        description: "User account has been verified and activated successfully.",
      });

      onClose();
      resetDialog();
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Incorrect OTP code.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const resetDialog = () => {
    setStep("form");
    setPendingUserId(null);
    setPendingUserData(null);
    setOtpCode("");
    setOtpChannel("");
    setOtpMaskedContact("");
    setImages([]);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChangeHandler}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            {t('dashboard.agent.assistedCreation') || "Assisted User Registration"}
          </DialogTitle>
          <DialogDescription>
            {step === "form" && (t('dashboard.agent.assistedCreationDesc') || "Create a new KIZERE account for a subscriber in the field.")}
            {step === "confirm" && "User created. Review the details before sending the verification code."}
            {step === "otp" && "Enter the verification code to activate the account."}
          </DialogDescription>
        </DialogHeader>

        {/* ============ STEP 1: Registration Form ============ */}
        {step === "form" && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="078..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="user@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Username (Phone or Email)</FormLabel>
                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-[10px] px-2 font-bold py-0 bg-primary/5 hover:bg-primary/10 border border-primary/10"
                          onClick={() => form.setValue("username", form.getValues("phoneNumber"))}
                          disabled={!form.watch("phoneNumber")}
                        >
                          <Phone className="h-2.5 w-2.5 mr-1" /> Use Phone
                        </Button>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-[10px] px-2 font-bold py-0 bg-primary/5 hover:bg-primary/10 border border-primary/10"
                          onClick={() => form.setValue("username", form.getValues("email"))}
                          disabled={!form.watch("email")}
                        >
                          <Mail className="h-2.5 w-2.5 mr-1" /> Use Email
                        </Button>
                      </div>
                    </div>
                    <FormControl>
                      <Input placeholder="Recommended: Phone Number" {...field} />
                    </FormControl>
                    <FormDescription className="text-[10px]">
                      Username must exactly match the Phone Number or Email provided.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temporary Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} />
                    </FormControl>
                    <FormDescription className="text-[10px]">
                      Provide a secure temporary password for the user.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2 py-2">
                <FormLabel className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-primary" />
                  User Identification Document
                </FormLabel>
                <BatchImageUpload 
                  onImagesChange={setImages} 
                  maxFiles={1} 
                  showHeader={false}
                  className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg p-3"
                />
                <p className="text-[10px] text-muted-foreground font-medium italic">
                  Take a clear photo of the user's National ID or Passport.
                </p>
              </div>

              <Card className="bg-primary/5 border-primary/20 mt-4">
                <CardContent className="p-4">
                  <FormField
                    control={form.control}
                    name="consentGiven"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="flex items-center gap-1.5 cursor-pointer">
                            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                            Compliance Verification
                          </FormLabel>
                          <FormDescription className="text-[10px] leading-tight text-muted-foreground">
                            I confirm that I have physically verified the user's identity (National ID) 
                            and obtained explicit consent to process their data per Law No. 058/2021.
                          </FormDescription>
                          <FormMessage className="text-[10px]" />
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !form.watch("consentGiven")}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Validate & Create User
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {/* ============ STEP 2: Confirmation before OTP ============ */}
        {step === "confirm" && pendingUserData && (
          <div className="space-y-5 py-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-1">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-bold text-green-700 dark:text-green-400">User Created Successfully</h3>
              <p className="text-xs text-muted-foreground px-4">
                All validation checks passed. No conflicts found. The account is in <strong>pending</strong> status until OTP verification.
              </p>
            </div>

            <Card className="border-muted">
              <CardContent className="p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{pendingUserData.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium">{pendingUserData.phoneNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium truncate max-w-[200px]">{pendingUserData.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Username</span>
                  <span className="font-medium">{pendingUserData.username}</span>
                </div>
              </CardContent>
            </Card>

            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                <strong>Next step:</strong> A verification code will be sent to {" "}
                <strong>{pendingUserData.phoneNumber || pendingUserData.email}</strong>. 
                Make sure the user is ready to receive it before proceeding.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button 
                className="w-full h-12 text-base font-bold gap-2" 
                onClick={onSendOtp}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send Verification Code
              </Button>
              <Button 
                variant="ghost" 
                className="w-full text-xs text-muted-foreground gap-1"
                onClick={() => setStep("form")}
                disabled={isSubmitting}
              >
                <ArrowLeft className="h-3 w-3" /> Go back and edit details
              </Button>
            </div>
          </div>
        )}

        {/* ============ STEP 3: OTP Verification ============ */}
        {step === "otp" && (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold">Verification Required</h3>
              <p className="text-sm text-muted-foreground px-4">
                A 6-digit code was sent via <strong>{otpChannel}</strong> to <strong>{otpMaskedContact}</strong>. 
                Enter it below to activate the account.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">OTP Verification Code</Label>
                <Input 
                  placeholder="000000" 
                  maxLength={6} 
                  className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Button 
                  className="w-full h-12 text-base font-bold" 
                  onClick={onVerifyOtp}
                  disabled={isSubmitting || otpCode.length < 6}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify & Activate
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full text-xs text-muted-foreground"
                  onClick={onSendOtp}
                  disabled={isSubmitting}
                >
                  Resend Code
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  function onOpenChangeHandler(open: boolean) {
    if (!open) onClose();
  }
}
