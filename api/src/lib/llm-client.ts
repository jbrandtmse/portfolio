/**
 * llm-client.ts — VM OpenAI-compatible streaming LLM client (Story 4.3).
 *
 * SEAM ISOLATION: This is the ONLY module in the api that talks to the LLM.
 * Any future model swap (endpoint, vendor, client library) is local to this file.
 *
 * STREAMING RELAY: OpenAI SSE → yielded tokens via an async generator.
 * Uses response.body.getReader() + TextDecoder (NOT for-await on a web
 * ReadableStream — that requires the stream to be AsyncIterable, which is
 * environment-specific). Buffer-splits on '\n\n', strips 'data: ' prefix,
 * handles '[DONE]', extracts choices[0].delta.content.
 *
 * ENV-GATE (Rule 4, NFR-5):
 *   - When no API key resolves (CI/test) OR GUIDE_LLM_STUB=1 → stub mode:
 *     yields a deterministic fixed token stream, no network.
 *   - The API key is NEVER emitted in SSE events, NEVER in web, NEVER committed.
 *   - Key resolution order: ABACUS_API_KEY env → IMDSv2 metadata service.
 *
 * ABORT / CEILING (NFR-4):
 *   - Callers pass an AbortSignal tied to a ~10s AbortController.
 *   - If the upstream fetch or stream is aborted, the generator returns cleanly.
 */
import { env } from '../env.js';

// ---------------------------------------------------------------------------
// IMDSv2 key fetch (production: key not in env → fetch from metadata service)
// ---------------------------------------------------------------------------

/** Fetch the ABACUS_API_KEY from the VM IMDSv2 metadata service (runtime only). */
async function fetchKeyFromIMDSv2(): Promise<string | null> {
  try {
    const tokenRes = await fetch('http://169.254.169.254/latest/api/token', {
      method: 'PUT',
      headers: { 'X-abacus-vm-metadata-token-ttl-seconds': '300' },
      signal: AbortSignal.timeout(3000),
    });
    if (!tokenRes.ok) return null;
    const imdsToken = await tokenRes.text();

    const dataRes = await fetch('http://169.254.169.254/latest/user-data', {
      headers: { 'X-abacus-vm-metadata-token': imdsToken.trim() },
      signal: AbortSignal.timeout(3000),
    });
    if (!dataRes.ok) return null;
    const userData = (await dataRes.json()) as { abacus_api_key?: string };
    return userData.abacus_api_key ?? null;
  } catch {
    return null;
  }
}

/** Resolve the LLM API key: env → IMDSv2 → null. Cached after first call. */
let _cachedKey: string | null | undefined = undefined; // undefined = not yet resolved

async function resolveApiKey(): Promise<string | null> {
  if (_cachedKey !== undefined) return _cachedKey;

  // 1. Direct env var
  if (env.ABACUS_API_KEY) {
    _cachedKey = env.ABACUS_API_KEY;
    return _cachedKey;
  }

  // 2. IMDSv2 metadata service (production VM)
  const imdsKey = await fetchKeyFromIMDSv2();
  _cachedKey = imdsKey;
  return _cachedKey;
}

/** Reset the cached key (for tests only). */
export function _resetKeyCache(): void {
  _cachedKey = undefined;
}

// ---------------------------------------------------------------------------
// Deterministic stub (Rule 4 / test + CI mode)
// ---------------------------------------------------------------------------

/** The fixed stub token sequence (deterministic, no network). */
const STUB_TOKENS = [
  'Based on the available documentation, ',
  'Joshua R. Brandt is an agentic engineering expert ',
  'with over 30 years of experience.',
] as const;

/**
 * True when the stub should be engaged:
 *   - GUIDE_LLM_STUB=1 in env, OR
 *   - No API key resolved AND not in a context where we should attempt the real LLM.
 * Callers can also force stub mode by passing `forceStub: true`.
 */
