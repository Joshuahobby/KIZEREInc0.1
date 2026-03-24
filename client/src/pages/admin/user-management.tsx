import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { UserFilters, type UserFilters as UserFiltersType } from "@/components/user-management/user-filters";
import { UserTable } from "@/components/user-management/user-table";
import { type User } from "@shared/schema";
import { UserActivityTimeline } from "@/components/user-management/user-activity-timeline";
import { UserStatusHistory } from "@/components/user-management/user-status-history";
import { UserWarnings } from "@/components/user-management/user-warnings";
import { UserVerificationDocuments } from "@/components/user-management/user-verification-documents";
import { UserVerificationDialog } from "@/components/user-management/user-verification-dialog";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { Loader2, UserPlus, ArrowLeft, Trash2, Edit, AlertTriangle, Shield, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";

import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { AuthWall } from "@/components/ui/auth-wall";
import { PageLayout } from "@/components/layout/page-layout";

const userEditSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
  role: z.string(),
  status: z.string(),
});

interface UserResponse {
  users: User[];
  total: number;
  pages: number;
}

export default function UserManagementPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading: isLoadingAuth } = useAuth();
  const [, navigate] = useLocation();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<UserFiltersType>({
    search: "",
    role: "",
    status: "",
    verificationStatus: "",
    activityLevel: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [verificationUser, setVerificationUser] = useState<User | null>(null);

  // Mutation for updating user details
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: number; data: any }) => {
      return apiRequest(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        data
      });
    },
    onSuccess: () => {
      toast({
        title: "User updated",
        description: "User details have been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setShowEditDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error updating user",
        description: error.message || "An error occurred while updating the user details.",
        variant: "destructive",
      });
    }
  });

  // Mutation for deleting user
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: "User deleted",
        description: "User has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setShowDeleteDialog(false);
      setShowUserDetail(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting user",
        description: error.message || "An error occurred while deleting the user.",
        variant: "destructive",
      });
    }
  });

  // Mutation for changing user status
  const changeStatusMutation = useMutation({
    mutationFn: async ({ userId, status, reason }: { userId: number; status: string; reason?: string }) => {
      return apiRequest(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        data: { status, reason }
      });
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "User status has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating status",
        description: error.message || "An error occurred while updating the user status.",
        variant: "destructive",
      });
    }
  });

  // Mutation for changing user role
  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      return apiRequest(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        data: { role }
      });
    },
    onSuccess: () => {
      toast({
        title: "Role updated",
        description: "User role has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating role",
        description: error.message || "An error occurred while updating the user role.",
        variant: "destructive",
      });
    }
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/admin/users', currentPage, pageSize, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
      });
      if (filters.search) params.append('search', filters.search);
      if (filters.role) params.append('role', filters.role);
      if (filters.status) params.append('status', filters.status);
      if (filters.verificationStatus) params.append('verificationStatus', filters.verificationStatus);
      if (filters.activityLevel) params.append('activityLevel', filters.activityLevel);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
      return apiRequest<UserResponse>(`/api/admin/users?${params.toString()}`);
    },
  });

  const handleExport = async (format: 'csv' | 'excel') => {
    const params = new URLSearchParams({ format });
    if (filters.search) params.append('search', filters.search);
    if (filters.role) params.append('role', filters.role);
    if (filters.status) params.append('status', filters.status);
    if (filters.verificationStatus) params.append('verificationStatus', filters.verificationStatus);
    if (filters.activityLevel) params.append('activityLevel', filters.activityLevel);
    if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
    if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
    window.open(`/api/admin/users/export?${params.toString()}`, '_blank');
    toast({
      title: "Export started",
      description: `User data is being exported as ${format.toUpperCase()}.`,
    });
  };

  const handleFilterChange = (newFilters: UserFiltersType) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowUserDetail(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditDialog(true);
  };

  const handleStatusChange = (userId: number, status: string) => {
    changeStatusMutation.mutate({
      userId,
      status,
      reason: `Status changed to ${status} by admin`
    });
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const handleVerifyUser = (user: User) => {
    setVerificationUser(user);
    setShowVerificationDialog(true);
  };

  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading users",
        description: "Failed to load user data. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  if (!user && !isLoadingAuth) {
    return (
      <PageLayout>
        <div className="container max-w-7xl mx-auto py-20 flex items-center justify-center">
          <AuthWall returnUrl="/admin/users" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto py-6">
        <DashboardPageHeader
          title="User Management"
          description="View and manage all users in the system"
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/admin/command-center")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Command Center
              </Button>
              <Button onClick={() => navigate("/admin/users/new")}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </div>
          }
        />

        <Tabs defaultValue="all-users" className="mt-6">
          <TabsList>
            <TabsTrigger value="all-users">All Users</TabsTrigger>
            <TabsTrigger value="pending-verification">Pending Verification</TabsTrigger>
            <TabsTrigger value="recently-active">Recently Active</TabsTrigger>
            <TabsTrigger value="warnings">Users with Warnings</TabsTrigger>
          </TabsList>

          <TabsContent value="all-users" className="space-y-6 mt-6">
            <UserFilters onFilterChange={handleFilterChange} onExport={handleExport} />

            {isLoading ? (
              <div className="flex items-center justify-center py-20 bg-background/50 backdrop-blur-sm rounded-3xl border-2 border-dashed border-primary/10">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-primary/60" />
                  <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading identity vault...</p>
                </div>
              </div>
            ) : data?.users && data.users.length > 0 ? (
              <div className="space-y-6">
                <UserTable
                  users={data.users}
                  onViewDetails={handleViewUser}
                  onEdit={handleEditUser}
                  onDelete={handleDeleteUser}
                  onVerify={handleVerifyUser}
                  onStatusChange={(id, s) => changeStatusMutation.mutate({ userId: id, status: s })}
                  onRoleChange={(id, r) => changeRoleMutation.mutate({ userId: id, role: r })}
                />
                
                {/* External Pagination */}
                {data.pages > 1 && (
                  <div className="flex items-center justify-between px-2 py-4">
                    <p className="text-xs font-medium text-muted-foreground">
                      Showing {data.users.length} of {data.total} users
                    </p>
                    <div className="flex items-center gap-2">
                       <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={currentPage === 1}
                        onClick={() => handlePageChange(currentPage - 1)}
                        className="h-8 border-primary/5 hover:bg-primary/5"
                       >
                         Previous
                       </Button>
                       <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, data.pages) }, (_, i) => {
                            const pageNum = i + 1; // Simplified for now
                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                className={cn(
                                    "h-8 w-8 p-0 border-primary/5",
                                    currentPage === pageNum && "shadow-md shadow-primary/20"
                                )}
                                onClick={() => handlePageChange(pageNum)}
                              >
                                {pageNum}
                              </Button>
                            )
                          })}
                       </div>
                       <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={currentPage === data.pages}
                        onClick={() => handlePageChange(currentPage + 1)}
                        className="h-8 border-primary/5 hover:bg-primary/5"
                       >
                         Next
                       </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="py-10 text-center">
                  <p className="text-muted-foreground">No users found matching the current filters.</p>
                  <Button variant="outline" className="mt-4" onClick={() => setFilters({
                    search: "",
                    role: "",
                    status: "",
                    verificationStatus: "",
                    activityLevel: "",
                    sortBy: "createdAt",
                    sortOrder: "desc",
                  })}>
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="pending-verification">
            <UserTabContent
              tab="pending-verification"
              onViewUser={handleViewUser}
              onEditUser={handleEditUser}
              onDeleteUser={handleDeleteUser}
              onVerifyUser={handleVerifyUser}
              onStatusChange={handleStatusChange}
              onRoleChange={(userId, r) => changeRoleMutation.mutate({ userId, role: r })}
            />
          </TabsContent>

          <TabsContent value="recently-active">
            <UserTabContent
              tab="recently-active"
              onViewUser={handleViewUser}
              onEditUser={handleEditUser}
              onDeleteUser={handleDeleteUser}
              onStatusChange={handleStatusChange}
              onRoleChange={(userId, r) => changeRoleMutation.mutate({ userId, role: r })}
            />
          </TabsContent>

          <TabsContent value="warnings">
            <UserTabContent
              tab="warnings"
              onViewUser={handleViewUser}
              onEditUser={handleEditUser}
              onDeleteUser={handleDeleteUser}
              onStatusChange={handleStatusChange}
              onRoleChange={(userId, r) => changeRoleMutation.mutate({ userId, role: r })}
            />
          </TabsContent>
        </Tabs>

        {selectedUser && (
          <Dialog open={showUserDetail} onOpenChange={setShowUserDetail}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>User Details</DialogTitle>
                <DialogDescription>
                  Detailed information about {selectedUser.fullName}
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="profile" className="mt-4">
                <TabsList className="grid grid-cols-4">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="status">Status History</TabsTrigger>
                  <TabsTrigger value="verification">Verification</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Full Name</h3>
                        <p className="mt-1">{selectedUser.fullName}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                        <p className="mt-1">{selectedUser.email}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Username</h3>
                        <p className="mt-1">{selectedUser.username || 'Not set'}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Role</h3>
                        <p className="mt-1">{selectedUser.role}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                        <p className="mt-1">{selectedUser.status}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Phone Number</h3>
                        <p className="mt-1">{selectedUser.phoneNumber || 'Not provided'}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">2FA Enabled</h3>
                        <p className="mt-1">
                          {selectedUser.twoFactorEnabled ? (
                            <Badge variant="success" className="bg-green-100 text-green-800">Enabled</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">Disabled</Badge>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Verification Status</h3>
                        <p className="mt-1">{selectedUser.verificationStatus}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Registered On</h3>
                        <p className="mt-1">{format(new Date(selectedUser.createdAt), 'PPP')}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Last Login</h3>
                        <p className="mt-1">
                          {selectedUser.lastLogin
                            ? format(new Date(selectedUser.lastLogin), 'PPP')
                            : "Never logged in"}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Activity Level</h3>
                        <p className="mt-1">{selectedUser.activityLevel || 'Unknown'}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Warning Count</h3>
                        <p className="mt-1">{selectedUser.warningCount}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <UserWarnings userId={selectedUser.id} />
                  </div>
                </TabsContent>

                <TabsContent value="activity" className="mt-4">
                  <UserActivityTimeline userId={selectedUser.id} />
                </TabsContent>
                <TabsContent value="status" className="mt-4">
                  <UserStatusHistory userId={selectedUser.id} />
                </TabsContent>
                <TabsContent value="verification" className="mt-4">
                  <UserVerificationDocuments userId={selectedUser.id} />
                </TabsContent>
              </Tabs>

              <DialogFooter className="flex justify-between sm:justify-between mt-6">
                <Button variant="outline" onClick={() => handleEditUser(selectedUser)}>
                  Edit User
                </Button>
                <Button onClick={() => setShowUserDetail(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Confirm Deletion
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the user <strong>{selectedUser?.fullName}</strong>?
                This action is permanent and cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deleteUserMutation.isPending}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedUser && deleteUserMutation.mutate(selectedUser.id)}
                disabled={deleteUserMutation.isPending}
              >
                {deleteUserMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <EditUserDialog
          user={selectedUser}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSave={(data) => {
            if (selectedUser) {
              updateUserMutation.mutate({ userId: selectedUser.id, data });
            }
          }}
          isSubmitting={updateUserMutation.isPending}
        />

        <UserVerificationDialog 
          user={verificationUser}
          open={showVerificationDialog}
          onOpenChange={setShowVerificationDialog}
        />
      </div>
    </PageLayout>
  );
}

// Helper Components
function UserTabContent({
  tab,
  onViewUser,
  onEditUser,
  onDeleteUser,
  onVerifyUser,
  onStatusChange,
  onRoleChange
}: {
  tab: string;
  onViewUser: (user: User) => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
  onVerifyUser?: (user: User) => void;
  onStatusChange: (userId: number, status: string) => void;
  onRoleChange: (userId: number, role: string) => void;
}) {
  const { data: usersData, isLoading } = useQuery({
    queryKey: [`/api/admin/users/tabs/${tab}`],
    queryFn: async () => apiRequest<UserResponse>(`/api/admin/users/tabs/${tab}`),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const users = usersData?.users || [];

  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground text-sm">No users found in this category.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <UserTable
      users={users}
      onViewDetails={onViewUser}
      onEdit={onEditUser}
      onDelete={onDeleteUser}
      onVerify={onVerifyUser}
      onStatusChange={onStatusChange}
      onRoleChange={onRoleChange}
    />
  );
}

function EditUserDialog({
  user,
  open,
  onOpenChange,
  onSave,
  isSubmitting
}: {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
  isSubmitting: boolean;
}) {
  const form = useForm({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      fullName: "",
      email: "",
      username: "",
      role: "Subscriber",
      status: "active",
    },
  });

  useEffect(() => {
    if (user && open) {
      form.reset({
        fullName: user.fullName,
        email: user.email,
        username: user.username || "",
        role: user.role,
        status: user.status,
      });
    }
  }, [user, open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit User Details</DialogTitle>
          <DialogDescription>
            Update profile information for {user?.fullName}.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Agent">Agent</SelectItem>
                        <SelectItem value="Subscriber">Subscriber</SelectItem>
                        <SelectItem value="Business">Business</SelectItem>
                        <SelectItem value="Moderator">Moderator</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>System Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="banned">Banned</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}