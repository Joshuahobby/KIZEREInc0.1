/**
 * Email Service Unit Tests
 *
 * Mocks the Resend SDK to verify the correct payload is built and that
 * errors are surfaced (not swallowed) in production mode.
 *
 * For a live delivery test run:
 *   TEST_EMAIL=you@example.com npx vitest run server/services/__tests__/email.service.integration.test.ts
 */
import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';

// vi.hoisted ensures these vars exist before the hoisted vi.mock factory runs
const { resendSendMock, ResendMock } = vi.hoisted(() => {
  const resendSendMock = vi.fn();
  const ResendMock = vi.fn().mockImplementation(() => ({
    emails: { send: resendSendMock },
  }));
  return { resendSendMock, ResendMock };
});

vi.mock('resend', () => ({ Resend: ResendMock }));

import { sendEmail } from '../email.service';

// ---------------------------------------------------------------------------
// Unit tests — sendEmail
// ---------------------------------------------------------------------------
describe('sendEmail (unit)', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    resendSendMock.mockReset();
    ResendMock.mockClear();
    process.env.NODE_ENV = 'production'; // disable dev-mode error suppression
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('calls Resend with the correct from/to/subject and returns true on success', async () => {
    resendSendMock.mockResolvedValueOnce({ data: { id: 'msg_abc123' }, error: null });

    const result = await sendEmail({
      to: 'recipient@example.com',
      subject: 'Test subject',
      html: '<p>Hello</p>',
    });

    expect(result).toBe(true);
    expect(resendSendMock).toHaveBeenCalledOnce();

    const payload = resendSendMock.mock.calls[0][0];
    expect(payload.to).toBe('recipient@example.com');
    expect(payload.subject).toBe('Test subject');
    expect(payload.html).toContain('Hello');
    // FROM must be a verified custom domain, not Gmail
    expect(payload.from).not.toMatch(/@gmail\.com/);
    expect(payload.from).toContain('kizere');
  });

  it('returns false when Resend returns an unverified-domain error', async () => {
    resendSendMock.mockResolvedValueOnce({
      data: null,
      error: { statusCode: 403, name: 'validation_error', message: 'The sender domain is not verified.' },
    });

    const result = await sendEmail({
      to: 'recipient@example.com',
      subject: 'Will fail',
      html: '<p>fail</p>',
    });

    expect(result).toBe(false);
  });

  it('returns false when Resend returns a 401 invalid API key error', async () => {
    resendSendMock.mockResolvedValueOnce({
      data: null,
      error: { statusCode: 401, name: 'validation_error', message: 'API key is invalid' },
    });

    const result = await sendEmail({
      to: 'recipient@example.com',
      subject: 'Bad key',
      html: '<p>fail</p>',
    });

    expect(result).toBe(false);
  });

  it('returns false when Resend throws a network error (production mode)', async () => {
    resendSendMock.mockRejectedValueOnce(new Error('Network timeout'));

    const result = await sendEmail({
      to: 'recipient@example.com',
      subject: 'Throws',
      html: '<p>fail</p>',
    });

    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Unit tests — OTP email content
// ---------------------------------------------------------------------------
describe('OTP email content (unit)', () => {
  beforeEach(() => {
    resendSendMock.mockReset();
    process.env.NODE_ENV = 'production';
  });

  it('sends an OTP email containing the 6-digit code in both subject and body', async () => {
    resendSendMock.mockResolvedValueOnce({ data: { id: 'msg_otp1' }, error: null });

    const code = '847291';
    const result = await sendEmail({
      to: 'user@example.com',
      subject: `Your KIZERE Verification Code: ${code}`,
      html: `<p>Your code is <strong>${code}</strong></p>`,
    });

    expect(result).toBe(true);
    expect(resendSendMock).toHaveBeenCalledOnce();

    const payload = resendSendMock.mock.calls[0][0];
    expect(payload.subject).toContain(code);
    expect(payload.html).toContain(code);
    expect(payload.to).toBe('user@example.com');
  });

  it('returns false on Resend error so OTP service does not persist an undelivered code', async () => {
    resendSendMock.mockResolvedValueOnce({
      data: null,
      error: { statusCode: 401, name: 'validation_error', message: 'API key is invalid' },
    });

    const result = await sendEmail({
      to: 'user@example.com',
      subject: 'Your KIZERE Verification Code: 123456',
      html: '<p>123456</p>',
    });

    expect(result).toBe(false);
  });
});
