import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * Build-output assertions for the design-system foundation (Story 1.2), the
 * calm-credible hero + audience fork (Story 1.3, IAC-1 / IAC-2), and the home
 * 7-scene scaffold + scene-rail (Story 1.4, IAC-1 / IAC-2). These run a REAL
 * `astro build` and assert on the produced static HTML + CSS — the
 * consumer-observable form of the ACs and genuine real-runtime evidence for a
 * user-facing surface (skill-rules Rule 3).
 *
 * The build runs once in beforeAll; every test reads from web/dist.
 */
const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(webRoot, 'dist');
const indexHtmlPath = join(distDir, 'index.html');

let indexHtml = '';
let builtCss = '';
// builtCss with the space after each declaration colon removed, so token-value
// assertions tolerate the minifier emitting `--x: 1px` vs `--x:1px`.
let builtCssNorm = '';

beforeAll(() => {
  // Resolve the real astro CLI bin regardless of where pnpm hoisted it
  // (workspace deps live in the root store, not web/node_modules/astro).
  const require = createRequire(import.meta.url);
  const astroPkgJson = require.resolve('astro/package.json');
  const astroBin = join(dirname(astroPkgJson), 'bin', 'astro.mjs');

  // Real production build — the same path `pnpm build` exercises.
  execFileSync('node', [astroBin, 'build'], {
    cwd: webRoot,
    stdio: 'pipe',
  });

  indexHtml = readFileSync(indexHtmlPath, 'utf8');

  // Concatenate every emitted stylesheet so token/font assertions are
  // location-independent (Astro hashes the filename).
  const cssDir = join(distDir, '_astro');
  builtCss = readdirSync(cssDir)
    .filter((f) => f.endsWith('.css'))
    .map((f) => readFileSync(join(cssDir, f), 'utf8'))
    .join('\n');

  builtCssNorm = builtCss.replace(/:\s+/g, ':');
});

/* ──────────────────────────────────────────────────────────────────────────
 * Script-classification helpers (Story 1.6).
 *
 * JSON-LD ships in <script type="application/ld+json"> — that is DATA, not
 * executable JS, so it must NOT count against the 0-JS budget (NFR-1). These
 * helpers split the two so the "0 script" / "exactly one script" assertions
 * count only EXECUTABLE scripts.
 * ────────────────────────────────────────────────────────────────────────── */

/** All <script …> opening tags in the document. */
function allScriptTags(html: string): string[] {
  return html.match(/<script\b[^>]*>/gi) ?? [];
}

