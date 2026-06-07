/**
 * Unit tests for POST /api/invite (Story 3.3, Decision 6, AC1–AC6).
 *
 * All tests mock the DB client and email lib — no live deps required.
 * Uses app.request() — no socket bind (Story-3.0 EADDRINUSE invariant, Decision 6).
 *
 * DB integration tests are in invite.integration.test.ts (real Postgres).
 *
 * Coverage:
 *   - Zod validation: valid body, missing required fields, invalid email
 *   - Honeypot: non-empty `website` field → benign 200, no DB call
 *   - Rate-limit: >5 requests → 429
 *   - CORS: cross-origin Origin header → 403
 *   - Mail-failure path: email 'failed' → row persisted, HTTP 201, mail_status='failed'
 *   - Persist-first order: db.insert() called before sendOwnerNotification()
 *   - No-PII logs: name/email/message never appear in console output
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the DB client so unit tests never hit a real database.
vi.mock('../db/client.js', () => ({
  db: {
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

// Mock the email lib so unit tests never send email.
vi.mock('../lib/email.js', () => ({
  sendOwnerNotification: vi.fn().mockResolvedValue('skipped'),
}));

import { db } from '../db/client.js';
import { sendOwnerNotification } from '../lib/email.js';
import { _resetRateLimiter } from './invite.js';
// The shared cross-package contract (AR-15). The route MUST validate against
// THIS schema (the same one Story 3.4's form will use), not an ad-hoc copy.
import { InviteInput } from '@portfolio/shared/schemas';

// Import app AFTER mocks are set up (app.ts imports the route which imports db/email).
import app from '../app.js';

const validBody = {
  name: 'Alice Smith',
  email: 'alice@example.com',
  org: 'Acme Corp',
  message: 'I would love to invite you to our annual tech summit.',
  topic: 'AI in product development',
  attribution: 'LinkedIn',
};

/**
 * Helper to build a mock db.insert() that returns a row id.
 */
function mockDbInsert(id = 'mock-id-unit-test') {
  const returning = vi.fn().mockResolvedValue([{ id }]);
  const values = vi.fn().mockReturnValue({ returning });
  vi.mocked(db.insert).mockReturnValue({ values } as never);
  return { id, returning, values };
}

/**
 * Helper to build a mock db.update() (for mail_status update).
 */
function mockDbUpdate() {
  const where = vi.fn().mockResolvedValue([]);
  const set = vi.fn().mockReturnValue({ where });
  vi.mocked(db.update).mockReturnValue({ set } as never);
  return { where, set };
}

