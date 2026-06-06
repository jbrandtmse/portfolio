/**
 * render-glassbox.ts — Glass Box render pipeline generator (Story 2.1).
 *
 * Reads each allowlisted artifact from the repo working tree and emits
 * structured reader data for the Glass Box. The output is written to a
 * deterministic, gitignored location (`web/src/generated/glassbox.json`)
 * importable by Astro at build time.
 *
 * HARD CONSTRAINTS (Story 1.8 / FR-33 / NFR-6):
 *  - NO network IO. No fetch, no HTTP, no GitHub/YouTube/Suno reads.
 *  - DETERMINISTIC: no Date.now() / Math.random() / argless new Date().
 *    Dates are derived from `git log -1 --format=%cI` (committer date).
 *    Output is sorted by date ascending then slug — same git state → byte-identical.
 *  - FAIL LOUD: throws (fails the build) if an allowlisted sourceFile is
 *    missing or unreadable — never silently skips.
 *
 * BUILD ORDERING NOTE (forward-reference to Story 2.2/2.3):
 *  `pnpm build` runs this pipeline BEFORE `astro build`, so the generated
 *  `glassbox.json` exists when Astro renders the Glass Box pages. A bare
 *  `astro build` (the web build-output test path) does NOT run this generator,
 *  so Story 2.2's pages must tolerate the absent file until they wire
 *  consumption + their own build-ordering. That is Story 2.2's responsibility,
 *  not a 2.1 defect (forward-reference, per skill-rules Rule 3).
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { GlassboxEntry } from '../content/glassbox.allowlist.ts';
import { GLASSBOX_ALLOWLIST } from '../content/glassbox.allowlist.ts';
import type { Generator } from './build-content.ts';

/** Fallback ISO-8601 date when git cannot supply a committer date. */
const FALLBACK_DATE = '2026-06-06T00:00:00+00:00';

/** ISO-8601 committer-date pattern (what `git --format=%cI` emits). */
const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/;

/**
 * Return the deterministic committer date for one source file.
 *
 * Replicates the `web/src/lib/lastmod.ts` pattern — cannot import directly
 * to avoid a web→scripts build coupling at runtime.
 *
 * @param sourceFile  Repo-root-relative path to the artifact.
 * @param repoRoot    Absolute path to the git work-tree root.
 * @returns ISO-8601 committer date, or FALLBACK_DATE on any failure.
 */
export function gitCommitterDate(sourceFile: string, repoRoot: string): string {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', sourceFile], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (ISO_8601.test(out)) return out;
    return FALLBACK_DATE;
  } catch {
    return FALLBACK_DATE;
  }
}

/**
 * Discover the repo root from the script's own location.
 * The repo root is always one level up from `scripts/`.
 */
export function getRepoRoot(): string {
  const scriptsDir = dirname(fileURLToPath(import.meta.url));
  return resolve(scriptsDir, '..');
}

/**
 * The structured reader data emitted for each allowlisted artifact.
 * Plain, serializable JSON — no functions, no Date objects.
 */
export interface GlassboxArtifact {
  /** URL slug (from the allowlist). Unique. Forms `/glass-box/{slug}`. */
  slug: string;
  /** Artifact type (from the allowlist). */
  type: string;
  /** Display title (from the allowlist). */
  title: string;
  /** ISO-8601 git committer date of the artifact's most recent commit. */
  date: string;
  /** One-line curator note (from the allowlist). */
  curatorNote: string;
  /** Full body text of the artifact (read from the repo working tree). */
  body: string;
}

/**
 * Pure render function — reads artifacts from `repoRoot` and returns the full
 * set of reader data. No IO side effects except the file reads; testable
 * without running the Generator.
 *
 * THROW-ON-MISSING: if any allowlisted sourceFile is absent or unreadable,
 * this throws and fails the build (AC4 — never silently skips).
 *
 * SORT ORDER: by `date` ascending, then `slug` (deterministic, stable).
 *
 * @param allowlist  The curated entries (default: GLASSBOX_ALLOWLIST).
 * @param repoRoot   Absolute path to the git work-tree root.
 */
export function renderGlassbox(
  allowlist: readonly GlassboxEntry[],
  repoRoot: string,
): GlassboxArtifact[] {
  const artifacts: GlassboxArtifact[] = [];

  for (const entry of allowlist) {
    const absPath = join(repoRoot, entry.sourceFile);
    let body: string;
    try {
      body = readFileSync(absPath, 'utf8');
    } catch (cause) {
      // AC4: fail loud — missing allowlisted artifact is a build error.
      throw new Error(
        `[render-glassbox] FAIL — allowlisted artifact not found or unreadable: ` +
          `"${entry.sourceFile}" (resolved: "${absPath}"). ` +
          `Remove it from GLASSBOX_ALLOWLIST or restore the file.`,
        { cause },
      );
    }

    const date = gitCommitterDate(entry.sourceFile, repoRoot);

    artifacts.push({
      slug: entry.slug,
      type: entry.type,
      title: entry.title,
      date,
      curatorNote: entry.curatorNote,
      body,
    });
  }

  // Sort deterministically: by date ascending, then slug (stable secondary key).
  artifacts.sort((a, b) => {
    const dateCmp = a.date.localeCompare(b.date);
    if (dateCmp !== 0) return dateCmp;
    return a.slug.localeCompare(b.slug);
  });

  return artifacts;
}

/**
 * The Generator registered into CONTENT_GENERATORS (Story 1.8 extension point).
 * Writes the rendered Glass Box reader data to `web/src/generated/glassbox.json`.
 */
export const renderGlassboxGenerator: Generator = {
  name: 'render-glassbox',
  async run(): Promise<void> {
    const repoRoot = getRepoRoot();
    const outputPath = join(repoRoot, 'web', 'src', 'generated', 'glassbox.json');

    // Ensure the generated directory exists.
    mkdirSync(dirname(outputPath), { recursive: true });

    const artifacts = renderGlassbox(GLASSBOX_ALLOWLIST, repoRoot);

    // Write deterministic JSON (sorted by date+slug from renderGlassbox).
    writeFileSync(outputPath, JSON.stringify(artifacts, null, 2) + '\n', 'utf8');

    console.log(
      `[render-glassbox] wrote ${artifacts.length} artifact(s) to web/src/generated/glassbox.json`,
    );
  },
};
