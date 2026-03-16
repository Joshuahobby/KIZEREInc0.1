import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, UserSearch } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { itemCategories } from "@shared/schema";

const assistedRegistrationSchema = z.object({
  targetUserEmail: z.string().email("Invalid email address"),
  name: z.string().min(2, "Item name is required"),
  category: z.string().min(1, "Category is required"),
  uniqueIdentifier: z.string().min(3, "Serial number is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().optional(),
});

type AssistedRegistrationValues = z.infer<typeof assistedRegistrationSchema>;

interface AssistedRegistrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AssistedRegistrationDialog({ isOpen, onClose }: AssistedRegistrationDialogProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<AssistedRegistrationValues>({
    resolver: zodResolver(assistedRegistrationSchema),
    defaultValues: {
      targetUserEmail: "",
      name: "",
      category: "",
      uniqueIdentifier: "",
      description: "",
      location: "",
    },
  });

  async function onSubmit(data: AssistedRegistrationValues) {
    setIsSubmitting(true);
    try {
      await apiRequest("/api/items", { method: "POST", data });
      toast({
        title: "Success",
        description: "Item registered successfully on behalf of the user.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      onClose();
      form.reset();
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register item.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserSearch className="h-5 w-5 text-primary" />
            Assisted Item Registration
          </DialogTitle>
          <DialogDescription>
            Register an item for a user in the field. They will receive a notification of ownership.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="targetUserEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User Email</FormLabel>
                  <FormControl>
                    <Input placeholder="user@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. iPhone 13" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {itemCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="uniqueIdentifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serial Number / ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Found on the device or document" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Color, condition, and other distinguishing features..." 
                      className="resize-none h-20"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Location (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="City, Building, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Register Item
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
