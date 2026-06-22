import React, { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { AppLayout } from "@/components/layout/admin-layout";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { CustomerDetailsDialog } from "@/components/retailer/CustomerDetailsDialog";
import { AddCustomerDialog } from "@/components/retailer/AddCustomerDialog";
import { ShieldAlert, Mail, Phone, Search, MoreVertical, Filter, UserPlus, ChevronLeft, ChevronRight } from "lucide-react";

export default function RetailerCustomers() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");

  const [page, setPage] = useState(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: customersData, isLoading } = useQuery({
    queryKey: ["/api/pos/my-customers", page],
    queryFn: () => apiGet<{ data: any[]; total: number; totalPages: number; page: number }>(`/api/pos/my-customers?page=${page}&limit=50`),
  });

  const generateStatus = (totalItems: number) => {
    if (totalItems >= 5) return "VIP";
    if (totalItems >= 1) return "Active";
    return "Inactive";
  };

  const customers = (customersData?.data || []).map((c: any) => ({
    id: `CUST-${c.id}`,
    rawId: c.id,
    name: c.fullName || "Unknown",
    email: c.email || "No email",
    phone: c.phone || "No phone",
    totalPurchases: Number(c.totalItems) || 0,
    lastActive: c.lastActivity ? new Date(c.lastActivity).toLocaleDateString() : "Never",
    status: generateStatus(Number(c.totalItems) || 0),
    isBlocked: !!c.isBlocked
  }));

  const filteredCustomers = customers.filter((c: any) => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="container max-w-7xl mx-auto py-6 space-y-6"
      >
        <DashboardPageHeader
          title={t("pos.customers") || "Customer Directory"}
          description={t("pos.customersDesc") || "Manage relationships and view purchase histories."}
          actions={
            <Button 
              className="gap-2 shadow-[0_0_20px_rgba(var(--primary),0.3)]"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <UserPlus className="h-4 w-4" />
              Add Customer
            </Button>
          }
        />

        <Card className="border-border/50 shadow-premium overflow-hidden bg-background/50 backdrop-blur-md rounded-3xl">
          <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <CardTitle className="text-lg font-bold">All Customers</CardTitle>
              <div className="flex w-full sm:w-auto items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 rounded-xl bg-background border-border/50 shadow-sm"
                  />
                </div>
                <Button variant="outline" size="icon" className="shrink-0 rounded-xl">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold text-xs tracking-wider uppercase pl-6">Customer</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider uppercase">Contact</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider uppercase">Purchases</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider uppercase">Last Active</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider uppercase">Status</TableHead>
                    <TableHead className="text-right pr-6"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer: any, i: number) => (
                      <motion.tr 
                        key={customer.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                        className="group hover:bg-muted/30 transition-colors border-b border-border/50 last:border-0"
                      >
                        <TableCell className="pl-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-primary/20">
                              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                {customer.name.split(" ").map((n: string) => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-bold text-sm flex items-center gap-2">
                                {customer.name}
                                {customer.isBlocked && (
                                  <ShieldAlert className="h-3 w-3 text-destructive" />
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono">{customer.id}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span>{customer.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span>{customer.phone}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-lg">{customer.totalPurchases}</div>
                          <p className="text-xs text-muted-foreground">Registered items</p>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {customer.lastActive}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`
                            font-bold uppercase tracking-widest text-[10px]
                            ${customer.status === "VIP" ? "bg-purple-500/10 text-purple-600 border-purple-500/20" : 
                              customer.status === "Active" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : 
                              "bg-muted text-muted-foreground border-border/50"
                            }
                          `}>
                            {customer.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl">
                              <DropdownMenuItem 
                                className="cursor-pointer font-medium"
                                onClick={() => {
                                  setSelectedCustomerId(customer.rawId);
                                  setIsDetailsOpen(true);
                                }}
                              >
                                View Profile & History
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="cursor-pointer font-medium"
                                onClick={() => {
                                  setSelectedCustomerId(customer.rawId);
                                  setIsDetailsOpen(true);
                                }}
                              >
                                Store Settings (Block/Notes)
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        No customers found matching your search.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <AddCustomerDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
        />

        <CustomerDetailsDialog 
          customerId={selectedCustomerId}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
        />

        {/* Pagination */}
        {(customersData?.totalPages ?? 1) > 1 && (
          <div className="flex items-center justify-between px-2">
            <p className="text-sm text-muted-foreground">
              Showing {((page - 1) * 50) + 1}–{Math.min(page * 50, customersData?.total ?? 0)} of {customersData?.total ?? 0} customers
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-xl"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                {page} / {customersData?.totalPages ?? 1}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-xl"
                disabled={page >= (customersData?.totalPages ?? 1)}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
}
