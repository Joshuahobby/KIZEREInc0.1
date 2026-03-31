import { Router } from "express";
import { storage } from "../storage";
import { insertUserSchema, users, DEFAULT_USER_PREFERENCES, VerificationCodeChannel, VerificationCodeType } from "@shared/schema";
import { z } from "zod";
import { createLogger } from "../utils/logger";
import { requireAdminOrAgent } from "../middleware/auth.middleware";
import { hashPassword } from "../utils/auth-crypto";
import { sendWelcomeEmail } from "../services/email.service";
import { sendOTP, verifyOTP } from "../services/otp.service";
import { createConsentRecord } from "../storage/consent.storage";

const logger = createLogger('AgentRoutes');
const router = Router();

// All routes here require Agent or Admin role
router.use(requireAdminOrAgent);

/**
 * POST /api/agent/users
 * Step 1: Validate all fields and create user in PENDING state.
 * OTP is NOT sent here — the agent must call /users/:userId/send-otp after confirming creation.
 */
router.post("/users", async (req, res) => {
  try {
    const { fullName, username, email, phoneNumber, password, consentGiven, verificationDocuments } = req.body;

    if (!consentGiven) {
      return res.status(400).json({ message: "Physical consent is mandatory for assisted registration." });
    }

    // Basic validation
    if (!fullName || !username || !email || !password) {
        return res.status(400).json({ message: "Missing required fields (fullName, username, email, password)" });
    }

    // --- Uniqueness checks (ALL run before any creation) ---
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) return res.status(409).json({ message: "Username already exists", field: "username" });
    
    const existingEmail = await storage.getUserByEmail(email);
    if (existingEmail) return res.status(409).json({ message: "Email already exists", field: "email" });

    if (phoneNumber) {
      const { UserService } = await import("../services/user.service");
      const existingPhone = await UserService.getUserByPhoneNumber(phoneNumber);
      if (existingPhone) return res.status(409).json({ message: "Phone number already registered", field: "phoneNumber" });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user in PENDING state (no OTP sent yet)
    const user = await storage.createUser({
      fullName,
      username,
      email,
      phoneNumber,
      password: hashedPassword,
      role: 'Subscriber',
      status: 'pending',
      verificationStatus: 'pending',
      phoneVerified: false,
      emailVerified: false,
      verificationDocuments,
      preferences: {
          ...DEFAULT_USER_PREFERENCES,
          notifications: { email: true, sms: !!phoneNumber, push: true }
      }
    });

    logger.info("Assisted user created (pending OTP)", { userId: user.id, username });

    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    logger.error("Failed to create user", { error });
    res.status(500).json({ message: "Failed to create user account" });
  }
});

/**
 * POST /api/agent/users/:userId/send-otp
 * Step 2: Send OTP to a pending user AFTER successful creation.
 * Agent calls this only after confirming the user was created without conflicts.
 */
router.post("/users/:userId/send-otp", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const user = await storage.getUser(userId);

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.status !== 'pending') {
      return res.status(400).json({ message: "OTP can only be sent to users in pending status" });
    }

    const channel = user.phoneNumber ? 'sms' : 'email';
    const destination = user.phoneNumber || user.email;
    const otpType = user.phoneNumber ? 'phone_verify' : 'email_verify';

    await sendOTP(user.id, channel as VerificationCodeChannel, otpType as VerificationCodeType, destination);

    logger.info("OTP sent for assisted registration", { userId, channel });

    res.json({
      message: `Verification code sent via ${channel}`,
      channel,
      maskedContact: channel === 'sms'
        ? `******${destination.slice(-4)}`
        : destination.replace(/(?<=.{3}).(?=.*@)/g, '*')
    });
  } catch (error) {
    logger.error("Failed to send OTP", { error });
    res.status(500).json({ message: "Failed to send verification code" });
  }
});

/**
 * POST /api/agent/users/verify
 * Verifies the OTP and activates the assisted user account.
 */
