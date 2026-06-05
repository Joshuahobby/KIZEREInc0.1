
import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { roles, PermissionType } from "@shared/schema";
import { eq } from "drizzle-orm";
import { createLogger } from '../utils/logger';

const logger = createLogger('PermissionsMiddleware');

// Note: User interface is augmented in server/auth.ts

// In-memory cache for role permissions (TTL: 30 seconds — short enough to propagate revocations)
const rolePermissionCache = new Map<string, { permissions: string[]; cachedAt: number }>();
const CACHE_TTL_MS = 30 * 1000;

/** Call this after any role permission change to force immediate re-fetch. */
export function invalidatePermissionCache(roleName?: string): void {
  if (roleName) {
    rolePermissionCache.delete(roleName);
  } else {
    rolePermissionCache.clear();
  }
}

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

        // 2. Check Role-based permissions (with caching)
        try {
            let rolePermissions: string[] = [];
            const cached = rolePermissionCache.get(user.role);

            if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
                rolePermissions = cached.permissions;
            } else {
                const userRole = await db.query.roles.findFirst({
                    where: eq(roles.name, user.role)
                });

                if (userRole) {
                    rolePermissions = userRole.permissions as string[];
                    rolePermissionCache.set(user.role, {
                        permissions: rolePermissions,
                        cachedAt: Date.now()
                    });
                }
            }

            if (rolePermissions.includes(requiredPermission)) {
                return next();
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
            logger.error("Permission check error", { error, userId: user.id, role: user.role });
            return res.status(500).json({ message: "Internal Server Error during permission check" });
        }
    };
}
