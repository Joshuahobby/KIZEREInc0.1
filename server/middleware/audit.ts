
import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { auditLogs } from "@shared/schema";
import { createLogger } from "../utils/logger";

const logger = createLogger("AuditMiddleware");

interface AuditOptions {
    action: string;
    entityType?: string;
    /** Function to extract entity ID from the request. If omitted, tries req.params.id */
    getEntityId?: (req: Request, res: Response) => string | undefined;
    /** Function to extract extra metadata */
    getMetadata?: (req: Request, res: Response) => Record<string, any> | undefined;
}

/**
 * Middleware that logs an audit entry after the response is sent.
 * Usage: `router.post("/", auditAction({ action: "user_create", entityType: "user" }), handler)`
 */
export function auditAction(options: AuditOptions) {
    return (req: Request, res: Response, next: NextFunction) => {
        // Hook into the response finish event so we log AFTER the action succeeds
        const originalEnd = res.end;
        const originalJson = res.json;
        let responseBody: any;

        // Capture the response body
        res.json = function (body: any) {
            responseBody = body;
            return originalJson.call(this, body);
        };

        res.on("finish", async () => {
            // Only log if the request was successful (2xx or 3xx)
            if (res.statusCode >= 400) return;

            try {
                const userId = req.user?.id || null;
                const entityId = options.getEntityId
                    ? options.getEntityId(req, res)
                    : req.params?.id || responseBody?.id?.toString();
                const metadata = options.getMetadata
                    ? options.getMetadata(req, res)
                    : { body: sanitizeBody(req.body) };

                await db.insert(auditLogs).values({
                    userId,
                    action: options.action,
                    entityType: options.entityType || null,
                    entityId: entityId?.toString() || null,
                    metadata,
                    ipAddress: getClientIp(req),
                    userAgent: req.headers["user-agent"] || null,
                });
            } catch (error) {
                // Never let audit logging break the request
                logger.error("Failed to write audit log", { error, action: options.action });
            }
        });

        next();
    };
}

/**
 * Direct function to log an audit event (for use outside middleware chains)
 */
export async function logAuditEvent(
    userId: number | null,
    action: string,
    entityType: string | null,
    entityId: string | null,
    metadata?: Record<string, any>,
    req?: Request
) {
    try {
        await db.insert(auditLogs).values({
            userId,
            action,
            entityType,
            entityId,
            metadata: metadata || null,
            ipAddress: req ? getClientIp(req) : null,
            userAgent: req?.headers["user-agent"] || null,
        });
    } catch (error) {
        logger.error("Failed to write audit log", { error, action });
    }
}

/** Remove sensitive fields from req.body before logging */
function sanitizeBody(body: any): Record<string, any> {
    if (!body || typeof body !== "object") return {};
    const { password, token, secret, ...safe } = body;
    return safe;
}

/** Extract the real client IP, considering proxies */
function getClientIp(req: Request): string {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
    return req.socket?.remoteAddress || "unknown";
}
