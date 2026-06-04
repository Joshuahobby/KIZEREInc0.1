/**
 * Seed default payment packages for all revenue types.
 * Safe to run multiple times — skips any type that already has an active package.
 *
 * Usage:
 *   npx tsx server/scripts/seed-payment-packages.ts
 */
import { db } from "../db";
import { paymentPackages } from "@shared/schema";
import { eq } from "drizzle-orm";
import { createLogger } from "../utils/logger";

const logger = createLogger("SeedPaymentPackages");

const DEFAULTS: Array<{
  name: string;
  description: string;
  type: string;
  amount: string;
  currency: string;
  features: string[];
}> = [
  {
    name: "Item Registration Fee",
    description: "One-time fee to register an item on KIZERE and activate its smart label",
    type: "registration",
    amount: "200",
    currency: "RWF",
    features: ["Smart QR label", "Lost/found reporting", "Ownership certificate eligibility"],
  },
  {
    name: "Lost Report Fee",
    description: "Fee to file a public lost-item report and notify the community",
    type: "lost_report",
    amount: "100",
    currency: "RWF",
    features: ["Public report", "Community alerts", "Claim management"],
  },
  {
    name: "Ownership Transfer Fee",
    description: "Fee to transfer registered item ownership to another KIZERE user",
    type: "transfer_fee",
    amount: "300",
    currency: "RWF",
    features: ["Instant ownership transfer", "Audit trail", "Notification to recipient"],
  },
  {
    name: "Ownership Certificate",
    description: "Official KIZERE certificate of ownership — downloadable PNG with unique code",
    type: "ownership_certificate",
    amount: "500",
    currency: "RWF",
    features: ["Official certificate code", "Downloadable PNG", "QR-verifiable"],
  },
  {
    name: "Full Verification Report",
    description: "48-hour access to full ownership history and owner contact details for any item",
    type: "verification_report",
    amount: "500",
    currency: "RWF",
    features: ["Owner details", "Registration history", "48-hour access"],
  },
  {
    name: "KIZERE Premium — Annual",
    description: "Unlimited item registrations and verification reports for 1 year",
    type: "consumer_subscription",
    amount: "2000",
    currency: "RWF",
    features: [
      "Unlimited registrations",
      "Unlimited verification reports",
      "Priority support",
      "1-year validity",
    ],
  },
  {
    name: "Retailer Subscription — Annual",
    description: "Annual standard plan for retail businesses using the KIZERE POS terminal",
    type: "retailer_subscription",
    amount: "15000",
    currency: "RWF",
    features: ["POS terminal access", "Commission payouts", "Inventory management", "1-year validity"],
  },
];

async function seed() {
  logger.info("Seeding default payment packages...");
  let inserted = 0;
  let skipped = 0;

  for (const pkg of DEFAULTS) {
    const existing = await db
      .select({ id: paymentPackages.id })
      .from(paymentPackages)
      .where(eq(paymentPackages.type, pkg.type as any))
      .limit(1);

    if (existing.length > 0) {
      logger.info(`Skipping "${pkg.type}" — package already exists (id=${existing[0].id})`);
      skipped++;
      continue;
    }

    await db.insert(paymentPackages).values({
      name: pkg.name,
      description: pkg.description,
      type: pkg.type as any,
      amount: pkg.amount,
      currency: pkg.currency,
      features: pkg.features,
      status: "active",
      isDefault: true,
    });

    logger.info(`Inserted package: ${pkg.name} (${pkg.type}) — ${pkg.currency} ${pkg.amount}`);
    inserted++;
  }

  logger.info(`Done. Inserted: ${inserted}, Skipped (already existed): ${skipped}`);
  process.exit(0);
}

seed().catch((err) => {
  logger.error("Seed failed", { error: err });
  process.exit(1);
});
