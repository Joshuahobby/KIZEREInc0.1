
import { db } from "../server/db";
import { roles, permissionTypes } from "../shared/schema";
import { eq } from "drizzle-orm";

const defaultRoles = [
    {
        name: "Admin",
        description: "Full system access",
        isSystem: true,
        permissions: permissionTypes, // All permissions
    },
    {
        name: "Agent",
        description: "Manage reports and claims",
        isSystem: true,
        permissions: [
            "item_view", "item_approve",
            "report_view", "report_edit", "report_resolve",
            "payment_view",
            "dashboard_view"
        ],
    },
    {
        name: "Moderator",
        description: "Moderate content and users",
        isSystem: true,
        permissions: [
            "user_view", "user_verify",
            "item_view", "item_edit",
            "report_view", "report_edit",
            "dashboard_view"
        ]
    },
    {
        name: "Business",
        description: "Business account with analytics",
        isSystem: true,
        permissions: [
            "item_view", "item_edit", "item_delete",
            "report_view", "report_edit", "report_delete",
            "payment_view", "payment_process",
            "dashboard_view", "dashboard_export"
        ],
    },
    {
        name: "Subscriber",
        description: "Standard user access",
        isSystem: true,
        permissions: [
            "item_view", "item_edit", "item_delete",
            "report_view", "report_edit", "report_delete",
            "payment_view", "payment_process",
            "dashboard_view"
        ],
    },
];

async function seedRoles() {
    console.log("Seeding roles...");

    for (const role of defaultRoles) {
        const existing = await db.select().from(roles).where(eq(roles.name, role.name)).limit(1);

        if (existing.length === 0) {
            console.log(`Creating role: ${role.name}`);
            await db.insert(roles).values({
                name: role.name,
                description: role.description,
                isSystem: role.isSystem,
                permissions: role.permissions,
            });
        } else {
            console.log(`Role ${role.name} already exists, updating permissions...`);
            await db.update(roles)
                .set({
                    permissions: role.permissions,
                    description: role.description,
                    isSystem: role.isSystem
                })
                .where(eq(roles.name, role.name));
        }
    }

    console.log("Roles seeded successfully.");
    process.exit(0);
}

seedRoles().catch((err) => {
    console.error("Error seeding roles:", err);
    process.exit(1);
});
