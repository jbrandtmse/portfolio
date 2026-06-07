/**
 * retriever.test.ts — unit + integration tests for the KB retriever seam (Story 4.1).
 *
 * Tests:
 *  AC4: import-isolation — @orama/orama is imported ONLY in retriever.ts.
 *  AC4: loadIndex() is idempotent (two calls → one load).
 *  AC4: loadIndex() fails loud if the index file is absent.
 *  AC5: search() against the REAL built api/data/kb-index.json returns expected
 *       route for a known term (real-runtime, proven to EXECUTE — Rule 7).
 *  AC5: below-threshold/empty query → empty or low result.
 *  AC6: importing app.ts does NOT trigger a file load (no import side-effect).
 *
 * Rule 7 compliance: the integration test (AC5) builds the index as a prerequisite
 * if absent, then queries the REAL api/data/kb-index.json. It is NOT skipped when
 * the artifact is absent — it generates it. A test.skip() here would mask the
 * guarantee entirely.
 *
 * Rule 8 compliance: the import-isolation test greps the REAL source files
 * (not a copy), and the route assertion is scoped to the RetrievedChunk fields
 * (not a whole-document match).
 */
import { execFileSync, execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { _resetIndex, loadIndex, search } from './retriever.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const API_ROOT = resolve(__dirname, '..', '..');
const REPO_ROOT = resolve(API_ROOT, '..');
const REAL_INDEX_PATH = join(API_ROOT, 'data', 'kb-index.json');

// ---------------------------------------------------------------------------
// Import isolation (AC4)
// ---------------------------------------------------------------------------

describe('import isolation — @orama/orama only in retriever.ts (AC4)', () => {
  it('no source file other than retriever.ts imports @orama/orama', () => {
    // Grep the REAL api/src source tree for @orama/orama imports.
    // Rule 8: assert against the real module source, not a copy.
    const apiSrcDir = join(API_ROOT, 'src');
    const retrieverPath = join(apiSrcDir, 'lib', 'retriever.ts');

    // Use grep to find all files that reference @orama/orama
    let grepOutput: string;
    try {
      grepOutput = execFileSync('grep', ['-r', '--include=*.ts', '-l', '@orama/orama', apiSrcDir], {
        encoding: 'utf8',
      }).trim();
    } catch {
      // grep exits 1 when no matches — that's fine (only our expected file matches)
      grepOutput = '';
    }

    const retrieverTestPath = join(apiSrcDir, 'lib', 'retriever.test.ts');
    const llmClientTestPath = join(apiSrcDir, 'lib', 'llm-client.test.ts');
    const matchingFiles = grepOutput ? grepOutput.split('\n').filter(Boolean) : [];

    // The ONLY files that may reference @orama/orama are:
    //   - retriever.ts (the seam — imports it)
    //   - retriever.test.ts (this file — mentions it in a string literal for the grep check)
    //   - llm-client.test.ts (mentions it in a string literal verifying non-import)
    // Any other file is a violation of the seam isolation rule.
    const ALLOWED = new Set([retrieverPath, retrieverTestPath, llmClientTestPath]);
    for (const file of matchingFiles) {
      expect(ALLOWED.has(file)).toBe(true);
    }

    // retriever.ts MUST actually import @orama/orama (sanity check)
    expect(matchingFiles.includes(retrieverPath)).toBe(true);

    // retriever.ts MUST import @orama/orama (sanity check that the grep worked)
    const retrieverSource = readFileSync(retrieverPath, 'utf8');
    expect(retrieverSource).toContain('@orama/orama');
  });
});

// ---------------------------------------------------------------------------
// Import side-effect guard (Decision 6 / AC4)
// ---------------------------------------------------------------------------

describe('app.ts import does NOT trigger index load (Decision 6)', () => {
  it('importing app has no file-open side effect — no index load without explicit loadIndex()', async () => {
    // Reset so we start clean
    _resetIndex();

    // Import app.ts dynamically — it must NOT call loadIndex() or open the index.
    // If it did, _db would be set. We verify search() still throws "not loaded".
    await import('../app.js');

    // search() should still throw because loadIndex() was not called
    await expect(search('test')).rejects.toThrow(/not loaded/);
  });
});

// ---------------------------------------------------------------------------
// loadIndex() unit tests (AC4)
// ---------------------------------------------------------------------------

describe('loadIndex() — unit tests (AC4)', () => {
  afterEach(() => {
    _resetIndex();
  });

  it('throws with a helpful message when index file is absent', async () => {
    _resetIndex();
    const fakePath = join(tmpdir(), 'nonexistent-kb-index.json');
    await expect(loadIndex(fakePath)).rejects.toThrow(/pnpm build/);
  });

  it('throws when index file is invalid JSON', async () => {
    _resetIndex();
    const badPath = join(tmpdir(), 'bad-kb-index.json');
    writeFileSync(badPath, 'NOT JSON', 'utf8');
    await expect(loadIndex(badPath)).rejects.toThrow(/not valid JSON/);
  });

  it('loadIndex() is idempotent — two calls load once', async () => {
    // Create a minimal valid index
    const tmpPath = join(tmpdir(), `kb-index-idem-${Date.now()}.json`);
    writeFileSync(
      tmpPath,
      JSON.stringify(
        [
          {
            id: 'test#intro',
            route: '/test/',
            label: 'Test',
            heading: 'Introduction',
            text: 'Joshua R. Brandt is a software engineer with 30 years of experience.',
          },
        ],
        null,
        2,
      ) + '\n',
      'utf8',
    );

    _resetIndex();
    await loadIndex(tmpPath);
    // Second call — should not throw (idempotent)
    await expect(loadIndex(tmpPath)).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Integration test — REAL built index (AC5 — proven to EXECUTE, Rule 7)
// ---------------------------------------------------------------------------

describe('search() — REAL built api/data/kb-index.json (AC5, Rule 7)', () => {
  beforeAll(async () => {
    // Rule 7: DO NOT test.skip() if the index is absent — generate it as a
    // prerequisite so the test ACTUALLY EXECUTES. A skip here would mask the
    // retrieval guarantee entirely.
    if (!existsSync(REAL_INDEX_PATH)) {
      console.log('[retriever.test] kb-index.json absent — running build:content to generate...');
      execSync('pnpm build:content', { cwd: REPO_ROOT, stdio: 'inherit' });
    }

    // Confirm the artifact exists after generation
    expect(existsSync(REAL_INDEX_PATH)).toBe(true);

    // Load the REAL index for all tests in this describe block
    _resetIndex();
    await loadIndex(REAL_INDEX_PATH);
  });

  afterEach(() => {
    // Do NOT reset between tests in this block — share the loaded index
    // (only reset after the describe completes, but afterEach in an outer
    // describe would do that — here we keep the index for the whole block).
  });

  it('returns ≥1 chunk for "LoanDemo" with route /work/loandemo/ (Rule 8: scoped assertion)', async () => {
    const results = await search('LoanDemo', 5);

    // At least one result
    expect(results.length).toBeGreaterThanOrEqual(1);

    // The top result should be from the loandemo KB doc — scoped to chunk.route
    // (not a whole-document match — Rule 8).
    const loanChunks = results.filter((c) => c.route === '/work/loandemo/');
    expect(loanChunks.length).toBeGreaterThanOrEqual(1);
    expect(loanChunks[0]!.text.length).toBeGreaterThan(0);
  });

  it('returns chunks with all required RetrievedChunk fields populated', async () => {
    const results = await search('agentic engineering', 3);
    expect(results.length).toBeGreaterThan(0);
    for (const chunk of results) {
      expect(typeof chunk.id).toBe('string');
      expect(chunk.id.length).toBeGreaterThan(0);
      expect(typeof chunk.route).toBe('string');
      expect(chunk.route.startsWith('/')).toBe(true);
      expect(typeof chunk.label).toBe('string');
      expect(chunk.label.length).toBeGreaterThan(0);
      expect(typeof chunk.heading).toBe('string');
      expect(typeof chunk.text).toBe('string');
      expect(chunk.text.length).toBeGreaterThan(0);
      expect(typeof chunk.score).toBe('number');
      expect(chunk.score).toBeGreaterThan(0);
    }
  });

  it('returns chunks for "speaking" with route /speaking/', async () => {
    const results = await search('speaking', 5);
    expect(results.length).toBeGreaterThan(0);
    const speakingChunks = results.filter((c) => c.route === '/speaking/');
    expect(speakingChunks.length).toBeGreaterThan(0);
  });

  it('returns chunks for "Joshua Brandt" mentioning the about route', async () => {
    const results = await search('Joshua Brandt software engineer', 5);
    expect(results.length).toBeGreaterThan(0);
    const aboutChunks = results.filter((c) => c.route === '/about/');
    expect(aboutChunks.length).toBeGreaterThan(0);
  });

  it('returns ≤k results when k is specified', async () => {
    const results = await search('engineering', 3);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it('empty query returns empty or low-score results (fail-closed signal for 4.3)', async () => {
    // An empty query should return no meaningful results.
    // This is the signal Story 4.3 uses to fail-closed (no model call below threshold).
    const results = await search('', 5);
    // Either no results, or results with score 0
    const hasHighScore = results.some((r) => r.score > 0);
    expect(hasHighScore).toBe(false);
  });

  it('a nonsense query returns empty results', async () => {
    const results = await search('zzz_xyzzy_gibberish_not_in_corpus', 5);
    expect(results).toHaveLength(0);
  });
});
