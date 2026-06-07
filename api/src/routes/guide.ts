/**
 * POST /guide — the Guide endpoint (Story 4.3).
 *
 * Full pipeline:
 *   1. CORS/same-origin guard       — rejects cross-origin requests.
 *   2. Rate-limit                   — in-memory per-IP → 429 on flood.
 *   3. Zod validate body            — 400 on invalid (GuideQuery).
 *   4. Injection check              — log + continue (grounding still holds).
 *   5. Retrieve                     — search(query, k) from Story-4.1 retriever.
 *   6. Threshold gate (fail-closed) — empty/below-threshold → canned SSE (NO model call).
 *   7. Ground                       — assemble grounded prompt (Decision 3).
 *   8. Stream                       — llm-client → SSE token/citation/done/error events.
 *   9. ~15s ceiling + abort         — AbortController → in-voice fallback on timeout.
 *
 * Security:
 *   - CORS-closed (same-origin guard, Step 1).
 *   - Rate-limited per IP (Step 2, max 10/min for the Guide).
 *   - LLM key never in SSE events, never in web, never committed (NFR-5).
 *   - System persona never echoed to the client (asserted in tests).
 *   - Injection attempts logged (Step 4); grounding holds regardless.
 *
 * Voice invariant: no exclamation marks in any canned or fallback string.
 *
 * Fail-closed (FR-6, SM-C3):
 *   Below-threshold retrieval → emit "I don't have that documented." as SSE
 *   token+done WITHOUT calling the model. Log retrieval_miss.
 *
 * Latency (NFR-4):
 *   Retrieval < ~200ms. ~15s AbortController ceiling on LLM call.
 *   Graceful in-voice fallback + Mirror links on timeout/endpoint-down.
 */
import type { Context } from 'hono';
import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';

import { GuideQuery } from '@portfolio/shared/schemas';

import { env } from '../env.js';
import { assembleGroundedPrompt, detectInjection, extractCitations } from '../lib/grounding.js';
import { LlmUnavailableError, streamTokens } from '../lib/llm-client.js';
import { logger } from '../lib/logger.js';
import { search } from '../lib/retriever.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** BM25 score threshold — below this, fail-closed (no model call). */
export const RETRIEVAL_THRESHOLD = 0.5;

/** Number of chunks to retrieve (architecture §Retriever abstraction: 3–6). */
const K = 5;

/**
 * Hard ceiling on LLM streaming (ms). Raised 10s → 15s to absorb the tail
 * latency of reasoning-class mid-tier models (gpt-5-mini's first token can run
 * past 10s, tripping the abort → in-voice fallback). 15s keeps a graceful upper
 * bound while letting slow-but-valid grounded answers complete (NFR-4).
 */
const LLM_CEILING_MS = 15_000;

/** Canned fail-closed response (in-voice, no exclamation). */
export const CANNED_NO_CONTEXT = "I don't have that documented.";

/** In-voice fallback when the LLM is unavailable or slow. */
export const FALLBACK_DEGRADED =
  "I'm unable to answer right now. You can explore Joshua's work directly on the Mirror — " +
  'try /about/, /work/loandemo/, /speaking/, /timeline/, or /faq/ for the most relevant sections.';

// ---------------------------------------------------------------------------
// Rate-limiter (reuse the invite pattern — per-IP fixed window)
// ---------------------------------------------------------------------------
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10; // Guide is more expensive → slightly tighter limit

interface WindowEntry {
  count: number;
  windowStart: number;
}

const ipWindows = new Map<string, WindowEntry>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipWindows.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    ipWindows.set(ip, { count: 1, windowStart: now });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

/** Exported for tests to reset state between runs. */
export function _resetRateLimiter(): void {
  ipWindows.clear();
}

// ---------------------------------------------------------------------------
// SSE helpers
// ---------------------------------------------------------------------------

type SseWriter = {
  writeSSE: (event: { event: string; data: string }) => Promise<void>;
  onAbort: (fn: () => void) => void;
};

async function emitToken(stream: SseWriter, value: string): Promise<void> {
  await stream.writeSSE({
    event: 'token',
    data: JSON.stringify({ type: 'token', value }),
  });
}

async function emitCitation(stream: SseWriter, route: string, label: string): Promise<void> {
  await stream.writeSSE({
    event: 'citation',
    data: JSON.stringify({ type: 'citation', route, label }),
  });
}

async function emitDone(stream: SseWriter): Promise<void> {
  await stream.writeSSE({ event: 'done', data: JSON.stringify({ type: 'done' }) });
}

