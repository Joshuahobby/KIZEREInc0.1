
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, AccountStatus } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { AuthWall } from "@/components/ui/auth-wall";
import { PageLayout } from "@/components/layout/page-layout";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
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
import { Textarea } from "@/components/ui/textarea";
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

export default function ClientManagementPage() {
    const { user: currentUser, isLoading: isLoadingAuth } = useAuth();

    if (!currentUser && !isLoadingAuth) {
        return (
            <PageLayout>
                <div className="container max-w-7xl mx-auto py-20 flex items-center justify-center">
                    <AuthWall returnUrl="/admin/client-management" />
                </div>
            </PageLayout>
        );
    }
    const queryClient = useQueryClient();
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);

    // Selected user for actions
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
    const [statusReason, setStatusReason] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<AccountStatus>("active" as AccountStatus);

    // Fetching ONLY business users
    const {
        data: usersData,
        isLoading,
        error,
    } = useQuery({
        queryKey: [
            "/api/admin/users",
            currentPage,
            pageSize,
            "Business" // Force role filter
        ],
        queryFn: async () => {
            const queryParams = new URLSearchParams({
                page: currentPage.toString(),
                pageSize: pageSize.toString(),
                role: "Business", // Hardcoded filter
                sortBy: "createdAt",
                sortOrder: "desc"
            });

            const response = await apiRequest<{ users: User[]; total: number }>(
                `/api/admin/users?${queryParams.toString()}`,
                { method: "GET" }
            );

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
            return apiRequest<{ success: boolean }>(
                `/api/admin/users/${userId}/status`,
                { method: "PATCH", data: { status, reason } }
            );
        },
        onSuccess: () => {
            toast({
                title: "Client status updated",
                description: "The business client's status has been successfully updated.",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
            setIsStatusDialogOpen(false);
            setStatusReason("");
        },
        onError: (error) => {
            toast({
                title: "Failed to update status",
                description: "There was an error updating the client's status. Please try again.",
                variant: "destructive",
            });
        },
    });

    // Function to handle page changes
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // Function to handle viewing a user
    const handleViewUser = (user: User) => {
        // Navigate to user details page
        window.location.href = `/admin/users/${user.id}`;
    };

    // Function to handle changing user status
    const handleStatusChange = (user: User, status: string) => {
        setSelectedUser(user);
        setSelectedStatus(status as AccountStatus);
        setIsStatusDialogOpen(true);
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

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
                <h2 className="text-2xl font-bold text-destructive mb-2">Error Loading Clients</h2>
                <p className="text-muted-foreground mb-4">
                    There was an error loading the client list. Please try again.
                </p>
                <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
        );
    }

    return (
        <PageLayout>
            <div className="container mx-auto p-4 space-y-6">
                <DashboardPageHeader
                    title="Client Management"
                    description="Manage business partners, verification, and subscriptions"
                    actions={
                        <Button onClick={() => window.location.href = "/admin/users/new"}>
                            Add New Business
                        </Button>
                    }
                />

                <Card>
                    <CardHeader>
                        <CardTitle>Business Directory</CardTitle>
                        <CardDescription>
                            View and manage all registered business clients
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
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
                                onEditUser={(user) => window.location.href = `/admin/users/${user.id}`}
                                onChangeStatus={handleStatusChange}
                                onChangeRole={() => { }} // Disabled for this view
                            />
                        )}
                    </CardContent>
                </Card>

                {/* Status Change Dialog */}
                <AlertDialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Change Client Status</AlertDialogTitle>
                            <AlertDialogDescription>
                                You are about to change the status of {selectedUser?.fullName} to{" "}
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
            </div>
        </PageLayout>
    );
}
