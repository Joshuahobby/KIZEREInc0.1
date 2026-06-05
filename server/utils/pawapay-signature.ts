/**
 * PawaPay Signed Callback Verification
 * 
 * Implements RFC-9421 HTTP Message Signatures verification for PawaPay webhook callbacks.
 * PawaPay signs callbacks with ECDSA-P256-SHA256 and includes three headers:
 *   - Content-Digest: SHA-256 hash of the request body
 *   - Signature-Input: Describes which components were signed and metadata (keyid, alg, created)
 *   - Signature: The actual ECDSA digital signature
 *
 * Reference: https://docs.pawapay.io/#tag/Callbacks/Signed-Callbacks
 */
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { createLogger } from './logger';
import { config } from '../config';

const logger = createLogger('PawaPaySignature');

// Cache public keys to avoid repeated API calls
let cachedPublicKeys: Map<string, string> = new Map();
let lastKeyFetchTime = 0;
const KEY_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour cache

/**
 * Get the PawaPay base URL based on the environment.
 */
function getBaseUrl(): string {
    const pawapayMode = process.env.PAWAPAY_MODE;
    if (pawapayMode === 'production' || process.env.NODE_ENV === 'production') {
        return 'https://api.pawapay.io';
    }
    return 'https://api.sandbox.pawapay.io';
}

/**
 * Fetch PawaPay's public keys for HTTP signature verification.
 * Keys are cached for 1 hour to reduce API calls.
 */
