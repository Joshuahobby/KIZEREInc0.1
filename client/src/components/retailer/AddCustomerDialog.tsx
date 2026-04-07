import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { posApi } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus } from "lucide-react";

const addCustomerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  nationalId: z.string().min(6, "National ID must be at least 6 characters"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
});

type AddCustomerValues = z.infer<typeof addCustomerSchema>;

interface AddCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddCustomerDialog({ open, onOpenChange }: AddCustomerDialogProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AddCustomerValues>({
    resolver: zodResolver(addCustomerSchema),
    defaultValues: {
      fullName: "",
      nationalId: "",
      phone: "",
      email: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: AddCustomerValues) => posApi.addCustomer(values),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/pos/my-customers"] });
      toast({
        title: data.isNew ? "Customer Created" : "Customer Found",
        description: data.isNew 
          ? `${data.customer.fullName} has been registered successfully.`
          : `${data.customer.fullName} already exists and has been added to your view.`,
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add customer. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: AddCustomerValues) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            {t("pos.addCustomer") || "Add New Customer"}
          </DialogTitle>
          <DialogDescription>
            {t("pos.addCustomerDesc") || "Register a new customer or find an existing one by their National ID."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.fullName") || "Full Name"}</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nationalId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.nationalId") || "National ID / Passport"}</FormLabel>
                  <FormControl>
                    <Input placeholder="119..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fields.phone") || "Phone Number"}</FormLabel>
                    <FormControl>
                      <Input placeholder="07..." {...field} />
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
                    <FormLabel>{t("fields.email") || "Email (Optional)"}</FormLabel>
                    <FormControl>
                      <Input placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
              >
                {t("common.cancel") || "Cancel"}
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.processing") || "Processing..."}
                  </>
                ) : (
                  t("pos.addCustomer") || "Add Customer"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
