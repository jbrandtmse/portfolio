/**
 * guide.spec.ts — SSE e2e for POST /api/guide (Story 4.3, AC7, Rule 7).
 *
 * Rule 7 compliance (the canonical Epic-4 case, retro A3):
 *   - Exercises the REAL Hono endpoint through the prod-faithful proxy
 *     (serve-with-api.mjs proxies /api/* → real Hono; SSE streams intact via pipe).
 *   - NOT a mock transport — the real retriever, real threshold gate, and real
 *     grounding assembly run. Only the LLM is stubbed (GUIDE_LLM_STUB=1 in harness).
 *   - PROVEN to execute: no test.skip() on a missing prereq. The beforeAll
 *     generates the KB index if absent (same pattern as retriever.test.ts).
 *   - Both paths exercised:
 *       (a) fail-closed: nonsense query → canned "I don't have that documented."
 *           SSE (token + done); real retrieval, no model call.
 *       (b) grounded: KB-answerable query → citation(s) + token(s) + done;
 *           real retrieval above threshold, deterministic stub stream.
 *
 * Harness notes:
 *   - baseURL = http://127.0.0.1:4321 (serve-with-api.mjs proxy port).
 *   - /api/* → Hono (E2E_API_PORT 8799), everything else → astro preview.
 *   - GUIDE_LLM_STUB=1 is set in serve-with-api.mjs so the API uses the stub.
 *   - DATABASE_URL is set from api/.env in playwright.config.ts (for the API boot).
 *
 * Rule 8 compliance:
 *   - Assertions scoped to specific SSE event types and fields.
 *   - No whole-response-body toContain that a different surface could satisfy.
 *
 * SSE consumption: uses the Fetch API with response.body.getReader() + TextDecoder
 * to consume the SSE stream (same pattern as the llm-client relay, but for the
 * client side). This works in Playwright's Node-based test runner.
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..', '..');
const REAL_INDEX_PATH = join(REPO_ROOT, 'api', 'data', 'kb-index.json');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface SseEvent {
  event: string;
  data: unknown;
}

function parseSseText(text: string): SseEvent[] {
  const events: SseEvent[] = [];
  const blocks = text.split('\n\n').filter((b) => b.trim());
  for (const block of blocks) {
    const lines = block.split('\n');
    let eventName = '';
    let dataStr = '';
    for (const line of lines) {
      if (line.startsWith('event:')) eventName = line.slice('event:'.length).trim();
      if (line.startsWith('data:')) dataStr = line.slice('data:'.length).trim();
    }
    if (eventName && dataStr) {
      try {
        events.push({ event: eventName, data: JSON.parse(dataStr) });
      } catch {
        events.push({ event: eventName, data: dataStr });
      }
    }
  }
  return events;
}

// ---------------------------------------------------------------------------
// KB index prerequisite (Rule 7 — do NOT skip; generate if needed)
// ---------------------------------------------------------------------------

test.beforeAll(() => {
  // Rule 7: never skip the integration e2e on a missing prerequisite.
  // Generate the KB index if it's absent so the test ACTUALLY EXECUTES.
  if (!existsSync(REAL_INDEX_PATH)) {
    console.log('[guide.spec] kb-index.json absent — running build:content...');
    execSync('pnpm build:content', { cwd: REPO_ROOT, stdio: 'inherit' });
  }
  if (!existsSync(REAL_INDEX_PATH)) {
    throw new Error(
      '[guide.spec] KB index still missing after build:content — cannot run guide e2e.',
    );
  }
});

// ---------------------------------------------------------------------------
// Helper: POST to /api/guide via the proxy and consume SSE stream
// ---------------------------------------------------------------------------

async function postGuide(baseURL: string, body: Record<string, unknown>): Promise<SseEvent[]> {
  const res = await fetch(`${baseURL}/api/guide`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok && res.status !== 200) {
    const text = await res.text().catch(() => '');
    throw new Error(`[guide.spec] POST /api/guide → ${res.status}: ${text.slice(0, 200)}`);
  }

  // Consume SSE stream via getReader() (same relay pattern as llm-client)
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let raw = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      raw += dec.decode(value, { stream: true });
    }
    raw += dec.decode();
  } finally {
    reader.releaseLock();
  }

  return parseSseText(raw);
}

// ---------------------------------------------------------------------------
// (a) Fail-closed path: nonsense query → canned SSE, no model call (AC7, AC3)
// ---------------------------------------------------------------------------

test('(a) fail-closed — nonsense query → canned SSE "I don\'t have that documented." (Rule 7)', async ({
  baseURL,
}) => {
  // Rule 7: this test hits the REAL endpoint through the proxy, with the REAL
  // retriever and REAL threshold gate. No LLM is called (fail-closed path).
  const events = await postGuide(baseURL!, {
    query: 'zzz_xyzzy_gibberish_notincorpus_at_all_abc123xyz',
  });

  // Rule 8: scoped assertions by event type
  const tokens = events.filter((e) => e.event === 'token');
  const doneEvents = events.filter((e) => e.event === 'done');
  const errorEvents = events.filter((e) => e.event === 'error');

  // Must have at least one token event
  expect(tokens.length, 'fail-closed path must emit token event(s)').toBeGreaterThanOrEqual(1);

  // The token must carry the canned text (scoped to token.value, not whole body)
  const tokenText = tokens.map((e) => (e.data as { value: string }).value).join('');
  expect(tokenText, 'canned text must contain "I don\'t have that documented"').toContain(
    "I don't have that documented",
  );

  // Voice rule: no exclamation marks in canned response
  expect(tokenText, 'no exclamation marks in canned response (voice rule)').not.toContain('!');

  // Must end with done (uniform client path)
  expect(doneEvents.length, 'fail-closed path must end with done event').toBeGreaterThanOrEqual(1);

  // Must NOT have error events (fail-closed is not an error — it's a valid flow)
  expect(errorEvents.length, 'fail-closed path must not emit error events').toBe(0);
});

// ---------------------------------------------------------------------------
// (b) Grounded path: KB-answerable query → citations + tokens + done (AC7, AC2)
// ---------------------------------------------------------------------------

test('(b) grounded path — KB query → citation + token + done SSE events (Rule 7, stub)', async ({
  baseURL,
}) => {
  // Rule 7: this test hits the REAL endpoint through the proxy, with the REAL
  // retriever (returns above-threshold chunks) and the DETERMINISTIC STUB LLM
  // (GUIDE_LLM_STUB=1 set in the harness). No live LLM is needed.
  const events = await postGuide(baseURL!, {
    query: 'loandemo case study fintech agentic engineering',
  });

  // Rule 8: scoped assertions by event type
  const citationEvents = events.filter((e) => e.event === 'citation');
  const tokenEvents = events.filter((e) => e.event === 'token');
  const doneEvents = events.filter((e) => e.event === 'done');

  // Must have citation events from real Mirror routes
  expect(
    citationEvents.length,
    'grounded path must emit at least one citation event',
  ).toBeGreaterThan(0);

  // Each citation must have {route, label} matching the CitationEvent contract
  for (const cite of citationEvents) {
    const data = cite.data as { type: string; route: string; label: string };
    expect(data.type, 'citation event type must be "citation"').toBe('citation');
    expect(data.route, 'citation route must start with /').toMatch(/^\//);
    expect(data.label, 'citation label must be non-empty').toBeTruthy();
  }

  // At least one citation should be from the loandemo route (real retrieval result)
  const loandemoCite = citationEvents.find((e) =>
    ((e.data as { route: string }).route ?? '').includes('loandemo'),
  );
  expect(
    loandemoCite,
    'grounded path must cite /work/loandemo/ for a loandemo query',
  ).toBeDefined();

  // Must have token events (stub stream emits fixed tokens)
  expect(tokenEvents.length, 'grounded path must emit token events').toBeGreaterThan(0);

  // Token values must not contain the system prompt (persona never leaks)
  const allTokenText = tokenEvents.map((e) => (e.data as { value: string }).value).join('');
  expect(allTokenText, 'tokens must not contain STRICT RULES from system prompt').not.toContain(
    'STRICT RULES',
  );
  expect(allTokenText, 'stub tokens must contain Joshua R. Brandt (deterministic)').toContain(
    'Joshua R. Brandt',
  );

  // Must end with done
  expect(doneEvents.length, 'grounded path must end with done event').toBeGreaterThanOrEqual(1);
});

// ---------------------------------------------------------------------------
// SSE event sequence structure (both paths must emit well-formed SSE)
// ---------------------------------------------------------------------------

test('SSE events are well-formed with event name and JSON data fields', async ({ baseURL }) => {
  const events = await postGuide(baseURL!, {
    query: 'zzz_xyzzy_notincorpus',
  });

  // Every parsed event must have string event name and parseable data
  expect(events.length).toBeGreaterThan(0);
  for (const e of events) {
    expect(typeof e.event).toBe('string');
    expect(e.event.length).toBeGreaterThan(0);
    // data must be an object with a 'type' field matching event name
    const data = e.data as { type: string };
    expect(data.type).toBe(e.event);
  }
});

// ---------------------------------------------------------------------------
// Validation — 400 on empty/invalid query (through the proxy)
// ---------------------------------------------------------------------------

test('returns 400 for empty query through the proxy', async ({ baseURL }) => {
  const res = await fetch(`${baseURL}/api/guide`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: '' }),
  });
  expect(res.status).toBe(400);
  const body = (await res.json()) as { error: { code: string } };
  expect(body.error.code).toBe('VALIDATION_ERROR');
});

test('returns 400 for missing query field through the proxy', async ({ baseURL }) => {
  const res = await fetch(`${baseURL}/api/guide`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  expect(res.status).toBe(400);
});
