import { Request, Response, NextFunction } from "express";
import { createLogger } from "../utils/logger";

const logger = createLogger('AuthMiddleware');

/**
 * Middleware to check authentication and roles
 * @param roles Array of allowed roles or 'any' for all authenticated users
 */
export function requireRole(roles: string[] | 'any') {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.isAuthenticated()) {
            logger.warn('Authentication required but not present', {
                path: req.path,
                cookies: !!req.headers.cookie,
                sessionId: req.sessionID
            });
            return res.status(401).json({ message: "Authentication required" });
        }

        if (roles === 'any') {
            return next();
        }

        if (!req.user || !roles.includes(req.user.role)) {
            logger.warn('Access denied: insufficient permissions', {
                userId: req.user?.id,
                userRole: req.user?.role,
                requiredRoles: roles,
                path: req.path
            });
            return res.status(403).json({
                message: "Insufficient permissions",
                required: roles
            });
        }

        next();
    };
}

// Common role-based middleware aliases
export const requireAuth = requireRole('any');
export const requireAdmin = requireRole(['Admin']);
export const requireAdminOrAgent = requireRole(['Admin', 'Agent']);
export const requireAgent = requireRole(['Agent']);
export const requireInternal = requireRole(['Admin', 'Agent', 'System']); // For internal operations
