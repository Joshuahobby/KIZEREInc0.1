import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, CheckIcon, Search, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter,
  SheetClose
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// Define the filter schema
const filterSchema = z.object({
  search: z.string().optional(),
  ownerName: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  serialNumber: z.string().optional(),
  minValue: z.string().optional(), // Will be parsed to number during filter application
  maxValue: z.string().optional(), // Will be parsed to number during filter application
  registeredAfter: z.date().optional(),
  registeredBefore: z.date().optional(),
  location: z.string().optional(),
  hasReports: z.boolean().optional(),
  reportType: z.enum(['any', 'lost', 'found']).optional(),
});

// Define the form values type
type FilterFormValues = z.infer<typeof filterSchema>;

// Define the component props
interface AdvancedItemFiltersProps {
  onFilterChange: (filters: FilterFormValues) => void;
  onClearFilters: () => void;
  activeFilters: number; // Number of active filters to display in badge
}

export function AdvancedItemFilters({ 
  onFilterChange, 
  onClearFilters,
  activeFilters
}: AdvancedItemFiltersProps) {
  const [open, setOpen] = useState(false);

  // Default form values
  const defaultValues: Partial<FilterFormValues> = {
    search: '',
    ownerName: '',
    category: '',
    status: '',
    serialNumber: '',
    minValue: '',
    maxValue: '',
    registeredAfter: undefined,
    registeredBefore: undefined,
    location: '',
    hasReports: false,
    reportType: 'any',
  };

  // Initialize the form
  const form = useForm<FilterFormValues>({
    resolver: zodResolver(filterSchema),
    defaultValues,
  });

  // Handle form submission
  function onSubmit(data: FilterFormValues) {
    onFilterChange(data);
    setOpen(false);
  }

  // Reset form and filters
  function handleReset() {
    form.reset(defaultValues);
    onClearFilters();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative gap-1">
          <Search className="h-4 w-4 mr-1" />
          Advanced Search
          {activeFilters > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 h-5 min-w-5 rounded-full">
              {activeFilters}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Advanced Item Search</SheetTitle>
          <SheetDescription>
            Use the filters below to narrow down your search for specific items
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="search"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name or Description</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search by name or description..." className="pl-8" {...field} />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Search by item name, description, or identifier
                    </FormDescription>
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ownerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Owner's name..." {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="serialNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serial Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Serial/model number..." {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">All Categories</SelectItem>
                          <SelectItem value="electronics">Electronics</SelectItem>
                          <SelectItem value="documents">Documents</SelectItem>
                          <SelectItem value="clothing">Clothing</SelectItem>
                          <SelectItem value="jewelry">Jewelry</SelectItem>
                          <SelectItem value="accessories">Accessories</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
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
                          <SelectItem value="">All Statuses</SelectItem>
                          <SelectItem value="Registered">Registered</SelectItem>
                          <SelectItem value="Lost">Lost</SelectItem>
                          <SelectItem value="Found">Found</SelectItem>
                          <SelectItem value="Recovered">Recovered</SelectItem>
                          <SelectItem value="Archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="minValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min Value ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          placeholder="Minimum value" 
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="maxValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Value ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          placeholder="Maximum value" 
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="registeredAfter"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Registered After</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="registeredBefore"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Registered Before</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Known Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Location..." {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <Separator />
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="hasReports"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Has Reports</FormLabel>
                        <FormDescription>
                          Show only items with associated reports
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                {form.watch('hasReports') && (
                  <FormField
                    control={form.control}
                    name="reportType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Report Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Report type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="any">Any Reports</SelectItem>
                            <SelectItem value="lost">Lost Reports</SelectItem>
                            <SelectItem value="found">Found Reports</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                )}
              </div>
              
              <SheetFooter className="flex justify-between gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleReset}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reset All Filters
                </Button>
                <Button type="submit">
                  <CheckIcon className="mr-2 h-4 w-4" />
                  Apply Filters
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}