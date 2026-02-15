
import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { roles, PermissionType } from "@shared/schema";
import { eq } from "drizzle-orm";

// Note: User interface is augmented in server/auth.ts

export function checkPermission(requiredPermission: PermissionType) {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const user = req.user!;

        // 1. Check if user has admin privileges (superuser)
        if (user.role === 'Admin') {
            return next();
        }

        // 2. Check Role-based permissions
        try {
            // We need to fetch the role definition from DB to get its permissions
            // In a production app, we should cache this
            const userRole = await db.query.roles.findFirst({
                where: eq(roles.name, user.role)
            });

            if (userRole) {
                const rolePermissions = userRole.permissions as string[];
                if (rolePermissions.includes(requiredPermission)) {
                    return next();
                }
            }

            // 3. Check Custom User Permissions (overrides)
            // Note: We use type assertion since customPermissions is json in schema
            const customPermissions = (user.customPermissions as string[]) || [];
            if (customPermissions.includes(requiredPermission)) {
                return next();
            }

            // If we got here, user doesn't have permission
            return res.status(403).json({
                message: "Forbidden: Insufficient permissions",
                required: requiredPermission
            });

        } catch (error) {
            console.error("Permission check error:", error);
            return res.status(500).json({ message: "Internal Server Error during permission check" });
        }
    };
}
