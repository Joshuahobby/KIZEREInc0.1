
import { Router } from "express";
import { db } from "../db";
import { auditLogs, users } from "@shared/schema";
import { desc, eq, and, like, sql, gte, lte } from "drizzle-orm";
import { checkPermission } from "../middleware/permissions";
import { createLogger } from "../utils/logger";

const logger = createLogger("AuditRoutes");
const router = Router();

/**
 * GET /api/admin/audit-logs
 * List audit logs with pagination and filters
 */
router.get("/", checkPermission("dashboard_admin"), async (req, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
        const offset = (page - 1) * limit;
        const action = req.query.action as string;
        const entityType = req.query.entityType as string;
        const userId = req.query.userId as string;
        const startDate = req.query.startDate as string;
        const endDate = req.query.endDate as string;

        // Build conditions
        const conditions = [];
        if (action) conditions.push(eq(auditLogs.action, action));
        if (entityType) conditions.push(eq(auditLogs.entityType, entityType));
        if (userId) conditions.push(eq(auditLogs.userId, parseInt(userId)));
        if (startDate) conditions.push(gte(auditLogs.createdAt, new Date(startDate)));
        if (endDate) conditions.push(lte(auditLogs.createdAt, new Date(endDate)));

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        // Fetch logs with user info
        const logs = await db
            .select({
                id: auditLogs.id,
                userId: auditLogs.userId,
                action: auditLogs.action,
                entityType: auditLogs.entityType,
                entityId: auditLogs.entityId,
                metadata: auditLogs.metadata,
                ipAddress: auditLogs.ipAddress,
                createdAt: auditLogs.createdAt,
                userName: users.fullName,
                userEmail: users.email,
            })
            .from(auditLogs)
            .leftJoin(users, eq(auditLogs.userId, users.id))
            .where(whereClause)
            .orderBy(desc(auditLogs.createdAt))
            .limit(limit)
            .offset(offset);

        // Get total count
        const [{ count }] = await db
            .select({ count: sql<number>`count(*)` })
            .from(auditLogs)
            .where(whereClause);

        res.json({
            logs,
            pagination: {
                page,
                limit,
                total: Number(count),
                totalPages: Math.ceil(Number(count) / limit),
            },
        });
    } catch (error) {
        logger.error("Failed to fetch audit logs", { error });
        res.status(500).json({ message: "Failed to fetch audit logs" });
    }
});

/**
 * GET /api/admin/audit-logs/recent
 * Get the 10 most recent audit entries (for dashboard widget)
 */
router.get("/recent", checkPermission("dashboard_view"), async (req, res) => {
    try {
        const logs = await db
            .select({
                id: auditLogs.id,
                action: auditLogs.action,
                entityType: auditLogs.entityType,
                entityId: auditLogs.entityId,
                createdAt: auditLogs.createdAt,
                userName: users.fullName,
            })
            .from(auditLogs)
            .leftJoin(users, eq(auditLogs.userId, users.id))
            .orderBy(desc(auditLogs.createdAt))
            .limit(10);

        res.json(logs);
    } catch (error) {
        logger.error("Failed to fetch recent audit logs", { error });
        res.status(500).json({ message: "Failed to fetch recent logs" });
    }
});

export default router;
