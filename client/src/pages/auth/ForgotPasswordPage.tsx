import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { Loader2, ArrowLeft, Mail, Phone, Lock, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const requestSchema = z.object({
  identifier: z.string().min(3, "Please enter your email or registered phone number"),
});

const resetSchema = z.object({
  otp: z.string().length(6, "Verification code must be 6 digits"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RequestValues = z.infer<typeof requestSchema>;
type ResetValues = z.infer<typeof resetSchema>;

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"request" | "verify" | "success">("request");
  const [isPhone, setIsPhone] = useState(false);
  const [identifier, setIdentifier] = useState("");

  const requestForm = useForm<RequestValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: { identifier: "" },
  });

  const resetForm = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      otp: "",
      password: "",
      confirmPassword: "",
    },
  });

  const requestMutation = useMutation({
    mutationFn: async (values: RequestValues) => {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.identifier);
      const res = await apiRequest("/api/auth/forgot-password", {
        method: "POST",
        data: isEmail ? { email: values.identifier } : { phoneNumber: values.identifier },
      });
      return { ...res, isEmail };
    },
    onSuccess: (data, variables) => {
      setIdentifier(variables.identifier);
      if (data.isEmail) {
        setStep("success");
        toast({
          title: "Check your email",
          description: "We've sent a password reset link to your email address.",
        });
      } else {
        setIsPhone(true);
        setStep("verify");
        toast({
          title: "Code Sent",
          description: "A 6-digit verification code has been sent to your phone.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetMutation = useMutation({
    mutationFn: async (values: ResetValues) => {
      return await apiRequest("/api/auth/reset-password", {
        method: "POST",
        data: {
          token: values.otp,
          password: values.password,
        },
      });
    },
    onSuccess: () => {
      setStep("success");
      toast({
        title: "Success",
        description: "Your password has been reset successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onRequestSubmit(values: RequestValues) {
    requestMutation.mutate(values);
  }

  function onResetSubmit(values: ResetValues) {
    resetMutation.mutate(values);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-secondary/5 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </div>

        <Card className="border-border/40 bg-card/80 backdrop-blur-xl shadow-xl overflow-hidden">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground text-center">
              {step === "verify" ? "Verify Code" : "Forgot Password"}
            </CardTitle>
            <CardDescription className="text-muted-foreground text-center">
              {step === "request" && "Enter your email or phone number to reset your password."}
              {step === "verify" && `Enter the 6-digit code sent to ${identifier} and your new password.`}
              {step === "success" && "Your password reset request has been processed."}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <AnimatePresence mode="wait">
              {step === "request" && (
                <motion.div
                  key="request"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                >
                  <Form {...requestForm}>
                    <form onSubmit={requestForm.handleSubmit(onRequestSubmit)} className="space-y-4">
                      <FormField
                        control={requestForm.control}
                        name="identifier"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground/80">Email or Phone Number</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  placeholder="Email or +250..." 
                                  {...field} 
                                  className="bg-background border-border/60 text-foreground pl-10 focus:border-primary/50 transition-all"
                                />
                              </div>
                            </FormControl>
                            <FormMessage className="text-destructive" />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full premium-button text-white font-semibold py-6 shadow-lg shadow-primary/20 border-none transition-all"
                        disabled={requestMutation.isPending}
                      >
                        {requestMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          "Continue"
                        )}
                      </Button>
                    </form>
                  </Form>
                </motion.div>
              )}

              {step === "verify" && (
                <motion.div
                  key="verify"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                >
                  <Form {...resetForm}>
                    <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-6">
                      <FormField
                        control={resetForm.control}
                        name="otp"
                        render={({ field }) => (
                          <FormItem className="flex flex-col items-center justify-center">
                            <FormLabel className="text-foreground/80 self-start">Verification Code</FormLabel>
                            <FormControl>
                              <InputOTP
                                maxLength={6}
                                value={field.value}
                                onChange={field.onChange}
                                disabled={resetMutation.isPending}
                              >
                                <InputOTPGroup className="gap-2">
                                  <InputOTPSlot index={0} className="h-12 w-12 rounded-lg border-border/60 bg-background/50 text-foreground text-lg focus:border-primary/50 ring-primary/20" />
                                  <InputOTPSlot index={1} className="h-12 w-12 rounded-lg border-border/60 bg-background/50 text-foreground text-lg focus:border-primary/50 ring-primary/20" />
                                  <InputOTPSlot index={2} className="h-12 w-12 rounded-lg border-border/60 bg-background/50 text-foreground text-lg focus:border-primary/50 ring-primary/20" />
                                  <InputOTPSlot index={3} className="h-12 w-12 rounded-lg border-border/60 bg-background/50 text-foreground text-lg focus:border-primary/50 ring-primary/20" />
                                  <InputOTPSlot index={4} className="h-12 w-12 rounded-lg border-border/60 bg-background/50 text-foreground text-lg focus:border-primary/50 ring-primary/20" />
                                  <InputOTPSlot index={5} className="h-12 w-12 rounded-lg border-border/60 bg-background/50 text-foreground text-lg focus:border-primary/50 ring-primary/20" />
                                </InputOTPGroup>
                              </InputOTP>
                            </FormControl>
                            <FormMessage className="text-destructive" />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-4 pt-2">
                        <FormField
                          control={resetForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground/80">New Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                  <Input 
                                    type="password" 
                                    placeholder="••••••••" 
                                    {...field} 
                                    className="bg-background border-border/60 text-foreground pl-10 focus:border-primary/50"
                                  />
                                </div>
                              </FormControl>
                              <FormMessage className="text-destructive" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={resetForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground/80">Confirm New Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                  <Input 
                                    type="password" 
                                    placeholder="••••••••" 
                                    {...field} 
                                    className="bg-background border-border/60 text-foreground pl-10 focus:border-primary/50"
                                  />
                                </div>
                              </FormControl>
                              <FormMessage className="text-destructive" />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full premium-button text-white font-semibold py-6 shadow-lg shadow-primary/20 border-none transition-all mt-2"
                        disabled={resetMutation.isPending}
                      >
                        {resetMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Resetting...
                          </>
                        ) : (
                          "Reset Password"
                        )}
                      </Button>
                      
                      <button 
                        type="button"
                        onClick={() => setStep("request")}
                        className="text-sm text-center w-full text-muted-foreground hover:text-primary transition-colors"
                      >
                        Use a different number or email
                      </button>
                    </form>
                  </Form>
                </motion.div>
              )}

              {step === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-6 text-center space-y-4"
                >
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    {isPhone ? (
                      <CheckCircle2 className="h-8 w-8 text-primary" />
                    ) : (
                      <Mail className="h-8 w-8 text-primary" />
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {isPhone ? "Password Reset Successful!" : "Check your inbox"}
                  </h3>
                  <p className="text-muted-foreground">
                    {isPhone 
                      ? "Your password has been successfully updated. You can now log in with your new password."
                      : `We've sent a password reset link to ${identifier}. Please check your email to continue.`
                    }
                  </p>
                  <div className="pt-4">
                    <Button 
                      className="w-full premium-button border-none text-white"
                      onClick={() => setLocation("/auth")}
                    >
                      Return to Login
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
          
          {step === "request" && (
            <CardFooter className="flex justify-center border-t border-border/10 pt-6">
              <p className="text-sm text-muted-foreground">
                Remembered your password?{" "}
                <Link href="/auth" className="text-primary hover:text-primary/80 font-medium transition-colors">
                  Login
                </Link>
              </p>
            </CardFooter>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
