/**
 * Unit tests for api/src/lib/email.ts (Story 3.3, AC3/AC4, Decision 4, Rule 4).
 *
 * Tests the ENV-GATED email library:
 *   - RESEND_API_KEY unset → 'skipped', no network (Rule 4 unset branch).
 *   - RESEND_API_KEY set + transport throws → 'failed' (Rule 4 failed branch).
 *   - RESEND_API_KEY set + transport succeeds → 'sent'.
 *   - No PII in logs (NFR-7): name/email/message never appear in console output.
 *
 * All tests mock the Nodemailer transport (vi.mock) — no live network.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// We mock 'nodemailer' before importing email.ts so the transport is never real.
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(),
  },
}));

// We also mock 'env' so we can control RESEND_API_KEY in each test.
vi.mock('../env.js', () => ({
  env: {
    RESEND_API_KEY: undefined as string | undefined,
    MAIL_FROM: 'noreply@example.com',
    MAIL_TO: 'owner@example.com',
  },
}));

// Import AFTER mocks are set up.
import nodemailer from 'nodemailer';
import * as envModule from '../env.js';
import { sendOwnerNotification } from './email.js';

const mockEnv = envModule.env as {
  RESEND_API_KEY: string | undefined;
  MAIL_FROM: string;
  MAIL_TO: string;
};

const testOpts = {
  inquiryId: 'test-id-123',
  submitterName: 'Test User',
  submitterEmail: 'test@example.com',
  submitterOrg: 'Acme Inc',
  message: 'I would love to book Josh for our event.',
  topic: 'AI in product development',
  attribution: 'LinkedIn',
};

describe('sendOwnerNotification — RESEND_API_KEY unset (Rule 4: skipped branch)', () => {
  beforeEach(() => {
    mockEnv.RESEND_API_KEY = undefined;
  });

  it('returns "skipped" when RESEND_API_KEY is not set', async () => {
    const status = await sendOwnerNotification(testOpts);
    expect(status).toBe('skipped');
  });

  it('does NOT call nodemailer.createTransport when RESEND_API_KEY is unset', async () => {
    await sendOwnerNotification(testOpts);
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
  });

  it('does NOT log PII (name/email/message) in the skipped path', async () => {
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    await sendOwnerNotification(testOpts);
    // Every logged string must NOT contain PII fields.
    for (const call of consoleSpy.mock.calls) {
      const msg = String(call[0]);
      expect(msg).not.toContain(testOpts.submitterName);
      expect(msg).not.toContain(testOpts.submitterEmail);
      expect(msg).not.toContain(testOpts.message);
    }
    consoleSpy.mockRestore();
  });
});

describe('sendOwnerNotification — RESEND_API_KEY set + transport throws (failed branch)', () => {
  const mockSendMail = vi.fn();
  const mockTransport = { sendMail: mockSendMail };

  beforeEach(() => {
    mockEnv.RESEND_API_KEY = 're_test_key';
    vi.mocked(nodemailer.createTransport).mockReturnValue(mockTransport as never);
    mockSendMail.mockRejectedValue(new Error('SMTP connection refused'));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns "failed" when sendMail throws', async () => {
    const status = await sendOwnerNotification(testOpts);
    expect(status).toBe('failed');
  });

  it('does NOT throw (failure is caught internally)', async () => {
    await expect(sendOwnerNotification(testOpts)).resolves.toBe('failed');
  });

  it('does NOT log PII (name/email/message) in the failed path', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await sendOwnerNotification(testOpts);
    for (const call of errorSpy.mock.calls) {
      const msg = String(call[0]);
      expect(msg).not.toContain(testOpts.submitterName);
      expect(msg).not.toContain(testOpts.submitterEmail);
      expect(msg).not.toContain(testOpts.message);
    }
    errorSpy.mockRestore();
  });
});

describe('sendOwnerNotification — RESEND_API_KEY set + transport succeeds (sent branch)', () => {
  const mockSendMail = vi.fn();
  const mockTransport = { sendMail: mockSendMail };

  beforeEach(() => {
    mockEnv.RESEND_API_KEY = 're_test_key';
    vi.mocked(nodemailer.createTransport).mockReturnValue(mockTransport as never);
    mockSendMail.mockResolvedValue({ messageId: 'msg-test-123' });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns "sent" when sendMail succeeds', async () => {
    const status = await sendOwnerNotification(testOpts);
    expect(status).toBe('sent');
  });

  it('calls createTransport with Resend SMTP config', async () => {
    await sendOwnerNotification(testOpts);
    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        auth: {
          user: 'resend',
          pass: 're_test_key',
        },
      }),
    );
  });

  it('does NOT log PII (name/email/message) in the sent path', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    await sendOwnerNotification(testOpts);
    for (const call of infoSpy.mock.calls) {
      const msg = String(call[0]);
      expect(msg).not.toContain(testOpts.submitterName);
      expect(msg).not.toContain(testOpts.submitterEmail);
      expect(msg).not.toContain(testOpts.message);
    }
    infoSpy.mockRestore();
  });
});
