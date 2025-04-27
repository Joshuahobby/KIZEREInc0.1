import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";

export function PasswordChangeForm() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Define the form schema with password validation
  const passwordFormSchema = z.object({
    currentPassword: z.string().min(1, t("validation.currentPasswordRequired")),
    newPassword: z.string().min(8, t("validation.passwordMinLength")),
    confirmPassword: z.string().min(1, t("validation.confirmPasswordRequired")),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: t("validation.passwordsDoNotMatch"),
    path: ["confirmPassword"],
  });

  type PasswordFormValues = z.infer<typeof passwordFormSchema>;

  // Initialize the form
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }
  });

  // API mutation for changing the password
  const changePasswordMutation = useMutation({
    mutationFn: async (values: PasswordFormValues) => {
      const response = await apiRequest("PUT", "/api/me/password", {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("profile.security.passwordChangeSuccess"),
        description: t("profile.security.passwordChangeSuccessDesc"),
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: t("profile.security.passwordChangeError"),
        description: error.message || t("profile.security.passwordChangeErrorDesc"),
        variant: "destructive"
      });
    }
  });

  // Form submission handler
  const onSubmit = (values: PasswordFormValues) => {
    changePasswordMutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Current Password */}
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("profile.security.currentPassword")}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
                  <Input
                    {...field}
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="sr-only">
                      {showCurrentPassword ? t("common.hidePassword") : t("common.showPassword")}
                    </span>
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* New Password */}
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("profile.security.newPassword")}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
                  <Input
                    {...field}
                    type={showNewPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="sr-only">
                      {showNewPassword ? t("common.hidePassword") : t("common.showPassword")}
                    </span>
                  </Button>
                </div>
              </FormControl>
              <FormDescription>
                {t("profile.security.passwordRequirements")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Confirm Password */}
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("profile.security.confirmPassword")}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
                  <Input
                    {...field}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="sr-only">
                      {showConfirmPassword ? t("common.hidePassword") : t("common.showPassword")}
                    </span>
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full"
          disabled={changePasswordMutation.isPending}
        >
          {changePasswordMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("common.processing")}
            </>
          ) : (
            t("profile.security.changePassword")
          )}
        </Button>
      </form>
    </Form>
  );
}