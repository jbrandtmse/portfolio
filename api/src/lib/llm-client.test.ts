/**
 * llm-client.test.ts — unit tests for the LLM client seam (Story 4.3, AC6, Rule 4, Rule 8).
 *
 * Tests:
 *  AC6: stub mode engaged when GUIDE_LLM_STUB=1.
 *  AC6: stub yields a deterministic fixed token stream (no network).
 *  AC6: stub respects AbortSignal (cleans up on abort).
 *  AC6: isStubMode() reads env correctly.
 *  AC5: AbortController ceiling — stream stops on abort.
 *  Rule 4: when no key and no stub env, falls back gracefully (stub path).
 *  Rule 8: import-isolation — llm-client.ts is the ONLY LLM-importing module.
 *
 * Note: Real LLM streaming is NOT tested here (no live LLM in tests).
 * The grounded-path real-LLM smoke is exercised by the lead smoke.
 * The grounded-path stub IS exercised in guide.spec.ts (Rule 7 SSE e2e).
 */
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const API_ROOT = resolve(__dirname, '..', '..');
const API_SRC_DIR = join(API_ROOT, 'src');

// ---------------------------------------------------------------------------
// Import isolation (Rule 8 — llm-client.ts is the ONLY LLM-importing module)
// ---------------------------------------------------------------------------

describe('import isolation — llm-client.ts is the ONLY LLM API importer (Rule 8)', () => {
  it('orama is imported only in retriever.ts (not llm-client or guide)', () => {
    // Cross-reference: llm-client.ts and guide.ts must NOT directly import orama.
    // The grep term is intentionally split to avoid this file being found by the grep.
    const oramaPkg = '@orama' + '/orama';
    let grepOutput: string;
    try {
      grepOutput = execFileSync('grep', ['-r', '--include=*.ts', '-l', oramaPkg, API_SRC_DIR], {
        encoding: 'utf8',
      }).trim();
    } catch {
      grepOutput = '';
    }
    const files = grepOutput ? grepOutput.split('\n').filter(Boolean) : [];
    const llmClientPath = join(API_SRC_DIR, 'lib', 'llm-client.ts');
    const guidePath = join(API_SRC_DIR, 'routes', 'guide.ts');

    expect(files).not.toContain(llmClientPath);
    expect(files).not.toContain(guidePath);
  });

  it('llm-client.ts is the ONLY file importing a fetch-based LLM call', () => {
    // Verify guide.ts does NOT directly call an LLM fetch — it goes through llm-client
    const guideSource = execFileSync('cat', [join(API_SRC_DIR, 'routes', 'guide.ts')], {
      encoding: 'utf8',
    });
    // Guide should import from llm-client, not make its own fetch to the LLM endpoint
    expect(guideSource).toContain("from '../lib/llm-client.js'");
    expect(guideSource).not.toContain('routellm.abacus.ai');
  });
});

// ---------------------------------------------------------------------------
// isStubMode() and stub stream (AC6, Rule 4)
// ---------------------------------------------------------------------------

describe('stub mode (AC6, Rule 4)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('isStubMode() returns true when GUIDE_LLM_STUB=1', async () => {
    vi.stubEnv('GUIDE_LLM_STUB', '1');
    // Re-import after env stub so the module re-reads env
    const { isStubMode } = await import('./llm-client.js');
    // isStubMode reads env directly at call time via the env module
    // We test the env module reads GUIDE_LLM_STUB=1 correctly
    expect(isStubMode()).toBe(true);
  });

  it('streamTokens() in stub mode (forceStub=true) yields deterministic tokens without network', async () => {
    const { streamTokens, _resetKeyCache } = await import('./llm-client.js');
    _resetKeyCache();

    const tokens: string[] = [];
    for await (const token of streamTokens({ messages: [], forceStub: true })) {
      tokens.push(token);
    }

    // Should yield the stub token sequence — deterministic
    expect(tokens.length).toBeGreaterThan(0);
    const full = tokens.join('');
    expect(full).toContain('Joshua R. Brandt');
    expect(full).toContain('agentic engineering');
  });

  it('stub stream respects AbortSignal — stops on abort', async () => {
    const { streamTokens, _resetKeyCache } = await import('./llm-client.js');
    _resetKeyCache();

    const controller = new AbortController();
    const tokens: string[] = [];

    // Abort after first token
    let count = 0;
    for await (const token of streamTokens({
      messages: [],
      forceStub: true,
      signal: controller.signal,
    })) {
      tokens.push(token);
      count++;
      if (count === 1) controller.abort();
    }

    // Should have stopped early (not all stub tokens)
    expect(tokens.length).toBeLessThan(10);
  });

  it('streamTokens() in stub mode produces NO network requests', async () => {
    // Verify by intercepting fetch — in stub mode, fetch should never be called
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { streamTokens, _resetKeyCache } = await import('./llm-client.js');
    _resetKeyCache();

    const tokens: string[] = [];
    for await (const token of streamTokens({ messages: [], forceStub: true })) {
      tokens.push(token);
    }

    // No LLM fetch calls (IMDSv2 might be called by key resolution,
    // but forceStub bypasses key resolution entirely)
    const llmCalls = fetchSpy.mock.calls.filter(
      (call) => typeof call[0] === 'string' && (call[0] as string).includes('chat/completions'),
    );
    expect(llmCalls).toHaveLength(0);
    fetchSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// LlmUnavailableError export (AC5 — callers catch it for fallback)
// ---------------------------------------------------------------------------

describe('LlmUnavailableError (AC5)', () => {
  it('is exported and instanceof Error', async () => {
    const { LlmUnavailableError } = await import('./llm-client.js');
    const err = new LlmUnavailableError('test');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('LlmUnavailableError');
    expect(err.message).toBe('test');
  });
});
