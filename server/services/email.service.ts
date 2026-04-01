import { Resend } from 'resend';
import { createLogger } from '../utils/logger';
import { config } from '../config';

const logger = createLogger('EmailService');

// Lazy-initialized Resend client
let _resend: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.warn('RESEND_API_KEY is missing. Email service will be disabled.');
    return null;
  }

  if (!_resend) {
    try {
      _resend = new Resend(apiKey);
    } catch (error) {
      logger.error('Failed to initialize Resend client', { error });
      return null;
    }
  }
  return _resend;
}

// Default sender email (must be verified in Resend)
const FROM_EMAIL = process.env.FROM_EMAIL || 'KIZERE <noreply@kizere.com>';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: { filename: string; content: Buffer }[];
}

/**
 * Send a generic email
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    logger.info('Sending email', { to: options.to, subject: options.subject });

    const client = getResendClient();
    if (!client) {
      logger.warn('RESEND_API_KEY missing - Email logged to console only');
      logger.info(`📧 EMAIL to ${options.to}: ${options.subject}`);
      console.log(`\n📧 [DEV EMAIL] To: ${options.to}\n   Subject: ${options.subject}\n   Content (preview): ${options.html.substring(0, 50)}...\n`);
      return true; // Simulate success in dev
    }

    const result = await client.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      ...(options.attachments?.length ? { attachments: options.attachments } : {}),
    });

    if (result.error) {
      logger.error('Failed to send email via Resend API', { error: result.error, to: options.to });
      // In development, fall back to console logging to unblock the flow
      if (process.env.NODE_ENV !== 'production') {
        logger.warn('Email failed but simulating success in dev mode');
        console.log(`\n📧 [DEV EMAIL FALLBACK] To: ${options.to}\n   Subject: ${options.subject}\n   Content (preview): ${options.html.substring(0, 50)}...\n`);
        return true;
      }
      return false;
    }

    logger.info('Email sent successfully', { id: result.data?.id });
    return true;
  } catch (error) {
    logger.error('Failed to send email', { error, to: options.to });
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('Email threw error but simulating success in dev mode');
      return true;
    }
    return false;
  }
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(email: string, fullName: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: 'Welcome to KIZERE! 🎉',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Welcome to KIZERE</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937;">Hello ${fullName}! 👋</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Thank you for joining KIZERE, Rwanda's trusted platform for lost and found items.
          </p>
          <p style="color: #4b5563; line-height: 1.6;">
            With KIZERE, you can:
          </p>
          <ul style="color: #4b5563; line-height: 1.8;">
            <li>Register your valuable items</li>
            <li>Report lost or found items</li>
            <li>Get notified when your items are found</li>
            <li>Help others reunite with their belongings</li>
          </ul>
          <a href="${process.env.APP_URL || 'https://kizere.com'}/dashboard" 
             style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">
            Go to Dashboard
          </a>
        </div>
        <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
          <p>© ${new Date().getFullYear()} KIZERE. All rights reserved.</p>
        </div>
      </div>
    `,
  });
}

/**
 * Send translator application email
 */
export async function sendApplicationEmail(
  name: string,
  email: string,
  phone: string,
  targetLanguage: string,
  sampleTranslation: string,
  file?: { originalname: string; buffer: Buffer; mimetype: string }
): Promise<boolean> {
  const attachments = file
    ? [{ filename: file.originalname, content: file.buffer }]
    : undefined;

  return sendEmail({
    to: 'career@kizere.rw',
    subject: `New Translator Application from ${name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 20px;">New Application Received</h1>
        </div>
        <div style="padding: 30px; background: #ffffff;">
          <h2 style="color: #1f2937; margin-top: 0;">Applicant Details</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; width: 40%;">Name:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-weight: 500;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280;">Email:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #111827;">
                <a href="mailto:${email}" style="color: #3b82f6; text-decoration: none;">${email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280;">Phone:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #111827;">
                <a href="tel:${phone}" style="color: #3b82f6; text-decoration: none;">${phone || 'N/A'}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280;">Target Language:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-weight: 500;">${targetLanguage}</td>
            </tr>
            ${file ? `<tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280;">Attachment:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #111827;">📎 ${file.originalname}</td>
            </tr>` : ''}
          </table>
          
          <h3 style="color: #1f2937; margin-top: 30px; margin-bottom: 10px;">Sample Translation:</h3>
          <div style="background: #f9fafb; padding: 20px; border-radius: 6px; border: 1px solid #e5e7eb; color: #374151; white-space: pre-wrap; font-family: monospace;">${sampleTranslation}</div>
        </div>
        <div style="padding: 15px; text-align: center; color: #9ca3af; font-size: 12px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0;">Sent automatically from KIZERE Landing Page</p>
        </div>
      </div>
    `,
    attachments,
  });
}

