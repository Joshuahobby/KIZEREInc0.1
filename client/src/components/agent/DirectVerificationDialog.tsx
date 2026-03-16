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
import { Loader2, ShieldCheck, Search } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const directVerificationSchema = z.object({
  userQuery: z.string().min(1, "User ID, Email or Username is required"),
  documentType: z.enum(["nid", "passport", "drivers_license"]),
  comment: z.string().min(5, "Reason for direct verification is required"),
});

type DirectVerificationValues = z.infer<typeof directVerificationSchema>;

interface DirectVerificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DirectVerificationDialog({ isOpen, onClose }: DirectVerificationDialogProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [foundUser, setFoundUser] = React.useState<any>(null);
  const [isSearching, setIsSearching] = React.useState(false);

  const form = useForm<DirectVerificationValues>({
    resolver: zodResolver(directVerificationSchema),
    defaultValues: {
      userQuery: "",
      documentType: "nid",
      comment: "",
    },
  });

  const searchUser = async () => {
    const query = form.getValues("userQuery");
    if (!query) return;

    setIsSearching(true);
    setFoundUser(null);
    try {
      // Search for user
      const data = await apiRequest<any>(`/api/admin/users?search=${query}&page=1&pageSize=1`);
      if (data.users && data.users.length > 0) {
        setFoundUser(data.users[0]);
      } else {
        toast({
          title: "Not Found",
          description: "No user found matching that criteria.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setIsSearching(false);
    }
  };

  async function onSubmit(data: DirectVerificationValues) {
    if (!foundUser) {
      toast({
        title: "Error",
        description: "Please find and select a user first.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("/api/verification/verify-direct", {
        method: "POST",
        data: {
          userId: foundUser.id,
          documentType: data.documentType,
          comment: data.comment,
        }
      });
      
      toast({
        title: "Verified",
        description: `User ${foundUser.username} has been verified directly.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/admin/verifications"] });
      onClose();
      form.reset();
      setFoundUser(null);
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify user.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            Field Verification
          </DialogTitle>
          <DialogDescription>
            Verify a user identity directly in the field after physical ID inspection.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="flex gap-2 items-end">
              <FormField
                control={form.control}
                name="userQuery"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Find User (Email/Username/Phone)</FormLabel>
                    <FormControl>
                      <Input placeholder="Search user..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="button" 
                variant="secondary" 
                onClick={searchUser} 
                disabled={isSearching}
                className="mb-[2px]"
              >
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>

            {foundUser && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 animate-in fade-in slide-in-from-top-2">
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Target User</p>
                <p className="text-sm font-semibold">{foundUser.fullName}</p>
                <p className="text-xs text-muted-foreground">{foundUser.email} • @{foundUser.username}</p>
                <p className="text-[10px] mt-1 italic text-muted-foreground">Current Status: {foundUser.verificationStatus || 'unverified'}</p>
              </div>
            )}

            <FormField
              control={form.control}
              name="documentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verified Document Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select document" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="nid">National ID</SelectItem>
                      <SelectItem value="passport">Passport</SelectItem>
                      <SelectItem value="drivers_license">Driver's License</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Field Observation Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="e.g. Identity confirmed via physical NID card #..." 
                      className="resize-none h-20"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !foundUser} className="bg-emerald-600 hover:bg-emerald-700">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Direct Verification
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