async function fetchPublicKeys(): Promise<Map<string, string>> {
    const now = Date.now();

    // Return cached keys if still valid
    if (cachedPublicKeys.size > 0 && (now - lastKeyFetchTime) < KEY_CACHE_TTL_MS) {
        return cachedPublicKeys;
    }

    const baseUrl = getBaseUrl();
    const token = config.PAWAPAY_API_TOKEN;

    if (!token) {
        throw new Error('PAWAPAY_API_TOKEN is not configured');
    }

    try {
        const response = await fetch(`${baseUrl}/public-key/http`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Failed to fetch PawaPay public keys (${response.status}): ${errText}`);
        }

        const keys: Array<{ id: string; key: string }> = await response.json();
        const keyMap = new Map<string, string>();

        for (const keyObj of keys) {
            keyMap.set(keyObj.id, keyObj.key);
        }

        cachedPublicKeys = keyMap;
        lastKeyFetchTime = now;

        logger.info('PawaPay public keys fetched and cached', { keyCount: keyMap.size, keyIds: Array.from(keyMap.keys()) });

        return keyMap;
    } catch (error) {
        logger.error('Failed to fetch PawaPay public keys', { error });
        // Return cached keys if available, even if expired
        if (cachedPublicKeys.size > 0) {
            logger.warn('Using expired cached public keys as fallback');
            return cachedPublicKeys;
        }
        throw error;
    }
}

/**
 * Verify the Content-Digest header matches the actual body hash.
 * PawaPay uses: Content-Digest: sha-256=:BASE64_HASH:
 */
function verifyContentDigest(body: string, contentDigestHeader: string): boolean {
    const match = contentDigestHeader.match(/(sha-256|sha-512)=:([A-Za-z0-9+/=]+):/);
    if (!match) {
        logger.warn('Invalid Content-Digest header format', { header: contentDigestHeader });
        return false;
    }

    const algo = match[1].replace('sha-', 'sha');
    const expectedHash = match[2];
    const computedHash = crypto.createHash(algo).update(body).digest('base64');

    return expectedHash === computedHash;
}

/**
 * Parse the Signature-Input header to extract signed components and metadata.
 * Format: sig1=("@method" "@target-uri" "content-digest" ...);keyid="KEY_ID";alg="ecdsa-p256-sha256";created=TIMESTAMP
 */
function parseSignatureInput(signatureInputHeader: string): {
    label: string;
    components: string[];
    keyid: string;
    alg: string;
    created: number;
} | null {
    try {
        // Extract label and the rest: "sig1=(...);params"
        const labelMatch = signatureInputHeader.match(/^(\w+)=\(([^)]*)\);?(.*)$/);
        if (!labelMatch) {
            logger.warn('Invalid Signature-Input format', { header: signatureInputHeader });
            return null;
        }

        const label = labelMatch[1];
        const componentsPart = labelMatch[2];
        const paramsPart = labelMatch[3];

        // Parse components: "\"@method\" \"@target-uri\" \"content-digest\""
        const components = componentsPart.match(/"([^"]+)"/g)?.map(c => c.replace(/"/g, '')) || [];

        // Parse parameters
        const keyidMatch = paramsPart.match(/keyid="([^"]+)"/);
        const algMatch = paramsPart.match(/alg="([^"]+)"/);
        const createdMatch = paramsPart.match(/created=(\d+)/);

        if (!keyidMatch || !algMatch || !createdMatch) {
            logger.warn('Missing required Signature-Input parameters', { paramsPart });
            return null;
        }

        return {
            label,
            components,
            keyid: keyidMatch[1],
            alg: algMatch[1],
            created: parseInt(createdMatch[1], 10),
        };
    } catch (error) {
        logger.error('Failed to parse Signature-Input', { error, header: signatureInputHeader });
        return null;
    }
}

/**
 * Build the signature base according to RFC-9421.
 * This reconstructs the exact string that PawaPay signed.
 */
function buildSignatureBase(
    req: Request,
    components: string[],
    signatureInputHeader: string,
    label: string,
): string {
    const lines: string[] = [];

    for (const component of components) {
        if (component.startsWith('@')) {
            // Derived components
            switch (component) {
                case '@method':
                    lines.push(`"@method": ${req.method.toUpperCase()}`);
                    break;
                case '@target-uri':
                    lines.push(`"@target-uri": ${req.protocol}://${req.get('host')}${req.originalUrl}`);
                    break;
                case '@path':
                    lines.push(`"@path": ${req.path}`);
                    break;
                case '@authority':
                    lines.push(`"@authority": ${req.get('host')}`);
                    break;
                case '@request-target':
                    lines.push(`"@request-target": ${req.originalUrl}`);
                    break;
                default:
                    logger.warn('Unknown derived component', { component });
                    return '';
            }
        } else {
            // Standard header components
            const headerValue = req.headers[component.toLowerCase()];
            if (headerValue !== undefined) {
                lines.push(`"${component.toLowerCase()}": ${Array.isArray(headerValue) ? headerValue.join(', ') : headerValue}`);
            }
        }
    }

    // Add the signature parameters line
    // Extract just the parameters part after the label
    const paramsMatch = signatureInputHeader.match(new RegExp(`${label}=\\(([^)]*)\\);?(.*)`));
    if (paramsMatch) {
        const componentsList = paramsMatch[1];
        const params = paramsMatch[2];
        lines.push(`"@signature-params": (${componentsList});${params}`);
    }

    return lines.join('\n');
}

/**
 * Verify the ECDSA signature using the public key.
 */
function verifySignature(signatureBase: string, signatureValue: string, publicKeyPem: string, algorithm: string): boolean {
    try {
        // Map PawaPay algorithm to Node.js algorithm
        const nodeAlg = algorithm === 'ecdsa-p256-sha256' ? 'SHA256' : 'SHA384';

        // Decode the signature from the header: "sig1=:BASE64_SIGNATURE:"
        const sigMatch = signatureValue.match(/:([A-Za-z0-9+/=]+):/);
        if (!sigMatch) {
            logger.warn('Invalid Signature header format', { header: signatureValue });
            return false;
        }
        const signatureBytes = Buffer.from(sigMatch[1], 'base64');

        const verify = crypto.createVerify(nodeAlg);
        verify.update(signatureBase);
        verify.end();

        // RFC-9421 requires RAW signature format (R + S), not DER.
        return verify.verify(
            {
                key: publicKeyPem,
                dsaEncoding: 'ieee-p1363'
            },
            signatureBytes
        );
    } catch (error) {
        logger.error('Signature verification error', { error });
        return false;
    }
}

