/**
 * Unit tests for the CONTENT-NEGOTIATION (form-encoded / JS-off native POST)
 * branch of POST /api/invite (Story 3.4, Decision 3).
 *
 * GAP THIS CLOSES: the entire Story-3.4 backend addition — `isFormEncoded()`,
 * `c.req.parseBody()`, the 303 → /invite/thanks/ redirect, the self-contained
 * HTML 400, and the form-encoded honeypot/CORS/rate-limit responses — shipped
 * with ZERO direct test coverage. The existing invite.test.ts +
 * invite.integration.test.ts only ever send `Content-Type: application/json`, so
 * none of the form-encoded code paths were exercised. The e2e JS-off test proves
 * the happy path against the real DB, but the rejection/benign shapes (403 / 400
 * HTML / honeypot-redirect / 429) are best asserted here at the unit level (no
 * real DB needed — db/email mocked, same as invite.test.ts).
 *
 * These tests are MUTATION-STRONG: each asserts a form-specific RESPONSE SHAPE
 * (303 + Location, or text/html 400, or 303-benign-no-insert) that differs from
 * the JSON path — so reverting the content-negotiation (returning JSON
 * everywhere) reds them. A backward-compat test re-confirms the JSON path is
 * untouched.
 *
 * No socket bind (app.request(); Story-3.0 EADDRINUSE invariant).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the DB client + email lib so these unit tests never hit real deps.
vi.mock('../db/client.js', () => ({
  db: {
    insert: vi.fn(),
    update: vi.fn(),
  },
}));
vi.mock('../lib/email.js', () => ({
  sendOwnerNotification: vi.fn().mockResolvedValue('skipped'),
}));

import { db } from '../db/client.js';
import { sendOwnerNotification } from '../lib/email.js';
import { _resetRateLimiter } from './invite.js';

import app from '../app.js';

const FORM_CT = 'application/x-www-form-urlencoded';

/** A valid form-encoded body string (the native POST shape). */
function validForm(overrides: Record<string, string> = {}): string {
  const fields: Record<string, string> = {
    name: 'Native Poster',
    email: 'native@example.com',
    org: 'Native Org',
    message: 'I am submitting this with JavaScript disabled.',
    topic: 'Resilience',
    attribution: 'referral',
    ...overrides,
  };
  return new URLSearchParams(fields).toString();
}

function mockDbInsert(id = 'mock-form-id') {
  const returning = vi.fn().mockResolvedValue([{ id }]);
  const values = vi.fn().mockReturnValue({ returning });
  vi.mocked(db.insert).mockReturnValue({ values } as never);
  return { id, returning, values };
}
function mockDbUpdate() {
  const where = vi.fn().mockResolvedValue([]);
  const set = vi.fn().mockReturnValue({ where });
  vi.mocked(db.update).mockReturnValue({ set } as never);
  return { where, set };
}

beforeEach(() => {
  _resetRateLimiter();
  vi.clearAllMocks();
  vi.mocked(sendOwnerNotification).mockResolvedValue('skipped');
});
afterEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/invite — form-encoded success → 303 /invite/thanks/ (Story 3.4 AC2)', () => {
  it('redirects (303) to /invite/thanks/ on a valid native POST', async () => {
    mockDbInsert();
    mockDbUpdate();
    const res = await app.request('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': FORM_CT },
      body: validForm(),
    });
    expect(res.status).toBe(303);
    expect(res.headers.get('Location')).toBe('/invite/thanks/');
    // It does NOT return JSON for the native path (mutation: returning the JSON
    // receipt here instead of a redirect would fail this).
    expect(res.headers.get('Content-Type') ?? '').not.toContain('application/json');
  });

  it('still PERSISTS the inquiry on the form path (db.insert called before email)', async () => {
    const insert = mockDbInsert();
    mockDbUpdate();
    await app.request('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': FORM_CT },
      body: validForm(),
    });
    // The same persist-first pipeline runs for the native POST.
    expect(db.insert).toHaveBeenCalledTimes(1);
    expect(insert.values).toHaveBeenCalledTimes(1);
    expect(sendOwnerNotification).toHaveBeenCalledTimes(1);
  });

  it('parses form-encoded fields into the persisted values (parseBody path)', async () => {
    const insert = mockDbInsert();
    mockDbUpdate();
    await app.request('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': FORM_CT },
      body: validForm({ name: 'Exact Name', email: 'exact@example.com' }),
    });
    // The values passed to db.insert(...).values(...) come from parseBody — assert
    // the form fields actually mapped (mutation: if parseBody were skipped/empty,
    // Zod would reject and db.insert would never be called).
    const valuesArg = insert.values.mock.calls[0]![0] as Record<string, unknown>;
    expect(valuesArg.name).toBe('Exact Name');
    expect(valuesArg.email).toBe('exact@example.com');
    expect(valuesArg.source).toBe('form');
  });
});