router.post("/users/verify", async (req, res) => {
  try {
    const { userId, code } = req.body;
    if (!userId || !code) return res.status(400).json({ message: "User ID and verification code are required" });

    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Determine verification type based on what was provided during registration
    const otpType = user.phoneNumber ? 'phone_verify' : 'email_verify';
    
    const verification = await verifyOTP(userId, code, otpType as VerificationCodeType);
    if (!verification.valid) {
      return res.status(400).json({ message: verification.message });
    }

    // Activate and verify user
    const updatedUser = await storage.updateUser(userId, {
      status: 'active',
      verificationStatus: 'approved',
      phoneVerified: !!user.phoneNumber,
      emailVerified: true,
    });

    // Record Physical Consent (Rwanda Law No. 058/2021)
    await createConsentRecord({
      userId: user.id,
      consentType: "assisted_registration",
      consentGiven: true,
      consentText: `Registration assisted by Agent ${req.user!.fullName} (ID: ${req.user!.id}). Physical ID verified. OTP verification completed.`,
      ipAddress: (req.ip as string) || null,
      userAgent: req.headers["user-agent"] || null,
    });

    // Log the agent action
    await storage.createUserActivityLog({
        userId: req.user!.id,
        action: 'agent_assisted_user_creation',
        details: {
            targetUserId: user.id,
            targetUsername: user.username,
            verified: true
        },
        ipAddress: (req.ip as string) || null,
        userAgent: req.headers["user-agent"] || null
    });

    // Send welcome email
    sendWelcomeEmail(user.email, user.fullName || user.username)
      .catch(err => logger.error('Failed to send welcome email', { error: err }));

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found after verification" });
    }

    const { password: _, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error) {
    logger.error("Failed to verify user", { error });
    res.status(500).json({ message: "Verification failed" });
  }
});

/**
 * POST /api/agent/handover/otp/send
 * Initiates the secure handover process by sending an OTP to the claimant.
 */
router.post("/handover/otp/send", async (req, res) => {
    try {
        const { claimId } = req.body;
        if (!claimId) return res.status(400).json({ message: "Claim ID is required" });

        const claim = await storage.getClaim(claimId);
        if (!claim) return res.status(404).json({ message: "Claim not found" });

        const claimant = await storage.getUser(claim.userId);
        if (!claimant) return res.status(404).json({ message: "Claimant not found" });

        // Generate and send OTP
        const channel = claimant.phoneNumber ? 'sms' : 'email';
        const contact = claimant.phoneNumber || claimant.email;
        
        const result = await sendOTP(claimant.id, channel as VerificationCodeChannel, 'handover_verify' as VerificationCodeType, contact);

        res.json({ 
            message: result.message, 
            channel,
            maskedContact: channel === 'sms' ? `******${contact.slice(-4)}` : contact.replace(/(?<=.{3}).(?=.*@)/g, '*')
        });
    } catch (error) {
        logger.error("Failed to send handover OTP", { error });
        res.status(500).json({ message: "Failed to send OTP" });
    }
});

/**
 * POST /api/agent/handover/otp/verify
 * Verifies the handover OTP and completes the custody transfer.
 */
router.post("/handover/otp/verify", async (req, res) => {
    try {
        const { claimId, code } = req.body;
        if (!claimId || !code) return res.status(400).json({ message: "Claim ID and code are required" });

        const claim = await storage.getClaim(claimId);
        if (!claim) return res.status(404).json({ message: "Claim not found" });

        const isValid = await verifyOTP(claim.userId, code, 'handover_verify' as VerificationCodeType);
        if (!isValid.valid) {
            return res.status(400).json({ message: isValid.message || "Invalid or expired handover code." });
        }

        // Complete the handover in DB
        await storage.updateClaim(claimId, {
            status: 'resolved',
            handedOverAt: new Date(),
            handoverOtp: 'VERIFIED' // Mark as verified physically
        });

        // Update item status if applicable
        const report = await storage.getReport(claim.reportId);
        if (report && report.itemId) {
            await storage.updateItem(report.itemId, { status: 'Recovered' });
            await storage.updateReport(report.id, { status: 'Resolved' });
        }

        // Log agent action
        await storage.createUserActivityLog({
            userId: req.user!.id,
            action: 'agent_verified_handover',
            details: {
                claimId,
                reportId: claim.reportId,
                claimantId: claim.userId
            },
            ipAddress: (req.ip as string) || null,
            userAgent: req.headers["user-agent"] || null
        });

        res.json({ success: true, message: "Handover completed successfully." });
    } catch (error) {
        logger.error("Failed to verify handover OTP", { error });
        res.status(500).json({ message: "Failed to complete handover" });
    }
});

/**
 * GET /api/agent/stats
 * Get performance stats for the current agent.
 */
router.get("/stats", async (req, res) => {
    try {
        const agentId = req.user!.id;
        // This would normally be a more complex query, for now returning dummy/basic stats
        // We'll calculate based on activity logs
        const logs = await storage.getUserActivityLogs(agentId, 1, 1000);
        
        const stats = {
            registrations: logs.filter(l => l.action === 'agent_assisted_user_creation' || l.action === 'assisted_item_registration').length,
            handovers: logs.filter(l => l.action === 'agent_verified_handover').length,
            verifications: logs.filter(l => l.action === 'identity_verification_approved').length,
        };

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch agent stats" });
    }
});

export default router;
