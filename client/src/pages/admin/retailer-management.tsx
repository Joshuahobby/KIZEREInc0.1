import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { PageLayout } from "@/components/layout/page-layout";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Store,
  Plus,
  Key,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  Pencil,
  MoreHorizontal,
  Search,
  User,
  Loader2,
  X,
  Clock,
  Wallet,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Retailer {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  apiKey: string;
  subscriptionPlan: string;
  status: string;
  userId: number;
  logoUrl: string | null;
  metadata: any;
  createdAt: string;
  updatedAt: string | null;
}

interface UserResult {
  id: number;
  fullName: string;
  username: string;
  email: string;
  role: string;
  phoneNumber: string | null;
}

/**
 * Searchable user selector that queries /api/admin/users with debounced input.
 */
function UserSearchCombobox({
  selectedUser,
  onSelect,
}: {
  selectedUser: UserResult | null;
  onSelect: (user: UserResult | null) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: usersData, isFetching } = useQuery<{ users: UserResult[]; total: number }>({
    queryKey: ["/api/admin/users", { search: debouncedSearch, pageSize: 10, page: 1 }],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: debouncedSearch,
        pageSize: "10",
        page: "1",
      });
      return apiRequest<{ users: UserResult[]; total: number }>(`/api/admin/users?${params.toString()}`);
    },
    enabled: debouncedSearch.length >= 2,
  });

  const users = usersData?.users ?? [];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (selectedUser) {
    return (
      <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-muted/50">
        <User className="w-4 h-4 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{selectedUser.fullName}</p>
          <p className="text-xs text-muted-foreground truncate">
            ID: {selectedUser.id} &middot; {selectedUser.email} &middot; {selectedUser.role}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={() => onSelect(null)}
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or username..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (searchQuery.length >= 2) setIsOpen(true);
          }}
          className="pl-9"
        />
        {isFetching && (
          <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      {isOpen && debouncedSearch.length >= 2 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-popover border rounded-md shadow-md max-h-[200px] overflow-y-auto">
          {users.length === 0 && !isFetching ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">No users found</p>
          ) : (
            users.map((user) => (
              <button
                key={user.id}
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-accent transition-colors flex items-center gap-2"
                onClick={() => {
                  onSelect(user);
                  setSearchQuery("");
                  setIsOpen(false);
                }}
              >
                <User className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{user.fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    ID: {user.id} &middot; {user.email} &middot; {user.role}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function RetailerManagementPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedRetailer, setSelectedRetailer] = useState<Retailer | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRegenKeyOpen, setIsRegenKeyOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Create form state
  const [selectedLinkedUser, setSelectedLinkedUser] = useState<UserResult | null>(null);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    subscriptionPlan: "basic",
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    status: "",
    subscriptionPlan: "",
  });

  const { data: retailersData, isLoading } = useQuery<{ success: boolean; retailers: Retailer[] }>({
    queryKey: ["/api/pos/admin/retailers"],
  });

  const retailers = retailersData?.retailers ?? [];
  const pendingRetailers = retailers.filter((r) => r.status === "inactive");
  const activeRetailers = retailers.filter((r) => r.status !== "inactive");

  const createMutation = useMutation({
    mutationFn: async (data: typeof createForm & { userId: number }) => {
      const res = await apiRequest<{ success: boolean; retailer: Retailer }>("/api/pos/admin/retailers", {
        method: "POST",
        data: {
          ...data,
          phone: data.phone || undefined,
          address: data.address || undefined,
        },
      });
      return res;
    },
    onSuccess: (data) => {
      toast({ title: "Retailer created", description: `API Key: ${data.retailer.apiKey}` });
      queryClient.invalidateQueries({ queryKey: ["/api/pos/admin/retailers"] });
      setIsCreateOpen(false);
      setCreateForm({ name: "", email: "", phone: "", address: "", subscriptionPlan: "basic" });
      setSelectedLinkedUser(null);
    },
    onError: (err: any) => {
      toast({ title: "Failed to create retailer", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof editForm> }) => {
      const res = await apiRequest<{ success: boolean; retailer: Retailer }>(`/api/pos/admin/retailers/${id}`, {
        method: "PATCH",
        data,
      });
      return res;
    },
    onSuccess: () => {
      toast({ title: "Retailer updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/pos/admin/retailers"] });
      setIsEditOpen(false);
      setSelectedRetailer(null);
    },
    onError: (err: any) => {
      toast({ title: "Failed to update retailer", description: err.message, variant: "destructive" });
    },
  });

  const regenKeyMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest<{ success: boolean; retailer: Retailer }>(
        `/api/pos/admin/retailers/${id}/regenerate-key`,
        { method: "POST" }
      );
      return res;
    },
    onSuccess: (data) => {
      toast({
        title: "API key regenerated",
        description: `New key: ${data.retailer.apiKey}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pos/admin/retailers"] });
      setIsRegenKeyOpen(false);
      setShowApiKey(false);
    },
    onError: (err: any) => {
      toast({ title: "Failed to regenerate key", description: err.message, variant: "destructive" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest<{ success: boolean; retailer: Retailer }>(
        `/api/pos/admin/retailers/${id}/approve`,
        { method: "PATCH" }
      );
      return res;
    },
    onSuccess: (data) => {
      toast({
        title: "Retailer approved",
        description: `${data.retailer.name} is now active.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pos/admin/retailers"] });
    },
    onError: (err: any) => {
      toast({ title: "Failed to approve retailer", description: err.message, variant: "destructive" });
    },
  });

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(true);
    toast({ title: "Copied!", description: "API key copied to clipboard" });
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const openEdit = (retailer: Retailer) => {
    setSelectedRetailer(retailer);
    setEditForm({
      name: retailer.name,
      email: retailer.email,
      phone: retailer.phone ?? "",
      address: retailer.address ?? "",
      status: retailer.status,
      subscriptionPlan: retailer.subscriptionPlan,
    });
    setIsEditOpen(true);
  };

  return (
    <PageLayout>
      <div className="container max-w-7xl mx-auto py-6 space-y-6">
        <DashboardPageHeader
          title="Retailer Management"
          description="Manage POS retailers, API keys, and subscription plans"
          actions={
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Retailer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Retailer</DialogTitle>
                  <DialogDescription>
                    Register a new retailer for POS access. Link to an existing user account.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="create-name">Business Name</Label>
                      <Input
                        id="create-name"
                        value={createForm.name}
                        onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                        placeholder="Shop name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="create-email">Email</Label>
                      <Input
                        id="create-email"
                        type="email"
                        value={createForm.email}
                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                        placeholder="retailer@example.com"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="create-phone">Phone</Label>
                      <Input
                        id="create-phone"
                        value={createForm.phone}
                        onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                        placeholder="+250 7XX XXX XXX"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Linked User Account</Label>
                    <UserSearchCombobox
                      selectedUser={selectedLinkedUser}
                      onSelect={(user) => {
                        setSelectedLinkedUser(user);
                        // Auto-fill email from user if form email is empty
                        if (user && !createForm.email) {
                          setCreateForm((prev) => ({ ...prev, email: user.email }));
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Search for an existing user to link as the retailer operator. Their role will be updated to Retailer.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-address">Address</Label>
                    <Input
                      id="create-address"
                      value={createForm.address}
                      onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                      placeholder="Business address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-plan">Subscription Plan</Label>
                    <Select
                      value={createForm.subscriptionPlan}
                      onValueChange={(v) => setCreateForm({ ...createForm, subscriptionPlan: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button
                    onClick={() => {
                      if (!selectedLinkedUser) return;
                      createMutation.mutate({ ...createForm, userId: selectedLinkedUser.id });
                    }}
                    disabled={createMutation.isPending || !createForm.name || !createForm.email || !selectedLinkedUser}
                  >
                    {createMutation.isPending ? "Creating..." : "Create Retailer"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          }
        />

        {/* Pending Applications Section */}
        {pendingRetailers.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                <Clock className="w-5 h-5" />
                Pending Applications ({pendingRetailers.length})
              </CardTitle>
              <CardDescription>
                These retailers are awaiting approval. Approving promotes their account role to Retailer.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingRetailers.map((retailer) => (
                  <div
                    key={retailer.id}
                    className="flex items-center justify-between rounded-lg border border-amber-200 bg-white p-4 dark:border-amber-700 dark:bg-card"
                  >
                    <div className="space-y-0.5">
                      <p className="font-medium">{retailer.name}</p>
                      <p className="text-sm text-muted-foreground">{retailer.email}</p>
                      {retailer.phone && (
                        <p className="text-xs text-muted-foreground">{retailer.phone}</p>
                      )}
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          className="bg-amber-600 hover:bg-amber-700 text-white"
                          disabled={approveMutation.isPending}
                        >
                          Approve
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Approve {retailer.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will set their account to active, promote their user role to Retailer, and send them an approval email with their API key.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => approveMutation.mutate(retailer.id)}>
                            Approve
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              Active Retailers ({activeRetailers.length})
            </CardTitle>
            <CardDescription>
              All registered POS retailers and their API access status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : activeRetailers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Store className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No active retailers yet</p>
                <p className="text-sm">Approve pending applications above or create a retailer manually</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>API Key</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeRetailers.map((retailer) => (
                    <TableRow key={retailer.id}>
                      <TableCell className="font-medium">{retailer.name}</TableCell>
                      <TableCell>{retailer.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {retailer.subscriptionPlan}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={retailer.status === "active" ? "default" : "destructive"}
                          className="capitalize"
                        >
                          {retailer.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <code className="text-xs bg-muted px-2 py-1 rounded font-mono max-w-[140px] truncate block">
                            {showApiKey && selectedRetailer?.id === retailer.id
                              ? retailer.apiKey
                              : `${retailer.apiKey.slice(0, 8)}...`}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                              setSelectedRetailer(retailer);
                              setShowApiKey(!showApiKey);
                            }}
                          >
                            {showApiKey && selectedRetailer?.id === retailer.id ? (
                              <EyeOff className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleCopyKey(retailer.apiKey)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(retailer)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedRetailer(retailer);
                              setIsRegenKeyOpen(true);
                            }}>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Regenerate Key
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Retailer</DialogTitle>
              <DialogDescription>Update retailer details and subscription plan.</DialogDescription>
            </DialogHeader>
            {selectedRetailer && (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Business Name</Label>
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subscription Plan</Label>
                    <Select
                      value={editForm.subscriptionPlan}
                      onValueChange={(v) => setEditForm({ ...editForm, subscriptionPlan: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={editForm.status}
                    onValueChange={(v) => setEditForm({ ...editForm, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button
                onClick={() =>
                  selectedRetailer &&
                  updateMutation.mutate({ id: selectedRetailer.id, data: editForm })
                }
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Regenerate Key Confirmation */}
        <AlertDialog open={isRegenKeyOpen} onOpenChange={setIsRegenKeyOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Regenerate API Key?</AlertDialogTitle>
              <AlertDialogDescription>
                This will invalidate the current API key for <strong>{selectedRetailer?.name}</strong>.
                Any POS systems using the old key will stop working immediately.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => selectedRetailer && regenKeyMutation.mutate(selectedRetailer.id)}
              >
                {regenKeyMutation.isPending ? "Regenerating..." : "Regenerate Key"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {/* Commission Management Panel */}
        <AdminCommissionsPanel />

      </div>
    </PageLayout>
  );
}

// ─── Admin Commissions Panel ─────────────────────────────────────────────────
const COMMISSION_STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending:    { label: "Pending",    className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  queued:     { label: "Queued",     className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  processing: { label: "Processing", className: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
  paid:       { label: "Paid",       className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  failed:     { label: "Failed",     className: "bg-destructive/10 text-destructive border-destructive/20" },
};

function AdminCommissionsPanel() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");

  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (statusFilter !== "all") params.set("status", statusFilter);

  const { data, isLoading } = useQuery<{ data: any[]; total: number; totalPages: number }>({
    queryKey: ["/api/pos/admin/commissions", page, statusFilter],
    queryFn: () => apiRequest(`/api/pos/admin/commissions?${params.toString()}`),
  });

  const commissions = data?.data || [];
  const totalPages = data?.totalPages || 1;

  const markPaidMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/pos/admin/commissions/${id}`, { method: "PATCH", data: { status: "paid" } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pos/admin/commissions"] });
      toast({ title: "Commission Marked Paid", description: "The payout has been recorded as paid." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const totalPending = commissions
    .filter((c: any) => c.status === "pending" || c.status === "queued")
    .reduce((sum: number, c: any) => sum + parseFloat(c.commissionAmount || "0"), 0);

  return (
    <Card className="mt-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <CardTitle>Commission Payouts</CardTitle>
              <CardDescription>Review and approve retailer commission payouts</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {totalPending > 0 && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Outstanding</p>
                <p className="text-lg font-black text-emerald-600">RWF {totalPending.toLocaleString()}</p>
              </div>
            )}
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="queued">Queued</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : commissions.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Clock className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="font-bold text-sm">No commissions found.</p>
            <p className="text-xs mt-1">Commissions appear when retailers request payouts.</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-6 text-xs uppercase tracking-wider">Retailer</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Date</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Transaction</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Commission</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Wallet</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-right pr-6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((c: any) => {
                  const badge = COMMISSION_STATUS_BADGE[c.status] || COMMISSION_STATUS_BADGE.pending;
                  return (
                    <TableRow key={c.id} className="hover:bg-muted/20 border-b border-border/50 last:border-0">
                      <TableCell className="pl-6 font-medium text-sm">{c.retailerName || `Retailer #${c.retailerId}`}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="font-mono text-sm">{c.currency} {parseFloat(c.transactionValue).toLocaleString()}</TableCell>
                      <TableCell className="font-bold text-emerald-600">+{c.currency} {parseFloat(c.commissionAmount).toLocaleString()}</TableCell>
                      <TableCell className="text-sm font-mono text-muted-foreground">{c.walletPhone || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-widest ${badge.className}`}>
                          {badge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        {(c.status === "queued" || c.status === "pending") && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg text-xs h-7 gap-1.5 text-emerald-600 border-emerald-500/30 hover:bg-emerald-50"
                            onClick={() => markPaidMutation.mutate(c.id)}
                            disabled={markPaidMutation.isPending}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Mark Paid
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-border/50">
                <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
