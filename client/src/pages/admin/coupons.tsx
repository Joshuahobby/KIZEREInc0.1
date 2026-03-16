import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CouponService } from "@/services/coupon.service";
import { AppLayout } from "@/components/layout/admin-layout";
import { cn } from "@/lib/utils";
import * as React from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Ticket, 
  Edit2, 
  Trash2, 
  Loader2, 
  Filter,
  Calendar,
  Layers,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCouponSchema, InsertCoupon, couponTypes, couponApplicableTypes } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";

export default function CouponManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/coupons", search, statusFilter],
    queryFn: () => CouponService.getCoupons({ 
      search, 
      status: statusFilter === "all" ? undefined : statusFilter 
    })
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertCoupon) => CouponService.createCoupon(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coupons"] });
      setIsCreateOpen(false);
      toast({ title: "Success", description: "Coupon created successfully" });
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create coupon", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertCoupon> }) => CouponService.updateCoupon(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coupons"] });
      setIsCreateOpen(false);
      setEditingCoupon(null);
      toast({ title: "Success", description: "Coupon updated successfully" });
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update coupon", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => CouponService.deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coupons"] });
      toast({ title: "Success", description: "Coupon deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete coupon", variant: "destructive" });
    }
  });

  const form = useForm<InsertCoupon>({
    resolver: zodResolver(insertCouponSchema),
    defaultValues: {
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: "0",
      applicableType: "all",
      validFrom: new Date(),
      validUntil: null,
      usageLimit: null,
      minPurchase: "0",
      maxDiscount: null,
      status: "active"
    }
  });

  const onSubmit = (values: InsertCoupon) => {
    if (editingCoupon) {
      updateMutation.mutate({ id: editingCoupon.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleEdit = (coupon: any) => {
    setEditingCoupon(coupon);
    form.reset({
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType as any,
      discountValue: coupon.discountValue.toString(),
      applicableType: coupon.applicableType as any,
      validFrom: new Date(coupon.validFrom),
      validUntil: coupon.validUntil ? new Date(coupon.validUntil) : null,
      usageLimit: coupon.usageLimit,
      minPurchase: coupon.minPurchase?.toString() || "0",
      maxDiscount: coupon.maxDiscount?.toString() || null,
      status: coupon.status as any
    });
    setIsCreateOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tightest">Offer Codes</h1>
            <p className="text-muted-foreground font-medium">Manage promotional discounts and special offers</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button 
                className="rounded-2xl h-12 px-6 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90"
                onClick={() => {
                  setEditingCoupon(null);
                  form.reset({
                    code: "",
                    description: "",
                    discountType: "percentage",
                    discountValue: "0",
                    applicableType: "all",
                    validFrom: new Date(),
                    validUntil: null,
                    usageLimit: null,
                    minPurchase: "0",
                    maxDiscount: null,
                    status: "active"
                  });
                }}
              >
                <Plus className="w-5 h-5 mr-2" />
                Create New Coupon
              </Button>
            </DialogTrigger>
            <DialogContent 
              className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-8 border-border/40 shadow-2xl"
              aria-describedby="offer-code-description"
            >
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">{editingCoupon ? "Edit Promotional Code" : "New Promotional Code"}</DialogTitle>
                <DialogDescription id="offer-code-description" className="font-medium text-muted-foreground/60">
                  {editingCoupon ? "Modify the existing offer terms" : "Define terms and validity for the new offer"}
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-xs uppercase tracking-widest opacity-60">Coupon Code</FormLabel>
                          <FormControl>
                            <Input placeholder="SAVE20" {...field} className="h-12 bg-muted/30 border-none rounded-xl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="applicableType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-xs uppercase tracking-widest opacity-60">Applicable For</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 bg-muted/30 border-none rounded-xl">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="all">Global (All Services)</SelectItem>
                              {couponApplicableTypes.filter(t => t !== 'all').map(type => (
                                <SelectItem key={type} value={type}>{type.replace('_', ' ')}</SelectItem>
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
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-xs uppercase tracking-widest opacity-60">Description</FormLabel>
                        <FormControl>
                          <Input placeholder="20% off for all premium lost item reports" {...field} value={field.value || ""} className="h-12 bg-muted/30 border-none rounded-xl" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-primary/5 rounded-2xl border border-primary/10">
                    <FormField
                      control={form.control}
                      name="discountType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-xs uppercase tracking-widest opacity-60">Discount Method</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-11 bg-background border-border/40 rounded-xl shadow-sm">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl">
                              {couponTypes.map(type => (
                                <SelectItem key={type} value={type}>{type === 'percentage' ? 'Percentage %' : 'Fixed Amount (RWF)'}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="discountValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-xs uppercase tracking-widest opacity-60">Value</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} className="h-11 bg-background border-border/40 rounded-xl shadow-sm" />
                          </FormControl>
                          <FormDescription className="text-[10px] font-medium opacity-60">Amount in RWF or Percentage</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="usageLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-xs uppercase tracking-widest opacity-60 text-muted-foreground">Total Usage Limit</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="Unlimited" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)} className="h-12 bg-muted/30 border-none rounded-xl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="minPurchase"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-xs uppercase tracking-widest opacity-60 text-muted-foreground">Min Purchase Required</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} className="h-12 bg-muted/30 border-none rounded-xl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="validFrom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-xs uppercase tracking-widest opacity-60 text-muted-foreground">Starts From</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value} onChange={(e) => field.onChange(new Date(e.target.value))} className="h-12 bg-muted/30 border-none rounded-xl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="validUntil"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold text-xs uppercase tracking-widest opacity-60 text-muted-foreground">Expires On</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : (field.value || "")} onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)} className="h-12 bg-muted/30 border-none rounded-xl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" className="w-full h-14 rounded-2xl font-black text-lg bg-primary shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all" disabled={createMutation.isPending || updateMutation.isPending}>
                    {createMutation.isPending || updateMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingCoupon ? "Update Coupon" : "Publish Coupon")}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-none bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white rounded-3xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Ticket className="w-24 h-24 rotate-12" />
            </div>
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Total Active</CardDescription>
              <CardTitle className="text-4xl font-black">{data?.coupons.filter(c => c.status === 'active').length || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-xs font-medium text-emerald-400">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Ready for checkout
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/40 bg-background/50 backdrop-blur-sm rounded-3xl">
            <CardHeader className="pb-2">
              <CardDescription className="font-bold uppercase tracking-widest text-[10px]">Total Usage</CardDescription>
              <CardTitle className="text-4xl font-black">{data?.coupons.reduce((acc, curr) => acc + curr.usageCount, 0) || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs font-medium text-muted-foreground">Times codes applied</div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/40 bg-background/50 backdrop-blur-md rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none">
          <CardHeader className="border-b border-border/40 pb-6 px-8">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                <Input 
                  placeholder="Search by code or description..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-11 bg-muted/20 border-none rounded-xl focus-visible:ring-primary/30"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-11 w-40 rounded-xl bg-muted/20 border-none">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="h-64 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary opacity-50" />
                <p className="text-muted-foreground text-sm font-medium animate-pulse">Syncing coupon database...</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-border/40">
                    <TableHead className="py-4 px-8 font-black text-[10px] uppercase tracking-widest">Offer Info</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest">Discount</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest">Usage</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest">Validity</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest">Status</TableHead>
                    <TableHead className="text-right px-8 font-black text-[10px] uppercase tracking-widest">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.coupons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2 opacity-30">
                          <Ticket className="w-12 h-12" />
                          <p className="font-bold text-lg">No offer codes found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.coupons.map((coupon) => (
                      <TableRow key={coupon.id} className="group hover:bg-muted/10 transition-colors border-border/40">
                        <TableCell className="py-6 px-8">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                              <Ticket className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-black text-sm tracking-tight">{coupon.code}</div>
                              <div className="text-[10px] text-muted-foreground font-medium line-clamp-1 max-w-[200px]">
                                {coupon.description || "No description provided"}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="rounded-lg py-1 px-3 border-emerald-500/20 text-emerald-600 bg-emerald-500/5 font-black text-xs">
                            {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `${Number(coupon.discountValue).toLocaleString()} RWF`}
                          </Badge>
                          <div className="text-[9px] font-bold text-muted-foreground mt-1 uppercase tracking-tighter opacity-50">
                            {coupon.applicableType === 'all' ? 'Global' : coupon.applicableType.replace('_', ' ')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                             <div className="text-sm font-black tracking-tight">{coupon.usageCount}</div>
                             <div className="text-[10px] font-bold text-muted-foreground opacity-40">/ {coupon.usageLimit || '∞'}</div>
                          </div>
                          <div className="w-24 h-1 bg-muted rounded-full mt-2 overflow-hidden">
                             {React.createElement("div", {
                              className: "h-full bg-primary transition-all duration-700",
                              style: { width: `${coupon.usageLimit ? (coupon.usageCount / coupon.usageLimit) * 100 : 0}%` }
                             })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-xs font-bold text-muted-foreground/80 space-x-1">
                            <Calendar className="w-3 h-3 opacity-50" />
                            <span>{format(new Date(coupon.validFrom), "MMM d, yyyy")}</span>
                          </div>
                          {coupon.validUntil ? (
                            <div className="flex items-center text-[10px] font-medium text-muted-foreground/60 space-x-1 mt-1">
                              <Clock className="w-3 h-3 opacity-30" />
                              <span>Until {format(new Date(coupon.validUntil), "MMM d, yyyy")}</span>
                            </div>
                          ) : (
                            <div className="text-[10px] font-medium text-emerald-500/60 mt-1 uppercase tracking-widest">Never Expires</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              "rounded-full px-4 py-0.5 text-[10px] font-black uppercase tracking-widest",
                              coupon.status === 'active' ? "bg-emerald-500/10 text-emerald-600 border-none px-2" : "bg-slate-500/10 text-slate-400 border-none px-2"
                            )}
                          >
                            {coupon.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right px-8">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 transition-transform">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="w-9 h-9 rounded-xl hover:bg-primary/10 hover:text-primary"
                              onClick={() => handleEdit(coupon)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="w-9 h-9 rounded-xl hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this coupon?")) {
                                  deleteMutation.mutate(coupon.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
          <div className="p-8 border-t border-border/40 bg-muted/10">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground/60">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Active</span>
                </div>
                 <div className="flex items-center space-x-1.5">
                  <div className="w-2 h-2 rounded-full bg-orange-400" />
                  <span>Limited</span>
                </div>
                 <div className="flex items-center space-x-1.5">
                  <div className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>Inactive</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span>Total results:</span>
                <span className="text-foreground">{data?.total || 0}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