describe('POST /api/invite — form-encoded validation failure → HTML 400 + mailto (Story 3.4 AC2)', () => {
  it('returns a self-contained text/html 400 (not JSON) when a required field is missing', async () => {
    const res = await app.request('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': FORM_CT },
      // Missing email + message.
      body: new URLSearchParams({ name: 'No Email', attribution: 'referral' }).toString(),
    });
    expect(res.status).toBe(400);
    expect(res.headers.get('Content-Type') ?? '').toContain('text/html');
    const body = await res.text();
    expect(body).toContain('<!DOCTYPE html>');
    // The inquiry-not-lost guarantee: a mailto fallback is offered in the HTML.
    expect(body.toLowerCase()).toContain('mailto:');
    // No row written on a validation rejection.
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('the HTML 400 COPY contains no exclamation marks (positive-assertion voice)', async () => {
    const res = await app.request('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': FORM_CT },
      body: new URLSearchParams({ name: 'X', attribution: 'referral' }).toString(),
    });
    const body = await res.text();
    // Strip the `<!DOCTYPE html>` declaration (its `!` is syntax, not copy) —
    // the same carve-out the web build-output voice tests apply.
    const copyOnly = body.replace(/<!doctype html>/i, '');
    expect(copyOnly).not.toContain('!');
  });
});

describe('POST /api/invite — form-encoded honeypot → benign 303, NO persist (Story 3.4 AC2)', () => {
  it('redirects (303) to /invite/thanks/ but writes NO row when `website` is filled', async () => {
    const res = await app.request('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': FORM_CT },
      body: validForm({ website: 'http://spam.example.com' }),
    });
    // Benign — the bot gets the same thanks UX, but nothing is persisted/emailed.
    expect(res.status).toBe(303);
    expect(res.headers.get('Location')).toBe('/invite/thanks/');
    expect(db.insert).not.toHaveBeenCalled();
    expect(sendOwnerNotification).not.toHaveBeenCalled();
  });
});

describe('POST /api/invite — form-encoded abuse responses are non-JSON (Story 3.4)', () => {
  it('CORS: cross-origin native POST → 403 plain text (not JSON)', async () => {
    const res = await app.request('/api/invite', {
      method: 'POST',
      headers: {
        'Content-Type': FORM_CT,
        Origin: 'https://evil.example.com',
        Host: 'joshuabrandt.abacusai.cloud',
      },
      body: validForm(),
    });
    expect(res.status).toBe(403);
    expect(res.headers.get('Content-Type') ?? '').not.toContain('application/json');
  });

  it('rate-limit: the 6th native POST in the window → 429 plain text (not JSON)', async () => {
    for (let i = 0; i < 5; i++) {
      mockDbInsert(`form-rl-${i}`);
      mockDbUpdate();
      await app.request('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': FORM_CT },
        body: validForm(),
      });
    }
    const limited = await app.request('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': FORM_CT },
      body: validForm(),
    });
    expect(limited.status).toBe(429);
    expect(limited.headers.get('Content-Type') ?? '').not.toContain('application/json');
  });
});

describe('POST /api/invite — JSON path is UNCHANGED by content-negotiation (Story 3.4 backward-compat)', () => {
  it('a JSON request still returns the 201 JSON receipt (not a redirect)', async () => {
    mockDbInsert('json-unchanged-id');
    mockDbUpdate();
    const res = await app.request('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        name: 'Json User',
        email: 'json@example.com',
        message: 'The island fetch path is unchanged.',
        attribution: 'referral',
      }),
    });
    expect(res.status).toBe(201);
    expect(res.headers.get('Content-Type') ?? '').toContain('application/json');
    // Definitely NOT the form redirect.
    expect(res.headers.get('Location')).toBeNull();
    const json = (await res.json()) as { id: string; mailStatus: string };
    expect(json.id).toBe('json-unchanged-id');
    expect(json.mailStatus).toBe('skipped');
  });
});
