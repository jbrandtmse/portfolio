/**
 * render-timeline.ts — Master Timeline render pipeline generator (Story 2.4).
 *
 * Reads the HAND-CURATED manifest `content/timeline/dots.ts` (the repo-root
 * source of truth, FR-33/FR-34) and emits it as structured JSON to a
 * deterministic, gitignored location (`web/src/generated/timeline.json`)
 * importable by Astro at build time.
 *
 * This parallels `scripts/render-glassbox.ts`: the page never imports the
 * repo-root `content/` source directly (Vite/Astro cannot import across the
 * `web/` package boundary) — it reads the generated JSON via the
 * `web/src/lib/timeline.ts` loader, exactly as the Glass Box page reads
 * `glassbox.json` via `web/src/lib/glassbox.ts`. Keeping `content/` as the
 * single source of truth is what lets Story 2.6 (Project Import) grow the site
 * by editing `content/timeline/dots.ts`.
 *
 * HARD CONSTRAINTS (Story 1.8 / FR-33 / NFR-6):
 *  - NO network IO. No fetch, no HTTP, no GitHub/YouTube/Suno reads.
 *  - NO automated harvest. Stage 1 is HAND-CURATED ONLY (AC1) — this generator
 *    does NOT read the filesystem/git for timeline entries; it serializes the
 *    static manifest. The deterministic git→Dot auto-harvest is Stage 2 (Epic 6).
 *  - DETERMINISTIC: no Date.now() / Math.random() / argless new Date(). The
 *    manifest is static data, so the same source → byte-identical output.
 *
 * BUILD ORDERING: `pnpm build` runs this pipeline BEFORE `astro build`, so the
 * generated `timeline.json` exists when Astro renders `/timeline`. A bare
 * `astro build` (the web build-output test path) does NOT run this generator,
 * so the page must tolerate the absent file — the loader degrades to `[]`
 * gracefully (same discipline as Glass Box; the timeline.test.ts beforeAll runs
 * the generator first).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { TIMELINE_ERAS } from '../content/timeline/dots.ts';
import type { EraBand } from '../content/timeline/dots.ts';
import type { Generator } from './build-content.ts';

/**
 * Discover the repo root from the script's own location.
 * The repo root is always one level up from `scripts/`.
 */
export function getRepoRoot(): string {
  const scriptsDir = dirname(fileURLToPath(import.meta.url));
  return resolve(scriptsDir, '..');
}

/**
 * Pure render function — returns the curated era-bands as a plain, serializable
 * array. The manifest is already static, hand-curated data; this performs NO
 * harvest, NO IO, NO mutation. Testable without running the Generator.
 *
 * @param eras  The curated era-bands (default: TIMELINE_ERAS).
 */
export function renderTimeline(eras: readonly EraBand[] = TIMELINE_ERAS): EraBand[] {
  // Defensive copy via JSON round-trip — guarantees the emitted output is a
  // plain serializable structure (no functions, no getters, no shared refs)
  // and is deterministic for the static manifest.
  return JSON.parse(JSON.stringify(eras)) as EraBand[];
}

/**
 * The Generator registered into CONTENT_GENERATORS (Story 1.8 extension point).
 * Writes the rendered timeline manifest to `web/src/generated/timeline.json`.
 */
export const renderTimelineGenerator: Generator = {
  name: 'render-timeline',
  async run(): Promise<void> {
    const repoRoot = getRepoRoot();
    const outputPath = join(repoRoot, 'web', 'src', 'generated', 'timeline.json');

    // Ensure the generated directory exists.
    mkdirSync(dirname(outputPath), { recursive: true });

    const eras = renderTimeline();

    // Write deterministic JSON (static manifest → byte-identical output).
    writeFileSync(outputPath, JSON.stringify(eras, null, 2) + '\n', 'utf8');

    console.log(
      `[render-timeline] wrote ${eras.length} era-band(s) to web/src/generated/timeline.json`,
    );
  },
};
