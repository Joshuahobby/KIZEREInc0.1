import crypto from 'crypto';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config();

async function testResendWebhook() {
    const secret = process.env.RESEND_WEBHOOK_SECRET || 'whsec_test_secret_key_12345';
    const svixId = 'evt_test_123';
    const svixTimestamp = Math.floor(Date.now() / 1000).toString();

    const payload = JSON.stringify({
        type: 'email.delivered',
        created_at: new Date().toISOString(),
        data: {
            email_id: 'email_123',
            to: ['test@example.com'],
            subject: 'Test Email'
        }
    });

    // Determine the actual secret (strip 'whsec_' prefix if present)
    const secretKey = secret.startsWith('whsec_') ? secret.substring(6) : secret;
    const secretBytes = Buffer.from(secretKey, 'base64');
    const toSign = `${svixId}.${svixTimestamp}.${payload}`;

    const signature = crypto
        .createHmac('sha256', secretBytes)
        .update(toSign)
        .digest('base64');

    const svixSignature = `v1,${signature}`;

    console.log('Sending test webhook...');
    console.log('Using Secret:', secret.startsWith('whsec_') ? 'whsec_...' : '***');
    console.log('Payload:', payload);
    console.log('Svix Headers:', {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature
    });

    try {
        const response = await axios.post('http://localhost:5000/api/webhooks/resend', JSON.parse(payload), {
            headers: {
                'svix-id': svixId,
                'svix-timestamp': svixTimestamp,
                'svix-signature': svixSignature,
                'Content-Type': 'application/json'
            }
        });

        console.log('Response:', response.status, response.data);
        if (response.status === 200) {
            console.log('SUCCESS: Webhook processed correctly.');
        }
    } catch (error: any) {
        console.error('FAILED: Webhook processing failed.');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

// Run the test
testResendWebhook();
