
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Edit, Trash2, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { AuthWall } from "@/components/ui/auth-wall";
import { PageLayout } from "@/components/layout/page-layout";
import { apiRequest } from "@/lib/queryClient";
import { PermissionType } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Role {
    id: number;
    name: string;
    description: string;
    isSystem: boolean;
    permissions: PermissionType[];
    createdAt: string;
}

export default function RoleManagementPage() {
    const { user, isLoading: isLoadingAuth } = useAuth();
    const { toast } = useToast();

    if (!user && !isLoadingAuth) {
        return (
            <PageLayout>
                <div className="container max-w-7xl mx-auto py-20 flex items-center justify-center">
                    <AuthWall returnUrl="/admin/role-management" />
                </div>
            </PageLayout>
        );
    }
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);

    // Fetch Roles
    const { data: roles, isLoading: rolesLoading } = useQuery<Role[]>({
        queryKey: ['/api/admin/roles'],
    });

    // Fetch Permissions
    const { data: availablePermissions } = useQuery<PermissionType[]>({
        queryKey: ['/api/admin/roles/permissions'],
    });

    // Form State
    const [formData, setFormData] = useState<{
        name: string;
        description: string;
        permissions: PermissionType[];
    }>({
        name: "",
        description: "",
        permissions: []
    });

    const resetForm = () => {
        setFormData({ name: "", description: "", permissions: [] });
        setSelectedRole(null);
    };

    const handleEditClick = (role: Role) => {
        setSelectedRole(role);
        setFormData({
            name: role.name,
            description: role.description || "",
            permissions: role.permissions
        });
        setIsEditOpen(true);
    };

    // Create Mutation
    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            return apiRequest('/api/admin/roles', {
                method: 'POST',
                data
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/roles'] });
            setIsCreateOpen(false);
            resetForm();
            toast({ title: "Success", description: "Role created" });
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });

    // Update Mutation
    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            return apiRequest(`/api/admin/roles/${selectedRole?.id}`, {
                method: 'PATCH',
                data
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/roles'] });
            setIsEditOpen(false);
            resetForm();
            toast({ title: "Success", description: "Role updated" });
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            return apiRequest(`/api/admin/roles/${id}`, {
                method: 'DELETE'
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/roles'] });
            toast({ title: "Success", description: "Role deleted" });
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });

    const handlePermissionToggle = (permission: PermissionType) => {
        setFormData(prev => {
            const exists = prev.permissions.includes(permission);
            return {
                ...prev,
                permissions: exists
                    ? prev.permissions.filter(p => p !== permission)
                    : [...prev.permissions, permission]
            };
        });
    };

    if (rolesLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <PageLayout>
            <div className="container mx-auto py-6 space-y-6">
                <DashboardPageHeader
                    title="Role Management"
                    description="Manage user roles and their permissions"
                    actions={
                        <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
                            <Plus className="mr-2 h-4 w-4" /> Create Role
                        </Button>
                    }
                />

                <Card>
                    <CardHeader>
                        <CardTitle>System Roles</CardTitle>
                        <CardDescription>
                            View and manage roles. System roles cannot be deleted.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Role Name</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Permissions Count</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {roles?.map((role) => (
                                    <TableRow key={role.id}>
                                        <TableCell className="font-medium">{role.name}</TableCell>
                                        <TableCell>{role.description}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{role.permissions.length} permissions</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {role.isSystem ? <Badge>System</Badge> : <Badge variant="outline">Custom</Badge>}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => handleEditClick(role)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            {!role.isSystem && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => {
                                                        if (confirm("Are you sure you want to delete this role?")) {
                                                            deleteMutation.mutate(role.id);
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Create/Edit Dialog */}
                <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => {
                    if (!open) {
                        setIsCreateOpen(false);
                        setIsEditOpen(false);
                        resetForm();
                    }
                }}>
                    <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle>{isEditOpen ? "Edit Role" : "Create New Role"}</DialogTitle>
                            <DialogDescription>
                                Configure role details and permissions.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4 overflow-y-auto pr-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Role Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    disabled={isEditOpen && selectedRole?.isSystem} // Prevent renaming system roles if desired
                                    placeholder="e.g. Content Moderator"
                                />
                                {isEditOpen && selectedRole?.isSystem && (
                                    <p className="text-xs text-muted-foreground">System role names cannot be changed.</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Input
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Role description"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Permissions</Label>
                                <ScrollArea className="h-[300px] border rounded-md p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {availablePermissions?.map((perm) => (
                                            <div key={perm} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`perm-${perm}`}
                                                    checked={formData.permissions.includes(perm)}
                                                    onCheckedChange={() => handlePermissionToggle(perm)}
                                                />
                                                <label
                                                    htmlFor={`perm-${perm}`}
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                >
                                                    {perm}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                                <div className="flex justify-between items-center pt-2">
                                    <p className="text-sm text-muted-foreground">{formData.permissions.length} selected</p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setFormData(prev => ({ ...prev, permissions: availablePermissions || [] }))}
                                    >
                                        Select All
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setFormData(prev => ({ ...prev, permissions: [] }))}
                                    >
                                        Deselect All
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); }}>Cancel</Button>
                            <Button
                                onClick={() => {
                                    const payload = {
                                        name: formData.name,
                                        description: formData.description,
                                        permissions: formData.permissions
                                    };
                                    if (isEditOpen) {
                                        updateMutation.mutate(payload);
                                    } else {
                                        createMutation.mutate(payload);
                                    }
                                }}
                                disabled={createMutation.isPending || updateMutation.isPending}
                            >
                                {createMutation.isPending || updateMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : null}
                                {isEditOpen ? "Save Changes" : "Create Role"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </PageLayout>
    );
}
