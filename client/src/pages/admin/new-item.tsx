import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Package, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { CommandCenterLayout } from "@/components/layouts/command-center-layout";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// Define form schema
const itemFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  category: z.string().min(1, "Please select a category"),
  description: z.string().optional(),
  estimatedValue: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  lastKnownLocation: z.string().optional(),
  serialNumber: z.string().optional(),
  modelNumber: z.string().optional(),
  ownerId: z.string().optional(),
  status: z.enum(["Registered", "Lost", "Found", "Recovered", "Archived"]).default("Registered"),
});

type ItemFormValues = z.infer<typeof itemFormSchema>;

export default function NewItem() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default values for the form
  const defaultValues: Partial<ItemFormValues> = {
    status: "Registered",
    category: "",
    description: "",
    lastKnownLocation: "",
  };

  // Form definition
  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues,
  });

  // Handle form submission
  async function onSubmit(data: ItemFormValues) {
    setIsSubmitting(true);
    try {
      // API call to create the item
      const response = await apiRequest('/api/admin/items', {
        method: 'POST',
        data,
      });

      if (response && response.success) {
        toast({
          title: t("admin_pages.item_created"),
          description: t("admin_pages.item_created_desc", { name: data.name }),
        });

        // Navigate to the item management page
        navigate('/admin/item-management');
      } else {
        throw new Error((response && response.message) || "Failed to create item");
      }
    } catch (error) {
      console.error("Error creating item:", error);
      toast({
        title: t("admin_pages.error_creating_item"),
        description: error instanceof Error ? error.message : t("admin_pages.unexpected_error"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <CommandCenterLayout>
      <div className="col-span-4 space-y-6">
        <Button
          variant="outline"
          className="mb-4"
          onClick={() => navigate('/admin/item-management')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> {t("admin_pages.back_to_items")}
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="mr-2 h-5 w-5" /> {t("admin_pages.add_new_item")}
            </CardTitle>
            <CardDescription>
              {t("admin_pages.add_new_item_desc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Item Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("admin_pages.item_name")}*</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter item name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Category */}
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("admin_pages.category")}*</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="electronics">Electronics</SelectItem>
                            <SelectItem value="documents">Documents</SelectItem>
                            <SelectItem value="clothing">Clothing</SelectItem>
                            <SelectItem value="jewelry">Jewelry</SelectItem>
                            <SelectItem value="accessories">Accessories</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Value */}
                  <FormField
                    control={form.control}
                    name="estimatedValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("admin_pages.estimated_value")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>{t("admin_pages.estimated_value_hint")}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Location */}
                  <FormField
                    control={form.control}
                    name="lastKnownLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("admin_pages.last_location")}</FormLabel>
                        <FormControl>
                          <Input placeholder="Where was this item last seen?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Serial Number */}
                  <FormField
                    control={form.control}
                    name="serialNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("admin_pages.serial_number")}</FormLabel>
                        <FormControl>
                          <Input placeholder="Serial number (if applicable)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Model Number */}
                  <FormField
                    control={form.control}
                    name="modelNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("admin_pages.model_number")}</FormLabel>
                        <FormControl>
                          <Input placeholder="Model number (if applicable)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Owner ID */}
                  <FormField
                    control={form.control}
                    name="ownerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("admin_pages.owner_id")}</FormLabel>
                        <FormControl>
                          <Input placeholder="User ID of the owner (optional)" {...field} />
                        </FormControl>
                        <FormDescription>{t("admin_pages.owner_id_hint")}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Status */}
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("admin_pages.status")}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Registered">Registered</SelectItem>
                            <SelectItem value="Lost">Lost</SelectItem>
                            <SelectItem value="Found">Found</SelectItem>
                            <SelectItem value="Recovered">Recovered</SelectItem>
                            <SelectItem value="Archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("admin_pages.description")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide a detailed description of the item"
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Image upload placeholder - to be implemented */}
                <div className="border border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Upload className="h-8 w-8" />
                  <p className="text-sm">{t("admin_pages.image_upload_coming")}</p>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="mr-2"
                    onClick={() => navigate('/admin/item-management')}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? t("admin_pages.creating") : t("admin_pages.create_item")}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </CommandCenterLayout>
  );
}