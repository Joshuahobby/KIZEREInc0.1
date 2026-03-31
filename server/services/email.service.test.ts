import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendEmail, EmailOptions } from './email.service';

// Mock Resend
vi.mock('resend', () => {
  const mockSend = vi.fn();
  return {
    Resend: vi.fn(() => ({
      emails: { send: mockSend }
    }))
  };
});

describe('Email Service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return false if RESEND_API_KEY is not set', async () => {
    delete process.env.RESEND_API_KEY;
    const options: EmailOptions = { to: 'test@example.com', subject: 'Test', html: '<p>Test</p>' };
    const result = await sendEmail(options);
    expect(result).toBe(false);
  });

  it('should call resend api successfully if key exists', async () => {
    process.env.RESEND_API_KEY = 're_12345';
    
    // Set up mock for successful send
    const { Resend } = await import('resend');
    const mockSend = (new Resend('re_12345')).emails.send as any;
    mockSend.mockResolvedValueOnce({ data: { id: 'msg_123' }, error: null });

    const options: EmailOptions = { to: 'test@example.com', subject: 'Test', html: '<p>Test</p>' };
    const result = await sendEmail(options);
    
    expect(result).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
      to: 'test@example.com',
      subject: 'Test',
      html: '<p>Test</p>'
    }));
  });

  it('should return false if resend api returns an error', async () => {
    process.env.RESEND_API_KEY = 're_12345';
    
    // Set up mock for failed send
    const { Resend } = await import('resend');
    const mockSend = (new Resend('re_12345')).emails.send as any;
    mockSend.mockResolvedValueOnce({ data: null, error: { message: 'Invalid email' } });

    const options: EmailOptions = { to: 'test@example.com', subject: 'Test', html: '<p>Test</p>' };
    const result = await sendEmail(options);
    
    expect(result).toBe(false);
  });
});
