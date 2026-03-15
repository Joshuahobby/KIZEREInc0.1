import { db } from "./db";
import { 
  users, items, paymentPackages, 
  notifications, reports, userActivityLogs,
  adminActionLogs, verificationRequests, statusChanges,
  userWarnings, chats, messages, payments,
  payouts, paymentMethods, roles, moderationReports,
  claimAppeals, claimStatusLogs, auditLogs,
  pushSubscriptions, claims
} from "@shared/schema";
import { hashPassword } from "./utils/auth-crypto";

async function seed() {
  console.log("🌱 Starting database seeding...");

  try {
    // 2. Clear existing data in correct order to satisfy FK constraints
    console.log("Cleaning old data...");
    // Independent/Leaf tables first
    await db.delete(messages);
    await db.delete(chats);
    await db.delete(notifications);
    await db.delete(auditLogs);
    await db.delete(userActivityLogs);
    await db.delete(adminActionLogs);
    await db.delete(moderationReports);
    await db.delete(pushSubscriptions);
    await db.delete(userWarnings);
    await db.delete(statusChanges);
    await db.delete(claimStatusLogs);
    await db.delete(claimAppeals);
    await db.delete(claims);
    await db.delete(payments);
    await db.delete(payouts);
    await db.delete(paymentMethods);
    await db.delete(verificationRequests);
    await db.delete(reports);
    await db.delete(items);
    await db.delete(paymentPackages);
    await db.delete(roles);
    await db.delete(users);

    const hashedAdminPassword = await hashPassword("admin123");
    const hashedUserPassword = await hashPassword("user123");

    // 3. Seed Users
    console.log("Seeding users...");
    const [adminUser] = await db.insert(users).values({
      username: "admin",
      password: hashedAdminPassword,
      email: "admin@kizere.com",
      fullName: "System Admin",
      role: "Admin",
      verificationStatus: "approved",
      phoneNumber: "+250788123456",
    }).returning();

    const [testUser] = await db.insert(users).values({
      username: "user",
      password: hashedUserPassword,
      email: "user@kizere.com",
      fullName: "Test User",
      role: "User",
      verificationStatus: "pending",
      phoneNumber: "+250788654321",
    }).returning();

    // 4. Seed Payment Packages — Only what the project needs
    // Each payment type gets exactly one default package.
    // Admins can add more tiers later via the dashboard.
    console.log("Seeding payment packages...");
    await db.insert(paymentPackages).values([
      {
        name: "Item Registration",
        description: "Register and protect your item with a unique QR code and digital certificate",
        amount: "2000",
        currency: "RWF",
        type: "registration",
        isDefault: true,
        features: ["Unique QR Code", "Digital Certificate", "Ownership Proof", "Lifetime Protection"],
        status: "active",
        validityDays: null, // Lifetime
        createdBy: adminUser.id,
      },
      {
        name: "Lost Item Report",
        description: "File a lost item report visible across the KIZERE network",
        amount: "1000",
        currency: "RWF",
        type: "lost_report",
        isDefault: true,
        features: ["Public Listing", "Email Notifications", "30 Days Visibility", "Match Alerts"],
        status: "active",
        validityDays: 30,
        createdBy: adminUser.id,
      }
    ]);

    // 5. Seed Items
    console.log("Seeding items...");
    await db.insert(items).values([
      {
        userId: testUser.id,
        name: "iPhone 15 Pro",
        description: "Natural Titanium, 256GB",
        category: "Electronics",
        status: "active",
        uniqueIdentifier: "IMEI-123456789",
        location: "Kigali, Rwanda",
        imageUrls: ["https://images.unsplash.com/photo-1696446701796-da61225697cc"]
      },
      {
        userId: testUser.id,
        name: "Silver MacBook Air",
        description: "M2 Chip, 13-inch",
        category: "Electronics",
        status: "active",
        uniqueIdentifier: "SN-C02ABCD123",
        location: "Kigali, Rwanda",
        imageUrls: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8"]
      }
    ]);

    console.log("✅ Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed().then(() => process.exit(0));
