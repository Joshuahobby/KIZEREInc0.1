import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, User as UserIcon, Mail, Phone, Upload } from "lucide-react";

interface ProfileEditFormProps {
  user: User;
  onCancel: () => void;
  onSuccess: () => void;
}

export function ProfileEditForm({ user, onCancel, onSuccess }: ProfileEditFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarUrl || null);

  // Define the form schema
  const profileFormSchema = z.object({
    fullName: z.string().min(2, t("validation.fullNameRequired")),
    email: z.string().email(t("validation.emailInvalid")),
    phoneNumber: z.string().optional(),
    avatarUrl: z.string().optional()
  });

  type ProfileFormValues = z.infer<typeof profileFormSchema>;

  // Initialize the form with current user data
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber || "",
      avatarUrl: user.avatarUrl || ""
    }
  });

  // API mutation for updating the profile
  const updateProfileMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      const response = await apiRequest("PUT", "/api/me", values);
      return response.json();
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: t("profile.updateError"),
        description: error.message || t("profile.updateErrorDesc"),
        variant: "destructive"
      });
    }
  });

  // For MVP, the avatar upload is simplified
  // In a real implementation, we would upload to a storage service
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // For now, just create a local preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        setAvatarPreview(preview);
        form.setValue("avatarUrl", preview);
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper function to generate initials from user's name
  const getInitials = (name: string) => {
    if (!name) return "??";
    return name.split(" ")
      .map(part => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
  };

  // Form submission handler
  const onSubmit = (values: ProfileFormValues) => {
    updateProfileMutation.mutate(values);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("profile.editProfile")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarPreview || ""} alt={form.getValues("fullName")} />
                <AvatarFallback className="text-2xl">
                  {getInitials(form.getValues("fullName"))}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2">
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => document.getElementById("avatar")?.click()}
                >
                  <Upload className="h-4 w-4" />
                  {t("profile.uploadAvatar")}
                </Button>
              </div>
            </div>

            {/* Full Name */}
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("profile.fullName")}</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2 relative">
                      <UserIcon className="h-4 w-4 text-muted-foreground absolute left-3" />
                      <Input
                        {...field}
                        placeholder={t("profile.fullNamePlaceholder")}
                        className="pl-10"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("profile.email")}</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2 relative">
                      <Mail className="h-4 w-4 text-muted-foreground absolute left-3" />
                      <Input
                        {...field}
                        placeholder={t("profile.emailPlaceholder")}
                        className="pl-10"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone Number */}
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("profile.phoneNumber")}</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2 relative">
                      <Phone className="h-4 w-4 text-muted-foreground absolute left-3" />
                      <Input
                        {...field}
                        placeholder={t("profile.phoneNumberPlaceholder")}
                        className="pl-10"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    {t("profile.phoneNumberDesc")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button 
          variant="outline" 
          onClick={onCancel}
          disabled={updateProfileMutation.isPending}
        >
          {t("common.cancel")}
        </Button>
        <Button 
          onClick={form.handleSubmit(onSubmit)}
          disabled={updateProfileMutation.isPending}
        >
          {updateProfileMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("common.saving")}
            </>
          ) : (
            t("common.save")
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}