/** Count `<script type="application/ld+json">` (DATA) blocks. */
function countLdJsonScripts(html: string): number {
  return allScriptTags(html).filter((tag) => /type\s*=\s*["']application\/ld\+json["']/i.test(tag))
    .length;
}

/** Count EXECUTABLE scripts — every <script> that is NOT an ld+json data block. */
function countExecutableScripts(html: string): number {
  return allScriptTags(html).filter((tag) => !/type\s*=\s*["']application\/ld\+json["']/i.test(tag))
    .length;
}

/**
 * Parse every `<script type="application/ld+json">` block in the document and
 * return the flattened list of top-level JSON-LD nodes (an array block is
 * spread into its entries). Throws (failing the test) if any block is not valid
 * JSON — exactly the IAC-1 "valid parseable JSON" guarantee.
 */
function parseLdJson(html: string): Array<Record<string, unknown>> {
  const blocks =
    html.match(
      /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ) ?? [];
  const nodes: Array<Record<string, unknown>> = [];
  for (const block of blocks) {
    const inner = block.replace(/^<script\b[^>]*>/i, '').replace(/<\/script>$/i, '');
    // Must be valid JSON (the serializer escapes < > & as \uXXXX, which is still
    // valid JSON). JSON.parse throws on malformed input → the test fails.
    const parsed = JSON.parse(inner) as unknown;
    if (Array.isArray(parsed)) {
      nodes.push(...(parsed as Array<Record<string, unknown>>));
    } else {
      nodes.push(parsed as Record<string, unknown>);
    }
  }
  return nodes;
}

/** Find the first parsed JSON-LD node of a given @type in the document. */
function findNodeByType(html: string, type: string): Record<string, unknown> | undefined {
  return parseLdJson(html).find((n) => n['@type'] === type);
}

/* ──────────────────────────────────────────────────────────────────────────
 * Story 1.7 — the global static-fallback footer + /browse.
 *
 * The canonical 10 Mirror routes (the registry order, lib/routes.ts). The global
 * footer (on EVERY page) and /browse must each link all ten; the sitemap now
 * enumerates all ten. Kept here as the test's own copy so a registry drift that
 * silently drops a route still fails these assertions (ground-truth, not the
 * same array the source reads).
 * ────────────────────────────────────────────────────────────────────────── */
const ALL_MIRROR_ROUTES = [
  '/',
  '/about/',
  '/timeline/',
  '/speaking/',
  '/speaking/reel/',
  '/work/loandemo/',
  '/glass-box/',
  '/faq/',
  '/invite/',
  '/browse/',
] as const;

/** Extract the global footer block (<footer class="…site-footer…">…</footer>). */
function footerBlock(html: string): string | null {
  const m = html.match(/<footer\b[^>]*class="[^"]*site-footer[^"]*"[^>]*>[\s\S]*?<\/footer>/);
  return m ? m[0] : null;
}

/**
 * Assert the global static-fallback footer is present on a page and carries a
 * real <a> to every one of the canonical 10 Mirror routes (IAC-1). Shared by the
 * home assertion and the per-Mirror-route parametrized assertion below.
 */
function expectGlobalFooter(html: string, where: string): void {
  const footer = footerBlock(html);
  expect(footer, `<footer class="site-footer"> on ${where}`).not.toBeNull();
  // A labelled landmark nav inside the footer (screen-reader navigable).
  expect(footer!, `footer <nav> on ${where}`).toMatch(/<nav\b[^>]*\saria-label="[^"]+"/);
  // A real <a> to every Mirror route (exact href, followable JS-off).
  for (const route of ALL_MIRROR_ROUTES) {
    const hrefPattern = new RegExp(`<a\\b[^>]*\\shref="${route.replace(/\//g, '\\/')}"[^>]*>`);
    expect(footer!, `footer link to ${route} on ${where}`).toMatch(hrefPattern);
  }
  // The footer carries no executable JS (0-JS fallback floor; NFR-1).
  expect(countExecutableScripts(footer!), `footer is 0-JS on ${where}`).toBe(0);
}

describe('built home page (web/dist/index.html)', () => {
  it('builds an index.html', () => {
    expect(existsSync(indexHtmlPath)).toBe(true);
  });

  it('has exactly one <html lang="en"> root', () => {
    // Astro appends a scoped data-attribute, so match the opening tag prefix.
    const matches = indexHtml.match(/<html lang="en"[\s>]/g) ?? [];
    expect(matches).toHaveLength(1);
  });

  it('renders the canonical Wordmark string', () => {
    expect(indexHtml).toContain('Joshua R. Brandt, MSE');
  });

  it('renders exactly one <h1> reading the canonical positioning line (Story 1.3 IAC-1)', () => {
    const h1s = indexHtml.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g) ?? [];
    expect(h1s).toHaveLength(1);
    // Strip any inner tags/whitespace and assert the exact Title-case, no-period
    // canonical string (no normalization — DESIGN locks this casing).
    const text = h1s[0]!
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    expect(text).toBe('Seasoned, building at the frontier');
  });

  it('carries the "built in the open · a BMAD Method project" framing (Story 1.3 IAC-1)', () => {
    expect(indexHtml).toContain('built in the open · a BMAD Method project');
  });

  it('wraps the hero in a <section id="hero"> (locked scene order starts at Hero)', () => {
    expect(indexHtml).toMatch(/<section\b[^>]*\sid="hero"[^>]*>/);
  });

  it('renders the three fork controls as real links with the exact hrefs (Story 1.3 IAC-1)', () => {
    // Explore → in-page Scene-Arc anchor #thesis (Story 1.4 finalizes the target).
    expect(indexHtml).toMatch(/<a\b[^>]*\shref="#thesis"[^>]*>[\s\S]*?Explore[\s\S]*?<\/a>/);
    // "I'm here to book a talk" → /speaking/ (trailing-slash form; Story 2.0 AC2).
    expect(indexHtml).toMatch(
      /<a\b[^>]*\shref="\/speaking\/"[^>]*>[\s\S]*?book a talk[\s\S]*?<\/a>/,
    );
    // Quiet "Or ask my Guide about the work" → /faq/ (becomes the Guide opener in Epic 4).
    expect(indexHtml).toMatch(
      /<a\b[^>]*\shref="\/faq\/"[^>]*>[\s\S]*?ask my Guide about the work[\s\S]*?<\/a>/,
    );
  });

  it('renders the "Explore" primary action as a real <a> driven by the accent token (Story 1.3)', () => {
    // Explore is the primary fork CTA — a real <a> (followable JS-off), styled
    // with the shared .btn--primary navy fill (not a div). Scope to the anchor
    // whose text is exactly "Explore": as of Story 1.4 the scene-rail also has a
    // #thesis anchor, so matching the first href="#thesis" is no longer the
    // Explore button. Assert that anchor carries BOTH the href and the primary
    // class (order-agnostic — Astro emits href before the class:list attribute).
    const exploreTag = indexHtml.match(/<a\b[^>]*\shref="#thesis"[^>]*>\s*Explore\s*<\/a>/);
    expect(exploreTag).not.toBeNull();
    expect(exploreTag![0]).toMatch(/class="[^"]*\bbtn--primary\b[^"]*"/);
  });

  it('keeps the quiet Guide entry distinct from the two fork buttons (Story 1.3 IAC-1)', () => {
    // The /faq/ Guide link is an inline link, NOT a .btn — visually distinct from
    // the Explore/book-a-talk buttons (DESIGN: a quiet, understated entry).
    const guideLink = indexHtml.match(/<a\b[^>]*\shref="\/faq\/"[^>]*>/);
    expect(guideLink).not.toBeNull();
    expect(guideLink![0]).not.toMatch(/class="[^"]*\bbtn\b/);
  });

  it('includes the navy-fill primary button driven by the accent token', () => {
    // The built CSS must style .btn--primary with the accent custom property.
    // Astro appends a scoped [data-astro-cid-*] attribute to the selector.
    expect(builtCss).toMatch(/\.btn--primary[^{]*\{[^}]*var\(--color-accent\)/);
  });

  it('renders the global static-fallback footer with real <a> to all 10 Mirror routes (Story 1.7 IAC-1)', () => {
    // The footer (BaseLayout-global) is now realized on the home: a <footer
    // class="site-footer"> with a labelled <nav> linking every Mirror route,
    // 0-JS. This replaces the 1.2 empty-slot placeholder check.
    expectGlobalFooter(indexHtml, 'home /');
  });

  it('the global footer carries the canonical Wordmark identity (Story 1.7; UX-DR5)', () => {
    const footer = footerBlock(indexHtml);
    expect(footer).not.toBeNull();
    expect(footer!).toContain('Joshua R. Brandt, MSE');
  });

  it('footer + /browse links get a visible :focus-visible ring and never suppress it (Story 1.7 AC3)', () => {
    // AC3: tabbing the footer and /browse shows a visible :focus-visible indicator
    // on every link. The footer/browse links carry NO per-link outline override,
    // so they inherit the global navy ring (global.css, Story 1.2). Assert in the
    // built CSS that (a) the global :focus-visible ring ships verbatim (the accent
    // outline + offset — the actual focus affordance), and (b) the footer/browse
    // link selectors never set `outline:` (i.e. never remove or replace the ring).
    expect(builtCssNorm).toMatch(
      /:focus-visible\{[^}]*outline:2px solid var\(--color-accent\)[^}]*outline-offset:2px/,
    );
    // No outline override scoped to the footer or /browse link classes — the ring
    // is never suppressed for these keyboard-reached links (would defeat AC3).
    expect(builtCss).not.toMatch(/\.site-footer__link[^{]*\{[^}]*outline\s*:/);
    expect(builtCss).not.toMatch(/\.browse-link[^{]*\{[^}]*outline\s*:/);
  });

  it('ships exactly ONE tiny EXECUTABLE <script> — the gated scene-rail enhancement (NFR-1)', () => {
    // 0-JS-by-default holds except the single minimal scene-rail enhancement
    // (Story 1.4 Task 3). The hero/scaffold themselves ship no JS; the rail adds
    // exactly one small inlined script for the semantic aria-current tracking.
    //
    // Story 1.6 adds a <script type="application/ld+json"> (Person + ProfilePage)
    // to <head> — that is DATA, not executable JS, and does NOT count against the
    // 0-JS budget. Count only EXECUTABLE scripts here (exclude ld+json).
    const executableScripts = countExecutableScripts(indexHtml);
    expect(executableScripts).toBe(1);
    // And exactly one ld+json data block is present (the structured data).
    expect(countLdJsonScripts(indexHtml)).toBe(1);
  });

  it('the single EXECUTABLE script is a reduced-motion-gated IntersectionObserver, inlined, sourced from motion.ts (Story 1.4 IAC-2; Story 1.9 IAC-1)', () => {
    // Astro inlines a script this small directly into the HTML (well under the
    // bundling threshold), so the gated enhancement is observable in the markup.
    // It MUST carry the two-layer reduced-motion gate's JS init-guard
    // (prefers-reduced-motion) AND use IntersectionObserver — i.e. it is the
    // expected minimal enhancement, not a heavyweight regression.
    //
    // Story 1.6 adds a <script type="application/ld+json"> in <head>, which now
    // precedes the scene-rail script in document order — so match the EXECUTABLE
    // script specifically (skip the ld+json data block) rather than "the first
    // <script>".
    const executableBlock = [...indexHtml.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].find(
      (m) => !/type\s*=\s*["']application\/ld\+json["']/i.test(m[1] ?? ''),
    );
    expect(executableBlock).toBeDefined();
    const scriptBody = executableBlock![2]!;
    expect(scriptBody).toContain('prefers-reduced-motion');
    expect(scriptBody).toContain('IntersectionObserver');

    // Story 1.9 IAC-1: the gate is now the SHARED utility from web/src/lib/motion.ts
    // (onMotionAllowed), bundled+inlined into this script — NOT an ad-hoc per-component
    // matchMedia. motion.ts's onMotionAllowed contributes the SSR-safe guard
    // (`typeof window` + `matchMedia` feature-detect) that an inline
    // `matchMedia(...).matches` check would NOT have. Assert that signature is
    // present, proving the rail consumes motion.ts rather than re-implementing the
    // gate inline. (Survives minification: `typeof window`, `matchMedia`, and the
    // reduced-motion query string are all preserved through esbuild's mangling.)
    expect(scriptBody).toMatch(/typeof window/);
    expect(scriptBody).toContain('matchMedia');
  });

  it('references no external JavaScript bundle and ships no React island (NFR-1)', () => {
    // The rail enhancement is inlined, so there is no <script src="…js">, no
    // module preload, and no React hydration bundle from the document.
    expect(indexHtml).not.toMatch(/<script\b[^>]*\bsrc=/);
    expect(indexHtml).not.toMatch(/<link\b[^>]*\brel="modulepreload"/);
    expect(indexHtml).not.toMatch(/\.js(["'?])/);
  });

  it('contains no exclamation marks in copy (positive-assertion voice)', () => {
    // The voice rule bans "!" in COPY, not in code. Strip the <!doctype> and the
    // inlined scene-rail enhancement <script> (whose JS legitimately uses "!"
    // negation / "!==") before asserting the rendered markup carries none.
    const copyOnly = indexHtml
      .replace(/<!doctype html>/i, '')
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
    expect(copyOnly).not.toContain('!');
  });
});

describe('home 7-scene scaffold + scene-rail (Story 1.4 IAC-1 / IAC-2)', () => {
  // The locked Stage-1 scene order (EXPERIENCE §"Scene order"): the section ids
  // in exact DOM order. #hero is the 1.3 HeroStatic; 1.4 adds the other six.
  const SCENE_IDS = ['hero', 'thesis', 'timeline', 'speaker', 'flagship', 'glass-box', 'close'];

  it('renders exactly 7 <section>s with the locked ids in the locked DOM order (IAC-1, AC1)', () => {
    // Collect every section's id in document order and assert it equals the
    // locked sequence exactly (count + order + ids).
    const sectionIds = [...indexHtml.matchAll(/<section\b[^>]*\sid="([^"]+)"[^>]*>/g)].map(
      (m) => m[1],
    );
    expect(sectionIds).toEqual(SCENE_IDS);
  });

  it('the scene-rail exposes 7 real in-page anchors matching the section ids (IAC-1, AC2)', () => {
    // Each of the 7 scene entries is a real <a href="#…"> (jump-to-scene,
    // followable JS-off) whose fragment matches a section id. Scope to the rail
    // nav so we assert on the rail itself, not incidental in-page links.
    const railMatch = indexHtml.match(
      /<nav\b[^>]*class="[^"]*scene-rail[^"]*"[^>]*>[\s\S]*?<\/nav>/,
    );
    expect(railMatch).not.toBeNull();
    const rail = railMatch![0];
    for (const id of SCENE_IDS) {
      expect(rail).toMatch(new RegExp(`<a\\b[^>]*\\shref="#${id}"[^>]*>`));
    }
  });

  it('the scene-rail carries the "Scene N of 7" progress meter label (AC2/AC4)', () => {
    // The meter label is real text (not color/width alone). Static baseline =
    // "Scene 1 of 7"; the JS enhancement only updates the N (which is wrapped in
    // a <span data-scene-current> the script mutates), so tolerate that markup.
    expect(indexHtml).toMatch(/Scene\s+<[^>]*data-scene-current[^>]*>\s*1\s*<\/span>\s*of 7/);
  });

  it('the scene-rail provides Skip-to-end → #close and Jump → /speaking (IAC-1, AC2)', () => {
    const railMatch = indexHtml.match(
      /<nav\b[^>]*class="[^"]*scene-rail[^"]*"[^>]*>[\s\S]*?<\/nav>/,
    );
    expect(railMatch).not.toBeNull();
    const rail = railMatch![0];
    // Skip to the end → the Close scene anchor.
    expect(rail).toMatch(/<a\b[^>]*\shref="#close"[^>]*>[\s\S]*?Skip[\s\S]*?<\/a>/);
    // Jump: book a talk → the /speaking/ Mirror route (trailing-slash form; SM-C1).
    expect(rail).toMatch(/<a\b[^>]*\shref="\/speaking\/"[^>]*>[\s\S]*?book a talk[\s\S]*?<\/a>/);
  });

  it('marks the current scene with aria-current (static baseline = #hero), never color alone (AC2/AC4)', () => {
    // Exactly one rail entry carries aria-current in the static baseline, and it
    // is the Hero entry (#hero). Weight is also applied in CSS — color is never
    // the sole signal.
    const railMatch = indexHtml.match(
      /<nav\b[^>]*class="[^"]*scene-rail[^"]*"[^>]*>[\s\S]*?<\/nav>/,
    );
    expect(railMatch).not.toBeNull();
    const rail = railMatch![0];
    const currentAnchors = [...rail.matchAll(/<a\b[^>]*\saria-current="true"[^>]*>/g)];
    expect(currentAnchors).toHaveLength(1);
    expect(currentAnchors[0]![0]).toMatch(/\shref="#hero"/);
  });

  it('authors the Thesis scene line "The medium is the message." (AC1)', () => {
    expect(indexHtml).toContain('The medium is the message.');
  });

  it('teaser scenes link to their Mirror routes (summarize-and-link, UX-DR10) (AC1)', () => {
    // Each teaser scene carries a real link to its Mirror route (trailing-slash form; Story 2.0 AC2).
    expect(indexHtml).toMatch(/<a\b[^>]*\shref="\/timeline\/"[^>]*>/);
    expect(indexHtml).toMatch(/<a\b[^>]*\shref="\/work\/loandemo\/"[^>]*>/);
    expect(indexHtml).toMatch(/<a\b[^>]*\shref="\/glass-box\/"[^>]*>/);
    // The Close shell links to /invite/ (the CTAs themselves are Epic 3).
    expect(indexHtml).toMatch(/<a\b[^>]*\shref="\/invite\/"[^>]*>/);
  });

  it('still keeps exactly one <h1> — scene titles are <h2> (clean hierarchy, NFR-2/SEO)', () => {
    const h1s = indexHtml.match(/<h1\b[^>]*>/g) ?? [];
    expect(h1s).toHaveLength(1);
    // The six non-hero scenes each contribute an <h2> (Thesis + 4 teasers +
    // Close = 6); assert at least that many h2s are present.
    const h2s = indexHtml.match(/<h2\b[^>]*>/g) ?? [];
    expect(h2s.length).toBeGreaterThanOrEqual(6);
  });

  it('provides the mobile "Jump to section" disclosure as a JS-off-operable <details> (AC3)', () => {
    // The mobile reflow (sticky top bar + "Jump to section" menu) is a native
    // <details>/<summary> disclosure so it works with 0 JS and is keyboard
    // operable. The same anchors live inside; presentation-only reflow.
    expect(indexHtml).toMatch(/<details\b[^>]*class="[^"]*rail-m[^"]*"[^>]*>/);
    expect(indexHtml).toMatch(/<summary\b[^>]*>[\s\S]*?Jump to section[\s\S]*?<\/summary>/);
  });
});

describe('built CSS — scene-rail two-layer reduced-motion gate (Story 1.4 AC4)', () => {
  it('gates the scroll-driven meter fill behind prefers-reduced-motion (CSS layer)', () => {
    // The animated width-fill is the enhancement; the static filled bar is the
    // baseline. The CSS layer of the two-layer gate wraps the scroll-driven
    // animation in a no-preference media query (auto-degrades under reduce).
    expect(builtCss).toMatch(/@media[^{]*prefers-reduced-motion:\s*no-preference/);
  });

  it('drives the scene-rail meter with a CSS scroll-driven animation-timeline', () => {
    // Prefer CSS scroll-driven animation for the visual fill (Story 1.4 Task 3).
    expect(builtCss).toMatch(/animation-timeline:/);
  });
});

describe('built CSS — tokens as the single source of truth (AC1 / IAC-2)', () => {
  it('emits the locked color custom properties verbatim', () => {
    expect(builtCssNorm).toContain('--color-surface-base:#f6f0e6');
    expect(builtCssNorm).toContain('--color-accent:#1e3a5f');
    expect(builtCssNorm).toContain('--color-ink-primary:#211b14');
  });

  it('emits the spacing scale and reading measures', () => {
    expect(builtCssNorm).toContain('--space-unit:8px');
    expect(builtCssNorm).toContain('--measure-reading:680px');
  });

  it('emits the radius scale', () => {
    expect(builtCssNorm).toContain('--radius-md:6px');
  });

  it('defines the reserved --shadow-float token', () => {
    expect(builtCssNorm).toContain('--shadow-float:');
  });

  it('applies no box-shadow to any surface (flat/hairline system, AC3)', () => {
    // The flat design system forbids box-shadow on surfaces/cards/panels.
    // Exception: the BMAD Method Dot (TimelineDot, Story 2.3) uses a static
    // box-shadow halo for the `live` state — spec-verbatim (DESIGN §timeline-dot:
    // "live filled + 4px rgba(30,58,95,0.16) static halo"). This is a DECORATIVE
    // node marker, not a content surface. The --shadow-float token remains reserved
    // for the Guide panel (the single elevated surface). The test is updated to
    // allow box-shadow ONLY on the timeline dot component while preserving the
    // flat-surface constraint for all other elements.
    //
    // Parse each rule block and verify non-dot blocks have no box-shadow.
    // Strategy: split on } to get declaration blocks, skip blocks that are
    // exclusively for the timeline-dot selector, check others have no box-shadow.
    const blocks = builtCss.split('}');
    const surfaceViolations = blocks.filter((block) => {
      // Only care about blocks that have a non-none box-shadow declaration.
      // box-shadow:none is explicitly allowed (it's the reset/flat declaration).
      if (!block.match(/box-shadow:\s*(?!none)[^;}]/)) return false;
      // The timeline-dot halo is exempt (decorative marker, spec-verbatim).
      if (block.includes('timeline-dot')) return false;
      // The --shadow-float token DEFINITION itself (not application) is allowed.
      if (block.includes('--shadow-float')) return false;
      return true;
    });
    expect(
      surfaceViolations,
      `box-shadow on surface (violating blocks): ${surfaceViolations.join('\n')}`,
    ).toHaveLength(0);
  });
});

describe('built CSS — self-hosted Source Serif 4 (AC2 / NFR-5)', () => {
  it('declares an @font-face for Source Serif 4', () => {
    expect(builtCss).toMatch(/@font-face\{[^}]*Source Serif 4/);
  });

  it('uses font-display: swap', () => {
    expect(builtCss).toContain('font-display:swap');
  });

  it('serves the font self-hosted from /fonts (no Google Fonts request)', () => {
    expect(builtCss).toMatch(/src:url\(\/fonts\/source-serif-4-[^)]+\.woff2\)/);
    expect(builtCss).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com/);
  });

  it('ships the self-hosted woff2 asset in dist', () => {
    const fontPath = join(distDir, 'fonts', 'source-serif-4-latin-opsz.woff2');
    expect(existsSync(fontPath)).toBe(true);
  });
});

describe('dev-only style guide is not shipped', () => {
  it('does not emit a _styleguide route into dist (underscore page is unbuilt)', () => {
    const styleguidePaths = [
      join(distDir, '_styleguide', 'index.html'),
      join(distDir, '_styleguide.html'),
    ];
    for (const p of styleguidePaths) {
      expect(existsSync(p)).toBe(false);
    }
  });
});

/* ──────────────────────────────────────────────────────────────────────────
 * Story 1.5 — MirrorLayout + Stage-1 route stubs + the canonical /about.
 *
 * These assert on the produced static HTML for every Mirror route (real
 * `astro build` output — the consumer-observable form of the ACs, JS-off; Rule
 * 3 real-runtime evidence). Each Mirror route must: build to a real
 * <route>/index.html; open answer-first with "Joshua R. Brandt, MSE" in the
 * FIRST SENTENCE of its lede; be self-canonical to its own absolute URL; carry
 * exactly one <h1>; provide the footer slot region; ship 0 JS; and carry no
 * exclamation marks (IAC-1). The 1.3 hero fork + 1.4 teaser forward-refs must
 * now resolve to these built routes (IAC-2).
 * ────────────────────────────────────────────────────────────────────────── */

// Canonical origin from astro.config.mjs (Story 1.5; also feeds 1.6 sitemap).
const SITE_ORIGIN = 'https://joshuabrandt.abacusai.cloud';

// Each Mirror route created by Story 1.5 → its built directory-index path. Astro
// (default build.format 'directory') emits <route>/index.html for each. Story 1.7
// adds /browse — a Mirror route built through MirrorLayout, so it inherits every
// per-route guarantee below (answer-first, self-canonical, one <h1>, the global
// footer, 0-JS, no exclamation).
const MIRROR_ROUTES = [
  '/timeline',
  '/speaking',
  '/speaking/reel',
  '/work/loandemo',
  '/glass-box',
  '/faq',
  '/invite',
  '/about',
  '/browse',
] as const;
// Note: MIRROR_ROUTES values are kept slashless here because routeHtmlPath() uses
// them to derive the filesystem path (about/index.html etc.) — the slash form is
// irrelevant to that lookup. The canonical href form is asserted below as exact
// trailing-slash (the Story 2.0 AC5 lock removes the earlier slash-normalization).

/** Absolute path to a route's built index.html (directory-index form). */
function routeHtmlPath(route: string): string {
  return join(distDir, ...route.split('/').filter(Boolean), 'index.html');
}

/** The text of the FIRST <p> in the document — the answer-first lede paragraph. */
function firstParagraphText(html: string): string {
  const m = html.match(/<p\b[^>]*>([\s\S]*?)<\/p>/);
  if (!m) return '';
  return m[1]!
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

describe('Story 1.5 — every Mirror route is a real, answer-first, self-canonical page (IAC-1)', () => {
  it.each(MIRROR_ROUTES)('builds a real index.html for %s (verifiable JS-off)', (route) => {
    expect(existsSync(routeHtmlPath(route))).toBe(true);
    const html = readFileSync(routeHtmlPath(route), 'utf8');
    // Real HTML document (not a redirect shell): has <html lang="en"> + <body>.
    // Astro appends a scoped data-attribute to both tags, so match the opening
    // tag prefix (same convention as the home-page assertions above).
    expect(html).toMatch(/<html lang="en"[\s>]/);
    expect(html).toMatch(/<body[\s>]/);
  });

  it.each(MIRROR_ROUTES)(
    'opens answer-first — the lede leads with the entity name — on %s',
    (route) => {
      const html = readFileSync(routeHtmlPath(route), 'utf8');
      const lede = firstParagraphText(html);
      // The opening paragraph names the entity FIRST (the GEO floor; UX-DR15).
      // Assert it leads with the canonical string rather than naively splitting
      // on "." — the entity itself contains "R." and "MSE", which a sentence
      // splitter would mistake for a boundary.
      expect(lede.startsWith('Joshua R. Brandt, MSE')).toBe(true);
    },
  );

  it.each(MIRROR_ROUTES)(
    'is self-canonical to its own absolute trailing-slash URL on %s (Story 2.0 AC3)',
    (route) => {
      const html = readFileSync(routeHtmlPath(route), 'utf8');
      const canonicalMatch = html.match(/<link\b[^>]*\brel="canonical"[^>]*>/);
      expect(canonicalMatch).not.toBeNull();
      const hrefMatch = canonicalMatch![0].match(/\bhref="([^"]+)"/);
      expect(hrefMatch).not.toBeNull();
      // Exact trailing-slash form — no normalization (Story 2.0 AC5 mandates exact-string
      // equality so any future form drift fails CI, not passes silently).
      const got = hrefMatch![1]!;
      expect(got).toBe(`${SITE_ORIGIN}${route}/`);
    },
  );

  it.each(MIRROR_ROUTES)('renders exactly one <h1> on %s (clean hierarchy)', (route) => {
    const html = readFileSync(routeHtmlPath(route), 'utf8');
    const h1s = html.match(/<h1\b[^>]*>/g) ?? [];
    expect(h1s).toHaveLength(1);
  });

  it.each(MIRROR_ROUTES)(
    'renders the global static-fallback footer with all 10 Mirror links on %s (Story 1.7 IAC-1)',
    (route) => {
      const html = readFileSync(routeHtmlPath(route), 'utf8');
      expectGlobalFooter(html, route);
    },
  );

  it.each(MIRROR_ROUTES)(
    'ships 0 EXECUTABLE JS — no executable <script>, no island, no JS bundle on %s (NFR-1)',
    (route) => {
      const html = readFileSync(routeHtmlPath(route), 'utf8');
      // 0-JS budget counts EXECUTABLE scripts only. Story 1.6 adds a
      // <script type="application/ld+json"> (DATA) to several Mirror routes
      // (/about, /speaking, /speaking/reel, /work/loandemo, /faq) — that does
      // NOT violate NFR-1. Assert zero executable scripts; ld+json is allowed.
      expect(countExecutableScripts(html)).toBe(0);
      expect(html).not.toMatch(/<script\b[^>]*\bsrc=/);
      expect(html).not.toMatch(/<link\b[^>]*\brel="modulepreload"/);
      expect(html).not.toMatch(/\.js(["'?])/);
    },
  );

  it.each(MIRROR_ROUTES)(
    'contains no exclamation marks in copy on %s (positive-assertion)',
    (route) => {
      const html = readFileSync(routeHtmlPath(route), 'utf8');
      const copyOnly = html.replace(/<!doctype html>/i, '');
      expect(copyOnly).not.toContain('!');
    },
  );
});

describe('Story 1.5 — the canonical /about (AC3)', () => {
  let aboutHtml = '';
  beforeAll(() => {
    aboutHtml = readFileSync(routeHtmlPath('/about'), 'utf8');
  });

  it('sets the 50-word short bio VERBATIM', () => {
    expect(aboutHtml).toContain(
      'Joshua R. Brandt, MSE is a software engineer with 30 years of shipping experience, ' +
        'now building at the frontier of agentic engineering. He speaks on the patterns that ' +
        'outlast hype cycles and on running real software through disciplined, auditable agent ' +
        'workflows — seasoned, building at the frontier.',
    );
  });

  it('sets the 100–150-word long bio VERBATIM, keeping the lowercase running tail', () => {
    expect(aboutHtml).toContain(
      'Joshua R. Brandt, MSE is a software engineer with three decades of shipping experience ' +
        'who has gone deep on agentic engineering — seasoned, building at the frontier.',
    );
    expect(aboutHtml).toContain(
      'aim to leave senior audiences with patterns they can use the next morning.',
    );
    // The lowercase bio tail must NOT be normalized to the Title-case hero form.
    expect(aboutHtml).not.toContain('Seasoned, building at the frontier');
  });

  it('flags the bios [ASSUMPTION] as real text (not color alone)', () => {
    expect(aboutHtml).toContain('[ASSUMPTION]');
  });

  it('renders the sameAs channels (YouTube, GitHub, Suno) as real <a>s with [OPEN] flags', () => {
    for (const channel of ['YouTube', 'GitHub', 'Suno']) {
      // A real anchor whose text is the channel label.
      expect(aboutHtml).toMatch(new RegExp(`<a\\b[^>]*>\\s*${channel}\\s*</a>`));
    }
    // Each placeholder href is flagged [OPEN] in visible text (not color alone).
    expect(aboutHtml).toContain('[OPEN: YouTube channel URL]');
    expect(aboutHtml).toContain('[OPEN: GitHub profile URL]');
    expect(aboutHtml).toContain('[OPEN: Suno profile URL]');
  });

  it('reuses the museum-mat headshot placeholder with a meaningful labelled region', () => {
    expect(aboutHtml).toMatch(/role="img"[^>]*aria-label="Portrait of Joshua R\. Brandt[^"]*"/);
    expect(aboutHtml).toContain('JRB');
  });
});

describe('Story 1.7 — /browse is the complete crawlable static index (IAC-2)', () => {
  let browseHtml = '';
  // The browse body (the <main>…</main> region) — excludes the global footer so
  // "the index itself links every route" is asserted on the index content, not
  // satisfied incidentally by the footer that is on every page.
  let browseBody = '';
  beforeAll(() => {
    browseHtml = readFileSync(routeHtmlPath('/browse'), 'utf8');
    const mainMatch = browseHtml.match(/<main\b[^>]*>[\s\S]*?<\/main>/);
    browseBody = mainMatch ? mainMatch[0] : '';
  });

  it('builds a real browse/index.html (verifiable JS-off)', () => {
    expect(existsSync(routeHtmlPath('/browse'))).toBe(true);
    expect(browseBody.length).toBeGreaterThan(0);
  });

  it.each(ALL_MIRROR_ROUTES)('the index body links %s as a real <a> (crawlable)', (route) => {
    const hrefPattern = new RegExp(`<a\\b[^>]*\\shref="${route.replace(/\//g, '\\/')}"[^>]*>`);
    expect(browseBody).toMatch(hrefPattern);
  });

  it('lists each of the 10 routes as its own item with a one-line description', () => {
    // Each registry route renders one <li> with the link + a description <p>.
    // Assert there are at least 10 list items, each carrying a non-empty <p>.
    const items = [...browseBody.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map((m) => m[1]!);
    expect(items.length).toBeGreaterThanOrEqual(ALL_MIRROR_ROUTES.length);
    // Every item has BOTH a real <a> and a description paragraph with real text.
    const itemsWithLinkAndDesc = items.filter((item) => {
      const hasLink = /<a\b[^>]*\shref="[^"]+"[^>]*>/.test(item);
      const descMatch = item.match(/<p\b[^>]*>([\s\S]*?)<\/p>/);
      const descText = descMatch
        ? descMatch[1]!
            .replace(/<[^>]+>/g, '')
            .replace(/\s+/g, ' ')
            .trim()
        : '';
      return hasLink && descText.length > 0;
    });
    expect(itemsWithLinkAndDesc.length).toBeGreaterThanOrEqual(ALL_MIRROR_ROUTES.length);
  });

  it('the lede first sentence names the entity (answer-first GEO floor)', () => {
    // /browse is in MIRROR_ROUTES so this is also checked there; assert here too
    // for the index specifically (the FR-8 parity surface).
    expect(firstParagraphText(browseHtml).startsWith('Joshua R. Brandt, MSE')).toBe(true);
  });

  it('carries no exclamation marks (positive-assertion, no hype)', () => {
    expect(browseHtml.replace(/<!doctype html>/i, '')).not.toContain('!');
  });
});

describe('Story 1.5 — 1.3 hero fork + 1.4 teaser forward-refs now resolve (IAC-2)', () => {
  // Every Mirror route the home links to (hero fork + scene teasers). Each MUST
  // now map to an existing built page (no 404). The home index.html is built in
  // the same run (beforeAll above already read it into indexHtml).
  // HOME_FORWARD_REFS now use the trailing-slash form (Story 2.0 AC2) since the
  // home markup emits trailing-slash hrefs. routeHtmlPath() still uses the
  // slashless form for filesystem lookup (about/index.html is unchanged).
  const HOME_FORWARD_REFS = [
    { href: '/speaking/', route: '/speaking' }, // hero fork "book a talk" + scene-rail jump + Speaker teaser
    { href: '/faq/', route: '/faq' }, // hero quiet Guide entry
    { href: '/timeline/', route: '/timeline' }, // Timeline teaser
    { href: '/work/loandemo/', route: '/work/loandemo' }, // Flagship teaser
    { href: '/glass-box/', route: '/glass-box' }, // Glass Box teaser
    { href: '/invite/', route: '/invite' }, // Close scene
  ] as const;

  it.each(HOME_FORWARD_REFS)(
    'the home links to $href (trailing-slash) and that route is now built',
    ({ href, route }) => {
      // The home markup carries the trailing-slash href (Story 2.0 AC2)…
      const hrefPattern = new RegExp(`<a\\b[^>]*\\shref="${href.replace(/\//g, '\\/')}"[^>]*>`);
      expect(indexHtml).toMatch(hrefPattern);
      // …and the href resolves to a real built directory-index (no 404).
      expect(existsSync(routeHtmlPath(route))).toBe(true);
    },
  );
});

/* ──────────────────────────────────────────────────────────────────────────
 * Story 1.6 — JSON-LD emission + sitemap.xml + robots.txt.
 *
 * Real `astro build` output (the consumer-observable form; IAC-1 / IAC-2,
 * skill-rules Rule 3 real-runtime evidence). Asserts: each owning route emits a
 * <script type="application/ld+json"> whose parsed JSON has the right @type(s)
 * with @context: "https://schema.org" and the required fields per type; the
 * generated sitemap.xml lists every route (absolute URL + lastmod); robots.txt
 * has the Sitemap line + Allow for every required AI-crawler token.
 * ────────────────────────────────────────────────────────────────────────── */

describe('Story 1.6 — JSON-LD is valid, parseable, and DATA (not executable JS) (IAC-1)', () => {
  // The home page is read into indexHtml in the top beforeAll.
  it('home / and /about each emit a Person (name "Joshua R. Brandt, MSE") AND a ProfilePage', () => {
    for (const route of ['/', '/about'] as const) {
      const html = route === '/' ? indexHtml : readFileSync(routeHtmlPath(route), 'utf8');
      const person = findNodeByType(html, 'Person');
      const profile = findNodeByType(html, 'ProfilePage');
      expect(person, `Person on ${route}`).toBeDefined();
      expect(profile, `ProfilePage on ${route}`).toBeDefined();

      // Person required fields (story Dev Notes) + the EXACT canonical name.
      expect(person!['@context']).toBe('https://schema.org');
      expect(person!.name).toBe('Joshua R. Brandt, MSE');
      expect(person!.jobTitle).toBe('Software Engineer');
      expect(typeof person!.description).toBe('string');
      expect((person!.description as string).length).toBeGreaterThan(0);
      expect(typeof person!.url).toBe('string');
      // sameAs mirrors the /about channels (YouTube/GitHub/Suno) — 3 URLs.
      expect(Array.isArray(person!.sameAs)).toBe(true);
      expect((person!.sameAs as string[]).length).toBeGreaterThanOrEqual(3);
      expect(typeof person!.image).toBe('string');

      // ProfilePage required field: mainEntity → the Person.
      expect(profile!['@context']).toBe('https://schema.org');
      const mainEntity = profile!.mainEntity as Record<string, unknown>;
      expect(mainEntity['@type']).toBe('Person');
      expect(mainEntity.name).toBe('Joshua R. Brandt, MSE');
      // The embedded Person inherits the page node's @context (no own @context).
      expect('@context' in mainEntity).toBe(false);
    }
  });

  it('the home Person + /about Person carry byte-identical canonical facts (one source)', () => {
    const aboutHtml = readFileSync(routeHtmlPath('/about'), 'utf8');
    const homePerson = findNodeByType(indexHtml, 'Person');
    const aboutPerson = findNodeByType(aboutHtml, 'Person');
    expect(JSON.stringify(homePerson)).toBe(JSON.stringify(aboutPerson));
  });

  it('/speaking emits a valid Event with the required fields (placeholder OK)', () => {
    const html = readFileSync(routeHtmlPath('/speaking'), 'utf8');
    const event = findNodeByType(html, 'Event');
    expect(event).toBeDefined();
    expect(event!['@context']).toBe('https://schema.org');
    expect(typeof event!.name).toBe('string');
    expect(typeof event!.startDate).toBe('string');
    expect(typeof event!.eventAttendanceMode).toBe('string');
    expect((event!.location as Record<string, unknown>)['@type']).toBeDefined();
    // performer is the real Person; organizer is present.
    expect((event!.performer as Record<string, unknown>)['@type']).toBe('Person');
    expect((event!.organizer as Record<string, unknown>)['@type']).toBeDefined();
  });

  it('/speaking/reel emits a valid VideoObject with the required fields (placeholder OK)', () => {
    const html = readFileSync(routeHtmlPath('/speaking/reel'), 'utf8');
    const video = findNodeByType(html, 'VideoObject');
    expect(video).toBeDefined();
    expect(video!['@context']).toBe('https://schema.org');
    expect(typeof video!.name).toBe('string');
    expect(typeof video!.description).toBe('string');
    expect(typeof video!.thumbnailUrl).toBe('string');
    expect(typeof video!.uploadDate).toBe('string');
    // ~90s reel target.
    expect(video!.duration).toBe('PT1M30S');
  });

  it('/work/loandemo emits a valid CreativeWork (name "loandemo") with required fields', () => {
    const html = readFileSync(routeHtmlPath('/work/loandemo'), 'utf8');
    const work = findNodeByType(html, 'CreativeWork');
    expect(work).toBeDefined();
    expect(work!['@context']).toBe('https://schema.org');
    expect(work!.name).toBe('loandemo');
    expect((work!.author as Record<string, unknown>)['@type']).toBe('Person');
    expect(typeof work!.description).toBe('string');
    expect(typeof work!.url).toBe('string');
    expect(typeof work!.dateCreated).toBe('string');
  });

  it('/faq emits a valid FAQPage with Question/acceptedAnswer→Answer pairs (placeholder OK)', () => {
    const html = readFileSync(routeHtmlPath('/faq'), 'utf8');
    const faq = findNodeByType(html, 'FAQPage');
    expect(faq).toBeDefined();
    expect(faq!['@context']).toBe('https://schema.org');
    const mainEntity = faq!.mainEntity as Array<Record<string, unknown>>;
    expect(Array.isArray(mainEntity)).toBe(true);
    expect(mainEntity.length).toBeGreaterThanOrEqual(1);
    for (const q of mainEntity) {
      expect(q['@type']).toBe('Question');
      expect(typeof q.name).toBe('string');
      const answer = q.acceptedAnswer as Record<string, unknown>;
      expect(answer['@type']).toBe('Answer');
      expect(typeof answer.text).toBe('string');
    }
  });

  it('every ld+json block on every JSON-LD route is valid parseable JSON', () => {
    // parseLdJson throws on malformed JSON (the assertion is that it does NOT).
    const routes = [
      '/',
      '/about',
      '/speaking',
      '/speaking/reel',
      '/work/loandemo',
      '/faq',
    ] as const;
    for (const route of routes) {
      const html = route === '/' ? indexHtml : readFileSync(routeHtmlPath(route), 'utf8');
      expect(() => parseLdJson(html)).not.toThrow();
      expect(parseLdJson(html).length).toBeGreaterThan(0);
    }
  });

  it('the ld+json is rendered server-side in <head> (not the body)', () => {
    const headOnly = indexHtml.slice(0, indexHtml.indexOf('</head>'));
    expect(countLdJsonScripts(headOnly)).toBeGreaterThanOrEqual(1);
  });

  it('routes WITHOUT a JSON-LD owner emit no ld+json (e.g. /timeline, /glass-box, /invite)', () => {
    // These stubs get their structured data in later epics; no ld+json yet, and
    // critically still 0 executable JS.
    for (const route of ['/timeline', '/glass-box', '/invite'] as const) {
      const html = readFileSync(routeHtmlPath(route), 'utf8');
      expect(countLdJsonScripts(html)).toBe(0);
      expect(countExecutableScripts(html)).toBe(0);
    }
  });
});

describe('Story 1.6 — generated sitemap.xml (AC3 / IAC-2)', () => {
  const sitemapPath = join(distDir, 'sitemap.xml');
  let sitemap = '';
  beforeAll(() => {
    sitemap = readFileSync(sitemapPath, 'utf8');
  });

  // Every current Mirror route the sitemap must enumerate. Story 1.7 adds
  // /browse → the sitemap is now 10 routes (the count assertion below guards it).
  const SITEMAP_ROUTES = [
    '/',
    '/about',
    '/timeline',
    '/speaking',
    '/speaking/reel',
    '/work/loandemo',
    '/glass-box',
    '/faq',
    '/invite',
    '/browse',
  ] as const;

  it('builds a sitemap.xml', () => {
    expect(existsSync(sitemapPath)).toBe(true);
  });

  it('is a valid urlset document', () => {
    expect(sitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(sitemap).toMatch(
      /<urlset\b[^>]*xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/,
    );
    expect(sitemap).toContain('</urlset>');
  });

  it.each(SITEMAP_ROUTES)('lists %s as an absolute <loc> with a <lastmod>', (route) => {
    // The <loc> uses the TRAILING-SLASH form so it matches the page's own
    // <link rel="canonical"> exactly (Astro directory build → "/about/"); a
    // slashless <loc> would advertise a non-canonical variant (UX-DR10).
    const loc = route === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${route}/`;
    // The <loc> appears verbatim (absolute, same origin as the self-canonicals).
    expect(sitemap).toContain(`<loc>${loc}</loc>`);
    // …inside a <url> that also carries a well-formed ISO-8601 <lastmod>.
    const urlBlock = sitemap.match(
      new RegExp(
        `<url>\\s*<loc>${loc.replace(/[/.]/g, '\\$&')}</loc>\\s*<lastmod>([^<]+)</lastmod>`,
      ),
    );
    expect(urlBlock, `<url> block for ${route}`).not.toBeNull();
    expect(urlBlock![1]).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/);
  });

  it('enumerates exactly the current route set (count guards against stale routes)', () => {
    // Story 2.2: the sitemap now includes the 10 static Mirror routes PLUS one
    // entry per allowlisted Glass Box artifact (/glass-box/{slug}/). The dynamic
    // reader pages are added by sitemap.xml.ts from glassbox.json. The test
    // asserts count >= 10 (the static floor) and that the 10 static routes are
    // all present (the per-route `it.each` above). The exact artifact count
    // depends on the allowlist and may grow as artifacts are added.
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs.length).toBeGreaterThanOrEqual(SITEMAP_ROUTES.length);
  });

  it('uses absolute URLs that match the Mirror self-canonical origin (UX-DR10)', () => {
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!);
    for (const loc of locs) {
      expect(loc.startsWith(`${SITE_ORIGIN}/`)).toBe(true);
    }
  });

  it('enumerates EXACTLY the live built page set — no missing / phantom routes (IAC-2)', () => {
    // IAC-2 requires the sitemap list "every existing Mirror route". The sitemap
    // is driven by a hand-maintained registry (src/lib/routes.ts), decoupled from
    // the build's real page output — so a future story that adds a route but
    // forgets to extend the registry (e.g. 1.7 /browse, Epic 2 /glass-box/[…])
    // would silently omit it, and the hardcoded SITEMAP_ROUTES checks above would
    // pass anyway (they drift together with the registry). This binds the sitemap
    // to GROUND TRUTH: the actual <route>/index.html pages emitted into dist.
    //
    // Derive the live route set by walking dist for directory-index pages
    // (Astro's directory build.format), converting each to its absolute <loc> in
    // the same shape the sitemap uses (site root → "<origin>/").
    function liveRouteLocs(dir: string, base = ''): string[] {
      const out: string[] = [];
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          // Skip Astro's hashed asset dir — it holds no routable pages.
          if (entry.name === '_astro') continue;
          out.push(...liveRouteLocs(join(dir, entry.name), `${base}/${entry.name}`));
        } else if (entry.name === 'index.html') {
          // dist/index.html → "/"; dist/about/index.html → "/about/", etc. The
          // directory-index page IS the trailing-slash URL, which matches both
          // the page's self-canonical and the sitemap <loc> form.
          const route = base === '' ? '/' : `${base}/`;
          out.push(`${SITE_ORIGIN}${route}`);
        }
      }
      return out;
    }

    const liveLocs = liveRouteLocs(distDir).sort();
    const sitemapLocs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!).sort();

    // Set equality both directions: every built page is in the sitemap (no
    // missing route) AND every sitemap entry is a real built page (no phantom).
    expect(sitemapLocs).toEqual(liveLocs);
  });
});

describe('Story 1.6 — generated robots.txt (AC3 / IAC-2; NFR-3 GEO-first)', () => {
  const robotsPath = join(distDir, 'robots.txt');
  let robots = '';
  beforeAll(() => {
    robots = readFileSync(robotsPath, 'utf8');
  });

  // The AC3 minimum required AI-crawler tokens.
  const REQUIRED_AI_TOKENS = [
    'ClaudeBot',
    'GPTBot',
    'OAI-SearchBot',
    'PerplexityBot',
    'Google-Extended',
  ] as const;

  it('builds a robots.txt', () => {
    expect(existsSync(robotsPath)).toBe(true);
  });

  it('points to the absolute sitemap URL', () => {
    expect(robots).toContain(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`);
  });

  it.each(REQUIRED_AI_TOKENS)(
    'explicitly Allows the AI-crawler token %s (does NOT block it)',
    (token) => {
      // A `User-agent: <token>` group immediately followed by `Allow: /`.
      const block = robots.match(new RegExp(`User-agent:\\s*${token}\\s*\\nAllow:\\s*/`));
      expect(block, `Allow block for ${token}`).not.toBeNull();
      // And it is never Disallowed (NFR-3 — GEO-first, do not block AI crawlers).
      expect(robots).not.toMatch(new RegExp(`User-agent:\\s*${token}\\s*\\nDisallow:\\s*/`));
    },
  );

  it('ends with a catch-all User-agent: * / Allow: / (nothing is globally blocked)', () => {
    expect(robots).toMatch(/User-agent:\s*\*\s*\nAllow:\s*\//);
    // No blanket Disallow anywhere (GEO-first posture).
    expect(robots).not.toMatch(/Disallow:\s*\//);
  });
});

/* ──────────────────────────────────────────────────────────────────────────
 * Story 1.10 — env-gated cookieless Umami + the /about channel-clicked surface.
 *
 * Real `astro build` output (the consumer-observable form; AC2 / IAC-2,
 * skill-rules Rule 3). Two branches of the env-gate are proven against REAL
 * builds:
 *   • UNSET (the default build in the top beforeAll) → NO analytics script
 *     anywhere, so the 0-executable-script floor (NFR-1) holds with no live Umami.
 *   • SET (a SEPARATE build below, invoked with PUBLIC_UMAMI_* in the env, output
 *     to a temp dir so it never clobbers the default dist) → the cookieless Umami
 *     <script> renders in <head> with data-website-id, defer, and NO cookie.
 * The 0-JS /about channel-clicked data attributes are asserted on the default build.
 * ────────────────────────────────────────────────────────────────────────── */

describe('Story 1.10 — env-gated Umami is OFF by default (AC2 / IAC-2; NFR-1)', () => {
  // The default build (top beforeAll) has NO PUBLIC_UMAMI_* set, so the gate is
  // closed: there must be zero trace of Umami on any page. This is the explicit
  // regression-guard that the analytics wiring ships 0 JS unless deliberately
  // enabled (keeps the existing 0-executable-script assertions honest).
  const PAGES = ['/', '/about', '/speaking', '/faq'] as const;

  it.each(PAGES)(
    'emits NO Umami tracker script and NO data-website-id on %s (gate closed)',
    (route) => {
      const html = route === '/' ? indexHtml : readFileSync(routeHtmlPath(route), 'utf8');
      // The gate-closed discriminator is the TRACKER SCRIPT, not the literal word
      // "umami" — /about deliberately carries `data-umami-event="channel-clicked"`
      // attributes (0-JS click wiring), which must NOT be mistaken for the script.
      // So assert: no <script> that loads a umami tracker, and no data-website-id
      // (the script-only attribute) anywhere.
      expect(html).not.toMatch(/<script\b[^>]*umami/i);
      expect(html).not.toMatch(/data-website-id/i);
    },
  );

  it('keeps the home + every Mirror route at 0 executable scripts with the gate closed', () => {
    // Re-assert the floor specifically in the Umami context: the home keeps its
    // single scene-rail script; the Mirror routes keep zero. No Umami JS is added.
    expect(countExecutableScripts(indexHtml)).toBe(1);
    for (const route of MIRROR_ROUTES) {
      const html = readFileSync(routeHtmlPath(route), 'utf8');
      expect(countExecutableScripts(html), `executable scripts on ${route}`).toBe(0);
    }
  });
});

describe('Story 1.10 — /about channel links carry the 0-JS channel-clicked event (IAC-2)', () => {
  let aboutHtml = '';
  beforeAll(() => {
    aboutHtml = readFileSync(routeHtmlPath('/about'), 'utf8');
  });

  // The three sameAs channels (the Person.sameAs / visible-link set).
  const CHANNELS = ['YouTube', 'GitHub', 'Suno'] as const;

  it('marks each of the 3 channel <a>s with data-umami-event="channel-clicked"', () => {
    const tagged = aboutHtml.match(/data-umami-event="channel-clicked"/g) ?? [];
    expect(tagged).toHaveLength(CHANNELS.length);
  });

  it.each(CHANNELS)('carries the non-PII channel prop data-umami-event-channel="%s"', (channel) => {
    expect(aboutHtml).toContain(`data-umami-event-channel="${channel}"`);
  });

  it('attaches the event to the REAL channel <a> (followable JS-off), not a wrapper', () => {
    // Each channel anchor is still a real <a href> with rel="me" AND now carries
    // the umami data attributes on the SAME element — so the click is tracked with
    // zero app JS while the link stays followable with JS off.
    for (const channel of CHANNELS) {
      const anchor = aboutHtml.match(
        new RegExp(`<a\\b[^>]*data-umami-event="channel-clicked"[^>]*>\\s*${channel}\\s*</a>`),
      );
      expect(anchor, `tagged <a> for ${channel}`).not.toBeNull();
      expect(anchor![0]).toMatch(/\shref="/);
      expect(anchor![0]).toMatch(/\srel="me"/);
    }
  });

  it('adds NO executable JS to /about — the channel events are pure data attributes (NFR-1)', () => {
    // The data-umami-event attributes are handled by Umami's own script; the page
    // itself gains no executable <script> (only the existing ld+json DATA block).
    expect(countExecutableScripts(aboutHtml)).toBe(0);
    expect(aboutHtml).not.toMatch(/<script\b[^>]*\bsrc=/);
  });
});

describe('Story 1.10 — env-gated Umami is ON when PUBLIC_UMAMI_* is set (AC2 / IAC-2)', () => {
  // A SEPARATE real build with the gate OPEN. Built into a temp outDir with the
  // PUBLIC_UMAMI_* vars in the environment so Vite statically inlines them — the
  // authoritative proof of the SET branch (a single vitest process cannot flip a
  // build-time-inlined import.meta.env value, so we must build again).
  const UMAMI_SRC = 'https://umami.example.test/script.js';
  const UMAMI_WEBSITE_ID = '00000000-aaaa-bbbb-cccc-000000000000';

  let tmpOutDir = '';
  let homeHtml = '';
  let aboutHtml = '';

  beforeAll(() => {
    const require = createRequire(import.meta.url);
    const astroPkgJson = require.resolve('astro/package.json');
    const astroBin = join(dirname(astroPkgJson), 'bin', 'astro.mjs');

    // The temp outDir MUST live on the same filesystem as the project: Astro
    // finalizes a build by `rename`-ing assets out of web/.astro into the outDir,
    // and a rename across devices (e.g. project → /tmp) fails with EXDEV. So place
    // it INSIDE webRoot (gitignored via `.test-umami-build-*`) and clean it up.
    tmpOutDir = mkdtempSync(join(webRoot, '.test-umami-build-'));
    execFileSync('node', [astroBin, 'build', '--outDir', tmpOutDir], {
      cwd: webRoot,
      stdio: 'pipe',
      env: {
        ...process.env,
        PUBLIC_UMAMI_SRC: UMAMI_SRC,
        PUBLIC_UMAMI_WEBSITE_ID: UMAMI_WEBSITE_ID,
      },
    });

    homeHtml = readFileSync(join(tmpOutDir, 'index.html'), 'utf8');
    aboutHtml = readFileSync(join(tmpOutDir, 'about', 'index.html'), 'utf8');
  });

  afterAll(() => {
    if (tmpOutDir) rmSync(tmpOutDir, { recursive: true, force: true });
  });

  it('renders the Umami <script> in <head> with the configured src + data-website-id', () => {
    const headOnly = homeHtml.slice(0, homeHtml.indexOf('</head>'));
    const tag = headOnly.match(
      /<script\b[^>]*src="https:\/\/umami\.example\.test\/script\.js"[^>]*>/,
    );
    expect(tag, 'Umami <script> in <head>').not.toBeNull();
    expect(tag![0]).toContain(`data-website-id="${UMAMI_WEBSITE_ID}"`);
  });

  it('the Umami script is deferred and COOKIELESS (no cookie attribute/param)', () => {
    const tag = homeHtml.match(/<script\b[^>]*umami\.example\.test[^>]*>/)![0];
    expect(tag).toMatch(/\bdefer\b/);
    // Umami is cookieless by default — the embed sets no cookie option.
    expect(tag).not.toMatch(/cookie/i);
  });

  it('emits the Umami script on Mirror routes too (it lives in the shared BaseLayout head)', () => {
    expect(aboutHtml).toContain(`src="${UMAMI_SRC}"`);
    expect(aboutHtml).toContain(`data-website-id="${UMAMI_WEBSITE_ID}"`);
  });

  it('still carries the /about channel-clicked data attributes alongside the script', () => {
    // Enabling Umami does not change the 0-JS channel wiring — both coexist.
    expect((aboutHtml.match(/data-umami-event="channel-clicked"/g) ?? []).length).toBe(3);
  });

  it('adds EXACTLY ONE external Umami script — no duplicate injection per page', () => {
    const onHome = homeHtml.match(/src="https:\/\/umami\.example\.test\/script\.js"/g) ?? [];
    expect(onHome).toHaveLength(1);
  });
});
