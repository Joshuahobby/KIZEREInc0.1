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
    <Card>
      <CardHeader>
        <CardTitle>{t("profile.editProfile")}</CardTitle>
        <CardDescription>{t("profile.editProfileDesc")}</CardDescription>
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
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("profile.fullName")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("profile.fullNamePlaceholder")} {...field} />
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
                    <FormLabel>{t("profile.username")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("profile.usernamePlaceholder")} {...field} />
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
                    <FormLabel>{t("profile.email")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("profile.emailPlaceholder")} {...field} />
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
                    <FormLabel>{t("profile.phone")}</FormLabel>
                    <FormControl>
                      <Input 
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
            <CardFooter className="flex justify-end gap-2 px-0">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel} 
                disabled={isSubmitting}
              >
                {t("common.cancel")}
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !form.formState.isDirty}
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