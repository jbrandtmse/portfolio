/**
 * check-deterministic.ts — verifies the build is BYTE-STABLE (Story 1.8, AC2 /
 * IAC-2; NFR-6 deterministic regeneration).
 *
 * Builds the site twice from a clean state and compares a hash of the entire
 * `web/dist/` file tree. Same repo state → byte-identical output, confirming
 * code-as-CMS reproducibility. Exits 0 if the two builds match, 1 otherwise
 * (printing the first differing files), so CI and the lead's smoke can gate on
 * it. This is the HEAVY check (two real builds) — intentionally a documented
 * command, NOT a default unit-suite test (the orchestrator's cheap contract is
 * unit-tested in build-content.test.ts; the existing web/test/build-output.test.ts
 * also runs a real build).
 *
 * DETERMINISM NOTE: this script only OBSERVES the build (it shells out to
 * `pnpm build`, hashes files, compares). It introduces no nondeterminism of its
 * own and performs no network reads. It hashes file CONTENTS + sorted relative
 * paths, so it is independent of filesystem enumeration order.
 *
 * Usage: `pnpm check-deterministic` (from repo root) or `tsx scripts/check-deterministic.ts`.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptsDir, '..');
const distDir = join(repoRoot, 'web', 'dist');

/** Every file under `dir`, as repo-root-relative POSIX paths, sorted. */
function listFilesSorted(dir: string): string[] {
  const out: string[] = [];
  const walk = (current: string): void => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const abs = join(current, entry.name);
      if (entry.isDirectory()) walk(abs);
      else out.push(relative(repoRoot, abs).split(sep).join('/'));
    }
  };
  walk(dir);
  // Sort so the manifest is independent of filesystem enumeration order.
  return out.sort();
}

/** Per-file content hashes (path → sha256), for a precise diff on mismatch. */
function hashFiles(files: string[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const rel of files) {
    const buf = readFileSync(join(repoRoot, rel));
    map.set(rel, createHash('sha256').update(buf).digest('hex'));
  }
  return map;
}

/** A single tree hash over the sorted (path, content-hash) manifest. */
export function treeHash(perFile: Map<string, string>): string {
  const h = createHash('sha256');
  for (const rel of [...perFile.keys()].sort()) {
    h.update(rel);
    h.update('\0');
    h.update(perFile.get(rel)!);
    h.update('\n');
  }
  return h.digest('hex');
}

/** Diff two per-file hash maps → human-readable list of differences. */
export function diffManifests(a: Map<string, string>, b: Map<string, string>): string[] {
  const diffs: string[] = [];
  const allPaths = [...new Set([...a.keys(), ...b.keys()])].sort();
  for (const rel of allPaths) {
    const ha = a.get(rel);
    const hb = b.get(rel);
    if (ha === undefined) diffs.push(`+ only in build #2: ${rel}`);
    else if (hb === undefined) diffs.push(`- only in build #1: ${rel}`);
    else if (ha !== hb) diffs.push(`~ differs: ${rel}`);
  }
  return diffs;
}

/** Run `pnpm build` from a clean dist and return the per-file hash manifest. */
function cleanBuildAndHash(label: string): Map<string, string> {
  console.log(`[check-deterministic] ${label}: clean build…`);
  rmSync(distDir, { recursive: true, force: true });
  // The same path `pnpm build` exercises: the content pipeline + astro build.
  execFileSync('pnpm', ['build'], { cwd: repoRoot, stdio: 'inherit' });
  const files = listFilesSorted(distDir);
  console.log(`[check-deterministic] ${label}: ${files.length} files in web/dist`);
  return hashFiles(files);
}

function main(): void {
  const first = cleanBuildAndHash('build #1');
  const second = cleanBuildAndHash('build #2');

  const h1 = treeHash(first);
  const h2 = treeHash(second);
  console.log(`[check-deterministic] build #1 tree hash: ${h1}`);
  console.log(`[check-deterministic] build #2 tree hash: ${h2}`);

  if (h1 === h2) {
    console.log('[check-deterministic] PASS — web/dist is byte-identical across two clean builds.');
    return;
  }

  console.error('[check-deterministic] FAIL — web/dist differs between builds:');
  for (const line of diffManifests(first, second)) console.error(`  ${line}`);
  process.exitCode = 1;
}

function isMain(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  return fileURLToPath(import.meta.url) === entry;
}

if (isMain()) main();
