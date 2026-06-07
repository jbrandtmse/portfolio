/**
 * POST /invite — speaking inquiry capture (Story 3.3, Decision 5).
 *
 * Full pipeline (in strict order):
 *   1. CORS/same-origin guard   — rejects cross-origin requests.
 *   2. Honeypot check           — silent 200 for bots (no persist, no email).
 *   3. Rate-limit               — in-memory per-IP sliding window → 429 on flood.
 *   4. Zod validate body        — 400 on invalid.
 *   5. Persist row (Drizzle)    — FIRST (Postgres = system of record; AC3).
 *   6. Send owner email         — records mail_status (sent/failed/skipped).
 *   7. Return JSON receipt      — { id, mailStatus, message } — on mail failure
 *                                  STILL success (inquiry is not lost; AC3).
 *
 * Security / abuse controls (AC3, architecture §Auth/Security):
 *   - CORS closed: only requests that present the correct site origin are served.
 *   - Honeypot: a `website` decoy field that real users never fill in.
 *   - Rate-limit: in-memory per-IP, max 5 submissions per 60-second window.
 *   - No PII in logs (NFR-7): logs only id + mail_status.
 *   - NFR-5: no secret reaches the client; env vars are server-side only.
 */
import type { Context } from 'hono';
import { Hono } from 'hono';
import { eq } from 'drizzle-orm';

import { InviteInput } from '@portfolio/shared/schemas';

import { db } from '../db/client.js';
import { inquiries } from '../db/schema.js';
import { sendOwnerNotification } from '../lib/email.js';

// ---------------------------------------------------------------------------
// Rate-limiter — in-memory per-IP sliding window (Stage 1 / no Redis needed).
// ---------------------------------------------------------------------------
const RATE_LIMIT_WINDOW_MS = 60_000; // 60 seconds
const RATE_LIMIT_MAX = 5; // max submissions per window

interface WindowEntry {
  count: number;
  windowStart: number;
}

const ipWindows = new Map<string, WindowEntry>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipWindows.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    // New or expired window — reset.
    ipWindows.set(ip, { count: 1, windowStart: now });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

// Exported for tests so they can reset state between runs.
export function _resetRateLimiter(): void {
  ipWindows.clear();
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------
const inviteRouter = new Hono();

/**
 * POST /invite
 *
 * Mounted on app.ts under `/api`, so the full path is `POST /api/invite`.
 * The router receives the request after the `/api` base path is stripped.
 */
inviteRouter.post('/invite', async (c: Context) => {
  // ------------------------------------------------------------------
  // Step 1 — CORS / same-origin guard.
  // The api is CORS-closed: it only serves requests from the site origin.
  // In production, nginx proxies /api/* so the Origin header should match
  // the site host. We reject clear-text cross-origin attempts here.
  // ------------------------------------------------------------------
  const origin = c.req.header('Origin');
  const host = c.req.header('Host');

  // Allow requests with no Origin (same-host server-side / curl tests)
  // but reject cross-origin (Origin present AND doesn't match the host).
  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return c.json(
          { error: { code: 'FORBIDDEN', message: 'Cross-origin requests are not allowed' } },
          403,
        );
      }
    } catch {
      return c.json({ error: { code: 'FORBIDDEN', message: 'Invalid origin' } }, 403);
    }
  }

  // ------------------------------------------------------------------
  // Step 2 — Honeypot check.
  // `website` is a hidden decoy field that real users leave empty.
  // Bots that fill it in get a benign 200 receipt (no persist, no email,
  // no clue that anything was rejected).
  // ------------------------------------------------------------------
  let rawBody: Record<string, unknown>;
  try {
    rawBody = (await c.req.json()) as Record<string, unknown>;
  } catch {
    return c.json({ error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' } }, 400);
  }

  const honeypot = rawBody['website'];
  if (honeypot !== undefined && honeypot !== null && honeypot !== '') {
    // Silent benign response — do NOT tip off the bot.
    // Log only a non-PII flag (no IP, no body content).
    console.info('[invite] honeypot triggered — benign 200 returned (no persist)');
    return c.json({
      id: 'honeypot',
      mailStatus: 'skipped',
      message: 'Thank you. We will be in touch.',
    });
  }

  // ------------------------------------------------------------------
  // Step 3 — Rate-limit (in-memory per-IP sliding window).
  // ------------------------------------------------------------------
  const ip =
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
    c.req.header('x-real-ip') ??
    'unknown';

  if (isRateLimited(ip)) {
    console.info(`[invite] rate-limited (ip-hash: ${ip.length})`); // hash by length only — no PII IP
    return c.json(
      { error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' } },
      429,
    );
  }

  // ------------------------------------------------------------------
  // Step 4 — Zod validate body against InviteInput.
  // ------------------------------------------------------------------
  const parseResult = InviteInput.safeParse(rawBody);
  if (!parseResult.success) {
    return c.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid submission',
          // Safe to return field errors (no PII — these are field names + rules).
          fields: parseResult.error.flatten().fieldErrors,
        },
      },
      400,
    );
  }

  const { name, email, org, message, topic, attribution } = parseResult.data;

  // ------------------------------------------------------------------
  // Step 5 — PERSIST FIRST (Postgres = system of record).
  // A mail failure must NEVER lose the inquiry.
  // ------------------------------------------------------------------
  let newRow: { id: string };
  try {
    const rows = await db
      .insert(inquiries)
      .values({
        name,
        email,
        org,
        message,
        topic,
        attribution,
        source: 'form',
        status: 'new',
        // mail_status is null until we attempt the email below.
      })
      .returning({ id: inquiries.id });

    newRow = rows[0]!;
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : String(err);
    console.error(`[invite] DB insert failed: ${errMessage}`);
    return c.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Could not save your inquiry. Please try again.',
        },
      },
      500,
    );
  }

  // ------------------------------------------------------------------
  // Step 6 — Send owner notification email (env-gated, never throws).
  // Records mail_status on the persisted row.
  // ------------------------------------------------------------------
  const mailStatus = await sendOwnerNotification({
    inquiryId: newRow.id,
    submitterName: name,
    submitterEmail: email,
    submitterOrg: org,
    message,
    topic,
    attribution,
  });

  // Update mail_status on the row (best-effort; non-fatal if this fails).
  try {
    await db.update(inquiries).set({ mailStatus }).where(eq(inquiries.id, newRow.id));
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : String(err);
    // Log only non-PII: id + status update failure.
    console.error(`[invite] mail_status update failed (id=${newRow.id}): ${errMessage}`);
    // Continue — the row is persisted; mail_status update is secondary.
  }

  // ------------------------------------------------------------------
  // Step 7 — Return JSON receipt (HTTP 201 — the inquiry was created).
  // Mail failure is non-destructive: we STILL return success (201) for the
  // persistence so the inquiry is never lost (Postgres = system of record; AC3).
  // ------------------------------------------------------------------
  // Log only non-PII: id + mail_status.
  console.info(`[invite] inquiry persisted (id=${newRow.id}, mailStatus=${mailStatus})`);

  return c.json(
    {
      id: newRow.id,
      mailStatus,
      message: 'Thank you. We will review your inquiry and be in touch.',
    },
    201,
  );
});

export default inviteRouter;
