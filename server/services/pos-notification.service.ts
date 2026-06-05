import { createLogger } from "../utils/logger";
import { users } from "@shared/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { sendPosRegistrationEmail, sendPosTransferEmail } from "./email.service";
import { sendPosRegistrationSMS, sendPosTransferSMS, isValidRwandanPhone } from "./sms.service";
import { storage } from "../storage";

const logger = createLogger("PosNotificationService");

export type PosEventType = "registration" | "transfer";

export interface PosNotificationData {
  userId: number;
  productId: number;
  productName: string;
  serialNumber: string;
  category: string;
  retailerName: string;
  ledgerId?: number;
}

/**
 * Orchestrates notifications (Email, SMS, In-App) for POS events.
 * Fire-and-forget: does not block the main request flow.
 */
export async function notifyPosCustomer(
  event: PosEventType,
  data: PosNotificationData
): Promise<void> {
  try {
    // 1. Fetch user details
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, data.userId))
      .limit(1);

    if (!user) {
      logger.error(`User ${data.userId} not found for POS notification`);
      return;
    }

    const isStubAccount = user.email?.endsWith("@pos.kizere.local") ?? false;
    const hasRealEmail = user.email && !isStubAccount;
    const hasValidPhone = user.phoneNumber && isValidRwandanPhone(user.phoneNumber);

    const formattedProductId = `POS-${String(data.productId).padStart(6, "0")}`;

    // 2. In-App Notification (Always)
    const notificationTitle =
      event === "registration" ? "Product Registered" : "Ownership Transferred";
    const notificationMessage =
      event === "registration"
        ? `${data.productName} has been registered to your account by ${data.retailerName}. Visit My Devices to download your purchase contract.`
        : `${data.productName} has been transferred to your account by ${data.retailerName}. Visit My Devices to download your purchase contract.`;

    await storage.createNotification({
      userId: user.id,
      title: notificationTitle,
      message: notificationMessage,
      type: "system",
      isRead: false,
    });

    // 3. Email Notification (If real email exists)
    if (hasRealEmail) {
      if (event === "registration") {
        await sendPosRegistrationEmail(user.email!, {
          customerName: user.fullName,
          productName: data.productName,
          serialNumber: data.serialNumber,
          category: data.category,
          productId: formattedProductId,
          retailerName: data.retailerName,
          isNewAccount: isStubAccount, // Though if they have a real email, they might still be a stub if they provided an email during POS creation
        });
      } else if (event === "transfer") {
        await sendPosTransferEmail(user.email!, {
          customerName: user.fullName,
          productName: data.productName,
          serialNumber: data.serialNumber,
          productId: formattedProductId,
          retailerName: data.retailerName,
        });
      }
    }

    // 4. SMS Notification (If valid Rwandan phone exists)
    if (hasValidPhone) {
      if (event === "registration") {
        await sendPosRegistrationSMS(user.phoneNumber!, {
          productName: data.productName,
          productId: formattedProductId,
          retailerName: data.retailerName,
        });
      } else if (event === "transfer") {
        await sendPosTransferSMS(user.phoneNumber!, {
          productName: data.productName,
          productId: formattedProductId,
          retailerName: data.retailerName,
        });
      }
    }

    logger.info(`POS notifications sent for ${event}`, {
      userId: user.id,
      emailSent: hasRealEmail,
      smsSent: hasValidPhone,
    });
  } catch (error) {
    logger.error("Failed to send POS notifications", { error, event, userId: data.userId });
  }
}
