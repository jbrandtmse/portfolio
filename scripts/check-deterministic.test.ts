import { describe, expect, it } from 'vitest';

import { diffManifests, treeHash } from './check-deterministic.ts';

/**
 * Unit tests for the determinism-check helpers (Story 1.8, Task 4 / AC2).
 *
 * The HEAVY end-to-end check (two real `pnpm build`s → byte-identical web/dist)
 * is the documented command `pnpm check-deterministic` + the lead's smoke gate —
 * intentionally NOT in the default unit suite (it would make every test run do
 * two full builds). These cheap tests cover the pure hashing/diff logic that the
 * command relies on, so a regression in the comparison itself is caught fast.
 * Discoverable by the package's test glob (Rule 8).
 */

describe('treeHash — order-independent, content-sensitive manifest hash', () => {
  it('is identical for the same (path → hash) manifest regardless of insertion order', () => {
    const a = new Map([
      ['web/dist/index.html', 'aaa'],
      ['web/dist/about/index.html', 'bbb'],
    ]);
    const b = new Map([
      ['web/dist/about/index.html', 'bbb'],
      ['web/dist/index.html', 'aaa'],
    ]);
    expect(treeHash(a)).toBe(treeHash(b));
  });

  it('changes when any file content hash changes', () => {
    const base = new Map([['web/dist/index.html', 'aaa']]);
    const changed = new Map([['web/dist/index.html', 'zzz']]);
    expect(treeHash(base)).not.toBe(treeHash(changed));
  });

  it('changes when a file is added or removed', () => {
    const one = new Map([['web/dist/index.html', 'aaa']]);
    const two = new Map([
      ['web/dist/index.html', 'aaa'],
      ['web/dist/robots.txt', 'ccc'],
    ]);
    expect(treeHash(one)).not.toBe(treeHash(two));
  });
});

describe('diffManifests — precise differences for the FAIL report', () => {
  it('returns no diffs for identical manifests (the byte-stable PASS case)', () => {
    const m = new Map([['web/dist/index.html', 'aaa']]);
    expect(diffManifests(m, new Map(m))).toEqual([]);
  });

  it('flags added, removed, and changed files distinctly', () => {
    const a = new Map([
      ['web/dist/index.html', 'aaa'],
      ['web/dist/gone.html', 'ddd'],
    ]);
    const b = new Map([
      ['web/dist/index.html', 'CHANGED'],
      ['web/dist/new.html', 'eee'],
    ]);
    const diffs = diffManifests(a, b);
    expect(diffs).toContain('~ differs: web/dist/index.html');
    expect(diffs).toContain('- only in build #1: web/dist/gone.html');
    expect(diffs).toContain('+ only in build #2: web/dist/new.html');
  });
});
