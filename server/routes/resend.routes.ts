import { Router } from 'express';
import { createLogger } from '../utils/logger';
import { verifyResendWebhook } from '../utils/resend';

const logger = createLogger('ResendWebhook');
const router = Router();

/**
 * Resend Webhook Endpoint
 * POST /api/webhooks/resend
 */
router.post('/', async (req, res) => {
    try {
        const payload = JSON.stringify(req.body);
        const secret = process.env.RESEND_WEBHOOK_SECRET;

        if (!secret) {
            logger.error('RESEND_WEBHOOK_SECRET is not configured');
            return res.status(500).json({ message: 'Webhook secret not configured' });
        }

        // Verify signature
        if (!verifyResendWebhook(req.headers, payload, secret)) {
            return res.status(401).json({ message: 'Invalid signature' });
        }

        const { type, data, created_at } = req.body;
        logger.info('Received Resend Webhook', { type, eventId: req.body.id, created_at });

        // Handle event types
        switch (type) {
            case 'email.delivered':
                logger.info('Email delivered successfully', {
                    emailId: data.email_id,
                    to: data.to,
                    subject: data.subject
                });
                break;

            case 'email.bounced':
                logger.warn('Email bounced', {
                    emailId: data.email_id,
                    to: data.to,
                    reason: data.reason,
                    type: data.type // e.g., 'permanent' or 'transient'
                });
                // TODO: In the future, we could update user status in DB here
                break;

            case 'email.complained':
                logger.warn('Email marked as spam/complained', {
                    emailId: data.email_id,
                    to: data.to
                });
                break;

            case 'email.clicked':
                logger.info('Email link clicked', {
                    emailId: data.email_id,
                    url: data.url
                });
                break;

            case 'email.opened':
                logger.info('Email opened', {
                    emailId: data.email_id
                });
                break;

            default:
                logger.debug('Unhandled Resend webhook event type', { type });
        }

        res.status(200).json({ received: true });
    } catch (error) {
        logger.error('Failed to process Resend webhook', { error });
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
