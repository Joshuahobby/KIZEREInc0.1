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
import { useTranslation } from "@/lib/i18n/useTranslation";

interface ClaimFormProps {
  reportId: number;
  challengeQuestion?: string | null;
  onSuccess: () => void;
}

export function ClaimForm({ reportId, challengeQuestion, onSuccess }: ClaimFormProps) {
  const [images, setImages] = useState<File[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const form = useForm({
    resolver: zodResolver(insertClaimSchema),
    defaultValues: {
      reportId,
      description: "",
      imageUrls: [],
      verificationAnswer: "",
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
        title: t('claims.success_title'),
        description: t('claims.success_desc'),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/claims/my-claims"] });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: t('claims.error_title'),
        description: error.message || t('common.submissionFailed'),
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg flex gap-3">
        <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0" />
        <div className="text-xs text-amber-800">
          <p className="font-bold mb-1">{t('claims.verify_title')}</p>
          <p>{t('claims.verify_desc')}</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => claimMutation.mutate(data))} className="space-y-4">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('claims.proof_label')}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t('claims.proof_placeholder')}
                    className="min-h-[150px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>{t('claims.proof_hint')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {challengeQuestion && (
            <FormField
              control={form.control}
              name="verificationAnswer"
              render={({ field }) => (
                <FormItem className="p-4 bg-primary/5 border border-primary/10 rounded-lg">
                  <FormLabel className="text-primary font-bold flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    {t('claims.question_label')}
                  </FormLabel>
                  <FormDescription className="text-neutral-700 font-medium mb-2">
                    {challengeQuestion}
                  </FormDescription>
                  <FormControl>
                    <Input
                      placeholder={t('claims.question_placeholder')}
                      className="bg-white"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <div className="space-y-2">
            <FormLabel>{t('claims.evidence_label')}</FormLabel>
            <BatchImageUpload onImagesChange={setImages} maxFiles={2} />
            <p className="text-[10px] text-neutral-400">{t('claims.evidence_hint')}</p>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 font-bold"
            disabled={claimMutation.isPending}
          >
            {claimMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('claims.submitting_claim')}
              </>
            ) : (
              <>
                {t('claims.submit_claim')}
                <Send className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
