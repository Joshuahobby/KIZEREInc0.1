import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, AccountStatus } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import UserFilters from "@/components/user-management/UserFilters";
import UserTable from "@/components/user-management/UserTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { userRoles } from "@shared/schema";

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    status: "",
    verificationStatus: "",
    activityLevel: "",
    sortBy: "createdAt",
    sortOrder: "desc" as "asc" | "desc",
  });

  // Selected user for editing
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [statusReason, setStatusReason] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<AccountStatus>("active");
  const [selectedRole, setSelectedRole] = useState("");

  // Fetching users with filters
  const {
    data: usersData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "/api/admin/users",
      currentPage,
      pageSize,
      filters.search,
      filters.role,
      filters.status,
      filters.verificationStatus,
      filters.activityLevel,
      filters.sortBy,
      filters.sortOrder,
      filters.startDate,
      filters.endDate,
    ],
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.role && { role: filters.role }),
        ...(filters.status && { status: filters.status }),
        ...(filters.verificationStatus && { verificationStatus: filters.verificationStatus }),
        ...(filters.activityLevel && { activityLevel: filters.activityLevel }),
        ...(filters.sortBy && { sortBy: filters.sortBy }),
        ...(filters.sortOrder && { sortOrder: filters.sortOrder }),
        ...(filters.startDate && { startDate: filters.startDate.toISOString() }),
        ...(filters.endDate && { endDate: filters.endDate.toISOString() }),
      });

      const response = await apiRequest<{ users: User[]; total: number }>({
        url: `/api/admin/users?${queryParams.toString()}`,
        method: "GET",
      });

      return response;
    },
  });

  // Mutation for updating user status
  const updateUserStatusMutation = useMutation({
    mutationFn: async ({
      userId,
      status,
      reason,
    }: {
      userId: number;
      status: string;
      reason?: string;
    }) => {
      return apiRequest<{ success: boolean }>({
        url: `/api/admin/users/${userId}/status`,
        method: "PATCH",
        data: { status, reason },
      });
    },
    onSuccess: () => {
      toast({
        title: "User status updated",
        description: "The user's status has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsStatusDialogOpen(false);
      setStatusReason("");
    },
    onError: (error) => {
      toast({
        title: "Failed to update user status",
        description: "There was an error updating the user's status. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation for updating user role
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      return apiRequest<{ success: boolean }>({
        url: `/api/admin/users/${userId}/role`,
        method: "PATCH",
        data: { role },
      });
    },
    onSuccess: () => {
      toast({
        title: "User role updated",
        description: "The user's role has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsRoleDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to update user role",
        description: "There was an error updating the user's role. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Function to handle filter changes
  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Function to handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Function to handle viewing a user
  const handleViewUser = (user: User) => {
    // Navigate to user details page
    window.location.href = `/admin/users/${user.id}`;
  };

  // Function to handle editing a user
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  // Function to handle changing user status
  const handleStatusChange = (user: User, status: string) => {
    setSelectedUser(user);
    setSelectedStatus(status as AccountStatus);
    setIsStatusDialogOpen(true);
  };

  // Function to handle changing user role
  const handleRoleChange = (user: User) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setIsRoleDialogOpen(true);
  };

  // Function to confirm status change
  const confirmStatusChange = () => {
    if (selectedUser) {
      updateUserStatusMutation.mutate({
        userId: selectedUser.id,
        status: selectedStatus,
        reason: statusReason,
      });
    }
  };

  // Function to confirm role change
  const confirmRoleChange = () => {
    if (selectedUser && selectedRole) {
      updateUserRoleMutation.mutate({
        userId: selectedUser.id,
        role: selectedRole,
      });
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <h2 className="text-2xl font-bold text-destructive mb-2">Error Loading Users</h2>
        <p className="text-muted-foreground mb-4">
          There was an error loading the user list. Please try again.
        </p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <DashboardPageHeader
        title="User Management"
        description="Manage users, roles, and permissions"
        actions={
          <Button onClick={() => window.location.href = "/admin/users/new"}>
            Add New User
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>User Directory</CardTitle>
          <CardDescription>
            View and manage all users in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserFilters onFilterChange={handleFilterChange} />

          {isLoading ? (
            <div className="space-y-4 mt-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-48 ml-auto" />
            </div>
          ) : (
            <UserTable
              users={usersData?.users || []}
              totalCount={usersData?.total || 0}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onViewUser={handleViewUser}
              onEditUser={handleEditUser}
              onChangeStatus={handleStatusChange}
              onChangeRole={handleRoleChange}
            />
          )}
        </CardContent>
      </Card>

      {/* Status Change Dialog */}
      <AlertDialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change User Status</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to change the status of user {selectedUser?.fullName} to{" "}
              <strong>{selectedStatus}</strong>. This action will be logged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status-reason">Reason for status change</Label>
              <Textarea
                id="status-reason"
                placeholder="Provide a reason for this status change..."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>
              {updateUserStatusMutation.isPending ? "Updating..." : "Confirm Change"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Role Change Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Change the role for user {selectedUser?.fullName}. This will update their permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role-select">Select Role</Label>
              <Select
                value={selectedRole}
                onValueChange={setSelectedRole}
              >
                <SelectTrigger id="role-select">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {userRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmRoleChange} disabled={updateUserRoleMutation.isPending}>
              {updateUserRoleMutation.isPending ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
            <DialogDescription>
              Make changes to the user's profile information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Full Name
              </Label>
              <Input
                id="name"
                value={selectedUser?.fullName || ""}
                className="col-span-3"
                onChange={() => {}}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Username
              </Label>
              <Input
                id="username"
                value={selectedUser?.username || ""}
                className="col-span-3"
                onChange={() => {}}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={selectedUser?.email || ""}
                className="col-span-3"
                onChange={() => {}}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}