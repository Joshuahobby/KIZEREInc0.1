
import { useAuth } from "./use-auth";
import { useQuery } from "@tanstack/react-query";
import { PermissionType } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface Role {
    id: number;
    name: string;
    permissions: string[];
}

export function usePermissions() {
    const { user } = useAuth();

    // Fetch the detailed role definition for the current user's role
    // This allows us to see what permissions the role currently has
    const { data: userRole } = useQuery<Role[]>({
        queryKey: ['/api/admin/roles'],
        enabled: !!user?.role,
        select: (roles) => roles.find(r => r.name === user?.role) ? [roles.find(r => r.name === user?.role)!] : []
    });

    const hasPermission = (permission: PermissionType): boolean => {
        if (!user) return false;

        // Admin has all permissions
        if (user.role === 'Admin') return true;

        const rolePermissions = userRole?.[0]?.permissions || [];
        const customPermissions = (user.customPermissions as string[]) || [];

        return rolePermissions.includes(permission) || customPermissions.includes(permission);
    };

    return {
        hasPermission,
        role: userRole?.[0],
        isLoading: !userRole && !!user
    };
}
