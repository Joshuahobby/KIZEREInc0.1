import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl,FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import { motion } from "framer-motion";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: ForgotPasswordValues) => {
      const res = await apiRequest("/api/auth/forgot-password", {
        method: "POST",
        data: values,
      });
      return res;
    },
    onSuccess: (data) => {
      toast({
        title: "Check your email",
        description: data.message,
      });
      // Optionally redirect or show a success state
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: ForgotPasswordValues) {
    mutation.mutate(values);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4 relative overflow-hidden">
      {/* Premium background effects inspired by index.css */}
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

        <Card className="border-border/40 bg-card/80 backdrop-blur-xl shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground text-center">Forgot Password</CardTitle>
            <CardDescription className="text-muted-foreground text-center">
              Enter your email and we'll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mutation.isSuccess ? (
              <div className="py-6 text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Check your inbox</h3>
                <p className="text-muted-foreground">
                  We've sent a password reset link to <span className="text-primary font-medium">{form.getValues("email")}</span>.
                </p>
                <div className="pt-4">
                  <Button 
                    variant="outline" 
                    className="w-full border-border/60 hover:bg-muted/50"
                    onClick={() => setLocation("/auth")}
                  >
                    Return to Login
                  </Button>
                </div>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/80">Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="name@example.com" 
                            {...field} 
                            className="bg-background border-border/60 text-foreground focus:border-primary/50 transition-all"
                            autoComplete="email"
                          />
                        </FormControl>
                        <FormMessage className="text-destructive" />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full premium-button text-white font-semibold py-6 shadow-lg shadow-primary/20 border-none transition-all"
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending link...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
          {!mutation.isSuccess && (
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
