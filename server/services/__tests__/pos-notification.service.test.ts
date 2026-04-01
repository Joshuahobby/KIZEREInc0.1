import { describe, it, expect, vi, beforeEach } from "vitest";
import { notifyPosCustomer } from "../pos-notification.service";
import { db } from "../../db";
import { storage } from "../../storage";
import { sendPosRegistrationEmail } from "../email.service";
import { sendPosRegistrationSMS } from "../sms.service";

vi.mock("../../db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  },
}));

vi.mock("../../storage", () => ({
  storage: {
    createNotification: vi.fn().mockResolvedValue({}),
  }
}));

vi.mock("../email.service", () => ({
  sendPosRegistrationEmail: vi.fn().mockResolvedValue(true),
  sendPosTransferEmail: vi.fn().mockResolvedValue(true),
}));

vi.mock("../sms.service", () => ({
  sendPosRegistrationSMS: vi.fn().mockResolvedValue(true),
  sendPosTransferSMS: vi.fn().mockResolvedValue(true),
  isValidRwandanPhone: vi.fn().mockReturnValue(true),
}));

describe("POS Notification Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends no emails/sms for stub account with no phone, but creates in-app notif", async () => {
    const mockUser = { id: 1, fullName: "Test", email: "test@pos.kizere.local", phoneNumber: null };
    (db.limit as any).mockResolvedValueOnce([mockUser]);

    await notifyPosCustomer("registration", {
      userId: 1,
      productId: 10,
      productName: "Item",
      serialNumber: "123",
      category: "Other",
      retailerName: "Store",
    });

    expect(storage.createNotification).toHaveBeenCalled();
    expect(sendPosRegistrationEmail).not.toHaveBeenCalled();
    expect(sendPosRegistrationSMS).not.toHaveBeenCalled();
  });

  it("sends email and sms if user has real email and valid phone", async () => {
    const mockUser = { id: 1, fullName: "Test", email: "test@gmail.com", phoneNumber: "+250788123456" };
    (db.limit as any).mockResolvedValueOnce([mockUser]);

    await notifyPosCustomer("registration", {
      userId: 1,
      productId: 10,
      productName: "Item",
      serialNumber: "123",
      category: "Other",
      retailerName: "Store",
    });

    expect(storage.createNotification).toHaveBeenCalled();
    expect(sendPosRegistrationEmail).toHaveBeenCalled();
    expect(sendPosRegistrationSMS).toHaveBeenCalled();
  });
});
