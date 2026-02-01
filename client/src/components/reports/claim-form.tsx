import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertClaimSchema } from "@shared/schema";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage, 
  FormDescription 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Send, ShieldCheck } from "lucide-react";
import { BatchImageUpload } from "@/components/item-registration/batch-image-upload";

interface ClaimFormProps {
  reportId: number;
  onSuccess: () => void;
}

export function ClaimForm({ reportId, onSuccess }: ClaimFormProps) {
  const [images, setImages] = useState<File[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(insertClaimSchema),
    defaultValues: {
      reportId,
      description: "",
      imageUrls: [],
    },
  });

  const claimMutation = useMutation({
    mutationFn: async (values: any) => {
      // 1. Upload evidence images if any
      let imageUrls: string[] = [];
      if (images.length > 0) {
        const formData = new FormData();
        images.forEach(img => formData.append('images', img));
        const uploadRes = await fetch('/api/upload/images', { method: 'POST', body: formData });
        if (!uploadRes.ok) throw new Error("Evidence upload failed");
        const { urls } = await uploadRes.json();
        imageUrls = urls;
      }

      // 2. Submit claim
      return await apiRequest("/api/claims", {
        method: "POST",
        data: { ...values, imageUrls }
      });
    },
    onSuccess: () => {
      toast({
        title: "Claim Submitted",
        description: "The finder has been notified. You'll receive a notification once they review it.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/claims/my-claims"] });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Submission failed",
        description: error.message || "Could not submit claim. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg flex gap-3">
        <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0" />
        <div className="text-xs text-amber-800">
          <p className="font-bold mb-1">Ownership Verification</p>
          <p>Please provide specific details only the owner would know (e.g., lock screen wallpaper, specific contents, unique marks). Uploading photos of your purchase receipt or the item in your possession helps tremendously.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => claimMutation.mutate(data))} className="space-y-4">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Detailed Proof of Ownership</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe the item in detail, including unique identifiers, contents, or circumstances of loss..." 
                    className="min-h-[150px]"
                    {...field} 
                  />
                </FormControl>
                <FormDescription>Min 50 characters for a valid claim.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <FormLabel>Upload Evidence (Optional)</FormLabel>
            <BatchImageUpload onImagesChange={setImages} maxFiles={2} />
            <p className="text-[10px] text-neutral-400">Upload receipts, old photos of the item, or ID scans.</p>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 font-bold"
            disabled={claimMutation.isPending}
          >
            {claimMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting Claim...
              </>
            ) : (
              <>
                Submit Claim
                <Send className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
