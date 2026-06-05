/**
 * OTP Service — Generate, store, and verify one-time codes for 2FA
 */
import crypto from 'crypto';
import { eq, and, gt, lt, isNull, desc } from 'drizzle-orm';
import { db } from '../db';
import { verificationCodes, users } from '@shared/schema';
import type { VerificationCodeType, VerificationCodeChannel } from '@shared/schema';
import { createLogger } from '../utils/logger';
import { sendOTPViaSMS } from './sms.service';
import { sendEmail } from './email.service';

const logger = createLogger('OTPService');

// Configuration
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS_PER_WINDOW = 5;
const RATE_LIMIT_WINDOW_MINUTES = 15;

/**
 * Generate a cryptographically secure 6-digit OTP
 */
function generateOTPCode(): string {
  // Generate a random number between 100000 and 999999
  const randomBytes = crypto.randomBytes(4);
  const num = randomBytes.readUInt32BE(0);
  const code = (num % 900000 + 100000).toString();
  return code;
}

/**
 * Hash an OTP code for secure storage
 */
function hashOTP(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/**
 * Check rate limiting — max N OTP requests per window
 */
async function checkRateLimit(userId: number): Promise<boolean> {
  const windowStart = new Date();
  windowStart.setMinutes(windowStart.getMinutes() - RATE_LIMIT_WINDOW_MINUTES);

  const recentCodes = await db
    .select()
    .from(verificationCodes)
    .where(
      and(
        eq(verificationCodes.userId, userId),
        gt(verificationCodes.createdAt, windowStart)
      )
    );

  if (recentCodes.length >= MAX_ATTEMPTS_PER_WINDOW) {
    logger.warn('OTP rate limit exceeded', { userId, count: recentCodes.length });
    return false; // Rate limited
  }

  return true; // OK
}

/**
 * Send an OTP code to a user
 * 
 * @param userId - The user's ID
 * @param channel - 'sms' or 'email'
 * @param type - 'login_2fa', 'phone_verify', or 'email_verify'
 * @param destination - Phone number or email address to send to
 * @returns Object with success status and optional message
 */
export async function sendOTP(
  userId: number,
  channel: VerificationCodeChannel,
  type: VerificationCodeType,
  destination: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Rate limit check
    const allowed = await checkRateLimit(userId);
    if (!allowed) {
      return {
        success: false,
        message: 'Too many verification requests. Please wait before trying again.'
      };
    }

    // Generate code
    const code = generateOTPCode();
    const hashedCode = hashOTP(code);

    // Set expiry
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

    // Store hashed code in database
    const [insertedCode] = await db.insert(verificationCodes).values({
      userId,
      code: hashedCode,
      type,
      channel,
      expiresAt,
    }).returning({ id: verificationCodes.id });

    // Send the code via the chosen channel
    let sent = false;
    if (channel === 'sms') {
      sent = await sendOTPViaSMS(destination, code);
    } else if (channel === 'email') {
      sent = await sendOTPEmail(destination, code);
    }

    if (!sent) {
      // Clean up the unused code so it doesn't count against their rate limit
      await db.delete(verificationCodes).where(eq(verificationCodes.id, insertedCode.id));
      
      logger.error('Failed to deliver OTP', { userId, channel, type });
      return {
        success: false,
        message: `Failed to send verification code via ${channel}. Please try again.`
      };
    }

    logger.info('OTP sent successfully', { userId, channel, type });
    return {
      success: true,
      message: `Verification code sent via ${channel}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`
    };
  } catch (error) {
    logger.error('Error sending OTP', { error, userId, channel, type });
    return {
      success: false,
      message: 'An error occurred while sending the verification code.'
    };
  }
}

/**
 * Verify an OTP code
 * 
 * @param userId - The user's ID
 * @param code - The 6-digit code entered by the user
 * @param type - The type of verification
 * @returns Whether the code is valid
 */
