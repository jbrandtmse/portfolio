/**
 * lastmod.ts — DETERMINISTIC `<lastmod>` dates for sitemap.xml (Story 1.6, Task
 * 3 / AC3; NFR-6 determinism, verified by Story 1.8).
 *
 * The lastmod for a route is the ISO-8601 commit date of the route's source
 * file (`git log -1 --format=%cI -- <file>`). For a fixed git state this is
 * byte-stable across builds — unlike `new Date()`/build-time-now, which would
 * make every build differ. If git is unavailable (no repo, no git binary) or
 * the file has no commit yet, we fall back to a fixed build constant so the
 * output stays deterministic and the sitemap still validates.
 *
 * This runs at BUILD TIME in Node (the sitemap is a prerendered static
 * endpoint). It is never shipped to the browser.
 */
import { execFileSync } from 'node:child_process';

/**
 * Fixed fallback lastmod (ISO-8601) used when git cannot supply a commit date.
 * A constant — never `new Date()` — so a git-less build is still byte-stable.
 */
export const FALLBACK_LASTMOD = '2026-06-06T00:00:00+00:00';

/** ISO-8601 committer-date pattern (what `git --format=%cI` emits). */
const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/;

/**
 * Return the deterministic lastmod for one source file.
 *
 * @param sourceFile  Path relative to the repo root (the git work-tree root).
 * @param repoRoot    Absolute path to the repo/work-tree root (the cwd git runs in).
 * @returns ISO-8601 commit date, or {@link FALLBACK_LASTMOD} on any failure.
 */
export function gitLastmod(sourceFile: string, repoRoot: string): string {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', sourceFile], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    // A tracked-but-uncommitted or unknown file yields empty output → fall back.
    if (ISO_8601.test(out)) return out;
    return FALLBACK_LASTMOD;
  } catch {
    // git missing, not a repo, or any other failure → deterministic fallback.
    return FALLBACK_LASTMOD;
  }
}
