/**
 * /sitemap.xml — the generated sitemap (Story 1.6, Task 3 / AC3; architecture
 * §AR-9; UX-DR23). A prerendered Astro static endpoint that enumerates every
 * current Mirror route as an absolute URL with a DETERMINISTIC `<lastmod>`.
 *
 * Absolute URLs are built from `context.site` (astro.config.mjs `site` —
 * https://joshuabrandt.abacusai.cloud), so they match the self-canonical URLs
 * the Mirror routes emit (Story 1.5, UX-DR10). lastmod is the route source
 * file's git commit date (deterministic — same git state → byte-identical
 * sitemap; NFR-6, verified by Story 1.8), with a fixed fallback when git is
 * unavailable. The route registry lives in lib/routes.ts; extend it as routes
 * are added (Story 1.7 `/browse`; Epic 2 `/glass-box/[artifact]`).
 *
 * This runs at BUILD TIME in Node and emits static XML; it ships no client JS.
 */
import { execFileSync } from 'node:child_process';
import process from 'node:process';

import type { APIRoute } from 'astro';

import { FALLBACK_LASTMOD, gitLastmod } from '../lib/lastmod';
import { SITEMAP_ROUTES } from '../lib/routes';

// Prerender as a static file at build time (the project is output: 'static',
// but mark explicitly so this endpoint is never treated as on-demand).
export const prerender = true;

/**
 * Discover the git work-tree root from the build cwd (`web/` during `astro
 * build`). The route source paths in lib/routes.ts are repo-root-relative, so
 * git must run from that root. Returns null if git/the repo is unavailable.
 */
function gitRepoRoot(): string | null {
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

/** Escape the five XML special chars for safe inclusion in element text. */
function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const GET: APIRoute = ({ site }) => {
  // `site` is the parsed astro.config `site` (a URL). It is always set in this
  // project (astro.config.mjs); guard for the rare unset case so the absolute
  // URLs never throw.
  const origin = site?.href.replace(/\/$/, '') ?? 'https://joshuabrandt.abacusai.cloud';
  const repoRoot = gitRepoRoot();

  const urls = SITEMAP_ROUTES.map((route) => {
    // Absolute URL with a TRAILING SLASH so each <loc> matches the page's own
    // <link rel="canonical"> exactly (Story 1.5, UX-DR10). Astro's default
    // directory build (build.format 'directory', trailingSlash 'ignore') serves
    // every route as a directory index and emits a trailing-slash self-canonical
    // (Astro.url.pathname is e.g. "/about/"), so the sitemap must use the same
    // form — a slashless <loc> would advertise a non-canonical variant and split
    // the SEO signal. The site root is already "/".
    const loc = route.path === '/' ? `${origin}/` : `${origin}${route.path}/`;
    const lastmod = repoRoot ? gitLastmod(route.sourceFile, repoRoot) : FALLBACK_LASTMOD;
    return `  <url>\n    <loc>${xmlEscape(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
