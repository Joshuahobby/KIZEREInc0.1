import { db } from "../server/db";
import { 
  users, items, reports, claims, verificationRequests, moderationReports,
  userRoles, itemCategories, reportStatuses, verificationStatuses,
  claimStatuses
} from "../shared/schema";
import { hashPassword } from "../server/utils/auth-crypto";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding database with realistic data...");

  try {
    // 1. Clear existing data
    await db.delete(moderationReports);
    await db.delete(claims);
    await db.delete(verificationRequests);
    await db.delete(reports);
    await db.delete(items);
    await db.delete(users);
    console.log("🧹 Cleared existing data");

    // 2. Create Users
    const password = await hashPassword("Password123!");
    
    const [admin] = await db.insert(users).values({
      fullName: "System Admin",
      username: "admin",
      email: "admin@kizere.com",
      password: password,
      role: "Admin",
      status: "active",
      verificationStatus: "approved"
    }).returning();

    const [agent] = await db.insert(users).values({
      fullName: "Service Agent",
      username: "agent",
      email: "agent@kizere.com",
      password: password,
      role: "Agent",
      status: "active",
      verificationStatus: "approved"
    }).returning();

    const [moderator] = await db.insert(users).values({
      fullName: "Moderator X",
      username: "moderator",
      email: "mod@kizere.com",
      password: password,
      role: "Moderator",
      status: "active",
      verificationStatus: "approved"
    }).returning();

    const [john] = await db.insert(users).values({
      fullName: "John Doe",
      username: "john_doe",
      email: "john@example.com",
      password: password,
      role: "Subscriber",
      status: "active",
      verificationStatus: "approved"
    }).returning();

    const [jane] = await db.insert(users).values({
      fullName: "Jane Smith",
      username: "jane_smith",
      email: "jane@example.com",
      password: password,
      role: "Subscriber",
      status: "active",
      verificationStatus: "pending"
    }).returning();

    const [businessUser] = await db.insert(users).values({
      fullName: "Kizere Hotel Group",
      username: "kizere_hotel",
      email: "admin@kizerehotel.com",
      password: password,
      role: "Subscriber",
      status: "active",
      verificationStatus: "approved"
    }).returning();

    console.log("👤 Created users");

    // 3. Create Verification Requests
    await db.insert(verificationRequests).values({
      userId: john.id,
      documentType: "nid",
      documentUrl: "https://res.cloudinary.com/demo/image/upload/v1624103192/sample.jpg",
      selfieUrl: "https://res.cloudinary.com/demo/image/upload/v1624103192/sample.jpg",
      status: "approved",
      reviewedBy: admin.id,
      reviewedAt: new Date()
    });

    await db.insert(verificationRequests).values({
      userId: jane.id,
      documentType: "passport",
      documentUrl: "https://res.cloudinary.com/demo/image/upload/v1624103192/sample.jpg",
      selfieUrl: "https://res.cloudinary.com/demo/image/upload/v1624103192/sample.jpg",
      status: "pending"
    });

    console.log("🛡️ Created verification requests");

    // 4. Create Items
    const [johnWallet] = await db.insert(items).values({
      userId: john.id,
      name: "Brown Leather Wallet",
      category: "Wallets",
      uniqueIdentifier: "WLT-7788",
      description: "A brown leather wallet with some old receipts and a library card.",
      status: "Lost",
      location: "Kigali Heights"
    }).returning();

    const [hotelItem1] = await db.insert(items).values({
      userId: businessUser.id,
      name: "Keys with Keychain",
      category: "Keys",
      uniqueIdentifier: "KEY-001",
      description: "Found in Room 302",
      status: "Found",
      location: "Hotel Lobby"
    }).returning();

    console.log("📦 Created items");

    // 5. Create Reports
    // John's Lost Report
    const [johnLostReport] = await db.insert(reports).values({
      userId: john.id,
      itemId: johnWallet.id,
      type: "lost",
      category: "Wallets",
      title: "Lost Brown Wallet at Kigali Heights",
      description: "Lost my wallet yesterday at Kigali Heights. It's brown leather.",
      location: "Kigali Heights, Entrance",
      date: new Date(),
      status: "Open",
      receiptNumber: "LST-ABC12"
    }).returning();

    // Jane's Found Report (Found a phone)
    const [janeFoundReport] = await db.insert(reports).values({
      userId: jane.id,
      type: "found",
      category: "Phones",
      title: "Found iPhone 15 Pro",
      description: "Found an iPhone 15 Pro near the parking lot. Case is blue.",
      location: "Kimihurura Parking",
      date: new Date(),
      status: "Open",
      receiptNumber: "FND-XYZ89",
      imageUrls: ["https://images.unsplash.com/photo-1696446701796-da61225697cc"]
    }).returning();

    // Hotel Found Report
    const [hotelFoundReport] = await db.insert(reports).values({
      userId: businessUser.id,
      itemId: hotelItem1.id,
      type: "found",
      category: "Keys",
      title: "Keys found in Suite 302",
      description: "Found a set of keys with a leather keychain.",
      location: "Kizere Hotel - Lobby",
      date: new Date(),
      status: "Open",
      receiptNumber: "FND-HOT01"
    }).returning();

    // Another Found Report (Someone found John's wallet - for claim testing)
    const [someoneFoundWallet] = await db.insert(reports).values({
      userId: agent.id, // Agent found it
      type: "found",
      category: "Wallets",
      title: "Wallet found at Heights",
      description: "Found a brown wallet. Looks like it has a library card inside.",
      location: "Kigali Heights, Floor 2",
      date: new Date(),
      status: "Open",
      receiptNumber: "FND-WLT55"
    }).returning();

    console.log("📋 Created reports");

    // 6. Create Claims
    // John claims the wallet found by Agent
    const [johnClaim] = await db.insert(claims).values({
      userId: john.id,
      reportId: someoneFoundWallet.id,
      description: "This is my wallet! It has my library card inside with the name John Doe.",
      status: "pending"
    }).returning();

    console.log("🚩 Created claims");

    // 7. Create Moderation Reports
    await db.insert(moderationReports).values({
      reportId: janeFoundReport.id,
      reporterEmail: "suspicious_user@fake.com",
      reason: "scam",
      description: "This post looks suspicious. The location is famous for scams.",
      status: "pending"
    });

    await db.insert(moderationReports).values({
      claimId: johnClaim.id,
      reporterEmail: "finder@example.com",
      reason: "inappropriate",
      description: "The claim description contains aggressive language.",
      status: "pending"
    });

    console.log("⚖️ Created moderation reports");

    console.log("✨ Seeding complete!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
