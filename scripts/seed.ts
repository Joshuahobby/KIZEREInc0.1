import { db } from "../server/db";
import {
  users, items, reports, claims, verificationRequests, moderationReports,
  userRoles, itemCategories, reportStatuses, verificationStatuses,
  claimStatuses, paymentPackages, notifications, payments,
  userActivityLogs, adminActionLogs, statusChanges, userWarnings,
  chats, messages, payouts
} from "../shared/schema";
import { hashPassword } from "../server/utils/auth-crypto";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding database with realistic Rwandan data...");

  try {
    // 1. Clear existing data (Order matters for foreign keys)
    console.log("🧹 Clearing existing data...");
    await db.delete(messages);
    await db.delete(chats);
    await db.delete(payouts);
    await db.delete(moderationReports);
    await db.delete(notifications);
    await db.delete(claims);
    await db.delete(payments);
    await db.delete(reports);
    await db.delete(items);
    await db.delete(verificationRequests);
    await db.delete(userActivityLogs);
    await db.delete(adminActionLogs);
    await db.delete(statusChanges);
    await db.delete(userWarnings);
    await db.delete(paymentPackages);
    await db.delete(users);
    console.log("✅ Cleared existing data");

    // 2. Create Payment Packages
    console.log("💳 Creating payment packages...");
    await db.insert(paymentPackages).values([
      { name: "Standard", description: "7 days visibility", type: "lost_report", amount: "1000", currency: "RWF", status: "active", isDefault: true, features: ["Basic matching", "Email notification"] },
      { name: "Premium", description: "30 days visibility", type: "lost_report", amount: "3000", currency: "RWF", status: "active", isDefault: false, features: ["Priority matching", "WhatsApp alerts"] },
      { name: "Urgent", description: "90 days visibility", type: "lost_report", amount: "10000", currency: "RWF", status: "active", isDefault: false, features: ["Real-time push", "Home feature"] },
      { name: "Single Item", description: "Register one item", type: "registration", amount: "2000", currency: "RWF", status: "active", isDefault: true, features: ["QR Code", "Digital Certificate"] }
    ]);

    // 3. Create Users
    const password = await hashPassword("Password123!");

    console.log("👤 Creating users...");
    const [admin] = await db.insert(users).values({
      fullName: "System Administrator", username: "admin", email: "admin@kizere.rw", password, role: "Admin", status: "active", verificationStatus: "approved"
    }).returning();

    const [agent] = await db.insert(users).values({
      fullName: "Mugisha Eric", username: "mugisha", email: "mugisha@kizere.rw", password, role: "Agent", status: "active", verificationStatus: "approved", phoneNumber: "+250788111222"
    }).returning();

    const [john] = await db.insert(users).values({
      fullName: "John Uwase", username: "john_uwase", email: "john@kizere.rw", password, role: "Subscriber", status: "active", verificationStatus: "approved", phoneNumber: "+250788333444"
    }).returning();

    const [keza] = await db.insert(users).values({
      fullName: "Keza Diane", username: "keza_diane", email: "keza@example.rw", password, role: "Subscriber", status: "active", verificationStatus: "pending", phoneNumber: "+250788555666"
    }).returning();

    const [ganza] = await db.insert(users).values({
      fullName: "Ganza Patrick", username: "ganza_p", email: "ganza@example.rw", password, role: "Subscriber", status: "active", verificationStatus: "approved", phoneNumber: "+250788777888"
    }).returning();

    const [business] = await db.insert(users).values({
      fullName: "Kigali Marriott Hotel", username: "marriott_kgl", email: "security@marriott.rw", password, role: "Business", status: "active", verificationStatus: "approved"
    }).returning();

    // 4. Create Items
    console.log("📦 Creating items...");
    const [laptop] = await db.insert(items).values({
      userId: john.id, name: "MacBook Pro 14\"", category: "Electronics", uniqueIdentifier: "SN-MBP12345", description: "Silver, Space Gray shell case", status: "Lost", location: "Kacyiru"
    }).returning();

    const [phone] = await db.insert(items).values({
      userId: keza.id, name: "Samsung S23 Ultra", category: "Phones", uniqueIdentifier: "IMEI-998877", description: "Green color, cracked screen protector", status: "Recovered", location: "Remera"
    }).returning();

    // 5. Create Reports
    console.log("📋 Creating reports...");
    const [lostLaptopReport] = await db.insert(reports).values({
      userId: john.id, itemId: laptop.id, type: "lost", category: "Electronics", title: "Lost MacBook Pro in Kacyiru", description: "Left it at a coffee shop in Kacyiru yesterday.", location: "Kacyiru, Kigali", date: new Date(), status: "Open", receiptNumber: "L-1001", bountyAmount: "50000", bountyStatus: "escrowed"
    }).returning();

    const [foundPhoneReport] = await db.insert(reports).values({
      userId: ganza.id, type: "found", category: "Phones", title: "Found Samsung Phone near Amahoro Stadium", description: "Found it after the game. It's green.", location: "Remera, Amahoro Stadium", date: new Date(), status: "Resolved", receiptNumber: "F-2001", challengeQuestion: "What is the wallpaper?"
    }).returning();

    const [foundWalletReport] = await db.insert(reports).values({
      userId: business.id, type: "found", category: "Wallets", title: "Brown Wallet found in Lobby", description: "Contains multiple cards and some cash.", location: "Kigali Marriott Lobby", date: new Date(), status: "Open", receiptNumber: "F-2002", challengeQuestion: "What is the name on the ID card inside?"
    }).returning();

    // 6. Create Claims
    console.log("🚩 Creating claims...");
    // Verified Claim
    const [claim1] = await db.insert(claims).values({
      userId: keza.id, reportId: foundPhoneReport.id, description: "I lost my Samsung S23 near the stadium! The wallpaper is a picture of my dog.", status: "resolved", verificationAnswer: "My dog", verifiedAt: new Date(), handedOverAt: new Date()
    }).returning();

    // Pending Claim
    const [claim2] = await db.insert(claims).values({
      userId: john.id, reportId: foundWalletReport.id, description: "I left my brown wallet at the hotel yesterday. It has my NID.", status: "pending", verificationAnswer: "John Uwase"
    }).returning();

    // 7. Create Chats and Messages
    console.log("💬 Creating chat history...");
    const [chat1] = await db.insert(chats).values({
      reportId: foundPhoneReport.id, claimId: claim1.id, finderId: ganza.id, claimantId: keza.id
    }).returning();

    await db.insert(messages).values([
      { chatId: chat1.id, senderId: keza.id, content: "Hello, I think this is my phone. Where can we meet?" },
      { chatId: chat1.id, senderId: ganza.id, content: "Hi! I am at Remera. Can you confirm the wallpaper color?" },
      { chatId: chat1.id, senderId: keza.id, content: "It's a photo of my Golden Retriever." },
      { chatId: chat1.id, senderId: ganza.id, content: "That matches! Please come to Amahoro gate 2." }
    ]);

    // 8. Create Payouts
    console.log("💰 Creating payouts...");
    await db.insert(payouts).values({
      userId: ganza.id, reportId: foundPhoneReport.id, amount: "5000", currency: "RWF", status: "completed", destination: "+250788777888", processedAt: new Date()
    });

    // 9. Activity Logs
    console.log("📝 Creating activity logs...");
    await db.insert(userActivityLogs).values([
      { userId: john.id, action: "login", details: { browser: "Chrome" } },
      { userId: keza.id, action: "report_filed", details: { type: "found" } }
    ]);

    console.log("✨ Seeding complete with high-fidelity Rwandan data!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed().then(() => process.exit(0));
