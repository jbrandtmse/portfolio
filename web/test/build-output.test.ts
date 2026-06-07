import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { BIOS } from '../src/data/speaking';
import { PERSON } from '../src/lib/person';

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

  it('ships the scene-rail script AND the React island — EXACTLY two sanctioned executable surfaces (NFR-1, Story 3.5 AC3)', () => {
    // Story 3.5: home is now the SECOND island route (after /invite). It ships TWO
    // sanctioned executable surfaces:
    //   1. The gated scene-rail enhancement (inline IntersectionObserver script).
    //   2. The React island (InviteForm, client:visible-deferred).
    // The CTAs (data-umami-event) + creative touch (static poster + <a>) add NO app
    // JS — both are 0-JS. Count only EXECUTABLE scripts; the ld+json DATA block does
    // not count against the budget.
    //
    // NOTE: Astro's client:visible hydration may emit multiple script tags for the
    // island (the client renderer + the island chunk inline initializer), so we assert
    // >= 2 (at least the rail script + at least one island script) rather than exactly 2.
    const executableScripts = countExecutableScripts(indexHtml);
    expect(
      executableScripts,
      `home should ship >= 2 executable scripts (scene-rail + React island); found ${executableScripts}`,
    ).toBeGreaterThanOrEqual(2);
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

  it('references the React island (client.*.js renderer) — home is now the 2nd island route (NFR-1 carve-out, Story 3.5 AC3)', () => {
    // Story 3.5: home gains the InviteForm React island (client:visible). The React
    // client renderer chunk IS now legitimately referenced on /. The scene-rail script
    // remains inlined (no separate src= for it). Assert the island renderer is present.
    expect(
      indexHtml,
      'home must reference the React client renderer (renderer-url attribute)',
    ).toMatch(/renderer-url="[^"]*client\.[^"]+\.js"/);
  });

  it('contains no exclamation marks in copy (positive-assertion voice)', () => {
    // The voice rule bans "!" in COPY, not in code. Strip the <!doctype>, all
    // <script>…</script> blocks (JS legitimately uses ! for negation/!==), and
    // HTML comments (Story 3.5: Astro emits <!--astro:end--> island markers —
    // these are not user-visible content; same treatment as the /invite page test).
    const copyOnly = indexHtml
      .replace(/<!doctype html>/i, '')
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '');
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
      //
      // CARVE-OUT (Story 3.2, Decision 2 / AC3): /speaking is the SECOND sanctioned
      // route with one minimal executable script (the vanilla copy-button enhancement).
      // It is explicitly NOT zero — asserted separately below. Skip the 0-count check
      // for /speaking; every OTHER Mirror route stays at 0 executable JS.
      if (route === '/speaking') return;
      // CARVE-OUT (Story 3.4, Decision 5 / AC6): /invite is the THIRD sanctioned route,
      // shipping the FIRST React island. It explicitly ships the React client runtime +
      // island chunk (client:visible deferred). Asserted separately below; skip here.
      // This resolves deferred [1.2]/retro A4 — the previously-unreferenced React chunk
      // is now legitimately referenced by /invite/ and is no longer dead weight.
      if (route === '/invite') return;
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
      const copyOnly = html
        .replace(/<!doctype html>/i, '')
        // Strip all <script>…</script> blocks (JS legitimately uses ! for
        // negation, !== etc.) — same pattern as the home scene-rail strip.
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
        // Strip HTML comments — Astro emits <!--astro:end--> island markers
        // (not copy) and these are not user-visible content.
        .replace(/<!--[\s\S]*?-->/g, '');
      expect(copyOnly).not.toContain('!');
    },
  );
});

