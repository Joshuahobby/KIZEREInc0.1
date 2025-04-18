import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

// UI Components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Shield, CheckCircle2 } from "lucide-react";

// Schema for transfer form
const transferSchema = z.object({
  recipientEmail: z.string().email("Please enter a valid email address"),
  confirmTransfer: z.literal(true, {
    errorMap: () => ({ message: "You must confirm the transfer" }),
  }),
});

type TransferFormValues = z.infer<typeof transferSchema>;

export function OwnershipTransferDialog({ 
  itemId,
  itemName,
  onSuccess
}: { 
  itemId: number;
  itemName: string;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [transferStep, setTransferStep] = useState<'form' | 'confirmation' | 'success'>('form');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create form with validation
  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      recipientEmail: "",
      confirmTransfer: false,
    },
  });

  // Transfer mutation
  const transferMutation = useMutation({
    mutationFn: async (data: TransferFormValues) => {
      const response = await apiRequest("POST", `/api/items/${itemId}/transfer`, {
        recipientEmail: data.recipientEmail,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to transfer ownership");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      setTransferStep('success');
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/items', itemId] });
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Transfer failed",
        description: error.message,
        variant: "destructive",
      });
      setTransferStep('form');
    },
  });

  function onSubmit(data: TransferFormValues) {
    // First show confirmation step
    if (transferStep === 'form') {
      setTransferStep('confirmation');
      return;
    }
    
    // Then actually submit
    if (transferStep === 'confirmation') {
      transferMutation.mutate(data);
    }
  }

  function closeDialog() {
    setOpen(false);
    // Reset form and step after dialog closes
    setTimeout(() => {
      form.reset();
      setTransferStep('form');
    }, 300);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 group">
          <Send className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          Transfer Ownership
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <AnimatePresence mode="wait">
          {transferStep === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <DialogHeader>
                <DialogTitle>Transfer Item Ownership</DialogTitle>
                <DialogDescription>
                  Transfer ownership of "{itemName}" to another user.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                  <FormField
                    control={form.control}
                    name="recipientEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient Email</FormLabel>
                        <FormControl>
                          <Input placeholder="email@example.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          The email of the user who will receive ownership of this item.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="confirmTransfer"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            className="h-4 w-4 mt-1"
                            checked={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>I confirm this transfer</FormLabel>
                          <FormDescription>
                            This action cannot be undone. The recipient will become the new owner.
                          </FormDescription>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button type="submit">Continue</Button>
                  </DialogFooter>
                </form>
              </Form>
            </motion.div>
          )}
          
          {transferStep === 'confirmation' && (
            <motion.div
              key="confirmation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <DialogHeader>
                <DialogTitle>Confirm Transfer</DialogTitle>
                <DialogDescription>
                  Please review the ownership transfer details below.
                </DialogDescription>
              </DialogHeader>
              
              <div className="border rounded-md p-4 bg-background/50">
                <div className="font-medium mb-2">Transfer details:</div>
                <div className="grid grid-cols-[auto_1fr] gap-x-2 text-sm">
                  <span className="text-muted-foreground">Item:</span>
                  <span className="font-medium">{itemName}</span>
                  
                  <span className="text-muted-foreground">New owner:</span>
                  <span className="font-medium">{form.getValues().recipientEmail}</span>
                  
                  <span className="text-muted-foreground">Current owner:</span>
                  <span className="font-medium">You</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 py-2 px-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-md">
                <Shield className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">
                  This action is permanent. After transferring, you will no longer be the owner of this item.
                </p>
              </div>
              
              <DialogFooter className="gap-2 sm:gap-0 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setTransferStep('form')}
                  disabled={transferMutation.isPending}
                >
                  Back
                </Button>
                <Button 
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={transferMutation.isPending}
                  className="gap-2"
                >
                  {transferMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirm Transfer
                </Button>
              </DialogFooter>
            </motion.div>
          )}
          
          {transferStep === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center pt-4 pb-2"
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="rounded-full bg-green-100 p-3">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                
                <div>
                  <h3 className="font-semibold text-xl">Transfer Complete</h3>
                  <p className="text-muted-foreground mt-1">
                    Ownership of "{itemName}" has been successfully transferred to {form.getValues().recipientEmail}.
                  </p>
                </div>
                
                <Button onClick={closeDialog} className="mt-4">Done</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}