/**
 * Express middleware to verify PawaPay signed callbacks.
 * 
 * This verifies:
 * 1. Content-Digest: Body integrity check (SHA-256 hash)
 * 2. Signature-Input: Parsing signed components and key metadata
 * 3. Signature: ECDSA digital signature verification using PawaPay's public key
 * 
 * In development mode, verification failures are logged as warnings but requests proceed.
 * In production mode, verification failures result in a 401 Unauthorized response.
 */
export async function verifyPawaPaySignature(req: Request, res: Response, next: NextFunction): Promise<void> {
    const contentDigest = req.headers['content-digest'] as string | undefined;
    const signatureInput = req.headers['signature-input'] as string | undefined;
    const signature = req.headers['signature'] as string | undefined;

    // If no signature headers are present, skip verification (backwards compatibility)
    if (!contentDigest && !signatureInput && !signature) {
        logger.info('No signature headers present on callback — skipping verification');
        return next();
    }

    // All three headers must be present if any are present
    if (!contentDigest || !signatureInput || !signature) {
        logger.warn('Incomplete signature headers on callback', {
            hasContentDigest: !!contentDigest,
            hasSignatureInput: !!signatureInput,
            hasSignature: !!signature,
        });
        if (process.env.NODE_ENV === 'production') {
            res.status(401).json({ error: 'Incomplete signature headers' });
            return;
        }
        return next();
    }

    try {
        // Step 1: Verify Content-Digest (body integrity)
        // Use the original raw bytes to avoid JSON re-serialization differences
        const rawBody = (req as any).rawBody?.toString('utf8') ?? JSON.stringify(req.body);

        if (!verifyContentDigest(rawBody, contentDigest)) {
            logger.error('Content-Digest verification failed — body may have been tampered with');
            if (process.env.NODE_ENV === 'production') {
                res.status(401).json({ error: 'Content-Digest verification failed' });
                return;
            }
            logger.warn('Proceeding despite Content-Digest failure (non-production)');
        } else {
            logger.info('Content-Digest verified successfully');
        }

        // Step 2: Parse Signature-Input
        const parsedInput = parseSignatureInput(signatureInput);
        if (!parsedInput) {
            logger.error('Failed to parse Signature-Input header');
            if (process.env.NODE_ENV === 'production') {
                res.status(401).json({ error: 'Invalid Signature-Input header' });
                return;
            }
            return next();
        }

        // Step 3: Fetch public key
        const publicKeys = await fetchPublicKeys();
        const publicKey = publicKeys.get(parsedInput.keyid);

        if (!publicKey) {
            logger.error('Public key not found for keyid', { keyid: parsedInput.keyid, availableKeys: Array.from(publicKeys.keys()) });
            if (process.env.NODE_ENV === 'production') {
                res.status(401).json({ error: 'Unknown signing key' });
                return;
            }
            return next();
        }

        // Step 4: Build signature base and verify
        const signatureBase = buildSignatureBase(req, parsedInput.components, signatureInput, parsedInput.label);

        // Extract the signature for this label
        const sigLabel = parsedInput.label;
        const sigRegex = new RegExp(`${sigLabel}=:([A-Za-z0-9+/=]+):`);
        const sigForLabel = signature.match(sigRegex);

        if (!sigForLabel) {
            logger.error('Signature label not found in Signature header', { label: sigLabel });
            if (process.env.NODE_ENV === 'production') {
                res.status(401).json({ error: 'Signature label not found' });
                return;
            }
            return next();
        }

        const isValid = verifySignature(signatureBase, `${sigLabel}=:${sigForLabel[1]}:`, publicKey, parsedInput.alg);

        if (!isValid) {
            logger.error('Signature verification FAILED — callback may not be from PawaPay', {
                keyid: parsedInput.keyid,
                alg: parsedInput.alg,
            });
            if (process.env.NODE_ENV === 'production') {
                res.status(401).json({ error: 'Signature verification failed' });
                return;
            }
            logger.warn('Proceeding despite signature failure (non-production)');
        } else {
            logger.info('PawaPay callback signature verified successfully ✓', {
                keyid: parsedInput.keyid,
                alg: parsedInput.alg,
            });
        }

        next();
    } catch (error) {
        logger.error('Error during signature verification', { error });
        if (process.env.NODE_ENV === 'production') {
            res.status(500).json({ error: 'Signature verification error' });
            return;
        }
        next();
    }
}

