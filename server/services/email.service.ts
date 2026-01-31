import { Resend } from 'resend';
import { createLogger } from '../utils/logger';

const logger = createLogger('EmailService');

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Default sender email (must be verified in Resend)
const FROM_EMAIL = process.env.FROM_EMAIL || 'KIZERE <noreply@kizere.com>';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send a generic email
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    logger.info('Sending email', { to: options.to, subject: options.subject });
    
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    logger.info('Email sent successfully', { id: result.data?.id });
    return true;
  } catch (error) {
    logger.error('Failed to send email', { error, to: options.to });
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

export default {
  sendEmail,
  sendWelcomeEmail,
  sendReportConfirmationEmail,
  sendClaimNotificationEmail,
  sendClaimStatusEmail,
  sendPaymentConfirmationEmail,
  sendMatchNotificationEmail,
  sendExpirationEmail,
};

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