/**
 * Send report confirmation email
 */
export async function sendReportConfirmationEmail(
  email: string,
  fullName: string,
  reportType: 'lost' | 'found',
  itemTitle: string,
  receiptNumber: string
): Promise<boolean> {
  const typeLabel = reportType === 'lost' ? 'Lost' : 'Found';
  const typeColor = reportType === 'lost' ? '#ef4444' : '#22c55e';

  return sendEmail({
    to: email,
    subject: `Your ${typeLabel} Item Report - ${receiptNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${typeColor}; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">${typeLabel} Item Report Submitted</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937;">Hello ${fullName},</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Your ${reportType} item report has been successfully submitted.
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="margin: 8px 0;"><strong>Item:</strong> ${itemTitle}</p>
            <p style="margin: 8px 0;"><strong>Receipt Number:</strong> <code style="background: #f3f4f6; padding: 2px 8px; border-radius: 4px;">${receiptNumber}</code></p>
            <p style="margin: 8px 0;"><strong>Status:</strong> Open</p>
          </div>
          <p style="color: #4b5563; line-height: 1.6;">
            We'll notify you if there are any updates or matches for your report.
          </p>
          <a href="${process.env.APP_URL || 'https://kizere.com'}/report/${receiptNumber}" 
             style="display: inline-block; background: ${typeColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">
            View Report
          </a>
        </div>
        <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
          <p>© ${new Date().getFullYear()} KIZERE. All rights reserved.</p>
        </div>
      </div>
    `,
  });
}

/**
 * Send claim notification to item owner
 */
export async function sendClaimNotificationEmail(
  ownerEmail: string,
  ownerName: string,
  itemTitle: string,
  claimantName: string,
  reportId: number
): Promise<boolean> {
  return sendEmail({
    to: ownerEmail,
    subject: `New Claim on Your Found Item - ${itemTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #3b82f6; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">New Ownership Claim</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937;">Hello ${ownerName},</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Someone has filed a claim on an item you found!
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="margin: 8px 0;"><strong>Item:</strong> ${itemTitle}</p>
            <p style="margin: 8px 0;"><strong>Claimant:</strong> ${claimantName}</p>
          </div>
          <p style="color: #4b5563; line-height: 1.6;">
            Please review the claim and verify if the item belongs to the claimant.
          </p>
          <a href="${process.env.APP_URL || 'https://kizere.com'}/dashboard?tab=claims" 
             style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">
            Review Claim
          </a>
        </div>
        <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
          <p>© ${new Date().getFullYear()} KIZERE. All rights reserved.</p>
        </div>
      </div>
    `,
  });
}

/**
 * Send claim status update to claimant
 */
export async function sendClaimStatusEmail(
  claimantEmail: string,
  claimantName: string,
  itemTitle: string,
  status: 'approved' | 'rejected'
): Promise<boolean> {
  const isApproved = status === 'approved';
  const statusColor = isApproved ? '#22c55e' : '#ef4444';
  const statusText = isApproved ? 'Approved' : 'Rejected';
  const emoji = isApproved ? '🎉' : '😔';

  return sendEmail({
    to: claimantEmail,
    subject: `Your Claim ${statusText} - ${itemTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${statusColor}; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Claim ${statusText} ${emoji}</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937;">Hello ${claimantName},</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            ${isApproved
        ? `Great news! Your ownership claim for <strong>${itemTitle}</strong> has been approved.`
        : `Unfortunately, your ownership claim for <strong>${itemTitle}</strong> has been rejected.`
      }
          </p>
          ${isApproved ? `
            <p style="color: #4b5563; line-height: 1.6;">
              Please contact the finder to arrange collection of your item.
            </p>
          ` : `
            <p style="color: #4b5563; line-height: 1.6;">
              If you believe this is an error, you may file another claim with additional proof of ownership.
            </p>
          `}
          <a href="${process.env.APP_URL || 'https://kizere.com'}/dashboard?tab=claims" 
             style="display: inline-block; background: ${statusColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">
            View Details
          </a>
        </div>
        <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
          <p>© ${new Date().getFullYear()} KIZERE. All rights reserved.</p>
        </div>
      </div>
    `,
  });
}

/**
 * Send payment confirmation email
 */
