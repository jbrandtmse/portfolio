/**
 * Real-module tests for api/src/env.ts (Story 3.3, AC4) — QA gap-fill.
 *
 * The companion env.test.ts validates the SCHEMA LOGIC against an inline copy
 * of the schema (to avoid the module-load process.exit). That is necessary but
 * NOT sufficient: if the REAL env.ts ever drifted from that inline copy, every
 * env.test.ts assertion would still pass (vacuous w.r.t. the real module).
 *
 * These tests exercise the REAL env.ts module in a child process so we can
 * observe its actual fail-fast (process.exit(1)) and its actual parse/transform
 * — closing that gap. The module is run via `tsx` (a devDep) so no build step
 * is required; this mirrors how `tsx watch src/index.ts` runs it in dev.
 *
 * No DB / no network — env.ts only reads process.env.
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_TS = path.resolve(__dirname, 'env.ts');

/**
 * Run the REAL env.ts in a child process with a controlled environment.
 * Returns { status, stdout, stderr }. We import env.ts and optionally print a
 * value so the parent can assert on the actually-parsed result.
 */
function runEnv(
  envOverrides: Record<string, string | undefined>,
  printExpr = '',
): { status: number; stdout: string; stderr: string } {
  // Start from the current env, then apply overrides (undefined ⇒ delete).
  const childEnv: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (typeof v === 'string') childEnv[k] = v;
  }
  for (const [k, v] of Object.entries(envOverrides)) {
    if (v === undefined) delete childEnv[k];
    else childEnv[k] = v;
  }

  const code = printExpr
    ? `import('${ENV_TS.replace(/\\/g, '\\\\')}').then((m) => { console.log(${printExpr}); });`
    : `import('${ENV_TS.replace(/\\/g, '\\\\')}');`;

  try {
    const stdout = execFileSync('npx', ['tsx', '-e', code], {
      env: childEnv,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { status: 0, stdout, stderr: '' };
  } catch (err) {
    const e = err as { status?: number; stdout?: Buffer | string; stderr?: Buffer | string };
    return {
      status: typeof e.status === 'number' ? e.status : 1,
      stdout: e.stdout ? String(e.stdout) : '',
      stderr: e.stderr ? String(e.stderr) : '',
    };
  }
}

describe('env.ts (REAL module) — fail-fast at load', () => {
  it('exits non-zero when DATABASE_URL is unset (process.exit(1))', () => {
    const { status, stderr } = runEnv({ DATABASE_URL: undefined });
    expect(status).not.toBe(0);
    // It logs a fatal banner (non-PII) before exiting.
    expect(stderr).toContain('invalid environment configuration');
  });

  it('exits non-zero when API_PORT is not a positive integer', () => {
    const { status } = runEnv({ DATABASE_URL: 'postgres://x/y', API_PORT: '-5' });
    expect(status).not.toBe(0);
  });

  it('exits non-zero when API_PORT is non-numeric', () => {
    const { status } = runEnv({ DATABASE_URL: 'postgres://x/y', API_PORT: 'abc' });
    expect(status).not.toBe(0);
  });
}, 60_000);

describe('env.ts (REAL module) — successful parse/transform', () => {
  it('parses + transforms API_PORT to a number when valid (default branch covered separately)', () => {
    const { status, stdout } = runEnv(
      { DATABASE_URL: 'postgres://x/y', API_PORT: '1234' },
      "'API_PORT=' + m.env.API_PORT + ' typeof=' + typeof m.env.API_PORT",
    );
    expect(status).toBe(0);
    // The REAL module returns API_PORT as a NUMBER (refine+transform), not a string.
    expect(stdout).toContain('API_PORT=1234');
    expect(stdout).toContain('typeof=number');
  });

  it('defaults API_PORT to 8787 when unset (default is centralized in the REAL module)', () => {
    const { status, stdout } = runEnv(
      { DATABASE_URL: 'postgres://x/y', API_PORT: undefined },
      "'API_PORT=' + m.env.API_PORT",
    );
    expect(status).toBe(0);
    // Resolves deferred [1.1]: the ONE canonical default lives in env.ts.
    expect(stdout).toContain('API_PORT=8787');
  });

  it('starts (exit 0) with RESEND_API_KEY unset — the Rule-4 env-gate default', () => {
    const { status, stdout } = runEnv(
      { DATABASE_URL: 'postgres://x/y', RESEND_API_KEY: undefined },
      "'RESEND=' + String(m.env.RESEND_API_KEY)",
    );
    expect(status).toBe(0);
    // Unset ⇒ undefined (email path will be 'skipped').
    expect(stdout).toContain('RESEND=undefined');
  });
}, 60_000);
