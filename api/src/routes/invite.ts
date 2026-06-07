/**
 * POST /invite — speaking inquiry capture (Story 3.3, Decision 5).
 * Extended: content-negotiation for form-encoded (JS-off) POST (Story 3.4, Decision 3).
 *
 * Full pipeline (in strict order):
 *   1. CORS/same-origin guard   — rejects cross-origin requests.
 *   2. Parse body               — JSON (island fetch) or form-encoded (native POST).
 *   3. Honeypot check           — silent 200/redirect for bots (no persist, no email).
 *   4. Rate-limit               — in-memory per-IP sliding window → 429 on flood.
 *   5. Zod validate body        — 400 on invalid.
 *   6. Persist row (Drizzle)    — FIRST (Postgres = system of record; AC3).
 *   7. Send owner email         — records mail_status (sent/failed/skipped).
 *   8. Return response          — JSON receipt (island fetch) OR 303-redirect to
 *                                  /invite/thanks/ (native POST, form-encoded).
 *
 * Content-negotiation (Story 3.4, Decision 3):
 *   - form-encoded (Content-Type: application/x-www-form-urlencoded, native POST):
 *       success → 303-redirect to /invite/thanks/
 *       validation failure → minimal HTML 400 + mailto fallback (inquiry not lost)
 *   - JSON (Accept: application/json, island fetch): existing JSON receipt unchanged.
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
// Content-negotiation helpers (Story 3.4, Decision 3).
// ---------------------------------------------------------------------------

/** True when the request is a native form POST (not the island's JSON fetch). */
function isFormEncoded(c: Context): boolean {
  const ct = c.req.header('Content-Type') ?? '';
  return ct.includes('application/x-www-form-urlencoded');
}

/**
 * Minimal self-contained HTML 400 for form-encoded validation failures.
 * Keeps the inquiry from being silently lost by providing a mailto fallback.
 * No external CSS/JS (0-JS, self-contained page fragment for native browser).
 */
function html400(fieldErrors: Record<string, string[] | undefined>): string {
  const errorLines = Object.entries(fieldErrors)
    .flatMap(([field, msgs]) => (msgs ?? []).map((m) => `<li>${field}: ${m}</li>`))
    .join('\n    ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Submission error — Joshua R. Brandt, MSE</title>
</head>
<body>
<main>
  <h1>There was a problem with your submission</h1>
  <p>Joshua R. Brandt, MSE could not receive your message because of the following issues:</p>
  <ul>
    ${errorLines}
  </ul>
  <p>
    Please use the back button to correct the fields, or
    <a href="mailto:?subject=${encodeURIComponent('Speaking inquiry — Joshua R. Brandt, MSE')}">send an email directly</a>
    so your inquiry is not lost. You can also visit
    <a href="/about/">the about page</a>.
  </p>
  <p><a href="/invite/">Return to the invite page</a></p>
</main>
</body>
</html>`;
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
  const formPost = isFormEncoded(c);

  // Allow requests with no Origin (same-host server-side / curl tests)
  // but reject cross-origin (Origin present AND doesn't match the host).
  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        if (formPost) {
          return new Response('Forbidden', { status: 403 });
        }
        return c.json(
          { error: { code: 'FORBIDDEN', message: 'Cross-origin requests are not allowed' } },
          403,
        );
      }
    } catch {
      if (formPost) {
        return new Response('Forbidden', { status: 403 });
      }
      return c.json({ error: { code: 'FORBIDDEN', message: 'Invalid origin' } }, 403);
    }
  }

  // ------------------------------------------------------------------
  // Step 2 — Parse body (content-negotiated).
  // JSON path (island fetch): c.req.json()
  // Form-encoded path (native POST): c.req.parseBody()
  // ------------------------------------------------------------------
  let rawBody: Record<string, unknown>;
  if (formPost) {
    // Native browser form POST — parse as URL-encoded form data.
    const parsed = await c.req.parseBody();
    rawBody = parsed as Record<string, unknown>;
  } else {
    // Island fetch (Accept: application/json) — parse as JSON.
    try {
      rawBody = (await c.req.json()) as Record<string, unknown>;
    } catch {
      return c.json({ error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' } }, 400);
    }
  }

  // ------------------------------------------------------------------
  // Step 3 — Honeypot check.
  // `website` is a hidden decoy field that real users leave empty.
  // Bots that fill it in get a benign 200 receipt (no persist, no email,
  // no clue that anything was rejected).
  // ------------------------------------------------------------------
  const honeypot = rawBody['website'];
  if (honeypot !== undefined && honeypot !== null && honeypot !== '') {
    // Silent benign response — do NOT tip off the bot.
    // Log only a non-PII flag (no IP, no body content).
    console.info('[invite] honeypot triggered — benign 200 returned (no persist)');
    if (formPost) {
      // Redirect to thanks page (benign, no persist — bot gets the same UX as success).
      return new Response(null, {
        status: 303,
        headers: { Location: '/invite/thanks/' },
      });
    }
    return c.json({
      id: 'honeypot',
      mailStatus: 'skipped',
      message: 'Thank you. We will be in touch.',
    });
  }

  // ------------------------------------------------------------------
  // Step 4 — Rate-limit (in-memory per-IP sliding window).
  // ------------------------------------------------------------------
  const ip =
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
    c.req.header('x-real-ip') ??
    'unknown';

  if (isRateLimited(ip)) {
    console.info(`[invite] rate-limited (ip-hash: ${ip.length})`); // hash by length only — no PII IP
    if (formPost) {
      return new Response('Too many requests. Please try again later.', { status: 429 });
    }
    return c.json(
      { error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' } },
      429,
    );
  }

  // ------------------------------------------------------------------
  // Step 5 — Zod validate body against InviteInput.
  // ------------------------------------------------------------------
  const parseResult = InviteInput.safeParse(rawBody);
  if (!parseResult.success) {
    const fieldErrors = parseResult.error.flatten().fieldErrors;
    if (formPost) {
      return new Response(html400(fieldErrors), {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
    return c.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid submission',
          // Safe to return field errors (no PII — these are field names + rules).
          fields: fieldErrors,
        },
      },
      400,
    );
  }

  const { name, email, org, message, topic, attribution } = parseResult.data;

  // ------------------------------------------------------------------
  // Step 6 — PERSIST FIRST (Postgres = system of record).
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
    if (formPost) {
      return new Response(
        html400({
          submit: ['Could not save your inquiry. Please try again or use the mailto fallback.'],
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        },
      );
    }
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
  // Step 7 — Send owner notification email (env-gated, never throws).
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
  // Step 8 — Return response.
  // Form-encoded path: 303-redirect to /invite/thanks/ (JS-off browser navigates).
  // JSON path: existing JSON receipt (island fetch; unchanged from Story 3.3).
  // ------------------------------------------------------------------
  console.info(`[invite] inquiry persisted (id=${newRow.id}, mailStatus=${mailStatus})`);

  if (formPost) {
    // Native POST success: redirect to the server-rendered confirmation page.
    return new Response(null, {
      status: 303,
      headers: { Location: '/invite/thanks/' },
    });
  }

  // JSON receipt (HTTP 201 — the inquiry was created).
  // Mail failure is non-destructive: we STILL return success (201) for the
  // persistence so the inquiry is never lost (Postgres = system of record; AC3).
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
