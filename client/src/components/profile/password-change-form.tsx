import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator";

// Define the password schema with validation
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required" }),
  newPassword: z.string().min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
    .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>;

export function PasswordChangeForm() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordScore, setPasswordScore] = useState(0);

  // Set up the form
  const form = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Set up mutation for changing password
  const mutation = useMutation({
    mutationFn: (data: PasswordChangeFormValues) => {
      return apiRequest('/api/me/password', {
        method: 'PUT',
        data: {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }
      });
    },
    onSuccess: () => {
      toast({
        title: t("profile.security.passwordChangeSuccess"),
        description: t("profile.security.passwordChangeSuccessDesc"),
      });
      form.reset();
      setPasswordScore(0);
    },
    onError: (error) => {
      console.error("Error changing password:", error);
      toast({
        title: t("profile.security.passwordChangeError"),
        description: (error as Error)?.message || t("profile.security.passwordChangeErrorDesc"),
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  // Handle form submission
  const onSubmit = (data: PasswordChangeFormValues) => {
    setIsSubmitting(true);
    mutation.mutate(data);
  };

  // Evaluate password strength as user types
  const evaluatePasswordStrength = (password: string) => {
    let score = 0;
    
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    setPasswordScore(score);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("profile.security.currentPassword")}</FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("profile.security.newPassword")}</FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    evaluatePasswordStrength(e.target.value);
                  }}
                />
              </FormControl>
              <PasswordStrengthIndicator score={passwordScore} maxScore={5} />
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("profile.security.confirmPassword")}</FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={isSubmitting || !form.formState.isDirty}
        >
          {isSubmitting ? t("common.updating") : t("profile.security.changePassword")}
        </Button>
      </form>
    </Form>
  );
}