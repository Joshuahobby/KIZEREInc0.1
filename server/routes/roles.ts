
import { Router } from "express";
import { db } from "../db";
import { roles, permissionTypes, insertRoleSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { checkPermission } from "../middleware/permissions";
import { auditAction } from "../middleware/audit";

const router = Router();

// Get all roles
router.get("/", checkPermission("system_settings"), async (req, res) => {
    try {
        const allRoles = await db.select().from(roles);
        res.json(allRoles);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch roles" });
    }
});

// Get all available permission types
router.get("/permissions", checkPermission("system_settings"), (req, res) => {
    res.json(permissionTypes);
});

// Create a new role
router.post("/", checkPermission("system_settings"), auditAction({ action: "role_create", entityType: "role" }), async (req, res) => {
    try {
        const data = insertRoleSchema.parse(req.body);

        // Check if role name exists
        const existing = await db.select().from(roles).where(eq(roles.name, data.name));
        if (existing.length > 0) {
            return res.status(400).json({ message: "Role name already exists" });
        }

        const [newRole] = await db.insert(roles).values({
            ...data,
            isSystem: false, // Created roles are never system by default
            createdBy: req.user!.id
        }).returning();

        res.status(201).json(newRole);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: "Invalid role data", errors: error.errors });
        }
        res.status(500).json({ message: "Failed to create role" });
    }
});

// Update a role
router.patch("/:id", checkPermission("system_settings"), auditAction({ action: "role_update", entityType: "role" }), async (req, res) => {
    try {
        const roleId = parseInt(req.params.id);
        const role = await db.query.roles.findFirst({
            where: eq(roles.id, roleId)
        });

        if (!role) {
            return res.status(404).json({ message: "Role not found" });
        }

        // Don't allow changing system role names or critical properties if needed
        // For now we allow editing permissions of system roles but careful with names

        const updatedData = req.body;

        // Prevent unsetting name to empty if passed
        if (updatedData.name === "") delete updatedData.name;

        const [updatedRole] = await db.update(roles)
            .set({
                ...updatedData,
                updatedAt: new Date()
            })
            .where(eq(roles.id, roleId))
            .returning();

        res.json(updatedRole);
    } catch (error) {
        res.status(500).json({ message: "Failed to update role" });
    }
});

// Delete a role
router.delete("/:id", checkPermission("system_settings"), auditAction({ action: "role_delete", entityType: "role" }), async (req, res) => {
    try {
        const roleId = parseInt(req.params.id);
        const role = await db.query.roles.findFirst({
            where: eq(roles.id, roleId)
        });

        if (!role) {
            return res.status(404).json({ message: "Role not found" });
        }

        if (role.isSystem) {
            return res.status(400).json({ message: "Cannot delete system roles" });
        }

        await db.delete(roles).where(eq(roles.id, roleId));
        res.json({ message: "Role deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete role" });
    }
});

export default router;