// ─── Outgoing Request Signing (RFC-9421) ─────────────────────────────────────

/**
 * Sign an outgoing HTTP request to PawaPay using the official `http-message-signatures` library.
 * 
 * This matches PawaPay's official Node.js example: https://github.com/pawaPay/signatures-node-example
 * 
 * The function is now ASYNC because signMessage is async.
 * 
 * @param method HTTP method (POST, GET, etc.)
 * @param url Full URL of the request
 * @param body Request body string (JSON)
 * @returns Additional headers to include in the request, or empty object if signing is not configured
 */
export async function signOutgoingRequest(
    method: string,
    url: string,
    body?: string,
): Promise<Record<string, string>> {
    const keyId = process.env.PAWAPAY_SIGNING_KEY_ID;
    const privateKeyEnv = process.env.PAWAPAY_SIGNING_PRIVATE_KEY;

    if (!keyId || !privateKeyEnv) {
        logger.warn('PawaPay signing not configured (missing keyId or privateKey)');
        return {};
    }

    try {
        // Import the library dynamically (it's a CJS module)
        const { httpbis: { signMessage } } = await import('http-message-signatures');

        // Restore PEM format from env variable
        const privateKeyPem = crypto.createPrivateKey(
            privateKeyEnv
                .replace(/\\n/g, '\n')
                .replace(/\r/g, '')
                .replace(/^"|"$/g, '')
                .trim()
        );

        // Build Content-Digest
        const contentDigest = body
            ? `sha-512=:${crypto.createHash('sha512').update(body).digest('base64')}:`
            : undefined;

        // Build the request object that signMessage expects
        const requestToSign: any = {
            method: method.toUpperCase(),
            url: url,
            headers: {
                'Signature-Date': new Date().toISOString().toString(),
                'Content-Type': 'application/json',
            },
        };

        if (body && contentDigest) {
            requestToSign.headers['Content-Digest'] = contentDigest;
            requestToSign.headers['Content-Length'] = body.length.toString();
            requestToSign.body = body;
        }

        // Create signer matching PawaPay's official example
        const signer = {
            id: keyId,
            alg: 'ecdsa-p256-sha256',
            async sign(data: Buffer | Uint8Array) {
                return crypto.createSign('SHA256').update(data).sign(privateKeyPem);
            }
        };

        // Sign the message using the official library
        // This handles RFC-9421 canonicalization exactly as PawaPay expects
        const signedRequest = await signMessage({
            key: signer,
            name: 'sig-pp',
            fields: ['@method', '@authority', '@path', 'signature-date', 'content-digest', 'content-type', 'content-length'],
        }, requestToSign);

        logger.debug('PawaPay Signature Debug (http-message-signatures library)', {
            url,
            signatureInput: signedRequest.headers['Signature-Input'],
        });

        // Extract the headers that were added/modified by signMessage
        const sigHeaders: Record<string, string> = {};
        const headerNames = ['Signature', 'Signature-Input', 'Signature-Date', 'Content-Digest', 'Content-Type', 'Content-Length'];
        for (const name of headerNames) {
            if (signedRequest.headers[name]) {
                sigHeaders[name] = signedRequest.headers[name];
            }
        }

        return sigHeaders;
    } catch (error) {
        logger.error('PawaPay signature generation failed', { error, url });
        return {};
    }
}
