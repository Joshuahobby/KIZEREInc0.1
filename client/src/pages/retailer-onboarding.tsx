import React from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, ArrowRight, Loader2, LogIn, CheckCircle2 } from "lucide-react";
import { AppLayout } from "@/components/layout/admin-layout";

const BUSINESS_TYPES = [
  { value: "Retailer",        label: "Retailer" },
  { value: "Wholesaler",      label: "Wholesaler / Distributor" },
  { value: "InsuranceCompany",label: "Insurance Company" },
  { value: "EventOrganizer",  label: "Event Organizer / Host" },
  { value: "NGO",             label: "NGO / Non-Profit" },
  { value: "GovernmentAgency",label: "Government Agency" },
  { value: "TechCompany",     label: "Tech Company" },
  { value: "Other",           label: "Other" },
] as const;

const onboardingSchema = z.object({
  businessType: z.enum([
    "Retailer", "Wholesaler", "InsuranceCompany", "EventOrganizer",
    "NGO", "GovernmentAgency", "TechCompany", "Other"
  ], { required_error: "Please select a business type" }),
  name: z.string().min(2, "Business name is required"),
  email: z.string().email("Valid business email is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

export default function BusinessOnboarding() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  // Detect if arriving from account creation (returnUrl flow)
  const searchParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  const justRegistered = searchParams.get("new") === "1";

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      businessType: "Retailer",
      name: "",
      email: user?.email || "",
      phone: user?.phoneNumber || "",
      address: "",
    },
  });

  const onboardMutation = useMutation({
    mutationFn: async (data: OnboardingFormData) => {
      const res = await apiRequest("/api/pos/onboard", { method: "POST", data });
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Registration successful!",
        description: "Your business profile has been created. Welcome to KIZERE Business.",
      });
      window.location.href = "/retailer/dashboard";
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OnboardingFormData) => {
    onboardMutation.mutate(data);
  };

  // Already a retailer or admin — redirect to dashboard
  if (user && (user.role === "Retailer" || user.role === "Admin")) {
    window.location.replace("/retailer/dashboard");
    return null;
  }

  // Unauthenticated visitors: show info + prompt to sign in/register
  if (!user) {
    return (
      <AppLayout hideSidebar>
        <div className="container max-w-2xl mx-auto py-12 px-4 sm:px-6">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Register Your Business</h1>
            <p className="text-muted-foreground mt-2 max-w-lg">
              Whether you're a retailer, insurance company, event organizer, or any other business — KIZERE gives your organization a verified digital presence.
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <span className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
              Create Account
            </div>
            <div className="h-px w-10 bg-muted-foreground/30" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="h-7 w-7 rounded-full border border-muted-foreground/40 flex items-center justify-center text-xs font-bold">2</span>
              Business Profile
            </div>
          </div>

          <Card>
            <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4 text-center">
              <p className="text-muted-foreground">
                Sign in or create a free personal KIZERE account first — then you'll complete your business profile on the next screen.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                <Button
                  size="lg"
                  onClick={() => navigate(`/auth?returnUrl=/business/register%3Fnew%3D1`)}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate(`/auth?tab=register&returnUrl=/business/register%3Fnew%3D1`)}
                >
                  Create Account & Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout hideSidebar>
      <div className="container max-w-2xl mx-auto py-12 px-4 sm:px-6">

        {/* Step 2 welcome banner shown after account creation */}
        {justRegistered && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">Account created — one more step!</p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-0.5">
                Fill in your business details below and click <strong>Complete Registration</strong> to activate your business profile.
              </p>
            </div>
          </div>
        )}

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Create Account
          </div>
          <div className="h-px w-10 bg-muted-foreground/30" />
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <span className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
            Business Profile
          </div>
        </div>

        <div className="flex flex-col items-center mb-8 text-center">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Register Your Business</h1>
          <p className="text-muted-foreground mt-2 max-w-lg">
            Retailers, wholesalers, insurers, event organizers and more — register your organization on KIZERE to manage products, verify ownership, and build customer trust.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>
              Tell us about your organization so we can set up the right profile for you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                <FormField
                  control={form.control}
                  name="businessType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Type <span className="text-destructive">*</span></FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your business type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {BUSINESS_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        This helps us configure the right tools and permissions for your organization.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business / Organization Name <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., Kigali Electronics Ltd" {...field} />
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
                      <FormLabel>Business Email <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contact@yourorganization.com" {...field} />
                      </FormControl>
                      <FormDescription>We'll use this for important notifications</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+250 788 000 000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="City, Street" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={onboardMutation.isPending}
                >
                  {onboardMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating profile...
                    </>
                  ) : (
                    <>
                      Complete Registration
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
