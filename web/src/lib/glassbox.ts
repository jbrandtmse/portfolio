/**
 * glassbox.ts — Build-time loader for the Glass Box render data (Story 2.2, Task 1).
 *
 * Reads `web/src/generated/glassbox.json` (written by the Story 2.1 render
 * pipeline: scripts/render-glassbox.ts → pnpm build) and returns a typed
 * `GlassboxArtifact[]` for use in the dynamic reader route
 * (`web/src/pages/glass-box/[artifact].astro`).
 *
 * GRACEFUL ABSENT-DATA (AC6): if the JSON file does not yet exist (e.g. a bare
 * `astro build` without the pipeline, or a clean CI checkout), this function
 * returns `[]` — never throws. The dynamic route's `getStaticPaths()` returns
 * zero entries and the build succeeds with no reader pages emitted.
 *
 * BUILD-TIME ONLY: uses Node's `fs.readFileSync`. Never shipped to the browser.
 * This module is only imported in `.astro` frontmatter (server-side build code).
 *
 * PATH RESOLUTION: Uses a JSON import via Vite's `?raw` query or falls back to
 * `fs.readFileSync` with `process.cwd()` (= `web/` during astro build). We avoid
 * `import.meta.url`-based `fileURLToPath` because during Vite bundling the URL
 * points to the bundle chunk rather than the source location.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';

/**
 * The structured reader data for a single Glass Box artifact.
 * Mirrors the `GlassboxArtifact` interface from scripts/render-glassbox.ts —
 * declared here to avoid a web → scripts import coupling at build time.
 */
export interface GlassboxArtifact {
  /** URL slug (unique). Forms the `/glass-box/{slug}/` reader URL. */
  slug: string;
  /** Artifact type label (e.g. "prd", "brief", "brainstorm", "ux"). */
  type: string;
  /** Display title — the single `<h1>` text on the reader page. */
  title: string;
  /** ISO-8601 date of the artifact's most recent git commit. */
  date: string;
  /** One-line editorial curator note. */
  curatorNote: string;
  /** Full artifact body as a markdown string. */
  body: string;
}

/**
 * Candidate paths for the generated glassbox.json, tried in order.
 *
 * 1. `process.cwd()/src/generated/glassbox.json` — cwd is `web/` during
 *    `astro build` (Astro always invokes from the web project root).
 * 2. `process.cwd()/web/src/generated/glassbox.json` — cwd is the repo root
 *    in some test or scripting contexts.
 */
function findGeneratedJson(): string | null {
  const candidates = [
    join(process.cwd(), 'src', 'generated', 'glassbox.json'),
    join(process.cwd(), 'web', 'src', 'generated', 'glassbox.json'),
    // Resolve via cwd up one level (web/test → web, test → project)
    resolve(process.cwd(), '..', 'src', 'generated', 'glassbox.json'),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * Load all allowlisted Glass Box artifacts from the generated JSON.
 *
 * Returns `[]` if the file is absent (AC6 graceful degradation — bare
 * `astro build` without the render pipeline runs cleanly and emits zero
 * reader pages; no throw, no crash).
 */
export function loadGlassboxArtifacts(): GlassboxArtifact[] {
  const jsonPath = findGeneratedJson();
  if (!jsonPath) return [];
  try {
    const raw = readFileSync(jsonPath, 'utf8');
    return JSON.parse(raw) as GlassboxArtifact[];
  } catch {
    // Malformed JSON or read error — degrade gracefully.
    return [];
  }
}