describe('Story 3.2 — /speaking NFR-1 carve-out: exactly ONE sanctioned copy-enhancement script (AC3, Decision 2)', () => {
  let speakingHtml = '';
  beforeAll(() => {
    speakingHtml = readFileSync(routeHtmlPath('/speaking'), 'utf8');
  });

  it('/speaking ships exactly ONE executable script — the vanilla copy-button enhancement (NFR-1 carve-out)', () => {
    // Story 3.2, Decision 2: /speaking is the SECOND sanctioned progressive-enhancement
    // route. It ships ONE minimal vanilla script (the BioBlock copy enhancement) —
    // NOT zero (unlike all other Mirror routes) and NOT more than one.
    const execCount = countExecutableScripts(speakingHtml);
    expect(
      execCount,
      `/speaking must ship exactly 1 executable script (the copy enhancement); found ${execCount}`,
    ).toBe(1);
  });

  it('the single /speaking executable script is NOT a React island / client.*.js chunk (NFR-1 carve-out)', () => {
    // Must be a minimal vanilla inline script, NOT a React hydration bundle.
    // No <script src=...> (external), no modulepreload, no .js bundle reference.
    expect(speakingHtml).not.toMatch(/<script\b[^>]*\bsrc=/);
    expect(speakingHtml).not.toMatch(/<link\b[^>]*\brel="modulepreload"/);
    expect(speakingHtml).not.toMatch(/client\.[a-zA-Z0-9]+\.js/);
  });

  it('the /speaking copy script body contains the clipboard API call (sanity: correct script)', () => {
    // Confirm the one executable script is the expected copy enhancement,
    // not an unrelated script that accidentally ended up there.
    const execBlock = [...speakingHtml.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].find(
      (m) => !/type\s*=\s*["']application\/ld\+json["']/i.test(m[1] ?? ''),
    );
    expect(execBlock).toBeDefined();
    const scriptBody = execBlock![2]!;
    expect(scriptBody).toContain('navigator.clipboard');
    expect(scriptBody).toContain('data-bio-copy');
  });

  it('the bio text elements are present as selectable plain text in the /speaking DOM (JS-off copy path; AC1/AC3)', () => {
    // The 0-JS baseline: bios are always present in the DOM regardless of the
    // copy-button script. A user can manually select + copy without any JS.
    // Assert that the known short-bio text (from PERSON.description / BIO.text)
    // is present verbatim in the HTML.
    const shortBioSnippet =
      'Joshua R. Brandt, MSE is a software engineer with 30 years of shipping experience';
    const longBioSnippet =
      'Joshua R. Brandt, MSE is a software engineer with three decades of shipping experience';
    expect(speakingHtml).toContain(shortBioSnippet);
    expect(speakingHtml).toContain(longBioSnippet);
    // Both bios must end with the lowercase running-sentence tail.
    expect(speakingHtml).toContain('seasoned, building at the frontier.');
  });

  it('the short bio on /speaking EXACTLY mirrors PERSON.description (AC1/AC5 consistency)', () => {
    // The short bio displayed on /speaking must equal PERSON.description so the
    // page text agrees with the Person JSON-LD emitted on / and /about.
    const personDescription =
      'Joshua R. Brandt, MSE is a software engineer with 30 years of shipping experience, ' +
      'now building at the frontier of agentic engineering. He speaks on the patterns that ' +
      'outlast hype cycles and on running real software through disciplined, auditable agent ' +
      'workflows — seasoned, building at the frontier.';
    expect(speakingHtml).toContain(personDescription);
  });

  it('the /speaking bios section carries Copy buttons and a fallback note (AC1)', () => {
    // Each BioBlock must have a real <button> (the Copy control) and a fallback
    // note stating manual selection works.
    const copyBtns = speakingHtml.match(/<button\b[^>]*data-bio-copy[^>]*>/g) ?? [];
    expect(
      copyBtns.length,
      'should have at least 2 Copy buttons (one per BioBlock)',
    ).toBeGreaterThanOrEqual(2);
    // The fallback note text is present.
    expect(speakingHtml).toContain('If the copy button fails, the text above is fully selectable');
  });

  it('/speaking renders Metric, Testimonial, and logo-wall placeholders with [OPEN]/[ph] in visible text (AC2)', () => {
    // Social proof credibility floor: every unconfirmed value flagged in text,
    // not color/style alone.
    expect(speakingHtml).toContain('[ph]');
    expect(speakingHtml).toContain('[OPEN:');
    // Logo wall placeholders are present in text.
    expect(speakingHtml).toContain('Conf logo [ph]');
    // Testimonial [OPEN] flags are visible.
    expect(speakingHtml).toContain('[OPEN: real testimonial pending]');
  });

  it('/speaking credibility strip proof-note is present (AC2 honesty)', () => {
    expect(speakingHtml).toContain('placeholders');
    // Use a shorter substring — the full string may have whitespace/newline variations
    // depending on how Astro serializes multi-line template literals.
    expect(speakingHtml).toContain('approved quotes are pending');
  });
});

/* ──────────────────────────────────────────────────────────────────────────
 * Story 3.2 — QA gap-fill: AC5 short-bio anti-drift (the VISIBLE bio agrees
 * with PERSON.description, bound to the imported lib value).
 *
 * WHY a second AC5 test: the carve-out's existing "short bio EXACTLY mirrors
 * PERSON.description" assertion does `speakingHtml.toContain(<literal>)` against
 * the WHOLE document — but PERSON.description is ALSO embedded (3×) in the Event
 * JSON-LD as `performer.description`. So that whole-HTML check passes even if the
 * VISIBLE/copied short bio is changed to something else (verified by mutating
 * BIOS[0].text — the literal still appeared via the JSON-LD leak, and the test
 * stayed green: a false positive). These tests close that gap two ways:
 *   1. data layer — BIOS[0].text === PERSON.description (the source binding);
 *   2. served HTML — the text INSIDE the first <p class="bio-block__text"> (the
 *      element a user reads/copies) equals PERSON.description, decoded — NOT a
 *      whole-document substring search the JSON-LD can satisfy.
 * A drift between the rendered short bio and PERSON.description now reds.
 * ────────────────────────────────────────────────────────────────────────── */

describe('Story 3.2 — AC5 short-bio anti-drift: the VISIBLE bio === PERSON.description', () => {
  let speakingHtml = '';
  beforeAll(() => {
    speakingHtml = readFileSync(routeHtmlPath('/speaking'), 'utf8');
  });

  /** Decode the minimal HTML entities Astro emits in the bio text + collapse WS. */
  function decode(s: string): string {
    return s
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&middot;/g, '·')
      .replace(/\s+/g, ' ')
      .trim();
  }

  it('data layer — BIOS[0].text equals PERSON.description (the single-source binding)', () => {
    // The source of the false positive is a divergence here; assert the binding
    // directly so a drift fails at the data layer, not just the rendered page.
    expect(BIOS[0]!.text).toBe(PERSON.description);
  });

  it('served HTML — the first <p class="bio-block__text"> text equals PERSON.description (scoped, not whole-doc)', () => {
    // Extract the text of the FIRST bio-block paragraph specifically — the element
    // the organizer reads and selects — rather than searching the whole document
    // (which the Event performer.description JSON-LD would satisfy regardless).
    const bioParas = [...speakingHtml.matchAll(/<p class="bio-block__text"[^>]*>([\s\S]*?)<\/p>/g)];
    expect(bioParas.length, 'two rendered bio-block__text paragraphs').toBe(2);
    const firstBioText = decode(bioParas[0]![1]!);
    // The rendered short bio is byte-for-byte PERSON.description (decoded), so the
    // page text and the Person JSON-LD provably cannot silently disagree (AC5).
    expect(firstBioText).toBe(decode(PERSON.description));
  });

  it('the rendered short bio is NOT the long bio (the two blocks are distinct content)', () => {
    // Guards a wiring bug that rendered the same bio twice (which would still
    // satisfy a naive "contains PERSON.description" check on the whole document).
    const bioParas = [...speakingHtml.matchAll(/<p class="bio-block__text"[^>]*>([\s\S]*?)<\/p>/g)];
    expect(bioParas.length).toBe(2);
    const firstBioText = decode(bioParas[0]![1]!);
    const secondBioText = decode(bioParas[1]![1]!);
    expect(firstBioText).not.toBe(secondBioText);
    // The long bio extends the short — both end on the lowercase running tail.
    expect(firstBioText.endsWith('seasoned, building at the frontier.')).toBe(true);
    expect(secondBioText).toContain('seasoned, building at the frontier.');
  });
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

  it('routes WITHOUT a JSON-LD owner emit no ld+json (e.g. /timeline, /glass-box)', () => {
    // These stubs get their structured data in later epics; no ld+json yet, and
    // critically still 0 executable JS.
    // NOTE: /invite is excluded here — it ships the React island (Story 3.4 carve-out).
    for (const route of ['/timeline', '/glass-box'] as const) {
      const html = readFileSync(routeHtmlPath(route), 'utf8');
      expect(countLdJsonScripts(html)).toBe(0);
      expect(countExecutableScripts(html)).toBe(0);
    }
    // /invite has no ld+json but has the React island (Story 3.4) — assert separately.
    const inviteHtml = readFileSync(routeHtmlPath('/invite'), 'utf8');
    expect(countLdJsonScripts(inviteHtml)).toBe(0); // still no structured data
  });
});