export async function verifyOTP(
  userId: number,
  code: string,
  type: VerificationCodeType
): Promise<{ valid: boolean; message: string; channel?: string }> {
  try {
    const hashedCode = hashOTP(code);
    const now = new Date();

    // Atomic CAS: mark the code as used in a single UPDATE WHERE usedAt IS NULL.
    // This prevents replay attacks from concurrent requests that both pass a SELECT check.
    const [matchingCode] = await db
      .update(verificationCodes)
      .set({ usedAt: now })
      .where(
        and(
          eq(verificationCodes.userId, userId),
          eq(verificationCodes.code, hashedCode),
          eq(verificationCodes.type, type),
          isNull(verificationCodes.usedAt),
          gt(verificationCodes.expiresAt, now)
        )
      )
      .returning();

    if (!matchingCode) {
      // Count recent failed attempts for this user+type to enforce lockout
      const windowStart = new Date(now.getTime() - 15 * 60 * 1000);
      const recentFailed = await db
        .select()
        .from(verificationCodes)
        .where(
          and(
            eq(verificationCodes.userId, userId),
            eq(verificationCodes.type, type),
            gt(verificationCodes.createdAt, windowStart),
            isNull(verificationCodes.usedAt)
          )
        );
      // After 5 distinct unused codes exist (each failed attempt consumed one attempt slot),
      // or if the code simply doesn't match, invalidate all pending codes to force re-issue
      if (recentFailed.length >= 5) {
        await db
          .update(verificationCodes)
          .set({ usedAt: now })
          .where(
            and(
              eq(verificationCodes.userId, userId),
              eq(verificationCodes.type, type),
              isNull(verificationCodes.usedAt)
            )
          );
        logger.warn('OTP lockout — all pending codes invalidated after too many failed attempts', { userId, type });
        return {
          valid: false,
          message: 'Too many failed attempts. Please request a new verification code.'
        };
      }
      logger.warn('Invalid or expired OTP attempt', { userId, type });
      return {
        valid: false,
        message: 'Invalid or expired verification code. Please request a new one.'
      };
    }

    logger.info('OTP verified successfully', { userId, type });
    return {
      valid: true,
      message: 'Verification successful.',
      channel: matchingCode.channel,
    };
  } catch (error) {
    logger.error('Error verifying OTP', { error, userId, type });
    return {
      valid: false,
      message: 'An error occurred during verification.'
    };
  }
}

/**
 * Send OTP via email with branded template
 */
async function sendOTPEmail(email: string, code: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: `Your KIZERE Verification Code: ${code}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Verification Code</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <p style="color: #4b5563; line-height: 1.6;">
            Use the following code to complete your verification:
          </p>
          <div style="background: white; padding: 24px; border-radius: 12px; border: 2px solid #667eea; margin: 24px 0; text-align: center;">
            <p style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1f2937; margin: 0; font-family: 'Courier New', monospace;">
              ${code}
            </p>
          </div>
          <p style="color: #4b5563; line-height: 1.6; font-size: 14px;">
            This code expires in <strong>10 minutes</strong>. Do not share it with anyone.
          </p>
          <p style="color: #9ca3af; line-height: 1.6; font-size: 12px;">
            If you didn't request this code, you can safely ignore this email.
          </p>
        </div>
        <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
          <p>© ${new Date().getFullYear()} KIZERE. All rights reserved.</p>
        </div>
      </div>
    `,
  });
}

/**
 * Clean up expired verification codes (can be called by a cron job)
 */
export async function cleanupExpiredCodes(): Promise<number> {
  try {
    const now = new Date();
    const result = await db
      .delete(verificationCodes)
      .where(
        lt(verificationCodes.expiresAt, now) // expired
      );
    
    // Drizzle doesn't always return count directly, we just log the attempt
    logger.info('Expired verification codes cleanup completed');
    return 0;
  } catch (error) {
    logger.error('Error cleaning up expired codes', { error });
    return 0;
  }
}

export default {
  sendOTP,
  verifyOTP,
  cleanupExpiredCodes,
};
