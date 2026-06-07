/**
 * Unit tests for api/src/env.ts (Story 3.3, AC4).
 *
 * Tests the Zod-validated, fail-fast env module:
 *   - API_PORT validation (positive integer, default 8787)
 *   - RESEND_API_KEY env-gate behaviour (tested here at the schema level;
 *     the full env-gate integration is in email.test.ts)
 *
 * NOTE: We test the ENV SCHEMA directly (not the parsed singleton) to avoid
 * process.exit() side effects during unit tests.
 */
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

// Re-create the same schema as env.ts to test validation logic in isolation.
// This avoids importing env.ts (which runs safeParse + potentially process.exit).
const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  API_PORT: z
    .string()
    .default('8787')
    .refine((v) => Number.isInteger(Number(v)) && Number(v) > 0, {
      message: 'API_PORT must be a positive integer',
    })
    .transform((v) => Number(v)),
  RESEND_API_KEY: z.string().min(1).optional(),
  MAIL_FROM: z.string().default('noreply@example.com'),
  MAIL_TO: z.string().default('owner@example.com'),
});

describe('env schema — API_PORT validation', () => {
  const baseEnv = { DATABASE_URL: 'postgres://test/db' };

  it('defaults to 8787 when API_PORT is unset', () => {
    const result = envSchema.safeParse(baseEnv);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.API_PORT).toBe(8787);
  });

  it('parses a valid positive integer string', () => {
    const result = envSchema.safeParse({ ...baseEnv, API_PORT: '3000' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.API_PORT).toBe(3000);
  });

  it('rejects a non-numeric string', () => {
    const result = envSchema.safeParse({ ...baseEnv, API_PORT: 'notanumber' });
    expect(result.success).toBe(false);
  });

  it('rejects zero', () => {
    const result = envSchema.safeParse({ ...baseEnv, API_PORT: '0' });
    expect(result.success).toBe(false);
  });

  it('rejects a negative integer', () => {
    const result = envSchema.safeParse({ ...baseEnv, API_PORT: '-1' });
    expect(result.success).toBe(false);
  });

  it('rejects a float', () => {
    const result = envSchema.safeParse({ ...baseEnv, API_PORT: '3000.5' });
    expect(result.success).toBe(false);
  });
});

describe('env schema — DATABASE_URL required', () => {
  it('fails when DATABASE_URL is missing', () => {
    const result = envSchema.safeParse({ API_PORT: '8787' });
    expect(result.success).toBe(false);
  });

  it('fails when DATABASE_URL is empty string', () => {
    const result = envSchema.safeParse({ DATABASE_URL: '', API_PORT: '8787' });
    expect(result.success).toBe(false);
  });
});

describe('env schema — RESEND_API_KEY optional (Rule 4 env-gate)', () => {
  const baseEnv = { DATABASE_URL: 'postgres://test/db' };

  it('is valid when RESEND_API_KEY is unset (default/CI mode)', () => {
    const result = envSchema.safeParse(baseEnv);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.RESEND_API_KEY).toBeUndefined();
  });

  it('is valid when RESEND_API_KEY is provided', () => {
    const result = envSchema.safeParse({ ...baseEnv, RESEND_API_KEY: 're_testkey' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.RESEND_API_KEY).toBe('re_testkey');
  });

  it('rejects an empty RESEND_API_KEY string', () => {
    const result = envSchema.safeParse({ ...baseEnv, RESEND_API_KEY: '' });
    expect(result.success).toBe(false);
  });
});

describe('env schema — MAIL_FROM / MAIL_TO defaults', () => {
  const baseEnv = { DATABASE_URL: 'postgres://test/db' };

  it('uses placeholder defaults when not set', () => {
    const result = envSchema.safeParse(baseEnv);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.MAIL_FROM).toBe('noreply@example.com');
      expect(result.data.MAIL_TO).toBe('owner@example.com');
    }
  });
});
