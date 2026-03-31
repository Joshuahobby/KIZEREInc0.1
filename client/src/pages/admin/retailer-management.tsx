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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              Retailers ({retailers.length})
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
            ) : retailers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Store className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No retailers registered yet</p>
                <p className="text-sm">Create your first retailer to enable POS access</p>
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
                  {retailers.map((retailer) => (
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
      </div>
    </PageLayout>
  );
}
