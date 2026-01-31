import { db } from "./db";
import { 
  users, items, paymentPackages, 
  notifications, reports, userActivityLogs,
  adminActionLogs, verificationRequests, statusChanges,
  userWarnings
} from "@shared/schema";
import { hashPassword } from "./utils/auth-crypto";

async function seed() {
  console.log("🌱 Starting database seeding...");

  try {
    // 2. Clear existing data in correct order to satisfy FK constraints
    console.log("Cleaning old data...");
    await db.delete(notifications);
    await db.delete(reports);
    await db.delete(items);
    await db.delete(userActivityLogs);
    await db.delete(adminActionLogs);
    await db.delete(verificationRequests);
    await db.delete(statusChanges);
    await db.delete(userWarnings);
    await db.delete(paymentPackages);
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

    // 4. Seed Payment Packages (Tiered Structure)
    console.log("Seeding payment packages...");
    await db.insert(paymentPackages).values([
      {
        name: "Standard",
        description: "Standard lost item listing (30 days)",
        amount: "1000",
        currency: "RWF",
        type: "lost_report",
        features: ["Basic Listing", "30 Days Visibility", "Email Notifications"],
        status: "active",
        validityDays: 30
      },
      {
        name: "Premium",
        description: "High-value items listing with priority support",
        amount: "2000",
        currency: "RWF",
        type: "lost_report",
        features: ["Premium Badge", "Top Search Results", "Priority Support", "60 Days Visibility"],
        status: "active",
        validityDays: 60
      },
      {
        name: "Urgent",
        description: "Urgent listing for immediate attention",
        amount: "3000",
        currency: "RWF",
        type: "lost_report",
        features: ["Urgent Tag", "Homepage Feature", "Instant Alerts", "90 Days Visibility"],
        status: "active",
        validityDays: 90
      },
      {
        name: "Item Registration",
        description: "Register item ownership with QR code",
        amount: "1000",
        currency: "RWF",
        type: "registration",
        features: ["QR Code", "Ownership Proof", "Lifetime Registration"],
        status: "active",
        validityDays: 3650 // 10 years
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
