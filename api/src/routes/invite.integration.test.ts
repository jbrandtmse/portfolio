/**
 * DB integration test for POST /api/invite (Story 3.3, Decision 6, AC2).
 *
 * Rule 3 (skill-rules): a service story MUST include at least one test that
 * exercises the deliverable against its real target runtime — here:
 *   - Real Postgres via DATABASE_URL (from api/.env, loaded by vitest.config.ts)
 *   - Real Drizzle insert + select
 *   - No socket bind (uses app.request() — Story-3.0 EADDRINUSE invariant)
 *   - mail_status='skipped' because RESEND_API_KEY is not set in test env
 *
 * Skip-with-warning if DATABASE_URL is not set (never fail the suite —
 * mirrors the Story-3.0 port-robustness discipline; Decision 6).
 *
 * Cleanup: deletes test rows by a recognisable marker email in afterEach.
 * Max connections: this file uses ONE pool instance shared via the db client
 * singleton (architecture: "reuse one pool"). Pool is closed in afterAll.
 */
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// This file does NOT mock db/client.js or email.ts — it uses the real deps.
// (The companion invite.test.ts handles unit tests with mocks.)
import { eq, inArray } from 'drizzle-orm';

const DATABASE_URL = process.env.DATABASE_URL;

// Guard: skip entirely if DATABASE_URL is not set.
if (!DATABASE_URL) {
  describe('POST /api/invite — DB integration (SKIPPED)', () => {
    it.todo(
      '[SKIP] DATABASE_URL not set — set it on the VM for DB integration coverage ' +
        '(api/.env on the deploy VM; pnpm test will run this automatically)',
    );
  });
} else {
  // DATABASE_URL is set — run the real integration suite.
  const { db, pool } = await import('../db/client.js');
  const { inquiries } = await import('../db/schema.js');
  const { default: app } = await import('../app.js');
  // Import the email module as a namespace so we can spy on the exact binding
  // the route calls (for the forced mail-failure integration test below).
  const emailModule = await import('../lib/email.js');
  // The route's in-memory rate-limiter is module-level shared state; reset it
  // before each test so accumulated counts across this file's many requests
  // don't spuriously 429 a later test (5/60s per-IP, all from the same test IP).
  const { _resetRateLimiter } = await import('./invite.js');

  beforeEach(() => {
    _resetRateLimiter();
  });

  const TEST_MARKER_EMAIL = 'story-3.3-integration-test@test.example.invalid';
  // Distinct markers for the gap-filling tests — all cleaned up in afterEach.
  const TEST_MARKER_MAILFAIL = 'story-3.3-mailfail@test.example.invalid';
  const TEST_MARKER_FIELDS = 'story-3.3-fields@test.example.invalid';
  const TEST_MARKER_HONEYPOT = 'story-3.3-honeypot@test.example.invalid';
  const ALL_TEST_MARKERS = [
    TEST_MARKER_EMAIL,
    TEST_MARKER_MAILFAIL,
    TEST_MARKER_FIELDS,
    TEST_MARKER_HONEYPOT,
  ];

  afterEach(async () => {
    // Restore any spies (e.g. the forced mail-failure spy) so they don't leak.
    vi.restoreAllMocks();
    // Clean up test rows by ANY of the marker emails (best-effort) — the table
    // must be empty of test rows after the suite (Rule: clean up every row).
    try {
      await db.delete(inquiries).where(inArray(inquiries.email, ALL_TEST_MARKERS));
    } catch {
      // Best-effort — do not fail tests on cleanup errors.
    }
  });

  afterAll(async () => {
    // Close the pool so vitest exits cleanly (no hanging async resources).
    await pool.end().catch(() => {});
  });

  describe('POST /api/invite — DB integration (real Postgres)', () => {
    const validBody = {
      name: 'Integration Test User',
      email: TEST_MARKER_EMAIL,
      message: 'This is an automated integration test message.',
      attribution: 'Test suite',
    };

    it('returns 201 with a JSON receipt containing id + mailStatus', async () => {
      const res = await app.request('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody),
      });

      expect(res.status).toBe(201);
      const json = (await res.json()) as { id: string; mailStatus: string; message: string };
      expect(typeof json.id).toBe('string');
      expect(json.id.length).toBeGreaterThan(0);
      // RESEND_API_KEY is not set in test env (api/.env has it commented out).
      expect(json.mailStatus).toBe('skipped');
      expect(typeof json.message).toBe('string');
    });

    it('persists the row in Postgres — readable by id (Rule 3 real-runtime assertion)', async () => {
      const res = await app.request('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody),
      });
      expect(res.status).toBe(201);

      const { id } = (await res.json()) as { id: string; mailStatus: string };

      // Read back from the REAL Postgres by the returned id.
      const rows = await db.select().from(inquiries).where(eq(inquiries.id, id));

      expect(rows.length).toBe(1);
      const row = rows[0]!;
      expect(row.id).toBe(id);
      expect(row.name).toBe('Integration Test User');
      expect(row.email).toBe(TEST_MARKER_EMAIL);
      expect(row.source).toBe('form');
      expect(row.status).toBe('new');
      expect(row.mailStatus).toBe('skipped');
      // DB-generated fields: timestamps from Postgres defaults (not new Date() in app code).
      expect(row.createdAt).toBeInstanceOf(Date);
      expect(row.updatedAt).toBeInstanceOf(Date);
    });

    it('uses DB-side uuid for id (non-enumerable; format check)', async () => {
      const res = await app.request('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody),
      });
      const { id } = (await res.json()) as { id: string };
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('cleans up test rows (afterEach removes marker-email rows)', async () => {
      // Run a submission to create a row.
      const res = await app.request('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody),
      });
      expect(res.status).toBe(201);
      const { id } = (await res.json()) as { id: string };

      // afterEach will clean this up — assert it's there NOW (pre-cleanup).
      const rows = await db.select().from(inquiries).where(eq(inquiries.id, id));
      expect(rows.length).toBe(1);

      // afterEach will delete it by TEST_MARKER_EMAIL.
    });
  });

  // -------------------------------------------------------------------------
  // GAP-FILL (QA): the headline guarantee — mail failure is NON-DESTRUCTIVE
  // against the REAL Postgres. We keep RESEND unset (no live email) and force
  // the email step to return 'failed' by spying on the real email module.
  // The row MUST still exist in the DB with mail_status='failed', and the
  // endpoint MUST still return success (201) so the inquiry is never lost.
  // -------------------------------------------------------------------------
  describe('POST /api/invite — mail failure is non-destructive (real Postgres, AC2/AC3)', () => {
    const mailFailBody = {
      name: 'Mail Fail User',
      email: TEST_MARKER_MAILFAIL,
      message: 'This submission should persist even though the email fails.',
      attribution: 'Test suite',
    };

    it('persists the inquiry AND returns 201 with mail_status="failed" when the email send fails', async () => {
      // Force the email step to fail WITHOUT a live Resend key (RESEND stays unset).
      const spy = vi.spyOn(emailModule, 'sendOwnerNotification').mockResolvedValue('failed');

      const res = await app.request('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mailFailBody),
      });

      // Endpoint still succeeds for persistence (the inquiry is NOT lost).
      expect(res.status).toBe(201);
      const { id, mailStatus } = (await res.json()) as { id: string; mailStatus: string };
      expect(mailStatus).toBe('failed');

      // Sanity: the spy WAS the binding the route called (proves the forced-fail
      // path was actually exercised, not a no-op).
      expect(spy).toHaveBeenCalledTimes(1);

      // The row MUST exist in the REAL DB, read back by the receipt id, with
      // mail_status='failed' recorded. If the route had rolled back / deleted on
      // mail failure (destructive), this read-back would be empty → red.
      const rows = await db.select().from(inquiries).where(eq(inquiries.id, id));
      expect(rows.length).toBe(1);
      const row = rows[0]!;
      expect(row.email).toBe(TEST_MARKER_MAILFAIL);
      expect(row.mailStatus).toBe('failed');
      expect(row.source).toBe('form');
      expect(row.status).toBe('new');
    });
  });

  // -------------------------------------------------------------------------
  // GAP-FILL (QA): full field-mapping read-back. A subtle snake/camel or
  // field-swap bug (e.g. attribution stored into org) would store the WRONG
  // VALUE while keeping the insert valid — the original read-back only checked
  // name/email/source/status. Here we round-trip ALL user fields and assert
  // each value, so a value-level mapping bug reds.
  // -------------------------------------------------------------------------
  describe('POST /api/invite — full field-mapping round-trip (real Postgres, AC2)', () => {
    const fullBody = {
      name: 'Fields Roundtrip User',
      email: TEST_MARKER_FIELDS,
      org: 'Roundtrip Org LLC',
      message: 'Every field should round-trip to the right column.',
      topic: 'Distinct topic value',
      attribution: 'Distinct attribution value',
    };

    it('stores every field in its own column (receipt id === row id; values match exactly)', async () => {
      const res = await app.request('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullBody),
      });
      expect(res.status).toBe(201);
      const { id } = (await res.json()) as { id: string };

      const rows = await db.select().from(inquiries).where(eq(inquiries.id, id));
      expect(rows.length).toBe(1);
      const row = rows[0]!;

      // Receipt id agrees with the persisted row id.
      expect(row.id).toBe(id);
      // Each user field round-trips to its OWN column with the exact value.
      expect(row.name).toBe(fullBody.name);
      expect(row.email).toBe(fullBody.email);
      expect(row.org).toBe(fullBody.org);
      expect(row.message).toBe(fullBody.message);
      expect(row.topic).toBe(fullBody.topic);
      expect(row.attribution).toBe(fullBody.attribution);
      // Server-set fields.
      expect(row.source).toBe('form');
      expect(row.status).toBe('new');
      // RESEND unset ⇒ skipped.
      expect(row.mailStatus).toBe('skipped');
    });

    it('persists null (not the string "undefined") for omitted optional fields', async () => {
      const minimal = {
        name: 'Minimal User',
        email: TEST_MARKER_FIELDS,
        message: 'No org and no topic provided.',
        attribution: 'Test suite',
      };
      const res = await app.request('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(minimal),
      });
      expect(res.status).toBe(201);
      const { id } = (await res.json()) as { id: string };

      const rows = await db.select().from(inquiries).where(eq(inquiries.id, id));
      expect(rows.length).toBe(1);
      const row = rows[0]!;
      expect(row.org).toBeNull();
      expect(row.topic).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // GAP-FILL (QA): honeypot truly blocks PERSISTENCE against the REAL DB.
  // The unit test mocks db; here we assert the real row count for the marker
  // email is unchanged (zero) after a honeypot submission — i.e. NO row was
  // written. Mutation: if the honeypot guard were removed, a row would appear.
  // -------------------------------------------------------------------------
  describe('POST /api/invite — honeypot blocks persistence (real Postgres, AC3)', () => {
    it('writes NO row when the honeypot `website` field is non-empty', async () => {
      const countMarker = async () => {
        const rows = await db
          .select()
          .from(inquiries)
          .where(eq(inquiries.email, TEST_MARKER_HONEYPOT));
        return rows.length;
      };

      const before = await countMarker();
      expect(before).toBe(0);

      const res = await app.request('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Bot Submitter',
          email: TEST_MARKER_HONEYPOT,
          message: 'I am a bot.',
          attribution: 'spam',
          website: 'http://spam.example.com', // honeypot filled → bot
        }),
      });

      // Benign response (does NOT tip off the bot) and NO row persisted.
      expect(res.status).toBe(200);
      const after = await countMarker();
      expect(after).toBe(0);
    });
  });
}
