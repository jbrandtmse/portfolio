/**
 * guide.config.test.ts — regression test locking the validated Guide config
 * (Story 7.0, AC2 / Rule 8).
 *
 * Asserts the REAL exported constants — not inline copies — so that a silent
 * revert of either value is caught by the canonical gate:
 *
 *   LLM_CEILING_MS    === 15_000  (matches NFR-4 "hard ceiling ~15s" after
 *                                  Story 7.0 spec reconciliation)
 *   GUIDE_LLM_MODEL   === 'claude-haiku-4-5-20251001'  (fast-streaming default;
 *                                  prevents silent revert to a slow/reasoning-
 *                                  class model that would re-trip the fallback)
 *
 * Rule 8 compliance:
 *   - LLM_CEILING_MS bound via direct named import of the REAL exported const
 *     from guide.ts (breaking the import → test reds immediately).
 *   - GUIDE_LLM_MODEL default bound via child-process execution of the REAL
 *     env.ts module (same pattern as env.realmodule.test.ts; bypasses the
 *     module-load process.exit so DATABASE_URL can be supplied inline).
 *
 * Mutation-verified: flip LLM_CEILING_MS to 10_000 in guide.ts → first test
 * reds; flip the GUIDE_LLM_MODEL default in env.ts → second test reds. Both
 * have been confirmed in development.
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { LLM_CEILING_MS } from './guide.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_TS = path.resolve(__dirname, '..', 'env.ts');

/**
 * Run the REAL env.ts in a child process and print a field value.
 * Mirrors the helper in env.realmodule.test.ts.
 */
function runEnv(
  envOverrides: Record<string, string | undefined>,
  printExpr: string,
): { status: number; stdout: string } {
  const childEnv: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (typeof v === 'string') childEnv[k] = v;
  }
  for (const [k, v] of Object.entries(envOverrides)) {
    if (v === undefined) delete childEnv[k];
    else childEnv[k] = v;
  }

  const code = `import('${ENV_TS.replace(/\\/g, '\\\\')}').then((m) => { console.log(${printExpr}); });`;

  try {
    const stdout = execFileSync('npx', ['tsx', '-e', code], {
      env: childEnv,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { status: 0, stdout };
  } catch (err) {
    const e = err as { status?: number; stdout?: Buffer | string };
    return {
      status: typeof e.status === 'number' ? e.status : 1,
      stdout: e.stdout ? String(e.stdout) : '',
    };
  }
}

describe('Guide config regression — real exported constants (Story 7.0 AC2)', () => {
  it('LLM_CEILING_MS equals 15_000 (NFR-4 hard ceiling ~15s)', () => {
    // Direct import of the REAL exported const from guide.ts.
    // Mutation check: change to 10_000 in guide.ts → this assertion reds.
    expect(LLM_CEILING_MS).toBe(15_000);
  });

  it('default GUIDE_LLM_MODEL is claude-haiku-4-5-20251001 (fast-streaming; prevents fallback regression)', () => {
    // Read the REAL default from the parsed env schema in env.ts via child process.
    // Mutation check: change the default in env.ts → this assertion reds.
    const { status, stdout } = runEnv(
      {
        DATABASE_URL: 'postgres://x/y',
        // Explicitly UNSET GUIDE_LLM_MODEL so we exercise the schema default.
        GUIDE_LLM_MODEL: undefined,
      },
      'm.env.GUIDE_LLM_MODEL',
    );
    expect(status).toBe(0);
    expect(stdout.trim()).toBe('claude-haiku-4-5-20251001');
  });
}, 60_000);
