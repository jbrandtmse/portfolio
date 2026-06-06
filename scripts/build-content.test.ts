import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { CONTENT_GENERATORS, runPipeline, type Generator } from './build-content.ts';

/**
 * Unit tests for the build-time content-pipeline orchestrator (Story 1.8,
 * Task 1 / Task 5; AC1, IAC-2).
 *
 * The orchestrator is non-user-facing build infrastructure (skill-rules Rule 3
 * EXEMPT), so the real-runtime evidence for AC1/AC2 (a real `astro build` →
 * byte-identical `web/dist/`) lives in the heavier determinism check
 * (`check-deterministic.ts`, the documented CI/smoke step) and the existing
 * `web/test/build-output.test.ts`. THESE unit tests assert the orchestrator's
 * own contract cheaply (no full build): it is no-op-safe with the empty
 * registry, it logs what it runs, it runs generators in registry order, and the
 * source carries no nondeterminism / no network reads. Discoverable by the
 * default suite via the package's test glob (Rule 8).
 */

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const orchestratorSource = readFileSync(join(scriptsDir, 'build-content.ts'), 'utf8');

/**
 * The orchestrator source with comments stripped, so the "no nondeterminism /
 * no network" assertions check EXECUTABLE code only — the file's own doc
 * comments legitimately *name* the forbidden APIs (Date.now, fetch) and sources
 * (GitHub/YouTube/Suno) while documenting the guarantee, and must not trip the
 * guard. Strips block comments then line comments (good enough for our own
 * comment-free-string source; we author no `//`-in-string literals here).
 */
const orchestratorCode = orchestratorSource
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|[^:])\/\/[^\n]*/g, '$1');

describe('content-pipeline orchestrator — empty registry is a no-op-safe foundation (AC1)', () => {
  it('ships an EMPTY generator registry now (the first generators land in Story 2.1 / 4.1)', () => {
    // Story 1.8 delivers the SCAFFOLD, not the generators (Rule 1 "no consumers
    // yet"). The registry must be empty until Glass Box (2.1) / KB index (4.1).
    expect(Array.isArray(CONTENT_GENERATORS)).toBe(true);
    expect(CONTENT_GENERATORS).toHaveLength(0);
  });

  it('runs clean (resolves, no throw) with the empty registry', async () => {
    const logs: string[] = [];
    await expect(runPipeline({ log: (m) => logs.push(m) })).resolves.toBeUndefined();
  });

  it('logs what it runs so the build is observable (AC1 / IAC-1)', async () => {
    const logs: string[] = [];
    await runPipeline({ log: (m) => logs.push(m) });
    // It announces start + the (zero) generator count + completion — observable
    // in `pnpm build` output even when nothing is generated yet.
    const joined = logs.join('\n');
    expect(joined).toMatch(/content[- ]pipeline/i);
    expect(joined).toMatch(/starting/i);
    expect(joined).toMatch(/0 generator/i);
    expect(joined).toMatch(/complete/i);
  });
});

describe('content-pipeline orchestrator — runs the registry in order (extension contract)', () => {
  it('invokes injected generators in array order, each exactly once', async () => {
    const calls: string[] = [];
    const make = (name: string): Generator => ({
      name,
      run: async () => {
        calls.push(name);
      },
    });
    const logs: string[] = [];
    await runPipeline({
      generators: [make('alpha'), make('beta'), make('gamma')],
      log: (m) => logs.push(m),
    });
    expect(calls).toEqual(['alpha', 'beta', 'gamma']);
    // Each generator's name is logged (observability of a real run).
    for (const name of ['alpha', 'beta', 'gamma']) {
      expect(logs.join('\n')).toContain(name);
    }
  });

  it('surfaces a failing generator (does not silently swallow) so a broken build fails loud', async () => {
    const boom: Generator = {
      name: 'explodes',
      run: async () => {
        throw new Error('generator failure');
      },
    };
    await expect(runPipeline({ generators: [boom], log: () => {} })).rejects.toThrow(
      /generator failure/,
    );
  });
});

describe('content-pipeline orchestrator — determinism + no external reads (IAC-2 / FR-33)', () => {
  it('the orchestrator code introduces NO wall-clock nondeterminism', () => {
    // No Date.now()/Math.random()/argless `new Date()` may influence output — the
    // determinism guardrail (Story Dev Notes). A git-derived timestamp (per 1.6
    // lastmod) is the only allowed time source, and is not needed yet. Checked
    // against comment-stripped code (doc comments may name these to ban them).
    expect(orchestratorCode).not.toMatch(/Date\.now\s*\(/);
    expect(orchestratorCode).not.toMatch(/Math\.random\s*\(/);
    expect(orchestratorCode).not.toMatch(/new\s+Date\s*\(\s*\)/);
  });

  it('the orchestrator code performs NO network reads (no fetch / http client / network import)', () => {
    // FR-33 / AC1: the build reads ONLY content/ + the repo. The orchestrator
    // must contain no network primitive at all (single git source of truth).
    // Checked against comment-stripped code so the documented guarantee (which
    // names fetch/GitHub/YouTube/Suno) does not self-trip.
    expect(orchestratorCode).not.toMatch(/\bfetch\s*\(/);
    expect(orchestratorCode).not.toMatch(/\bimport\b[^;]*\bnode:https?\b/);
    expect(orchestratorCode).not.toMatch(/\b(?:axios|got|undici|node-fetch)\b/);
    expect(orchestratorCode).not.toMatch(/https?:\/\//);
  });
});