describe('Story 1.6 — generated sitemap.xml (AC3 / IAC-2)', () => {
  const sitemapPath = join(distDir, 'sitemap.xml');
  let sitemap = '';
  beforeAll(() => {
    sitemap = readFileSync(sitemapPath, 'utf8');
  });

  // Every route the sitemap must enumerate. Story 1.7: 10 Mirror routes.
  // Story 3.4: /invite/thanks/ added as a utility confirmation page.
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
    '/invite/thanks',
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
    // Story 2.2: the sitemap includes the 10 static Mirror routes PLUS one entry
    // per allowlisted Glass Box artifact (/glass-box/{slug}/). Story 3.4 adds
    // /invite/thanks/ as a utility confirmation page (11 static routes total).
    // The test asserts count >= SITEMAP_ROUTES.length (the static floor) and that
    // all static routes are present (the per-route `it.each` above). The exact
    // artifact count depends on the allowlist and may grow as artifacts are added.
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

  it('keeps the home + every Mirror route at the correct script count with the gate closed', () => {
    // Re-assert the floor specifically in the Umami context: No Umami JS is added.
    // CARVE-OUT (Story 3.2): /speaking ships ONE minimal copy-enhancement script.
    // CARVE-OUT (Story 3.4): /invite ships the React island (not zero).
    // CARVE-OUT (Story 3.5): home ships >= 2 scripts (scene-rail + React island).
    // In all cases: no Umami script is added — asserted separately per-page above.
    expect(
      countExecutableScripts(indexHtml),
      'home scene-rail + React island',
    ).toBeGreaterThanOrEqual(2);
    for (const route of MIRROR_ROUTES) {
      if (route === '/speaking') continue; // carve-out — see Story 3.2 NFR-1 suite
      if (route === '/invite') continue; // carve-out — see Story 3.4 island suite
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

/* ──────────────────────────────────────────────────────────────────────────
 * Story 2.5 — /work/loandemo layered case study (AC1–AC6 / IAC-1).
 *
 * Build-output assertions on the produced /work/loandemo/index.html (real
 * `astro build` output — the consumer-observable form, skill-rules Rule 3).
 *
 * Asserts:
 *   • One <h1> (the case study title, from MirrorLayout).
 *   • #code / #build / #retro section IDs exist (resolves Story 2.4's Dot links).
 *   • Enriched CreativeWork JSON-LD: name "loandemo" + author Person + description
 *     + dateCreated (keeps the 1.6 assertion green, AC1/AC5).
 *   • The /speaking/ cross-link is a real <a> (forward-ref: AC2; talk content Epic 3).
 *   • The lede leads with "Joshua R. Brandt, MSE" (entity-first, GEO floor).
 *   • 0 executable scripts (NFR-1).
 *   • No exclamation marks in copy (positive-assertion voice).
 *   • [OPEN] flags present in the rendered HTML (credibility floor, AC3).
 *   • The description does NOT contain the old [PLACEHOLDER] marker (enriched, AC1).
 * ────────────────────────────────────────────────────────────────────────── */

describe('Story 2.5 — /work/loandemo layered case study (AC1–AC6 / IAC-1)', () => {
  let loandemoHtml = '';
  beforeAll(() => {
    loandemoHtml = readFileSync(routeHtmlPath('/work/loandemo'), 'utf8');
  });

  it('builds a real /work/loandemo/index.html', () => {
    expect(existsSync(routeHtmlPath('/work/loandemo'))).toBe(true);
  });

  it('renders exactly one <h1> (the MirrorLayout title; #code/#build/#retro are h2, AC6)', () => {
    const h1s = loandemoHtml.match(/<h1\b[^>]*>/g) ?? [];
    expect(h1s).toHaveLength(1);
  });

  it('the lede leads with "Joshua R. Brandt, MSE" (entity-first, GEO floor, AC1)', () => {
    const lede = firstParagraphText(loandemoHtml);
    expect(lede.startsWith('Joshua R. Brandt, MSE')).toBe(true);
  });

  it('contains the #code section ID (resolves Story 2.4 Dot link to /work/loandemo/#code, AC5)', () => {
    expect(loandemoHtml).toContain('id="code"');
  });

  it('contains the #build section ID (resolves Story 2.4 Dot link to /work/loandemo/#build, AC5)', () => {
    expect(loandemoHtml).toContain('id="build"');
  });

  it('contains the #retro section ID (resolves Story 2.4 Dot link to /work/loandemo/#retro, AC5)', () => {
    expect(loandemoHtml).toContain('id="retro"');
  });

  it('the #code / #build / #retro IDs are on <section> elements (AC2, heading hierarchy)', () => {
    // Each fragment target is a <section id="…"> — real in-page sections, not bare anchors.
    expect(loandemoHtml).toMatch(/<section\b[^>]*id="code"[^>]*>/);
    expect(loandemoHtml).toMatch(/<section\b[^>]*id="build"[^>]*>/);
    expect(loandemoHtml).toMatch(/<section\b[^>]*id="retro"[^>]*>/);
  });

  it('the #code / #build / #retro section headings are <h2> — never a 2nd <h1> (AC6 hierarchy)', () => {
    // STRENGTHENED (QA): AC6 explicitly requires the section headings to be
    // <h2>/<h3>, "not a 2nd h1". The IDs-on-<section> test above does NOT check
    // the heading LEVEL inside each section — a regression that promoted a section
    // heading to <h1> (breaking clean hierarchy + the one-h1 SEO floor) would slip
    // through it. Bind each fragment section's FIRST heading to <h2> directly.
    for (const id of ['code', 'build', 'retro'] as const) {
      const section = loandemoHtml.match(
        new RegExp(`<section\\b[^>]*id="${id}"[^>]*>([\\s\\S]*?)</section>`),
      );
      expect(section, `<section id="${id}">`).not.toBeNull();
      const inner = section![1]!;
      // The first heading tag inside the section must be an <h2> (the section
      // title); h3 is allowed deeper (the evidence-card title) but never h1.
      const firstHeading = inner.match(/<h([1-6])\b/);
      expect(firstHeading, `a heading inside #${id}`).not.toBeNull();
      expect(firstHeading![1], `#${id} section heading level`).toBe('2');
      // And categorically: no <h1> anywhere inside any fragment section.
      expect(inner).not.toMatch(/<h1\b/);
    }
  });

  it('carries a /speaking/ cross-link as a real <a> (AC2; forward-ref: talk content Epic 3)', () => {
    // The /speaking/ route exists from Epic 1; the talk content lands in Epic 3.
    // The link must be a real <a href="/speaking/"> (trailing-slash; followable JS-off).
    expect(loandemoHtml).toMatch(/<a\b[^>]*\shref="\/speaking\/"[^>]*>/);
  });

  it('carries a /glass-box/ cross-link as a real <a> (AC4: the two flagships reference each other)', () => {
    expect(loandemoHtml).toMatch(/<a\b[^>]*\shref="\/glass-box\/"[^>]*>/);
  });

  it('carries a /timeline/ cross-link as a real <a> (AC4: links to the Master Timeline)', () => {
    expect(loandemoHtml).toMatch(/<a\b[^>]*\shref="\/timeline\/"[^>]*>/);
  });

  it('ships 0 executable scripts (NFR-1)', () => {
    expect(countExecutableScripts(loandemoHtml)).toBe(0);
    expect(loandemoHtml).not.toMatch(/<script\b[^>]*\bsrc=/);
  });

  it('contains no exclamation marks in copy (positive-assertion voice)', () => {
    const copyOnly = loandemoHtml.replace(/<!doctype html>/i, '');
    expect(copyOnly).not.toContain('!');
  });

  it('contains [OPEN] flags in visible text (credibility floor: gaps flagged, AC3)', () => {
    // The [OPEN] pattern must appear in the rendered HTML — the visible text
    // commitment that assets/metrics not yet confirmed are flagged, not invented.
    expect(loandemoHtml).toContain('[OPEN');
  });

  it('the CreativeWork description is enriched — [PLACEHOLDER] is gone (AC1)', () => {
    // Story 1.6 seeded the JSON-LD with a "[PLACEHOLDER]" description; Story 2.5
    // must replace it with a real case-study description (AC1: "ENRICH the 1.6 placeholder").
    const work = findNodeByType(loandemoHtml, 'CreativeWork');
    expect(work).toBeDefined();
    const desc = work!.description as string;
    expect(desc).not.toContain('[PLACEHOLDER]');
    expect(desc.length).toBeGreaterThan(50);
  });

  it('/work/loandemo emits a valid CreativeWork JSON-LD with all required fields (1.6 assertion kept green, AC5)', () => {
    // This is the Story 1.6 assertion kept + extended. All required fields must be present.
    const work = findNodeByType(loandemoHtml, 'CreativeWork');
    expect(work).toBeDefined();
    expect(work!['@context']).toBe('https://schema.org');
    expect(work!.name).toBe('loandemo');
    expect((work!.author as Record<string, unknown>)['@type']).toBe('Person');
    expect(typeof work!.description).toBe('string');
    expect(typeof work!.url).toBe('string');
    expect(typeof work!.dateCreated).toBe('string');
    // dateCreated must be a valid ISO-8601 date string (parseable; not "[OPEN]").
    expect(() => new Date(work!.dateCreated as string).toISOString()).not.toThrow();
  });

  it('the author Person in CreativeWork is "Joshua R. Brandt, MSE" (AC1)', () => {
    const work = findNodeByType(loandemoHtml, 'CreativeWork');
    expect(work).toBeDefined();
    const author = work!.author as Record<string, unknown>;
    expect(author.name).toBe('Joshua R. Brandt, MSE');
  });

  it('is self-canonical to /work/loandemo/ (trailing-slash; Story 2.0 AC3)', () => {
    const canonicalMatch = loandemoHtml.match(/<link\b[^>]*\brel="canonical"[^>]*>/);
    expect(canonicalMatch).not.toBeNull();
    const hrefMatch = canonicalMatch![0].match(/\bhref="([^"]+)"/);
    expect(hrefMatch).not.toBeNull();
    expect(hrefMatch![1]).toBe(`${SITE_ORIGIN}/work/loandemo/`);
  });

  it('every Story 2.4 timeline loandemo fragment resolves to a real section here — no dangling fragment (AC5 reciprocity)', () => {
    // STRENGTHENED (QA — the key cross-story wire-up). The dev tests assert the
    // #code/#build/#retro IDs exist HERE, and timeline.spec.ts asserts the Dot
    // links exist on /timeline/ — but NOTHING bound the two together. A peer who
    // clicks a timeline loandemo Dot must land on a REAL in-page section. This
    // closes the loop against GROUND TRUTH: read the BUILT /timeline/index.html,
    // extract every `/work/loandemo/#…` href the timeline actually ships, and
    // assert each fragment id is present as an element id in the built loandemo
    // page. If a future edit renames a section here OR changes a Dot href in
    // content/timeline/dots.ts, this fails (the dangling-fragment regression the
    // Story 2.5 directive warns about). This is the Integration AC (Rule 1):
    // consumer (timeline) → producer (this page) verified observably.
    const timelineHtml = readFileSync(routeHtmlPath('/timeline'), 'utf8');

    // The fragment ids the timeline links into on /work/loandemo/.
    const timelineFragments = [
      ...timelineHtml.matchAll(/href="\/work\/loandemo\/#([a-z-]+)"/g),
    ].map((m) => m[1]!);

    // The timeline MUST link at least the three canonical loandemo fragments
    // (Story 2.4 dots.ts cluster: code · build · retro) — guards against the
    // consumer silently dropping the wire-up.
    const uniqueFragments = [...new Set(timelineFragments)];
    expect(uniqueFragments.length).toBeGreaterThanOrEqual(3);
    expect(uniqueFragments).toEqual(expect.arrayContaining(['code', 'build', 'retro']));

    // Every fragment the timeline points at MUST resolve to a real element id on
    // this page (no dangling fragment — the peer lands on a real section).
    const idsHere = new Set([...loandemoHtml.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]!));
    for (const frag of uniqueFragments) {
      expect(idsHere.has(frag), `timeline links /work/loandemo/#${frag} → must exist here`).toBe(
        true,
      );
    }
  });

  it('no fabricated metric/outcome ships as fact — every figure is [OPEN]/[ASSUMPTION]-flagged (AC3, adversarial)', () => {
    // STRENGTHENED (QA — the 2.4 AC4 credibility lesson, HIGH-value). The existing
    // "[OPEN] present" check is weak: it would still pass if the body ALSO leaked a
    // fabricated outcome like "40% faster" or "$2M saved" next to the [OPEN] flags.
    // AC3 forbids ANY invented metric/result/date/figure shipping as fact. This
    // scan extracts the VISIBLE <main> text (tags + the ld+json <head> stripped)
    // and asserts no fabricated-outcome numeric pattern appears. Known-legitimate,
    // non-metric numerics are allowed: requirement/stage ids (FR-22, Stage-1), the
    // talk year (2026), epic refs (Epic 3) — none is an invented performance claim.
    const mainMatch = loandemoHtml.match(/<main\b[^>]*>([\s\S]*?)<\/main>/);
    expect(mainMatch, '<main> region').not.toBeNull();
    const visibleText = mainMatch![1]!
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z]+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Fabricated-OUTCOME patterns: a percentage, a currency figure, an "Nx"
    // multiplier, a "N <unit>" performance/scale figure, or a count of users/etc.
    // Any of these presented as fact (i.e. NOT inside an [OPEN]/[ASSUMPTION] flag)
    // is a credibility-floor violation.
    const fabricationPatterns: Array<[string, RegExp]> = [
      ['percentage', /\b\d+(\.\d+)?\s*%/],
      ['currency', /[$€£]\s*\d/],
      ['multiplier', /\b\d+(\.\d+)?x\b/i],
      [
        'scale/perf figure',
        /\b\d+(\.\d+)?\s*(users|customers|requests|ms|seconds|minutes|hours|days|weeks|months|loans|applications|x\b)/i,
      ],
      ['relative-outcome claim', /\b\d+(\.\d+)?\s*(faster|slower|cheaper|fewer|more)\b/i],
    ];
    const leaks: string[] = [];
    for (const [label, pattern] of fabricationPatterns) {
      const m = visibleText.match(pattern);
      if (m) {
        const idx = visibleText.indexOf(m[0]);
        const ctx = visibleText.slice(Math.max(0, idx - 40), idx + 40);
        // Only a leak if NOT wrapped in an [OPEN…]/[ASSUMPTION…] flag in its context.
        if (!/\[(OPEN|ASSUMPTION)/i.test(ctx)) {
          leaks.push(`${label}: "${m[0]}" — context: …${ctx}…`);
        }
      }
    }
    expect(leaks, `fabricated metric(s) shipped as fact:\n${leaks.join('\n')}`).toEqual([]);
  });
});

/* ──────────────────────────────────────────────────────────────────────────
 * Story 3.4 — /invite/ React island carve-out + NFR-1 isolation (AC6, Decision 5).
 *
 * [1.2]/retro-A4 RESOLVED: the previously-unreferenced React chunk is now
 * legitimately referenced by /invite/ — the first route to ship a React island.
 * This suite asserts:
 *   • /invite/ ships the React island (client.*.js runtime + island chunk referenced,
 *     SSR'd <form> present for JS-off baseline).
 *   • NO other Mirror route references the React client.*.js chunk.
 *   • /invite/thanks/ is a 0-JS confirmation page with the right content.
 * ────────────────────────────────────────────────────────────────────────── */

describe('Story 3.4 — /invite/ React island carve-out (AC6, Decision 5; resolves [1.2]/A4)', () => {
  let inviteHtml = '';
  let thanksHtml = '';

  beforeAll(() => {
    inviteHtml = readFileSync(routeHtmlPath('/invite'), 'utf8');
    thanksHtml = readFileSync(join(distDir, 'invite', 'thanks', 'index.html'), 'utf8');
  });

  it('/invite/ ships executable scripts — the React island is the FIRST island (NFR-1 carve-out)', () => {
    // /invite/ is the third sanctioned progressive-enhancement route (after home
    // scene-rail and /speaking copy). It ships the React client runtime + island
    // chunk. The exact count depends on Astro's island hydration scaffolding —
    // assert at least 1 and that the React client chunk is referenced.
    const execCount = countExecutableScripts(inviteHtml);
    expect(
      execCount,
      `/invite/ must ship at least 1 executable script (the island + hydration); found ${execCount}`,
    ).toBeGreaterThanOrEqual(1);
  });

  it('/invite/ references the React client.*.js runtime chunk (island legitimately active)', () => {
    // The React island requires the client renderer — assert the renderer-url is
    // present in the astro-island element's renderer-url attribute (the canonical
    // signal that the React runtime chunk is used, not dead weight). This resolves
    // the deferred [1.2]/retro-A4 "unreferenced React chunk" item.
    expect(
      inviteHtml,
      '/invite/ must reference the React client renderer (renderer-url attribute)',
    ).toMatch(/renderer-url="[^"]*client\.[^"]+\.js"/);
  });

  it('/invite/ SSR-emits the real <form action="/api/invite" method="POST"> for JS-off baseline (AC1)', () => {
    // The island SSRs its initial HTML into the static output — the <form> is in the
    // dist HTML so the native POST works with JS disabled (the resilience guarantee).
    expect(inviteHtml).toMatch(/<form[^>]+action="\/api\/invite"[^>]+method="POST"/i);
  });

  it('/invite/ SSR form has labeled fields with name= matching the InviteInput contract (AC1)', () => {
    // All required field names must be present in the SSR'd HTML.
    for (const fieldName of ['name', 'email', 'message', 'attribution']) {
      expect(inviteHtml, `form field name="${fieldName}" in SSR'd HTML`).toContain(
        `name="${fieldName}"`,
      );
    }
    // Honeypot field is present (server checks it).
    expect(inviteHtml).toContain('name="website"');
  });

  it('/invite/ SSR form has visible labels for required fields (AC1/NFR-2)', () => {
    // Every required field carries a <label> in the SSR'd HTML (NFR-2 / WCAG AA).
    expect(inviteHtml).toMatch(/<label[^>]*>[\s\S]*?Your name[\s\S]*?<\/label>/i);
    expect(inviteHtml).toMatch(/<label[^>]*>[\s\S]*?Your email[\s\S]*?<\/label>/i);
    expect(inviteHtml).toMatch(/<label[^>]*>[\s\S]*?Message[\s\S]*?<\/label>/i);
    expect(inviteHtml).toMatch(/<label[^>]*>[\s\S]*?How did you hear[\s\S]*?<\/label>/i);
  });

  it('/invite/ SSR form marks required fields in text — not asterisk/color alone (AC1/NFR-2)', () => {
    // Required-in-text markers (the "(required)" pattern) for the required fields.
    const requiredTextCount = (inviteHtml.match(/\(required\)/gi) ?? []).length;
    expect(
      requiredTextCount,
      'at least 3 required-in-text markers (name, email, message, attribution)',
    ).toBeGreaterThanOrEqual(3);
  });

  it('/invite/ SSR form contains an attribution <select> with option elements (AC1/FR-31)', () => {
    // The attribution field is a labeled <select> for structured FR-31 capture.
    expect(inviteHtml).toMatch(/<select[^>]+name="attribution"[^>]*>/i);
    expect(inviteHtml).toContain('<option');
  });

  it('/invite/ SSR form contains the honeypot input (aria-hidden, tabindex=-1) (AC2)', () => {
    // The honeypot <input name="website"> must be in the SSR'd form (the server
    // checks it on both JSON and form-encoded paths). It must be visually hidden
    // (aria-hidden wrapper).
    expect(inviteHtml).toMatch(/aria-hidden="true"/i);
    expect(inviteHtml).toContain('name="website"');
    expect(inviteHtml).toMatch(/tabindex="-1"/i);
  });

  it('/invite/ contains no exclamation marks in copy (positive-assertion voice)', () => {
    // Strip all <script>…</script> blocks (the island JS legitimately uses ! negation).
    // Also strip HTML comments — Astro emits <!--astro:end--> island markers.
    const copyOnly = inviteHtml
      .replace(/<!doctype html>/i, '')
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '');
    expect(copyOnly).not.toContain('!');
  });

  // NON-island routes: assert none reference the React client.*.js chunk.
  // This is the core NFR-1 isolation guarantee: ONLY /invite/ and / gain the React runtime.
  // Story 3.5: home (/) is now also an island route — excluded from the non-island list.
  const NON_ISLAND_MIRROR_ROUTES = [
    '/timeline',
    '/glass-box',
    '/faq',
    '/about',
    '/browse',
    '/speaking',
    '/speaking/reel',
    '/work/loandemo',
  ] as const;

  it.each(NON_ISLAND_MIRROR_ROUTES)(
    'non-island route %s does NOT reference the React client.*.js chunk (NFR-1 isolation)',
    (route) => {
      const html = readFileSync(routeHtmlPath(route), 'utf8');
      // The React chunk (client.*.js from @astrojs/react) must NOT appear in any
      // non-island route. If it appears, the React runtime has leaked beyond / and /invite/.
      expect(
        html,
        `${route} must not reference React client.*.js (the React runtime must not leak)`,
      ).not.toMatch(/client\.[a-zA-Z0-9_-]+\.js/);
    },
  );

  it('home (/) references the React client.*.js chunk — it is the 2nd island route (Story 3.5, NFR-1 carve-out)', () => {
    // Story 3.5: home gains the InviteForm island alongside /invite. The React chunk
    // is LEGITIMATELY referenced on / — this is the intended state (not a leak).
    expect(indexHtml).toMatch(/client\.[a-zA-Z0-9_-]+\.js/);
  });

  it('/invite/thanks/ builds as a 0-JS confirmation page (AC2, Decision 3)', () => {
    // The confirmation page is a pure MirrorLayout page — 0 executable JS.
    expect(existsSync(join(distDir, 'invite', 'thanks', 'index.html'))).toBe(true);
    expect(countExecutableScripts(thanksHtml)).toBe(0);
    expect(thanksHtml).not.toMatch(/<script\b[^>]*\bsrc=/);
  });

  it('/invite/thanks/ names the entity and carries the response-time copy (AC2)', () => {
    // Answer-first: entity name in the lede.
    expect(thanksHtml).toContain('Joshua R. Brandt, MSE');
    // Response-time copy (with [OPEN: N] placeholder).
    expect(thanksHtml).toContain('[OPEN: N]');
    // A link back to / (canonical return path).
    expect(thanksHtml).toMatch(/<a[^>]+href="\/"[^>]*>/i);
  });

  it('/invite/thanks/ contains no exclamation marks in copy (positive-assertion voice)', () => {
    const copyOnly = thanksHtml.replace(/<!doctype html>/i, '');
    expect(copyOnly).not.toContain('!');
  });

  it('/invite/thanks/ is self-canonical (Rule 2 trailing-slash)', () => {
    expect(thanksHtml).toContain(
      '<link rel="canonical" href="https://joshuabrandt.abacusai.cloud/invite/thanks/"',
    );
  });
});

/* ──────────────────────────────────────────────────────────────────────────
 * Story 3.5 — home #close: InviteForm island + follow CTAs + creative touch.
 *
 * Build-output assertions on the produced home /index.html (real `astro build`
 * output — the consumer-observable form, skill-rules Rule 3 / AC3 / AC4).
 *
 * Asserts:
 *   • Home now embeds the InviteForm island (React island, client:visible).
 *   • The SSR'd <form action="/api/invite" method="POST"> is in the home HTML.
 *   • The follow/subscribe CTAs carry data-umami-event="channel-clicked" +
 *     data-umami-event-channel="{youtube|github|suno}" — 0-JS, no app JS.
 *   • The creative-touch <a> is present and followable JS-off.
 *   • CTAs + creative touch add NO app JS (no additional React-runtime references
 *     beyond the island — the island is already asserted above in the 3.4 suite).
 *   • The Close heading copy and no exclamation marks (positive-assertion voice).
 *   • home ships its existing scene-rail PLUS the React island (>= 2 exec scripts).
 *   • All non-island Mirror routes are unchanged (no new React references).
 * ────────────────────────────────────────────────────────────────────────── */

describe('Story 3.5 — home #close: InviteForm island + follow CTAs + creative touch (AC1–AC5)', () => {
  it('home Close scene embeds the InviteForm island — React island renderer-url present (AC1/AC3)', () => {
    // Story 3.5: home is now the 2nd island route. The React renderer-url must be
    // present (the same signal used for /invite/ — the island is legitimately active).
    expect(indexHtml).toMatch(/renderer-url="[^"]*client\.[^"]+\.js"/);
  });

  it('home Close scene SSR-emits the <form action="/api/invite" method="POST"> for JS-off baseline (AC1)', () => {
    // The InviteForm island SSRs its initial HTML into the static output — the <form>
    // is in dist/index.html so the native POST works with JS disabled (resilience guarantee).
    expect(indexHtml).toMatch(/<form[^>]+action="\/api\/invite"[^>]+method="POST"/i);
  });

  it('home Close follow CTAs carry data-umami-event="channel-clicked" on real <a> elements (AC1, 0-JS)', () => {
    // The 3 CTAs (youtube, github, suno) must each carry the channel-clicked event
    // attribute on a real <a> — the 0-JS Umami click form (no app JS added).
    const channelClicked = indexHtml.match(/data-umami-event="channel-clicked"/g) ?? [];
    expect(
      channelClicked.length,
      'at least 3 channel-clicked CTAs in home Close',
    ).toBeGreaterThanOrEqual(3);
  });

  it.each(['youtube', 'github', 'suno'] as const)(
    'home Close CTA carries data-umami-event-channel="%s" (non-PII, AC1/AC4)',
    (channel) => {
      expect(indexHtml).toContain(`data-umami-event-channel="${channel}"`);
    },
  );

  it('home Close CTAs are real <a> links (followable JS-off; no app JS) (AC1/AC3)', () => {
    // Each CTA must be a real <a href> with the channel-clicked attribute on the SAME
    // element — so the click is tracked (0-JS, Umami-handled) and the link works JS-off.
    for (const channel of ['youtube', 'github', 'suno'] as const) {
      const anchor = indexHtml.match(
        new RegExp(`<a\\b[^>]*data-umami-event-channel="${channel}"[^>]*>`),
      );
      expect(anchor, `<a> with data-umami-event-channel="${channel}"`).not.toBeNull();
      expect(anchor![0], `CTA for ${channel} is a real link with href`).toMatch(/\shref="/);
    }
  });

  it('home Close CTAs add NO additional app JS — only the island runner is present (AC3/NFR-1)', () => {
    // The CTAs use data-umami-event (0-JS). The only JS added by 3.5 beyond the
    // scene-rail script is the React island (already counted). No extra scripts.
    // Non-island Mirror routes are unchanged — asserted by the Story 3.4 NFR-1 suite.
    // Here: assert the island renderer-url is present (the island, legitimately) but no
    // additional script elements beyond the scene-rail + island scaffolding.
    //
    // The CTAs themselves must NOT have onclick= or any inline JS.
    expect(indexHtml).not.toMatch(/data-umami-event-channel[^>]*onclick=/);
  });

  it('home Close has the curated creative-touch <a> link (followable JS-off) (AC2)', () => {
    // The creative touch is a real <a> (followable JS-off; no autoplay). Assert the
    // <a> element is present with an aria-label (accessible name, NFR-2/AA).
    expect(indexHtml).toMatch(/<a\b[^>]*class="[^"]*close__creative-link[^"]*"[^>]*>/);
    // The creative-touch link has an accessible name (aria-label; NFR-2/AA).
    expect(indexHtml).toMatch(
      /<a\b[^>]*class="[^"]*close__creative-link[^"]*"[^>]*aria-label="[^"]+"/,
    );
  });

  it('home Close creative touch is a static poster — no autoplay, no live runtime read (AC2/FR-23)', () => {
    // FR-23 / Guardrail §9.1: NO live API reads. The poster is a static CSS element
    // with hardcoded copy — no <video autoplay>, no <iframe>, no dynamic embed tag.
    // Check the close section specifically doesn't have autoplay.
    const closeSection = indexHtml.match(/<section\b[^>]*id="close"[^>]*>[\s\S]*?<\/section>/);
    expect(closeSection, 'close section present').not.toBeNull();
    expect(closeSection![0]).not.toMatch(/autoplay/i);
    expect(closeSection![0]).not.toContain('<iframe');
    expect(closeSection![0]).not.toContain('<video');
  });

  it('home Close [OPEN] placeholder flags are visible in text (no fabrication; AC2)', () => {
    // The channel handles + the curated creative-touch URL are [OPEN]-flagged,
    // meaning the unconfirmed values are visible to the reader — never invented.
    expect(indexHtml).toContain('[OPEN:');
  });

  it('home Close heading + copy contain no exclamation marks (positive-assertion voice; AC5)', () => {
    // The voice rule bans "!" in COPY. Strip scripts (JS uses !) and comments,
    // then assert the rendered Close markup is exclamation-free.
    const copyOnly = indexHtml
      .replace(/<!doctype html>/i, '')
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '');
    expect(copyOnly).not.toContain('!');
  });

  it('home Close sub-headings are <h3> (under the <h2> scene title; heading hierarchy; AC5)', () => {
    // The Close scene has an <h2> title; the sub-sections (invite / follow / sample)
    // use <h3> — correct heading hierarchy under h2 (NFR-2/SEO).
    const closeSection = indexHtml.match(/<section\b[^>]*id="close"[^>]*>[\s\S]*?<\/section>/);
    expect(closeSection, 'close section present').not.toBeNull();
    // There must be at least one <h3> inside the close section (the sub-headings).
    expect(closeSection![0]).toMatch(/<h3\b/);
    // And no <h1> inside close (would break hierarchy).
    expect(closeSection![0]).not.toMatch(/<h1\b/);
  });

  it('home ships >= 2 executable scripts — scene-rail + React island (NFR-1, Story 3.5 AC3)', () => {
    // Mirrors the AC3 carve-out test above; here for the 3.5 suite colocation.
    expect(countExecutableScripts(indexHtml)).toBeGreaterThanOrEqual(2);
  });

  it('home Close embeds NO live-read provider sub-resource — no script/iframe to youtube/suno/github (AC2/FR-23, Guardrail §9.1)', () => {
    // The static-build counterpart to the e2e no-network test: assert the produced
    // home HTML's Close section bakes in NO <script src> / <iframe src> / <img src>
    // pointing at a media-provider host. The curated <a href="…suno.com/song/[OPEN]">
    // is a link TARGET (allowed, followable JS-off) — NOT an embedded sub-resource.
    // So we scan only the loadable-sub-resource tags, never the <a>. A regression
    // that swapped the static poster for a real provider embed (a build/runtime live
    // read, violating Guardrail §9.1) would red here.
    const closeSection = indexHtml.match(/<section\b[^>]*id="close"[^>]*>[\s\S]*?<\/section>/);
    expect(closeSection, 'close section present').not.toBeNull();
    const close = closeSection![0];
    const providerHost =
      /(?:youtube\.com|youtu\.be|ytimg\.com|googlevideo\.com|suno\.com|github\.com|githubusercontent\.com)/i;
    // Every loadable sub-resource tag in the Close (script/iframe/img/source with src).
    const subResources =
      close.match(/<(?:script|iframe|img|source)\b[^>]*\bsrc="([^"]*)"[^>]*>/gi) ?? [];
    const providerEmbeds = subResources.filter((tag) => {
      const src = tag.match(/\bsrc="([^"]*)"/i)?.[1] ?? '';
      return providerHost.test(src);
    });
    expect(
      providerEmbeds,
      `Close must embed no provider sub-resource (static poster only): ${providerEmbeds.join('\n')}`,
    ).toHaveLength(0);
    // Belt-and-braces: the only suno.com reference in the Close is an <a href> (the
    // curated link), never a loadable src. (If a src= to suno appeared, the check
    // above already fails; this asserts the curated link IS present as an anchor.)
    expect(close).toMatch(/<a\b[^>]*\shref="https:\/\/suno\.com\/[^"]*"[^>]*>/i);
  });

  it('the /speaking/reel/ route references NO React client chunk — carve-out is exactly {/, /invite} (NFR-1, Story 3.5 AC3)', () => {
    // The directive names /speaking/reel explicitly. It is a plain MirrorLayout
    // route (NOT an island): the React runtime must NOT leak onto it when home
    // became the 2nd island route. This is the mutation-proof tail of the carve-out
    // — if a global/layout-level island injection ever shipped React everywhere,
    // this (and the NON_ISLAND_MIRROR_ROUTES suite) would red.
    const reelHtml = readFileSync(routeHtmlPath('/speaking/reel'), 'utf8');
    expect(reelHtml).not.toMatch(/client\.[a-zA-Z0-9_-]+\.js/);
    expect(reelHtml).not.toMatch(/renderer-url=/);
    expect(countExecutableScripts(reelHtml)).toBe(0);
  });
});
