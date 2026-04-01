import React from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Store, ArrowRight, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/admin-layout";

const onboardingSchema = z.object({
  name: z.string().min(2, "Business name is required"),
  email: z.string().email("Valid business email is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

export default function RetailerOnboarding() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
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
        description: "Your business profile has been created. Welcome to the POS platform.",
      });
      // Force reload to update user context with new role
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

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto py-12 px-4 sm:px-6">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Store className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Become a Retailer</h1>
          <p className="text-muted-foreground mt-2 max-w-lg">
            Register your business to access the KIZERE POS platform. You'll be able to register products, transfer ownership, and track inventory.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>
              Provide your business details to set up your retailer account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name <span className="text-destructive">*</span></FormLabel>
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
                        <Input type="email" placeholder="contact@business.com" {...field} />
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
                      Creating account...
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
