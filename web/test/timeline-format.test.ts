import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { formatDotDate } from '../src/lib/timeline.ts';

/**
 * Unit tests for `formatDotDate` (Story 3.0, AC5).
 *
 * Verifies:
 *  1. Correct "Mon YYYY" label from ISO date strings.
 *  2. TZ-independence: the same input produces the same label under
 *     TZ=UTC and TZ=America/Los_Angeles (proven via child-process invocation
 *     since the module-level Intl.DateTimeFormat is created at import time and
 *     cannot be re-initialized with a different TZ in the same process).
 *  3. Passthrough behaviors: "~YYYY" approximate markers, "[FLAG]" values,
 *     and invalid-date strings.
 *
 * Discoverable by the default pnpm test suite (skill-rules Rule 8):
 *  - Named `*.test.ts` under `web/test/`, covered by `web/vitest.config.ts`
 *    include glob `test/**`.
 *
 * Real-runtime tier: pure formatting helper — unit tier is appropriate
 * (no socket / no DOM / no build artifact).
 */

// ─── Same-process assertions (formatter always uses timeZone:'UTC') ──────────

describe('formatDotDate — correct label output', () => {
  it('formats a month-level ISO string "YYYY-MM" as "Mon YYYY"', () => {
    expect(formatDotDate('2026-06')).toBe('Jun 2026');
  });

  it('formats a full date ISO string "YYYY-MM-DD" as "Mon YYYY"', () => {
    // Day part is ignored in the short label; month/year must be from the UTC calendar value.
    expect(formatDotDate('2026-06-06')).toBe('Jun 2026');
  });

  it('formats a date at UTC midnight that would be May in west-UTC TZ', () => {
    // 2026-06-01T00:00:00Z is June UTC, but would be May 31 in America/Los_Angeles.
    // With timeZone:'UTC' forced, the label must be "Jun 2026" regardless of runner TZ.
    expect(formatDotDate('2026-06-01')).toBe('Jun 2026');
  });

  it('formats a 2024 date correctly', () => {
    expect(formatDotDate('2024-01')).toBe('Jan 2024');
  });

  it('formats a 2024-12 date correctly', () => {
    expect(formatDotDate('2024-12-31')).toBe('Dec 2024');
  });
});

describe('formatDotDate — passthrough behaviors', () => {
  it('passes through "~YYYY" approximate era markers verbatim', () => {
    expect(formatDotDate('~1996')).toBe('~1996');
    expect(formatDotDate('~2006')).toBe('~2006');
    expect(formatDotDate('~2016')).toBe('~2016');
  });

  it('passes through "[FLAG]" prefixed values verbatim', () => {
    // "[OPEN]" and "[ASSUMPTION]…" values appear in timeline datetime attrs.
    expect(formatDotDate('[OPEN]')).toBe('[OPEN]');
    expect(formatDotDate('[ASSUMPTION] ~2006')).toBe('[ASSUMPTION] ~2006');
  });

  it('passes through invalid date strings verbatim (no crash)', () => {
    // An unrecognizable string should return as-is, not throw.
    expect(formatDotDate('not-a-date')).toBe('not-a-date');
    expect(formatDotDate('')).toBe('');
  });
});

// ─── TZ-independence: child-process proof ────────────────────────────────────
// The module-level Intl.DateTimeFormat is instantiated at import time, so it
// cannot be re-created with a different TZ inside the same Vitest process.
// Instead, we spawn a tiny inline script under each TZ and compare outputs.

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(webRoot, '..');
const tsxBin = join(repoRoot, 'node_modules', '.bin', 'tsx');

function runFormatDotDate(iso: string, tz: string): string {
  // Inline script: import the helper and print the result.
  const script = `
    import { formatDotDate } from '${webRoot}/src/lib/timeline.ts';
    process.stdout.write(formatDotDate(${JSON.stringify(iso)}));
  `;
  return execFileSync(tsxBin, ['--eval', script], {
    env: { ...process.env, TZ: tz },
    encoding: 'utf8',
  }).trim();
}

describe('formatDotDate — TZ-independence (UTC vs America/Los_Angeles)', () => {
  // Test the critical boundary: a date that is June UTC but would be May in LA.
  // 2026-06-01T00:00:00Z = May 31 23:00 PDT (-07:00)
  it('"2026-06-01" renders "Jun 2026" in TZ=UTC', () => {
    expect(runFormatDotDate('2026-06-01', 'UTC')).toBe('Jun 2026');
  });

  it('"2026-06-01" renders "Jun 2026" in TZ=America/Los_Angeles (not "May 2026")', () => {
    expect(runFormatDotDate('2026-06-01', 'America/Los_Angeles')).toBe('Jun 2026');
  });

  it('"2026-06" renders "Jun 2026" in TZ=UTC', () => {
    expect(runFormatDotDate('2026-06', 'UTC')).toBe('Jun 2026');
  });

  it('"2026-06" renders "Jun 2026" in TZ=America/Los_Angeles', () => {
    expect(runFormatDotDate('2026-06', 'America/Los_Angeles')).toBe('Jun 2026');
  });

  it('"2026-06-06" renders "Jun 2026" in TZ=UTC', () => {
    expect(runFormatDotDate('2026-06-06', 'UTC')).toBe('Jun 2026');
  });

  it('"2026-06-06" renders "Jun 2026" in TZ=America/Los_Angeles', () => {
    expect(runFormatDotDate('2026-06-06', 'America/Los_Angeles')).toBe('Jun 2026');
  });

  it('"~1996" passthrough is identical in both TZ environments', () => {
    const utcResult = runFormatDotDate('~1996', 'UTC');
    const laResult = runFormatDotDate('~1996', 'America/Los_Angeles');
    expect(utcResult).toBe('~1996');
    expect(laResult).toBe('~1996');
  });
});
