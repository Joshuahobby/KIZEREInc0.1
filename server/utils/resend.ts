import crypto from 'crypto';
import { createLogger } from './logger';

const logger = createLogger('ResendUtils');

/**
 * Verify a Resend webhook signature (Svix compatible)
 * 
 * Resend sends three headers:
 * - svix-id: unique event identifier
 * - svix-timestamp: time of the event
 * - svix-signature: HMAC-SHA256 signature
 * 
 * @param headers Request headers
 * @param payload Raw request body string
 * @param secret Webhook secret from Resend dashboard
 * @returns boolean indicating if the signature is valid
 */
export function verifyResendWebhook(
    headers: Record<string, string | string[] | undefined>,
    payload: string,
    secret: string
): boolean {
    try {
        const svixId = headers['svix-id'] as string;
        const svixTimestamp = headers['svix-timestamp'] as string;
        const svixSignature = headers['svix-signature'] as string;

        if (!svixId || !svixTimestamp || !svixSignature) {
            logger.warn('Missing Svix headers in Resend webhook');
            return false;
        }

        // Determine the actual secret (strip 'whsec_' prefix if present)
        const secretKey = secret.startsWith('whsec_') ? secret.substring(6) : secret;
        const secretBytes = Buffer.from(secretKey, 'base64');

        // Constuct the signature base: <id>.<timestamp>.<payload>
        const toSign = `${svixId}.${svixTimestamp}.${payload}`;

        // Calculate signatures (Resend/Svix can send multiple space-separated signatures)
        const signatures = svixSignature.split(' ');

        for (const signaturePart of signatures) {
            const [version, signature] = signaturePart.split(',');
            if (version !== 'v1') continue;

            const expectedSignature = crypto
                .createHmac('sha256', secretBytes)
                .update(toSign)
                .digest('base64');

            if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
                return true;
            }
        }

        logger.warn('Invalid Svix signature for Resend webhook');
        return false;
    } catch (error) {
        logger.error('Error verifying Resend webhook signature', { error });
        return false;
    }
}