export async function sendPaymentConfirmationEmail(
  email: string,
  fullName: string,
  amount: number,
  currency: string,
  transactionRef: string,
  paymentType: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: `Payment Confirmed - ${transactionRef}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #22c55e; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Payment Confirmed ✓</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937;">Hello ${fullName},</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Your payment has been successfully processed.
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="margin: 8px 0;"><strong>Amount:</strong> ${currency} ${amount.toLocaleString()}</p>
            <p style="margin: 8px 0;"><strong>Transaction Ref:</strong> <code style="background: #f3f4f6; padding: 2px 8px; border-radius: 4px;">${transactionRef}</code></p>
            <p style="margin: 8px 0;"><strong>Type:</strong> ${paymentType}</p>
          </div>
          <p style="color: #4b5563; line-height: 1.6;">
            Thank you for using KIZERE!
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
 * Send notification to item owner when their registered item is found
 */
export async function sendFoundNotificationEmail(
  email: string,
  userName: string,
  itemName: string,
  reportTitle: string,
  reportId: number
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: `Good News! Your Registered Item Was Found - ${itemName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #10b981; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Your Item Was Found! 🔔</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937;">Hello ${userName},</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Your registered item <strong>${itemName}</strong> was reported as found by another user.
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="margin: 8px 0;"><strong>Found Report:</strong> ${reportTitle}</p>
          </div>
          <p style="color: #4b5563; line-height: 1.6;">
            This is part of KIZERE's Passive Protection. You didn't even have to report it lost yet!
          </p>
          <a href="${process.env.APP_URL || 'https://kizere.com'}/report/${reportId}" 
             style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">
            View Details & Claim
          </a>
        </div>
        <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
          <p>© ${new Date().getFullYear()} KIZERE. All rights reserved.</p>
        </div>
      </div>
    `,
  });
}

/**
 * Send POS product registration confirmation email to customer
 */
export async function sendPosRegistrationEmail(
  email: string,
  data: {
    customerName: string;
    productName: string;
    serialNumber: string;
    category: string;
    productId: string;
    retailerName: string;
    isNewAccount: boolean;
  }
): Promise<boolean> {
  const appUrl = process.env.APP_URL || 'https://kizere.com';

  return sendEmail({
    to: email,
    subject: `Product Registered - ${data.productName} (${data.productId})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Product Registered</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937;">Hello ${data.customerName},</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Your product has been successfully registered on KIZERE by <strong>${data.retailerName}</strong>.
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="margin: 8px 0;"><strong>Product:</strong> ${data.productName}</p>
            <p style="margin: 8px 0;"><strong>Serial Number:</strong> <code style="background: #f3f4f6; padding: 2px 8px; border-radius: 4px;">${data.serialNumber}</code></p>
            <p style="margin: 8px 0;"><strong>Category:</strong> ${data.category}</p>
            <p style="margin: 8px 0;"><strong>Product ID:</strong> <code style="background: #f3f4f6; padding: 2px 8px; border-radius: 4px; color: #10b981; font-weight: bold;">${data.productId}</code></p>
            <p style="margin: 8px 0;"><strong>Registered by:</strong> ${data.retailerName}</p>
          </div>
          ${data.isNewAccount ? `
            <div style="background: #fef3c7; padding: 16px; border-radius: 8px; border: 1px solid #fcd34d; margin: 20px 0;">
              <p style="color: #92400e; margin: 0; font-weight: bold;">Claim Your Account</p>
              <p style="color: #92400e; margin: 8px 0 0; font-size: 14px;">
                A KIZERE account was created for you. Visit the link below to set your password and access your registered products.
              </p>
              <a href="${appUrl}/claim-account"
                 style="display: inline-block; background: #f59e0b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; margin-top: 12px; font-weight: bold;">
                Claim Your Account
              </a>
            </div>
          ` : ''}
          <p style="color: #4b5563; line-height: 1.6;">
            This registration serves as a digital proof of ownership. Keep this email for your records.
          </p>
        </div>
        <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} KIZERE. All rights reserved.</p>
        </div>
      </div>
    `,
  });
}

/**
 * Send POS product ownership transfer confirmation email
 */
export async function sendPosTransferEmail(
  email: string,
  data: {
    customerName: string;
    productName: string;
    serialNumber: string;
    productId: string;
    retailerName: string;
  }
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: `Ownership Transfer - ${data.productName} (${data.productId})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Ownership Transferred</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937;">Hello ${data.customerName},</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            A product has been transferred to your ownership on KIZERE by <strong>${data.retailerName}</strong>.
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="margin: 8px 0;"><strong>Product:</strong> ${data.productName}</p>
            <p style="margin: 8px 0;"><strong>Serial Number:</strong> <code style="background: #f3f4f6; padding: 2px 8px; border-radius: 4px;">${data.serialNumber}</code></p>
            <p style="margin: 8px 0;"><strong>Product ID:</strong> <code style="background: #f3f4f6; padding: 2px 8px; border-radius: 4px; color: #3b82f6; font-weight: bold;">${data.productId}</code></p>
            <p style="margin: 8px 0;"><strong>Transfer facilitated by:</strong> ${data.retailerName}</p>
          </div>
          <p style="color: #4b5563; line-height: 1.6;">
            You are now the registered owner of this product on KIZERE.
          </p>
        </div>
        <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} KIZERE. All rights reserved.</p>
        </div>
      </div>
    `,
  });
}

export default {
  sendEmail,
  sendWelcomeEmail,
  sendReportConfirmationEmail,
  sendClaimNotificationEmail,
  sendClaimStatusEmail,
  sendPaymentConfirmationEmail,
  sendMatchNotificationEmail,
  sendExpirationEmail,
  sendFoundNotificationEmail,
  sendAppealUpdateEmail,
  sendAdminAppealNotification,
  sendAdminVerificationNotification,
  sendUserVerificationStatusEmail,
  sendResetPasswordEmail,
  sendPosRegistrationEmail,
  sendPosTransferEmail,
};

/**
 * Send password reset email
 */
export async function sendResetPasswordEmail(
  email: string,
  userName: string,
  token: string
): Promise<boolean> {
  const resetLink = `${config.APP_URL}/reset-password?token=${token}`;
  
  logger.info('Generated password reset link', { 
    userIdOrEmail: email, 
    link: resetLink.replace(token, '[REDACTED]') 
  });

  return sendEmail({
    to: email,
    subject: 'Reset Your KIZERE Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #667eea; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Password Reset Request</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937;">Hello ${userName},</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            We received a request to reset your password for your KIZERE account.
          </p>
          <p style="color: #4b5563; line-height: 1.6;">
            Click the button below to choose a new password. This link will expire in 1 hour.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p style="color: #4b5563; line-height: 1.6; font-size: 14px;">
            If you didn't request this, you can safely ignore this email. Your password will remain unchanged.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #9ca3af; font-size: 12px;">
            If the button above doesn't work, copy and paste this link into your browser: <br>
            <a href="${resetLink}" style="color: #667eea;">${resetLink}</a>
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
 * Send expiration warning email
 */
export async function sendExpirationEmail(
  email: string,
  userName: string,
  reportTitle: string,
  reportId: number,
  renewalLink: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: `Action Required: Your Report is Expiring - ${reportTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f59e0b; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Report Expiring Soon ⏳</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937;">Hello ${userName},</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Your report <strong>${reportTitle}</strong> is set to expire soon.
          </p>
          <p style="color: #4b5563; line-height: 1.6;">
            To keep your listing active and visible to the community, please renew it now.
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="margin: 8px 0;"><strong>Status:</strong> Expiring</p>
            <p style="margin: 8px 0;"><strong>Grace Period:</strong> 7 Days</p>
          </div>
          <a href="${renewalLink}" 
             style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">
            Renew Listing
          </a>
        </div>
        <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
          <p>© ${new Date().getFullYear()} KIZERE. All rights reserved.</p>
        </div>
      </div>
    `,
  });
}

/**
 * Send match notification email
 */
export async function sendMatchNotificationEmail(
  email: string,
  userName: string,
  reportTitle: string,
  matchTitle: string,
  matchId: number
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: `Potential Match Found! - ${reportTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #8b5cf6; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">We Found a Match! 🎉</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937;">Hello ${userName},</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            We have found an item that might match your report <strong>${reportTitle}</strong>.
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="margin: 8px 0;"><strong>Potential Match:</strong> ${matchTitle}</p>
          </div>
          <p style="color: #4b5563; line-height: 1.6;">
            Please click below to view the details and contact the other party if it matches.
          </p>
          <a href="${process.env.APP_URL || 'https://kizere.com'}/report/${matchId}" 
             style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">
            View Match
          </a>
        </div>
        <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
          <p>© ${new Date().getFullYear()} KIZERE. All rights reserved.</p>
        </div>
      </div>
    `,
  });
}

/**
 * Send claim appeal update email
 */
export async function sendAppealUpdateEmail(
  email: string,
  userName: string,
  itemTitle: string,
  decision: 'approved' | 'rejected',
  adminNotes?: string
): Promise<boolean> {
  const isApproved = decision === 'approved';
  const statusColor = isApproved ? '#22c55e' : '#ef4444';
  const statusText = isApproved ? 'Approved' : 'Rejected';
  const emoji = isApproved ? '🎉' : '🛡️';

  return sendEmail({
    to: email,
    subject: `Claim Appeal ${statusText} - ${itemTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${statusColor}; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Appeal ${statusText} ${emoji}</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937;">Hello ${userName},</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Your appeal for the rejected claim on <strong>${itemTitle}</strong> has been <strong>${decision}</strong> by our administration team.
          </p>
          ${adminNotes ? `
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="margin: 0; color: #4b5563;"><strong>Admin Notes:</strong> ${adminNotes}</p>
            </div>
          ` : ''}
          ${isApproved ? `
            <p style="color: #4b5563; line-height: 1.6;">
              Your claim status has been reset to <strong>Pending</strong>, and the finder has been notified to re-evaluate your claim or proceed with verification.
            </p>
          ` : `
            <p style="color: #4b5563; line-height: 1.6;">
              This decision is final. If you have further questions, please contact our support team.
            </p>
          `}
          <a href="${process.env.APP_URL || 'https://kizere.com'}/dashboard?tab=claims" 
             style="display: inline-block; background: ${statusColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">
            View Claim Status
          </a>
        </div>
        <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
          <p>© ${new Date().getFullYear()} KIZERE. All rights reserved.</p>
        </div>
      </div>
    `,
  });
}

/**
 * Send admin notification when a new claim appeal is submitted
 */
export async function sendAdminAppealNotification(
  adminEmail: string,
  claimId: number,
  claimantName: string,
  reason: string
): Promise<boolean> {
  return sendEmail({
    to: adminEmail,
    subject: `New Claim Appeal Requires Review - Claim #${claimId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #ef4444; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">New Claim Appeal ⚖️</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937;">Admin Alert,</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            <strong>${claimantName}</strong> has appealed the rejection of Claim #${claimId}.
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="margin: 0; color: #4b5563;"><strong>Appeal Reason:</strong></p>
            <p style="margin-top: 8px; color: #1f2937; white-space: pre-wrap;">${reason}</p>
          </div>
          <a href="${process.env.APP_URL || 'https://kizere.com'}/admin" 
             style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">
            Review Appeal in Admin Panel
          </a>
        </div>
      </div>
    `,
  });
}

/**
 * Send admin notification when a new identity verification is submitted
 */
export async function sendAdminVerificationNotification(
  adminEmail: string,
  userId: number,
  userName: string
): Promise<boolean> {
  return sendEmail({
    to: adminEmail,
    subject: `New Identity Verification Submitted - ${userName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #3b82f6; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Identity Verification 🛡️</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937;">Admin Alert,</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            <strong>${userName}</strong> (User ID: ${userId}) has submitted their identity documents for review.
          </p>
          <a href="${process.env.APP_URL || 'https://kizere.com'}/admin" 
             style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">
            Review in Admin Panel
          </a>
        </div>
      </div>
    `,
  });
}

/**
 * Send user notification when their identity verification is approved or rejected
 */
export async function sendUserVerificationStatusEmail(
  userEmail: string,
  userName: string,
  status: 'approved' | 'rejected',
  adminNotes?: string
): Promise<boolean> {
  const isApproved = status === 'approved';
  const statusColor = isApproved ? '#22c55e' : '#ef4444';
  const statusText = isApproved ? 'Approved' : 'Rejected';
  const emoji = isApproved ? '✅' : '❌';

  return sendEmail({
    to: userEmail,
    subject: `Identity Verification ${statusText}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${statusColor}; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Verification ${statusText} ${emoji}</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937;">Hello ${userName},</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Your identity verification request has been <strong>${status}</strong>.
          </p>
          ${!isApproved && adminNotes ? `
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="margin: 0; color: #4b5563;"><strong>Reason:</strong> ${adminNotes}</p>
            </div>
            <p style="color: #4b5563; line-height: 1.6;">
              Please review the feedback and submit a new verification request if needed.
            </p>
          ` : ''}
          <a href="${process.env.APP_URL || 'https://kizere.com'}/profile" 
             style="display: inline-block; background: ${statusColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">
            View Profile
          </a>
        </div>
        <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
          <p>© ${new Date().getFullYear()} KIZERE. All rights reserved.</p>
        </div>
      </div>
    `,
  });
}
