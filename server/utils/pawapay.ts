import crypto from 'crypto';
import { z } from 'zod';
import { createLogger } from './logger';
import { signOutgoingRequest } from './pawapay-signature';
import { config, isProd } from '../config';
import { getPaymentAmount as configGetPaymentAmount } from '../config/payment.config';

const logger = createLogger('PawaPayUtils');

// ─── Configuration ───────────────────────────────────────────────────────────

const isConfigured = !!config.PAWAPAY_API_TOKEN;
if (!isConfigured) {
    logger.warn("PawaPay is not configured. Payment features will be disabled.");
}

export const isPawaPayConfigured = () => isConfigured;

function checkConfig() {
    if (!isConfigured) {
        throw new Error("PawaPay is not configured. Please set PAWAPAY_API_TOKEN.");
    }
}

/** Base URL switches between sandbox and production based on NODE_ENV or PAWAPAY_MODE */
function getBaseUrl(): string {
    const forceProd = process.env.PAWAPAY_MODE === 'production';
    return (isProd || forceProd)
        ? 'https://api.pawapay.io'
        : 'https://api.sandbox.pawapay.io';
}

/** Standard auth headers for all PawaPay API calls */
function getHeaders(): Record<string, string> {
    return {
        'Authorization': `Bearer ${config.PAWAPAY_API_TOKEN}`,
        'Content-Type': 'application/json',
    };
}

/** Fetch wrapper that automatically signs all requests */
async function signedFetch(url: string, options: RequestInit): Promise<Response> {
    const method = (options.method || 'GET').toUpperCase();
    const body = typeof options.body === 'string' ? options.body : undefined;
    const headers = { ...(options.headers as Record<string, string>) };

    // Sign all requests using the official http-message-signatures library
    const sigHeaders = await signOutgoingRequest(method, url, body);
    Object.assign(headers, sigHeaders);

    return fetch(url, { ...options, headers });
}

// Pricing is now exclusively admin-managed via payment_packages table

// ─── Type Definitions ────────────────────────────────────────────────────────

export interface PawaPayDepositRequest {
    depositId: string;
    amount: string;
    currency: string;
    payer: {
        type: 'MMO';
        accountDetails: {
            phoneNumber: string;
            provider: string;
        };
    };
    metadata: Array<Record<string, string>>;
}

/** Response from POST /v2/deposits */
export interface PawaPayDepositResponse {
    depositId: string;
    status: 'ACCEPTED' | 'REJECTED' | 'DUPLICATE_IGNORED';
    nextStep?: string;
    created: string;
    rejectionReason?: {
        rejectionCode: string;
        rejectionMessage: string;
    };
}

/** Response from GET /v2/deposits/{depositId} */
export interface PawaPayDepositStatusResponse {
    depositId: string;
    status: 'COMPLETED' | 'FAILED' | 'SUBMITTED' | 'ACCEPTED' | 'PROCESSING';
    amount?: string;
    currency?: string;
    country?: string;
    payer?: {
        type: string;
        accountDetails: {
            phoneNumber: string;
            provider: string;
        };
    };
    customerMessage?: string;
    created?: string;
    providerTransactionId?: string;
    failureReason?: {
        failureCode: string;
        failureMessage: string;
    };
}

/** Callback payload sent by PawaPay when deposit status changes */
export interface PawaPayDepositCallback {
    depositId: string;
    status: 'COMPLETED' | 'FAILED';
    amount: string;
    currency: string;
    country: string;
    payer: {
        type: string;
        accountDetails: {
            phoneNumber: string;
            provider: string;
        };
    };
    customerMessage?: string;
    created: string;
    providerTransactionId?: string;
    failureReason?: {
        failureCode: string;
        failureMessage: string;
    };
}

/** Response from POST /v2/predict-provider */
export interface PawaPayPredictProviderResponse {
    country: string;
    provider: string;
    phoneNumber: string;
}

