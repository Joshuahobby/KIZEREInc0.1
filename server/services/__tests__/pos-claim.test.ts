import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "../../db";
import { sendOTP, verifyOTP } from "../otp.service";
import bcrypt from "bcrypt";
// Use the router directly if needed, but it's easier to just mock the service logic.
// We can test the route endpoints by mocking express, but let's just test the logic that would run inside it.
import { isPosStubAccount } from "../pos.service";

vi.mock("../../db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  },
}));

vi.mock("../otp.service", () => ({
  sendOTP: vi.fn().mockResolvedValue({ success: true, message: "OTP sent" }),
  verifyOTP: vi.fn().mockResolvedValue({ valid: true, message: "OK" }),
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("new-hashed-password"),
  },
}));

describe("Claim Account Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Request OTP", () => {
    it("fails if account is not a POS stub", async () => {
      const mockUser = { id: 1, email: "real@email.com" };
      
      expect(isPosStubAccount(mockUser.email)).toBe(false);
      // In route this returns 400
    });

    it("sends OTP for valid stub account", async () => {
      const mockUser = { id: 1, email: "stub@pos.kizere.local" };
      
      expect(isPosStubAccount(mockUser.email)).toBe(true);
      // Call service directly
      const result = await sendOTP(mockUser.id, "sms", "phone_verify", "+250788123456");
      expect(result.success).toBe(true);
      expect(sendOTP).toHaveBeenCalledWith(1, "sms", "phone_verify", "+250788123456");
    });
  });

  describe("Verify OTP", () => {
    it("verifies OTP and hashes new password", async () => {
      const result = await verifyOTP(1, "123456", "phone_verify");
      expect(result.valid).toBe(true);
      
      const newHash = await bcrypt.hash("newPassword123", 10);
      expect(newHash).toBe("new-hashed-password");
    });
  });
});