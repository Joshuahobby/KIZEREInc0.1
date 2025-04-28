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
import { UserTable, type User } from "@/components/user-management/user-table";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { Loader2, UserPlus } from "lucide-react";

interface UserResponse {
  users: User[];
  total: number;
  pages: number;
}

export default function UserManagementPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State
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
  
  // State for user detail modal
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  
  // Fetch users with filters and pagination
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/admin/users', currentPage, pageSize, filters],
    queryFn: async () => {
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
      });
      
      // Add filters to params
      if (filters.search) params.append('search', filters.search);
      if (filters.role) params.append('role', filters.role);
      if (filters.status) params.append('status', filters.status);
      if (filters.verificationStatus) params.append('verificationStatus', filters.verificationStatus);
      if (filters.activityLevel) params.append('activityLevel', filters.activityLevel);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      
      // Add date filters if provided
      if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
      
      const response = await apiRequest<UserResponse>(`/api/admin/users?${params.toString()}`);
      return response;
    },
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
  
  // Export users handler
  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      // Build query parameters for the export
      const params = new URLSearchParams({
        format
      });
      
      // Add filters to export params
      if (filters.search) params.append('search', filters.search);
      if (filters.role) params.append('role', filters.role);
      if (filters.status) params.append('status', filters.status);
      if (filters.verificationStatus) params.append('verificationStatus', filters.verificationStatus);
      if (filters.activityLevel) params.append('activityLevel', filters.activityLevel);
      
      // Add date filters if provided
      if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
      
      // Trigger file download
      window.open(`/api/admin/users/export?${params.toString()}`, '_blank');
      
      toast({
        title: "Export started",
        description: `User data is being exported as ${format.toUpperCase()}.`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "An error occurred while exporting users.",
        variant: "destructive",
      });
    }
  };
  
  // Event handlers
  const handleFilterChange = (newFilters: UserFiltersType) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowUserDetail(true);
  };
  
  const handleEditUser = (user: User) => {
    // Navigate to user edit page or open a modal
    console.log("Edit user:", user);
  };
  
  const handleStatusChange = (user: User, status: string) => {
    changeStatusMutation.mutate({
      userId: user.id,
      status,
      reason: `Status changed to ${status} by admin`
    });
  };
  
  const handleRoleChange = (user: User) => {
    // Implementation handled by mutation in the UserTable component
  };

  // Handle errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading users",
        description: "Failed to load user data. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  return (
    <div className="container mx-auto py-6">
      <DashboardPageHeader
        title="User Management"
        description="View and manage all users in the system"
        actions={
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        }
      />
      
      <Tabs defaultValue="all-users" className="mt-6">
        <TabsList>
          <TabsTrigger value="all-users">All Users</TabsTrigger>
          <TabsTrigger value="pending-verification">Pending Verification</TabsTrigger>
          <TabsTrigger value="recently-active">Recently Active</TabsTrigger>
          <TabsTrigger value="warnings">Users with Warnings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all-users">
          <UserFilters onFilterChange={handleFilterChange} onExport={handleExport} />
          
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : data?.users && data.users.length > 0 ? (
            <UserTable
              users={data.users}
              totalPages={data.pages || 1}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              onViewUser={handleViewUser}
              onEditUser={handleEditUser}
              onStatusChange={handleStatusChange}
              onRoleChange={(user, role) => 
                changeRoleMutation.mutate({ userId: user.id, role })
              }
            />
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
          <p className="text-muted-foreground mb-4">Users awaiting identity verification</p>
          {/* This tab would be implemented similar to all-users but with a predefined filter */}
        </TabsContent>
        
        <TabsContent value="recently-active">
          <p className="text-muted-foreground mb-4">Users who logged in within the last 7 days</p>
          {/* This tab would be implemented similar to all-users but with a predefined filter */}
        </TabsContent>
        
        <TabsContent value="warnings">
          <p className="text-muted-foreground mb-4">Users with one or more warning flags</p>
          {/* This tab would be implemented similar to all-users but with a predefined filter */}
        </TabsContent>
      </Tabs>
      
      {/* User Detail Dialog */}
      {selectedUser && (
        <Dialog open={showUserDetail} onOpenChange={setShowUserDetail}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>
                Detailed information about {selectedUser.fullName}
              </DialogDescription>
            </DialogHeader>
            
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
                  <h3 className="text-sm font-medium text-muted-foreground">Role</h3>
                  <p className="mt-1">{selectedUser.role}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <p className="mt-1">{selectedUser.status}</p>
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
                  <h3 className="text-sm font-medium text-muted-foreground">Warning Count</h3>
                  <p className="mt-1">{selectedUser.warningCount}</p>
                </div>
              </div>
            </div>
            
            <DialogFooter className="flex justify-between sm:justify-between">
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
    </div>
  );
}