import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/**
 * Pipeline-wide guards for the build-time content pipeline (Story 1.8, QA stage;
 * AC1 / AC2 / IAC-1 / IAC-2, FR-33 / NFR-6).
 *
 * The dev's build-content.test.ts already proves the orchestrator's runtime
 * contract (no-op-safe, runs the registry in order, fails loud) and source-guards
 * `build-content.ts` itself for nondeterminism / network. These QA tests widen
 * that net to the things the orchestrator's own unit test cannot see, and that
 * are most likely to regress as the FIRST generators land in Story 2.1 / 4.1:
 *
 *  1. The "no wall-clock / no network" determinism guarantee must hold for the
 *     WHOLE pipeline directory (every non-test `scripts/*.ts`), not just the
 *     orchestrator — a generator added in 2.1/4.1 lands here, and a determinism
 *     regression in it (or drift in check-deterministic.ts) would otherwise be
 *     invisible. (IAC-2 / FR-33 govern the pipeline, not one file.)
 *  2. `content/README.md` actually documents the code-as-CMS doctrine (Task 2 /
 *     FR-33): no CMS, single source of truth, no runtime external reads,
 *     deterministic regeneration.
 *  3. Root `package.json`'s `build` wiring runs the content pipeline BEFORE the
 *     web build (IAC-1) — a static regression guard for the wiring the lead's
 *     smoke + `pnpm check-deterministic` exercise at runtime.
 *
 * These are cheap static/source assertions — no full build. The heavy real-build
 * byte-stability proof remains `pnpm check-deterministic` + the lead's smoke.
 * Discoverable by the package's test glob (skill-rules Rule 8).
 */

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptsDir, '..');

/**
 * Strip block then line comments so the "forbidden API" assertions check
 * EXECUTABLE code only — the pipeline files' doc comments legitimately NAME the
 * banned APIs (Date.now, fetch) and sources (GitHub/YouTube/Suno) while
 * documenting the guarantee, and must not self-trip. Mirrors the dev's
 * build-content.test.ts stripping (good enough for our comment-free-string
 * sources; we author no `//`-in-string literals in scripts/).
 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

/**
 * Every pipeline SOURCE file: non-test `scripts/*.ts`, excluding the Vitest
 * config (tooling, not part of the build that produces web/dist). This is the
 * set the determinism / no-network guarantee must cover — including any
 * generator file a future story drops in.
 */
function pipelineSourceFiles(): string[] {
  return readdirSync(scriptsDir)
    .filter(
      (name) => name.endsWith('.ts') && !name.endsWith('.test.ts') && name !== 'vitest.config.ts',
    )
    .sort();
}

describe('content pipeline — determinism guarantee holds for the whole scripts/ directory (IAC-2 / FR-33)', () => {
  const files = pipelineSourceFiles();

  it('includes at least the orchestrator + determinism check (sanity: the sweep sees real files)', () => {
    // Guards against the sweep silently matching nothing (e.g. a glob typo),
    // which would make the assertions below vacuously pass.
    expect(files).toContain('build-content.ts');
    expect(files).toContain('check-deterministic.ts');
  });

  it.each(pipelineSourceFiles())(
    'scripts/%s introduces no wall-clock nondeterminism (no Date.now / Math.random / argless new Date)',
    (fileName) => {
      const code = stripComments(readFileSync(join(scriptsDir, fileName), 'utf8'));
      expect(code, `${fileName} must not use Date.now()`).not.toMatch(/Date\.now\s*\(/);
      expect(code, `${fileName} must not use Math.random()`).not.toMatch(/Math\.random\s*\(/);
      expect(code, `${fileName} must not use argless new Date()`).not.toMatch(
        /new\s+Date\s*\(\s*\)/,
      );
    },
  );

  it.each(pipelineSourceFiles())(
    'scripts/%s performs no network reads (no fetch / http client / network import / URL)',
    (fileName) => {
      const code = stripComments(readFileSync(join(scriptsDir, fileName), 'utf8'));
      expect(code, `${fileName} must not call fetch()`).not.toMatch(/\bfetch\s*\(/);
      expect(code, `${fileName} must not import node:http(s)`).not.toMatch(
        /\bimport\b[^;]*\bnode:https?\b/,
      );
      expect(code, `${fileName} must not use an http client lib`).not.toMatch(
        /\b(?:axios|got|undici|node-fetch)\b/,
      );
      expect(code, `${fileName} must not embed an http(s) URL`).not.toMatch(/https?:\/\//);
    },
  );
});

describe('content/ — README documents the code-as-CMS doctrine (Task 2 / FR-33)', () => {
  const readme = readFileSync(join(repoRoot, 'content', 'README.md'), 'utf8');

  it('asserts the no-CMS / single-source-of-truth / no-runtime-external-reads / deterministic doctrine', () => {
    expect(readme.toLowerCase()).toContain('code-as-cms');
    expect(readme.toLowerCase()).toContain('source of truth');
    expect(readme.toLowerCase()).toMatch(/no cms/);
    expect(readme.toLowerCase()).toMatch(/no.*runtime external reads|no runtime external reads/);
    expect(readme.toLowerCase()).toContain('deterministic');
  });
});

describe('root build wiring — `pnpm build` runs the content pipeline before the web build (IAC-1)', () => {
  const rootPkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };

  it('root `build` invokes the content pipeline, then the web build, in that order', () => {
    const build = rootPkg.scripts?.build ?? '';
    expect(build).toContain('build-content.ts');
    expect(build).toMatch(/web build|--filter web/);
    // Pipeline must come first so generated content exists before astro renders.
    const pipelineIdx = build.indexOf('build-content.ts');
    const webIdx = build.search(/web build|--filter web/);
    expect(pipelineIdx).toBeGreaterThanOrEqual(0);
    expect(webIdx).toBeGreaterThan(pipelineIdx);
  });
});
