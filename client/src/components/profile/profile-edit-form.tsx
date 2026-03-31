import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@/types/user";

// UI Components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

// Define the form schema
const profileFormSchema = z.object({
  fullName: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  phoneNumber: z.string().nullable().optional(),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  username: z.string().min(3, {
    message: "Username must be at least 3 characters."
  }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileEditFormProps {
  user: User;
  onCancel: () => void;
  onSuccess: () => void;
}

export function ProfileEditForm({ user, onCancel, onSuccess }: ProfileEditFormProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set up the form with default values from the user object
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: user.fullName || "",
      email: user.email || "",
      phoneNumber: user.phoneNumber || "",
      username: user.username || "",
    },
  });

  // Set up mutation for updating profile
  const mutation = useMutation({
    mutationFn: (data: ProfileFormValues) => {
      return apiRequest(`/api/me`, {
        method: "PUT",
        data
      });
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
      console.error("Error updating profile:", error);
      toast({
        title: t("profile.updateError"),
        description: (error as Error)?.message || t("profile.genericError"),
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  // Handle form submission
  const onSubmit = (data: ProfileFormValues) => {
    setIsSubmitting(true);
    mutation.mutate(data);
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Card className="border-white/10 shadow-premium bg-[#0B0F1A]">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-white/5 pb-6 mb-6">
        <CardTitle className="text-2xl font-black tracking-tighter">{t("profile.editProfile")}</CardTitle>
        <CardDescription className="text-white/40 font-bold">{t("profile.editProfileDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-4 mb-6">
          <Avatar className="h-24 w-24">
            <AvatarImage
              src={user.avatarUrl || ""}
              alt={user.fullName || ""}
            />
            <AvatarFallback className="text-xl">
              {getInitials(user.fullName || "")}
            </AvatarFallback>
          </Avatar>
          <Button variant="outline" disabled className="text-sm">
            {t("profile.changeAvatar")}
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase tracking-widest text-white/40">{t("profile.fullName")}</FormLabel>
                    <FormControl>
                      <Input className="h-14 bg-white/5 border-white/5 rounded-2xl font-black text-white" placeholder={t("profile.fullNamePlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase tracking-widest text-white/40">{t("profile.username")}</FormLabel>
                    <FormControl>
                      <Input className="h-14 bg-white/5 border-white/5 rounded-2xl font-black text-white" placeholder={t("profile.usernamePlaceholder")} {...field} />
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
                    <FormLabel className="text-xs font-black uppercase tracking-widest text-white/40">{t("profile.email")}</FormLabel>
                    <FormControl>
                      <Input className="h-14 bg-white/5 border-white/5 rounded-2xl font-black text-white" placeholder={t("profile.emailPlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase tracking-widest text-white/40">{t("profile.phone")}</FormLabel>
                    <FormControl>
                      <Input
                        className="h-14 bg-white/5 border-white/5 rounded-2xl font-black text-white"
                        placeholder={t("profile.phonePlaceholder")}
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <CardFooter className="flex flex-col md:flex-row justify-end gap-3 px-0 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="h-14 w-full md:w-auto rounded-2xl font-black border-white/10 bg-white/5 hover:bg-white/10 transition-all order-2 md:order-1"
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !form.formState.isDirty}
                className={cn(
                    "h-14 w-full md:w-auto rounded-2xl font-black transition-all order-1 md:order-2",
                    form.formState.isDirty ? "bg-primary text-black hover:bg-primary/90 shadow-[0_0_20px_rgba(var(--primary),0.3)]" : "bg-white/10 text-white/40"
                )}
              >
                {isSubmitting ? t("common.saving") : t("common.save")}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}