beforeEach(() => {
  _resetRateLimiter();
  vi.clearAllMocks();
  // Reset email mock default to 'skipped'
  vi.mocked(sendOwnerNotification).mockResolvedValue('skipped');
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/invite — Zod validation', () => {
  it('returns 201 for a fully valid body', async () => {
    mockDbInsert();
    mockDbUpdate();

    const res = await app.request('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json).toHaveProperty('id');
    expect(json).toHaveProperty('mailStatus');
    expect(json).toHaveProperty('message');
  });

  it('returns 400 when name is missing', async () => {
    const body = {
      email: validBody.email,
      message: validBody.message,
      attribution: validBody.attribution,
    };
    const res = await app.request('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 when email is missing', async () => {
    const body = {
      name: validBody.name,
      message: validBody.message,
      attribution: validBody.attribution,
    };
    const res = await app.request('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 when email is invalid', async () => {
    const res = await app.request('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validBody, email: 'not-an-email' }),
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 when message is missing', async () => {
    const body = {
      name: validBody.name,
      email: validBody.email,
      attribution: validBody.attribution,
    };
    const res = await app.request('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 when attribution is missing', async () => {
    const body = { name: validBody.name, email: validBody.email, message: validBody.message };
    const res = await app.request('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    expect(res.status).toBe(400);
  });

  it('accepts valid body with optional fields omitted', async () => {
    mockDbInsert();
    mockDbUpdate();
    const minimal = {
      name: 'Bob',
      email: 'bob@example.com',
      message: 'Hello',
      attribution: 'Conference',
    };
    const res = await app.request('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(minimal),
    });
    expect(res.status).toBe(201);
  });

  it('returns 400 when body is not valid JSON', async () => {
    const res = await app.request('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json {',
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/invite — Honeypot (AC3)', () => {
  it('returns 200 (benign) when `website` field is non-empty', async () => {
    const res = await app.request('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validBody, website: 'http://spam.example.com' }),
    });
    expect(res.status).toBe(200);
  });

  it('does NOT call db.insert() when honeypot is triggered', async () => {
    await app.request('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validBody, website: 'spam' }),
    });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('does NOT call sendOwnerNotification() when honeypot is triggered', async () => {
    await app.request('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validBody, website: 'spam' }),
    });
    expect(sendOwnerNotification).not.toHaveBeenCalled();
  });

  it('passes through when `website` field is empty string (real user)', async () => {
    mockDbInsert();
    mockDbUpdate();
    const res = await app.request('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validBody, website: '' }),
    });
    expect(res.status).toBe(201);
  });
});

describe('POST /api/invite — Rate-limit (AC3)', () => {
  it('returns 429 after more than 5 requests within the window', async () => {
    // Make 5 successful requests (hits the max).
    for (let i = 0; i < 5; i++) {
      mockDbInsert(`id-${i}`);
      mockDbUpdate();
      await app.request('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody),
      });
    }
    // The 6th request should be rate-limited.
    const limitedRes = await app.request('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });
    expect(limitedRes.status).toBe(429);
  });
});

describe('POST /api/invite — CORS guard (AC3)', () => {
  it('returns 403 when Origin does not match Host', async () => {
    const res = await app.request('/api/invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://evil.example.com',
        Host: 'joshuabrandt.abacusai.cloud',
      },
      body: JSON.stringify(validBody),
    });
    expect(res.status).toBe(403);
  });

  it('allows requests with no Origin header (same-host / server-side calls)', async () => {
    mockDbInsert();
    mockDbUpdate();
    const res = await app.request('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });
    expect(res.status).toBe(201);
  });

  it('allows same-origin requests (Origin host === Host) → 201', async () => {
    mockDbInsert();
    mockDbUpdate();
    const res = await app.request('/api/invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://joshuabrandt.abacusai.cloud',
        Host: 'joshuabrandt.abacusai.cloud',
      },
      body: JSON.stringify(validBody),
    });
    expect(res.status).toBe(201);
  });
});

describe('POST /api/invite — Mail-failure persist-first invariant (AC2/AC3)', () => {
  it('returns 201 even when sendOwnerNotification returns "failed"', async () => {
    mockDbInsert('persist-first-id');
    mockDbUpdate();
    vi.mocked(sendOwnerNotification).mockResolvedValueOnce('failed');

    const res = await app.request('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect((json as { mailStatus: string }).mailStatus).toBe('failed');
  });

  it('records mail_status="failed" on the persisted row (db.update called with failed)', async () => {
    mockDbInsert('mailfail-update-id');
    const { set } = mockDbUpdate();
    vi.mocked(sendOwnerNotification).mockResolvedValueOnce('failed');

    const res = await app.request('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(res.status).toBe(201);
    // The row's mail_status MUST be updated to 'failed' (not left null / not
    // skipped) — proves the failure is recorded on the persisted inquiry, not
    // just echoed in the receipt.
    expect(set).toHaveBeenCalledWith({ mailStatus: 'failed' });
  });

  it('calls db.insert() before sendOwnerNotification (persist-first order)', async () => {
    const callOrder: string[] = [];

    const returning = vi.fn().mockResolvedValue([{ id: 'order-test-id' }]);
    const values = vi.fn().mockReturnValue({ returning });
    vi.mocked(db.insert).mockImplementation(() => {
      callOrder.push('db.insert');
      return { values } as never;
    });
    mockDbUpdate();

    vi.mocked(sendOwnerNotification).mockImplementation(async () => {
      callOrder.push('sendOwnerNotification');
      return 'skipped';
    });

    await app.request('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    expect(callOrder).toEqual(['db.insert', 'sendOwnerNotification']);
  });
});

describe('POST /api/invite — No PII in logs (NFR-7, AC3)', () => {
  it('does not log name, email, or message on a successful submission', async () => {
    mockDbInsert('pii-test-id');
    mockDbUpdate();

    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await app.request('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    const allLogs = [
      ...infoSpy.mock.calls.map((c) => String(c[0])),
      ...errorSpy.mock.calls.map((c) => String(c[0])),
    ];

    for (const log of allLogs) {
      expect(log).not.toContain(validBody.name);
      expect(log).not.toContain(validBody.email);
      expect(log).not.toContain(validBody.message);
    }

    infoSpy.mockRestore();
    errorSpy.mockRestore();
  });
});

describe('POST /api/invite — uses the shared InviteInput contract (AR-15 consistency)', () => {
  it('rejects a body that violates a shared-schema-only rule (message > 5000 chars) with field errors', async () => {
    // This body is well-formed except `message` exceeds the shared schema's
    // max(5000). If the route validated with the shared contract, it 400s with
    // a `message` field error — proving THE shared schema is the one in force.
    const tooLong = { ...validBody, message: 'x'.repeat(5001) };

    // Sanity: the shared contract itself rejects this (the api must agree).
    expect(InviteInput.safeParse(tooLong).success).toBe(false);

    const res = await app.request('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tooLong),
    });
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: { fields?: Record<string, unknown> } };
    expect(json.error.fields).toBeDefined();
    expect(Object.keys(json.error.fields!)).toContain('message');
  });

  it('accepts exactly what the shared contract accepts (no stricter/looser api drift)', async () => {
    mockDbInsert();
    mockDbUpdate();
    // A payload at the shared schema's boundaries (trimmed name, 5000-char
    // message, optional fields present) — valid under the shared contract.
    const boundary = {
      name: 'A',
      email: 'edge@example.com',
      org: 'O'.repeat(200),
      message: 'm'.repeat(5000),
      topic: 'T'.repeat(200),
      attribution: 'X'.repeat(200),
    };
    expect(InviteInput.safeParse(boundary).success).toBe(true);

    const res = await app.request('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(boundary),
    });
    // The api accepts what the contract accepts — no hidden extra constraint.
    expect(res.status).toBe(201);
  });
});
