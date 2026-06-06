/**
 * routes.ts — the single registry of the static Mirror routes that feed
 * sitemap.xml (Story 1.6, Task 3 / AC3). One source of truth so the sitemap and
 * any future route-driven output stay in lockstep. As routes are added (Story
 * 1.7 `/browse`; Epic 2 `/glass-box/[artifact]`), extend this list.
 *
 * Each entry maps a public route path to its Astro source file (relative to the
 * repo root) — the source file is what the sitemap's deterministic `lastmod`
 * reads via `git log -1 --format=%cI` (see sitemap.xml.ts). Kept in the locked
 * order the routes appear across the site.
 */

export interface RouteEntry {
  /** Public route path (leading slash; site-root is "/"). */
  path: string;
  /** Source file relative to the REPO ROOT (for git lastmod). */
  sourceFile: string;
}

/**
 * The current Stage-1 Mirror routes (Story 1.6 enumerates exactly these nine).
 * Order matches the story's route list.
 */
export const SITEMAP_ROUTES: RouteEntry[] = [
  { path: '/', sourceFile: 'web/src/pages/index.astro' },
  { path: '/about', sourceFile: 'web/src/pages/about.astro' },
  { path: '/timeline', sourceFile: 'web/src/pages/timeline.astro' },
  { path: '/speaking', sourceFile: 'web/src/pages/speaking.astro' },
  { path: '/speaking/reel', sourceFile: 'web/src/pages/speaking/reel.astro' },
  { path: '/work/loandemo', sourceFile: 'web/src/pages/work/loandemo.astro' },
  { path: '/glass-box', sourceFile: 'web/src/pages/glass-box/index.astro' },
  { path: '/faq', sourceFile: 'web/src/pages/faq.astro' },
  { path: '/invite', sourceFile: 'web/src/pages/invite.astro' },
];
