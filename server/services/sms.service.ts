/**
 * SMS Service — Pindo Integration for Rwanda
 * 
 * Pindo is a Rwandan SMS gateway with direct MTN/Airtel routes.
 * Docs: https://pindo.io/docs
 */
import { createLogger } from '../utils/logger';

const logger = createLogger('SMSService');

const PINDO_API_URL = 'https://api.pindo.io/v1/sms/';
const PINDO_API_TOKEN = process.env.PINDO_API_TOKEN;
const PINDO_SENDER_ID = process.env.PINDO_SENDER_ID || 'KIZERE';

/**
 * Normalize a Rwandan phone number to E.164 format (+250XXXXXXXXX)
 */
export function normalizeRwandanPhone(phone: string): string {
  // Remove all non-digit characters except leading +
  const cleaned = phone.replace(/[^\d+]/g, '');
  const digits = cleaned.replace(/\+/g, '');

  if (digits.length === 9 && /^[79]/.test(digits)) {
    return `+250${digits}`;
  }
  if (digits.length === 10 && digits.startsWith('0')) {
    return `+250${digits.substring(1)}`;
  }
  if (digits.length === 12 && digits.startsWith('250')) {
    return `+${digits}`;
  }
  if (digits.length === 13 && cleaned.startsWith('+250')) {
    return cleaned;
  }

  // Return as-is if we can't normalize
  return phone.startsWith('+') ? phone : `+${phone}`;
}

/**
 * Validate if a string is a valid Rwandan phone number
 */
export function isValidRwandanPhone(phone: string): boolean {
  const normalized = normalizeRwandanPhone(phone);
  return /^\+250[79]\d{8}$/.test(normalized);
}

/**
 * Send an SMS via Pindo API
 */
export async function sendSMS(to: string, message: string): Promise<boolean> {
  const normalizedTo = normalizeRwandanPhone(to);

  // Dev mode fallback — log to console if no API token
  if (!PINDO_API_TOKEN) {
    logger.warn('PINDO_API_TOKEN not set — SMS logged to console only');
    logger.info(`📱 SMS to ${normalizedTo}: ${message}`);
    console.log(`\n📱 [DEV SMS] To: ${normalizedTo}\n   Message: ${message}\n`);
    return true;
  }

  try {
    logger.info('Sending SMS via Pindo', { to: normalizedTo });

    const response = await fetch(PINDO_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PINDO_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: normalizedTo,
        text: message,
        sender: PINDO_SENDER_ID,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error('Pindo SMS API error', { 
        status: response.status, 
        body: errorBody,
        to: normalizedTo 
      });
      // In development, fall back to console logging to unblock the flow
      if (process.env.NODE_ENV !== 'production') {
        logger.warn('SMS failed but simulating success in dev mode');
        console.log(`\n📱 [DEV SMS FALLBACK] To: ${normalizedTo}\n   Message: ${message}\n`);
        return true;
      }
      return false;
    }

    const result = await response.json();
    logger.info('SMS sent successfully via Pindo', { 
      to: normalizedTo, 
      messageId: result.id || result.message_id 
    });
    return true;
  } catch (error) {
    logger.error('Failed to send SMS via Pindo', { error, to: normalizedTo });
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('SMS threw error but simulating success in dev mode');
      return true;
    }
    return false;
  }
}

/**
 * Send OTP verification code via SMS
 */
export async function sendOTPViaSMS(phoneNumber: string, code: string): Promise<boolean> {
  const message = `Your KIZERE verification code is: ${code}. It expires in 10 minutes. Do not share this code with anyone.`;
  return sendSMS(phoneNumber, message);
}

export default {
  sendSMS,
  sendOTPViaSMS,
  normalizeRwandanPhone,
  isValidRwandanPhone,
};
