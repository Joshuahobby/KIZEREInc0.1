import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { z } from "zod";

// Item categories
const itemCategories = [
  'Electronics', 'Jewelry', 'Documents', 'Accessories', 
  'Clothing', 'Bags', 'Keys', 'Wallets', 'Phones', 
  'Computers', 'Transportation', 'Other'
] as const;

// Item validation schema
const itemRegistrationSchema = z.object({
  name: z.string().min(2, "Item name must be at least 2 characters"),
  category: z.enum(itemCategories, {
    errorMap: () => ({ message: "Please select a valid category" })
  }),
  uniqueIdentifier: z.string().min(3, "Unique identifier must be at least 3 characters"),
  description: z.string().min(10, "Please provide a detailed description").max(500, "Description is too long"),
  location: z.string().min(2, "Location is required").optional(),
  status: z.string().default('Registered'),
  imageUrls: z.array(z.string()).optional().default([]),
  details: z.record(z.any()).optional()
});

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useDropzone } from "react-dropzone";
import { Upload, X, Camera, Info, ArrowRight } from "lucide-react";
import { PageLayout } from "@/components/layout/page-layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";

type FormValues = z.infer<typeof itemRegistrationSchema>;

export default function ItemRegistrationPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const defaultValues: Partial<FormValues> = {
    name: "",
    category: "Electronics",
    uniqueIdentifier: "",
    description: "",
    location: "",
    status: "Registered",
    imageUrls: [],
    details: {}
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(itemRegistrationSchema),
    defaultValues,
    mode: "onChange"
  });

  // Set up image dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: 5,
    onDrop: (acceptedFiles) => {
      // For a real implementation, we would upload these to a server/storage
      // For now we'll just create object URLs for preview
      const newFiles = acceptedFiles.filter(file => 
        !uploadedFiles.some(existingFile => existingFile.name === file.name && existingFile.size === file.size)
      );
      
      if (uploadedFiles.length + newFiles.length > 5) {
        toast({
          title: "Maximum images exceeded",
          description: "You can only upload up to 5 images per item.",
          variant: "destructive"
        });
        return;
      }
      
      setUploadedFiles(prev => [...prev, ...newFiles]);
      
      const newUrls = newFiles.map(file => URL.createObjectURL(file));
      setImageUrls(prev => [...prev, ...newUrls]);
      
      // Update the form value
      form.setValue("imageUrls", [...imageUrls, ...newUrls], { shouldValidate: true });
    }
  });

  const removeImage = (index: number) => {
    const newFiles = [...uploadedFiles];
    const newUrls = [...imageUrls];
    
    // Revoke the object URL to prevent memory leaks
    URL.revokeObjectURL(newUrls[index]);
    
    newFiles.splice(index, 1);
    newUrls.splice(index, 1);
    
    setUploadedFiles(newFiles);
    setImageUrls(newUrls);
    form.setValue("imageUrls", newUrls, { shouldValidate: true });
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      imageUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const mutation = useMutation({
    mutationFn: (data: FormValues) => {
      // In a real implementation, we would upload images and get URLs first
      // For this demo, we'll just pass the local URLs directly
      return apiRequest({
        url: "/api/items",
        method: "POST",
        data: {
          ...data,
          userId: user?.id, // Ensure user ID is included
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      toast({
        title: "Item registered successfully!",
        description: "Your item has been registered in our system.",
      });
      navigate("/dashboard/items");
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "There was an error registering your item. Please try again.",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setErrors([]);
    
    // Validate images
    if (imageUrls.length === 0) {
      setErrors(prev => [...prev, "Please upload at least one image of your item"]);
      setIsSubmitting(false);
      return;
    }
    
    // In a real app, we would upload images to storage and get permanent URLs
    // For this demo, we'll use the object URLs directly
    
    mutation.mutate(data);
  };

  return (
    <PageLayout>
      <div className="container max-w-4xl mx-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="shadow-lg border-t-4 border-t-sky-500">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">Register Your Item</CardTitle>
              <CardDescription className="text-center">
                Secure your valuable possessions by registering them in our system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {errors.length > 0 && (
                <Alert variant="destructive" className="mb-6">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Errors</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Laptop, Watch, etc." {...field} />
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
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {itemCategories.map(category => (
                                <SelectItem key={category} value={category}>
                                  {category}
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
                        <FormLabel>
                          Unique Identifier
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 ml-2 inline cursor-help text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Serial number, IMEI, or any other unique identifier for your item</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Serial number, IMEI, etc." {...field} />
                        </FormControl>
                        <FormDescription>
                          This helps identify your item uniquely in case it's lost
                        </FormDescription>
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
                            placeholder="Provide a detailed description of your item including color, size, brand, distinguishing marks, etc."
                            className="min-h-[120px]"
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
                        <FormLabel>Current Location</FormLabel>
                        <FormControl>
                          <Input placeholder="Where is this item usually kept?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-4">
                    <FormLabel>Item Images</FormLabel>
                    <div 
                      {...getRootProps()} 
                      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                        isDragActive 
                          ? "border-primary bg-primary/5" 
                          : "border-muted-foreground/25 hover:border-primary/50"
                      }`}
                    >
                      <input {...getInputProps()} />
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Upload className="h-10 w-10 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Drag & drop images here, or click to select files
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Upload up to 5 clear images of your item from different angles
                        </p>
                      </div>
                    </div>
                    
                    {imageUrls.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-4">
                        {imageUrls.map((url, index) => (
                          <div key={index} className="relative group">
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.2 }}
                              className="relative aspect-square rounded-md overflow-hidden border border-muted"
                            >
                              <img 
                                src={url} 
                                alt={`Item preview ${index + 1}`} 
                                className="object-cover w-full h-full"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-1 right-1 bg-black/70 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-4 w-4 text-white" />
                              </button>
                            </motion.div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Button 
                      type="submit" 
                      className="w-full bg-sky-500 hover:bg-sky-600"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center">
                          <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-opacity-50 border-t-transparent rounded-full" />
                          Registering...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          Register Item
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-center text-sm text-muted-foreground">
              <p>Your items are secure and only accessible to you and authorized personnel</p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </PageLayout>
  );
}