/** Provider info from active configuration */
export interface PawaPayProviderInfo {
    provider: string;
    displayName: string;
    logo: string;
    currencies: Array<{
        currency: string;
        displayName: string;
        operationTypes: any;
    }>;
}

/** Country info from active configuration */
export interface PawaPayActiveConfig {
    companyName: string;
    countries: Array<{
        country: string;
        prefix: string;
        flag: string;
        displayName: { en: string; fr?: string };
        providers: PawaPayProviderInfo[];
    }>;
}

/** Request body for POST /v2/payouts */
export interface PawaPayPayoutRequest {
    payoutId: string;
    amount: string;
    currency: string;
    recipient: {
        type: 'MMO';
        accountDetails: {
            phoneNumber: string;
            provider: string;
        };
    };
}

/** Response from POST /v2/payouts */
export interface PawaPayPayoutResponse {
    payoutId: string;
    status: 'ACCEPTED' | 'REJECTED' | 'DUPLICATE_IGNORED';
    created: string;
    rejectionReason?: {
        rejectionCode: string;
        rejectionMessage: string;
    };
}

// ─── Initialization data interface (used by routes/services) ─────────────────

export interface PaymentInitialization {
    amount: number;
    currency: string;
    depositId: string;
    phoneNumber: string;
    provider?: string; // If not provided, we auto-detect via predict-provider
    metadata?: Record<string, any>;
}

export interface TransferInitialization {
    payoutId?: string;
    phoneNumber: string;
    provider?: string;
    amount: number;
    currency: string;
    narration?: string;
}

// ─── Utility Functions ───────────────────────────────────────────────────────

/**
 * Generate a unique deposit ID (UUID v4) for PawaPay.
 * PawaPay requires merchant-generated UUIDs.
 */
export function generateDepositId(): string {
    return crypto.randomUUID();
}

/**
 * Generate a unique transaction reference with a prefix.
 * (Alias for backwards compatibility — internally uses UUID)
 */
export function generateTransactionReference(prefix = 'KIZERE'): string {
    return `${prefix}-${generateDepositId()}`;
}

// ─── API Functions ───────────────────────────────────────────────────────────

/**
 * Predict the MoMo provider from a phone number.
 * Also validates and normalises the number.
 */
export async function predictProvider(phoneNumber: string): Promise<PawaPayPredictProviderResponse> {
    checkConfig();
    const baseUrl = getBaseUrl();

    const response = await signedFetch(`${baseUrl}/v2/predict-provider`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ phoneNumber }),
    });

    if (!response.ok) {
        const errText = await response.text();
        logger.error('Provider prediction failed', { status: response.status, error: errText });
        throw new Error(`Provider prediction failed (${response.status}): ${errText}`);
    }

    return response.json();
}

/**
 * Get active configuration (available providers for a country).
 */
export async function getActiveConfig(country = 'RWA', operationType = 'DEPOSIT'): Promise<PawaPayActiveConfig> {
    checkConfig();
    const baseUrl = getBaseUrl();

    const response = await signedFetch(`${baseUrl}/v2/active-conf?country=${country}&operationType=${operationType}`, {
        method: 'GET',
        headers: getHeaders(),
    });

    if (!response.ok) {
        const errText = await response.text();
        logger.error('Active config fetch failed', { status: response.status, error: errText });
        throw new Error(`Active config fetch failed (${response.status}): ${errText}`);
    }

    return response.json();
}

/**
 * Initiate a deposit (collect money from customer via MoMo).
 * The customer will receive a USSD / push prompt on their phone to approve.
 */