async function emitError(stream: SseWriter, message: string): Promise<void> {
  await stream.writeSSE({
    event: 'error',
    data: JSON.stringify({ type: 'error', message }),
  });
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

const guideRouter = new Hono();

/**
 * POST /guide
 *
 * Mounted on app.ts under `/api`, so the full path is `POST /api/guide`.
 * Returns an SSE stream (Content-Type: text/event-stream via streamSSE).
 * Each event has an `event:` name matching the GuideEvent type discriminant.
 */
guideRouter.post('/guide', async (c: Context) => {
  // ------------------------------------------------------------------
  // Step 1 — CORS / same-origin guard (reuse invite pattern).
  // ------------------------------------------------------------------
  const origin = c.req.header('Origin');
  const host = c.req.header('Host');

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
  // Step 2 — Rate-limit (in-memory per-IP fixed window).
  // ------------------------------------------------------------------
  const ip =
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
    c.req.header('x-real-ip') ??
    'unknown';

  if (isRateLimited(ip)) {
    return c.json(
      { error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' } },
      429,
    );
  }

  // ------------------------------------------------------------------
  // Step 3 — Zod validate body (GuideQuery).
  // ------------------------------------------------------------------
  let rawBody: unknown;
  try {
    rawBody = await c.req.json();
  } catch {
    return c.json({ error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' } }, 400);
  }

  const parseResult = GuideQuery.safeParse(rawBody);
  if (!parseResult.success) {
    return c.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          fields: parseResult.error.flatten().fieldErrors,
        },
      },
      400,
    );
  }

  const { query, threadContext } = parseResult.data;

  // ------------------------------------------------------------------
  // Step 4 — Injection detection (log + continue — grounding still holds).
  // The system prompt is server-side; injection cannot override it through
  // the visitor input block. We log attempts for monitoring.
  // ------------------------------------------------------------------
  const injectionCheck = detectInjection(query);
  if (injectionCheck.detected && injectionCheck.matchedPattern) {
    logger.injectionAttempt(injectionCheck.matchedPattern);
    // Continue — grounding absorbs the injection attempt; the system prompt
    // instructs the model to treat visitor text as data, not instructions.
  }

  // ------------------------------------------------------------------
  // Step 5 — Retrieve (Story 4.1 retriever.search).
  // ------------------------------------------------------------------
  const chunks = await search(query, K);

  // ------------------------------------------------------------------
  // Step 6 — Threshold gate (fail-closed, FR-6).
  // Empty result or below-threshold → canned SSE, NO model call.
  // ------------------------------------------------------------------
  const topScore = chunks[0]?.score ?? 0;
  const isAboveThreshold = chunks.length > 0 && topScore >= RETRIEVAL_THRESHOLD;

  if (!isAboveThreshold) {
    logger.retrievalMiss(query, topScore, RETRIEVAL_THRESHOLD);

    // Emit the canned response as a valid SSE stream (uniform client path).
    return streamSSE(c, async (stream) => {
      await emitToken(stream, CANNED_NO_CONTEXT);
      await emitDone(stream);
    });
  }

  // ------------------------------------------------------------------
  // Steps 7–9 — Ground → stream → AbortController ceiling.
  // ------------------------------------------------------------------
  const messages = assembleGroundedPrompt(query, chunks, threadContext);
  const citations = extractCitations(chunks);

  // ~15s hard ceiling on the LLM call (NFR-4)
  const controller = new AbortController();
  const ceiling = setTimeout(() => controller.abort(), LLM_CEILING_MS);

  return streamSSE(c, async (stream) => {
    // Register abort cleanup on client disconnect
    stream.onAbort(() => {
      controller.abort();
    });

    try {
      // Emit citation events first (all retrieved chunks that grounded the answer)
      for (const citation of citations) {
        await emitCitation(stream, citation.route, citation.label);
      }

      // Stream LLM tokens
      const useStub =
        env.GUIDE_LLM_STUB === '1' || (process.env.NODE_ENV === 'test' && !env.ABACUS_API_KEY);

      for await (const token of streamTokens({
        messages,
        signal: controller.signal,
        forceStub: useStub,
      })) {
        if (controller.signal.aborted) break;
        await emitToken(stream, token);
      }

      if (controller.signal.aborted) {
        await emitError(stream, FALLBACK_DEGRADED);
      } else {
        await emitDone(stream);
      }
    } catch (err) {
      // Any failure on the grounded path (LlmUnavailableError from an
      // endpoint-down/non-2xx upstream, or any other stream error) degrades to
      // the SAME in-voice fallback — never a raw error/stack to the client
      // (AC5, NFR-4). LlmUnavailableError is named here for log/intent clarity.
      controller.abort();
      const reason = err instanceof LlmUnavailableError ? 'llm-unavailable' : 'stream-error';
      logger.streamFailure(reason);
      await emitError(stream, FALLBACK_DEGRADED);
    } finally {
      clearTimeout(ceiling);
    }
  });
});

export default guideRouter;
