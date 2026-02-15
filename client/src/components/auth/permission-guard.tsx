
import { ReactNode } from "react";
import { PermissionType } from "@shared/schema";
import { usePermissions } from "@/hooks/use-permissions";

interface PermissionGuardProps {
    permission: PermissionType;
    children: ReactNode;
    fallback?: ReactNode;
}

export function PermissionGuard({ permission, children, fallback = null }: PermissionGuardProps) {
    const { hasPermission, isLoading } = usePermissions();

    if (isLoading) {
        return null; // Or a skeleton/spinner if needed
    }

    if (hasPermission(permission)) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
}