export async function initiateDeposit(data: PaymentInitialization): Promise<PawaPayDepositResponse> {
    try {
        checkConfig();

        // Mock mode for testing
        if (config.MOCK_PAYMENTS) {
            logger.info('MOCK_PAYMENTS enabled – returning mock deposit response', { depositId: data.depositId });
            return {
                depositId: data.depositId,
                status: 'ACCEPTED',
                nextStep: 'FINAL_STATUS',
                created: new Date().toISOString(),
            };
        }
        // Format phoneNumber: remove leading +, spaces, dashes
        let formattedPhone = data.phoneNumber.replace(/[\s\+\-]/g, '');
        // If it starts with '07' and is 10 digits (e.g., 0788331033), convert to '2507...'
        if (formattedPhone.startsWith('07') && formattedPhone.length === 10) {
            formattedPhone = '250' + formattedPhone.substring(1);
        }

        // Auto-detect provider if not supplied
        let provider = data.provider;
        if (!provider) {
            const prediction = await predictProvider(formattedPhone);
            provider = prediction.provider;
            logger.info('Auto-detected provider', { phoneNumber: data.phoneNumber, provider });
        }

        const baseUrl = getBaseUrl();
        // Build metadata as array of key-value objects (PawaPay requires this field)
        const metadataArray: Array<Record<string, string>> = data.metadata
            ? Object.entries(data.metadata).map(([key, value]) => ({
                [key]: String(value)
            }))
            : [];

        const requestBody: PawaPayDepositRequest = {
            depositId: data.depositId,
            amount: data.amount.toString(),
            currency: data.currency,
            payer: {
                type: 'MMO',
                accountDetails: {
                    phoneNumber: formattedPhone,
                    provider,
                },
            },
            metadata: metadataArray,
        };

        logger.info('Initiating PawaPay deposit', { depositId: data.depositId, amount: data.amount, currency: data.currency, requestBody });

        const response = await signedFetch(`${baseUrl}/v2/deposits`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errText = await response.text();
            logger.error('Deposit initiation failed', { status: response.status, requestBody, error: errText });
            throw new Error(`Deposit initiation failed (${response.status}): ${errText}`);
        }

        const result: PawaPayDepositResponse = await response.json();
        logger.info('Deposit initiated', { depositId: result.depositId, status: result.status });

        if (result.status === 'REJECTED') {
            throw new Error(`Deposit rejected: ${result.rejectionReason?.rejectionMessage || 'Unknown reason'}`);
        }

        return result;
    } catch (error) {
        logger.error('Error initiating deposit', { error });
        throw error instanceof Error ? error : new Error(`Error initiating deposit: Unknown error`);
    }
}

/**
 * Check the status of a deposit.
 */
export async function checkDepositStatus(depositId: string): Promise<PawaPayDepositStatusResponse> {
    try {
        checkConfig();

        // Mock mode
        if (config.MOCK_PAYMENTS) {
            logger.info('MOCK_PAYMENTS enabled – returning mock completed status', { depositId });
            return {
                depositId,
                status: 'COMPLETED',
                amount: '5000',
                currency: 'RWF',
                country: 'RWA',
                payer: {
                    type: 'MMO',
                    accountDetails: {
                        phoneNumber: '250780000000',
                        provider: 'MTN_MOMO_RWA',
                    },
                },
                created: new Date().toISOString(),
                providerTransactionId: `mock-provider-${Date.now()}`,
            };
        }

        const baseUrl = getBaseUrl();

        logger.info('Checking deposit status', { depositId });

        const response = await signedFetch(`${baseUrl}/v2/deposits/${depositId}`, {
            method: 'GET',
            headers: getHeaders(),
        });

        if (!response.ok) {
            const errText = await response.text();
            logger.error('Deposit status check failed', { status: response.status, error: errText, depositId });
            throw new Error(`Deposit status check failed (${response.status}): ${errText}`);
        }

        const rawResult = await response.json();
        // PawaPay wraps the deposit details inside a `data` field
        const result: PawaPayDepositStatusResponse = rawResult.data || rawResult;
        logger.info('Deposit status retrieved', {
            depositId,
            status: result.status,
            amount: result.amount,
            currency: result.currency,
            failureReason: result.failureReason,
        });

        return result;
    } catch (error) {
        logger.error('Error checking deposit status', { depositId, error });
        throw error instanceof Error ? error : new Error(`Error checking deposit status: Unknown error`);
    }
}

