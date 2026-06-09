import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/**
 * Regression guard for the Rule-12 mechanical guard (Story 6.0).
 *
 * Story 6.0 enabled `react-hooks/exhaustive-deps` + `react-hooks/rules-of-hooks`
 * as hard ERRORS, scoped to the React `.tsx` islands (`web/src/islands/**`), so
 * the Epic-5 stale-closure bug class (5.2 `currentDepth`, 5.4 `motionAllowed`)
 * is caught at lint time rather than in production. This test binds the REAL
 * resolved ESLint config (via `eslint --print-config`, the same surface AC1
 * verifies) and reds if a future change silently:
 *   - removes either react-hooks rule from the islands,
 *   - downgrades either rule below `error` (severity 2) — e.g. to `warn`, or
 *   - widens the glob so the rule leaks onto non-island surfaces.
 *
 * It is NOT a vacuous test: it exercises the actual config ESLint computes for
 * a specific file, scoped to the two specific rule values (skill-rules Rule 8).
 * Mutation-verified: dropping/downgrading either rule, or widening the glob,
 * reds the matching assertion.
 *
 * The config lives at the REPO ROOT (`eslint.config.js`); this test resolves
 * the root from the web package dir and runs ESLint with cwd at the root, the
 * same way `pnpm run lint` (root `eslint .`) does.
 */

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(webRoot, '..');

// Resolve the real ESLint CLI bin regardless of where pnpm hoisted it
// (workspace deps live in the root store, not web/node_modules).
const require = createRequire(import.meta.url);
const eslintPkgJson = require.resolve('eslint/package.json');
const eslintBin = join(dirname(eslintPkgJson), 'bin', 'eslint.js');

// ESLint normalizes a rule's resolved severity to a numeric leading element:
// 0 = off, 1 = warn, 2 = error. The flat-config `'error'` string resolves to 2.
const ERROR = 2;
const REACT_HOOKS_RULES = ['react-hooks/exhaustive-deps', 'react-hooks/rules-of-hooks'] as const;

/** Run `eslint --print-config <file>` (cwd = repo root) and return its `rules` map. */
function printConfigRules(repoRelativeFile: string): Record<string, unknown[]> {
  const out = execFileSync('node', [eslintBin, '--print-config', repoRelativeFile], {
    cwd: repoRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const cfg = JSON.parse(out.toString('utf8')) as { rules?: Record<string, unknown[]> };
  return cfg.rules ?? {};
}

/** Resolved numeric severity for a rule, or undefined if the rule is absent. */
function severityOf(rules: Record<string, unknown[]>, ruleName: string): number | undefined {
  const entry = rules[ruleName];
  return Array.isArray(entry) ? (entry[0] as number) : undefined;
}

describe('Rule-12 mechanical guard: react-hooks ESLint config (Story 6.0)', () => {
  // The four islands present at Story 6.0; the glob `web/src/islands/**/*.{ts,tsx}`
  // automatically covers any island Epic 6 adds, so a representative file is the
  // load-bearing assertion. We also pin every existing island to catch a
  // regression that narrows the glob to exclude one.
  const islandFiles = [
    'web/src/islands/GuidePanel.tsx',
    'web/src/islands/GuidePill.tsx',
    'web/src/islands/InviteForm.tsx',
    'web/src/islands/WebGLSetpiece.tsx',
  ];

  for (const file of islandFiles) {
    it(`enforces both react-hooks rules as ERROR for the island ${file}`, () => {
      const rules = printConfigRules(file);
      for (const rule of REACT_HOOKS_RULES) {
        expect(
          severityOf(rules, rule),
          `${rule} must resolve to error (severity ${ERROR}) for ${file}`,
        ).toBe(ERROR);
      }
    });
  }

  // Scope guard: the rules must NOT leak onto non-island surfaces (.astro, the
  // Node/api service, scripts, the eslint config itself). A widened glob that
  // turns these on would be noise/false-positives — and a different bug.
  const nonIslandFiles = [
    'web/src/components/hero/HeroStatic.astro',
    'api/src/env.realmodule.test.ts',
    'eslint.config.js',
  ];

  for (const file of nonIslandFiles) {
    it(`does NOT enable react-hooks rules for non-island ${file}`, () => {
      const rules = printConfigRules(file);
      for (const rule of REACT_HOOKS_RULES) {
        expect(
          severityOf(rules, rule),
          `${rule} must be absent (not enabled) for non-island ${file}`,
        ).toBeUndefined();
      }
    });
  }
});
