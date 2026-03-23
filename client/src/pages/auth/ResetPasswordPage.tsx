import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { Loader2, Lock, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Get token from URL
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get("token");

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: { password: string }) => {
      const res = await apiRequest("/api/auth/reset-password", {
        method: "POST",
        data: {
          token,
          password: values.password,
        },
      });
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your password has been reset successfully.",
      });
      setTimeout(() => setLocation("/auth"), 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: ResetPasswordValues) {
    if (!token) {
      toast({
        title: "Error",
        description: "Missing or invalid reset token.",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate(values);
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
        <Card className="max-w-md w-full border-border/40 bg-card/80 backdrop-blur-xl text-center p-8 shadow-xl">
          <CardTitle className="text-foreground mb-4">Invalid Link</CardTitle>
          <CardDescription className="mb-6 text-muted-foreground">
            This password reset link is invalid or has expired.
          </CardDescription>
          <Button onClick={() => setLocation("/auth")} className="premium-button text-white w-full border-none">
            Back to Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4 relative overflow-hidden">
      {/* Premium background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-20 w-80 h-80 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-secondary/5 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="border-border/40 bg-card/80 backdrop-blur-xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-foreground text-center">Reset Password</CardTitle>
            <CardDescription className="text-muted-foreground text-center">
              Choose a strong new password for your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mutation.isSuccess ? (
              <div className="py-8 text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Password Reset!</h3>
                <p className="text-muted-foreground">
                  Redirecting you to login in a moment...
                </p>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
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
                    control={form.control}
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
                  <Button 
                    type="submit" 
                    className="w-full premium-button text-white font-semibold py-6 shadow-lg shadow-primary/20 border-none transition-all mt-4"
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating password...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