/**
 * Initiate a payout (send money to a customer's MoMo account).
 * Used for bounty payouts.
 */
export async function initiatePayout(data: TransferInitialization): Promise<PawaPayPayoutResponse> {
    try {
        checkConfig();

        const payoutId = data.payoutId || generateDepositId();

        // Auto-detect provider if not supplied
        let provider = data.provider;
        if (!provider) {
            const prediction = await predictProvider(data.phoneNumber);
            provider = prediction.provider;
        }

        const baseUrl = getBaseUrl();
        const requestBody: PawaPayPayoutRequest = {
            payoutId,
            amount: data.amount.toString(),
            currency: data.currency,
            recipient: {
                type: 'MMO',
                accountDetails: {
                    phoneNumber: data.phoneNumber,
                    provider,
                },
            },
        };

        logger.info('Initiating PawaPay payout', { payoutId, amount: data.amount });

        const response = await signedFetch(`${baseUrl}/v2/payouts`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errText = await response.text();
            logger.error('Payout initiation failed', { status: response.status, error: errText });
            throw new Error(`Payout initiation failed (${response.status}): ${errText}`);
        }

        const result: PawaPayPayoutResponse = await response.json();
        logger.info('Payout initiated', { payoutId: result.payoutId, status: result.status });

        return result;
    } catch (error) {
        logger.error('Error initiating payout', { error });
        throw error instanceof Error ? error : new Error(`Error initiating payout: Unknown error`);
    }
}

// ─── Map PawaPay status to internal status ───────────────────────────────────

/**
 * Map PawaPay deposit/payout status strings to our internal payment statuses.
 */
export function mapPawaPayStatus(pawaPayStatus: string): 'pending' | 'successful' | 'failed' | 'cancelled' {
    switch (pawaPayStatus) {
        case 'COMPLETED':
            return 'successful';
        case 'FAILED':
            return 'failed';
        case 'ACCEPTED':
        case 'SUBMITTED':
        case 'PROCESSING':
            return 'pending';
        default:
            return 'pending';
    }
}

/**
 * Map PawaPay failure codes to user-friendly messages.
 */
export function getFailureMessage(failureCode?: string, failureMessage?: string): string {
    const messages: Record<string, string> = {
        'PAYER_INSUFFICIENT_FUNDS': 'Your mobile money balance is insufficient for this payment. Please top up and try again.',
        'PAYER_NOT_FOUND': 'The phone number is not registered for Mobile Money. Please check the number and try again.',
        'PAYER_LIMIT_REACHED': 'Your Mobile Money transaction limit has been reached. Please try again later or contact your provider.',
        'NOT_ALLOWED': 'This transaction is not allowed by your Mobile Money provider. Please contact your provider for assistance.',
        'NOT_ENOUGH_BALANCE': 'Insufficient balance on your Mobile Money account. Please top up and try again.',
        'TRANSACTION_ALREADY_IN_PROCESS': 'A transaction is already pending on your account. Please complete or cancel it first.',
        'PAYER_BARRED': 'Your Mobile Money account is restricted. Please contact your provider.',
        'TIMEOUT': 'The payment request timed out. The prompt may not have reached your phone. Please try again.',
        'PROVIDER_UNAVAILABLE': 'The Mobile Money service is temporarily unavailable. Please try again in a few minutes.',
        'AUTHENTICATION_ERROR': 'There was an authentication issue with the payment provider. Please contact support.',
        'DUPLICATE_METADATA_FIELD': 'A technical error occurred. Please contact support.',
        'UNSPECIFIED_FAILURE': 'The payment could not be completed. This is usually due to insufficient balance or an expired prompt. Please check your balance and try again.',
    };
    return messages[failureCode || ''] || failureMessage || 'The payment could not be completed. Please check your balance and try again.';
}

// ─── Re-export payment amount helper ─────────────────────────────────────────

export async function getPaymentAmount(paymentType: 'registration' | 'lost_report' | 'bounty'): Promise<number> {
    return configGetPaymentAmount(paymentType as any);
}