export function isStubMode(): boolean {
  return env.GUIDE_LLM_STUB === '1';
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface StreamTokensOptions {
  messages: LlmMessage[];
  signal?: AbortSignal;
  /** Force stub even when a key is available (for tests). */
  forceStub?: boolean;
}

// ---------------------------------------------------------------------------
// Main export — async generator that yields string tokens
// ---------------------------------------------------------------------------

/**
 * Stream tokens from the LLM (or the stub when no key / stub mode).
 *
 * Yields string tokens as they arrive. Stops on '[DONE]', abort, or error.
 * The caller is responsible for the AbortController / ceiling timer.
 *
 * @throws {LlmUnavailableError} when the endpoint is down and no graceful path
 *   is taken (callers should catch and emit the in-voice fallback).
 */
export class LlmUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LlmUnavailableError';
  }
}

export async function* streamTokens(
  options: StreamTokensOptions,
): AsyncGenerator<string, void, unknown> {
  const { messages, signal, forceStub = false } = options;

  // Engage stub when forced, or when GUIDE_LLM_STUB=1
  if (forceStub || isStubMode()) {
    yield* stubStream(signal);
    return;
  }

  // Resolve key — if none, fall back to stub (graceful: no crash in CI)
  const apiKey = await resolveApiKey();
  if (!apiKey) {
    // No key → stub mode (deterministic fallback, no network)
    yield* stubStream(signal);
    return;
  }

  yield* realStream({ messages, apiKey, signal });
}

// ---------------------------------------------------------------------------
// Stub stream (deterministic, no network)
// ---------------------------------------------------------------------------

async function* stubStream(signal?: AbortSignal): AsyncGenerator<string, void, unknown> {
  for (const token of STUB_TOKENS) {
    if (signal?.aborted) return;
    yield token;
    // Small artificial delay to simulate streaming (1ms — enough to be async)
    await new Promise<void>((resolve) => setTimeout(resolve, 1));
    if (signal?.aborted) return;
  }
}

// ---------------------------------------------------------------------------
// Real streaming relay (OpenAI SSE → tokens)
// ---------------------------------------------------------------------------

/** Parse one SSE data: line → delta content string or null. */
function parseSseLine(line: string): string | null {
  if (!line.startsWith('data: ')) return null;
  const payload = line.slice('data: '.length).trim();
  if (payload === '[DONE]') return null; // sentinel — signals end
  try {
    const parsed = JSON.parse(payload) as {
      choices?: Array<{ delta?: { content?: string } }>;
    };
    return parsed.choices?.[0]?.delta?.content ?? null;
  } catch {
    return null;
  }
}

async function* realStream(opts: {
  messages: LlmMessage[];
  apiKey: string;
  signal?: AbortSignal;
}): AsyncGenerator<string, void, unknown> {
  const { messages, apiKey, signal } = opts;

  let res: Response;
  try {
    res = await fetch(`${env.GUIDE_LLM_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: env.GUIDE_LLM_MODEL,
        messages,
        stream: true,
      }),
      signal,
    });
  } catch (err: unknown) {
    if (signal?.aborted) return;
    const msg = err instanceof Error ? err.message : String(err);
    throw new LlmUnavailableError(`[llm-client] fetch failed: ${msg}`);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new LlmUnavailableError(`[llm-client] upstream ${res.status}: ${body.slice(0, 200)}`);
  }

  if (!res.body) {
    throw new LlmUnavailableError('[llm-client] response body is null');
  }

  // Relay: getReader() + TextDecoder + buffer-split on '\n\n'
  // (Do NOT for-await a web ReadableStream — not reliably AsyncIterable in Node)
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      if (signal?.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;

      // stream:true in the TextDecoder handles partial multibyte chars
      buffer += dec.decode(value, { stream: true });

      // Split on double-newline (SSE event boundary)
      const events = buffer.split('\n\n');
      // The last element is a partial event (or empty) — keep in buffer
      buffer = events.pop() ?? '';

      for (const eventBlock of events) {
        if (signal?.aborted) break;
        // An SSE event block may have multiple lines; find data: lines
        const lines = eventBlock.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed === 'data: [DONE]') return; // stream finished
          const content = parseSseLine(trimmed);
          if (content) yield content;
        }
      }
    }
    // Flush any remaining bytes in the TextDecoder
    const tail = dec.decode(undefined, { stream: false });
    if (tail) buffer += tail;

    // Process remaining buffer content
    if (buffer.trim()) {
      for (const line of buffer.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        const content = parseSseLine(trimmed);
        if (content) yield content;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
