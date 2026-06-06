import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { beforeAll, describe, expect, it } from 'vitest';

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
    // "I'm here to book a talk" → /speaking (route stub from Story 1.5; bypasses Guide).
    expect(indexHtml).toMatch(/<a\b[^>]*\shref="\/speaking"[^>]*>[\s\S]*?book a talk[\s\S]*?<\/a>/);
    // Quiet "Or ask my Guide about the work" → /faq (becomes the Guide opener in Epic 4).
    expect(indexHtml).toMatch(
      /<a\b[^>]*\shref="\/faq"[^>]*>[\s\S]*?ask my Guide about the work[\s\S]*?<\/a>/,
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
    // The /faq Guide link is an inline link, NOT a .btn — visually distinct from
    // the Explore/book-a-talk buttons (DESIGN: a quiet, understated entry).
    const guideLink = indexHtml.match(/<a\b[^>]*\shref="\/faq"[^>]*>/);
    expect(guideLink).not.toBeNull();
    expect(guideLink![0]).not.toMatch(/class="[^"]*\bbtn\b/);
  });

  it('includes the navy-fill primary button driven by the accent token', () => {
    // The built CSS must style .btn--primary with the accent custom property.
    // Astro appends a scoped [data-astro-cid-*] attribute to the selector.
    expect(builtCss).toMatch(/\.btn--primary[^{]*\{[^}]*var\(--color-accent\)/);
  });

  it('provides the global footer slot region', () => {
    expect(indexHtml).toMatch(/<footer[^>]*class="[^"]*site-footer[^"]*"/);
  });

  it('ships exactly ONE tiny <script> — the gated scene-rail enhancement (NFR-1)', () => {
    // 0-JS-by-default holds except the single minimal scene-rail enhancement
    // (Story 1.4 Task 3). The hero/scaffold themselves ship no JS; the rail adds
    // exactly one small inlined script for the semantic aria-current tracking.
    const scripts = indexHtml.match(/<script\b/g) ?? [];
    expect(scripts).toHaveLength(1);
  });

  it('the single script is a reduced-motion-gated IntersectionObserver, inlined (Story 1.4 IAC-2)', () => {
    // Astro inlines a script this small directly into the HTML (well under the
    // bundling threshold), so the gated enhancement is observable in the markup.
    // It MUST carry the two-layer reduced-motion gate's JS init-guard
    // (prefers-reduced-motion) AND use IntersectionObserver — i.e. it is the
    // expected minimal enhancement, not a heavyweight regression.
    const scriptBlock = indexHtml.match(/<script\b[^>]*>([\s\S]*?)<\/script>/);
    expect(scriptBlock).not.toBeNull();
    const scriptBody = scriptBlock![1]!;
    expect(scriptBody).toContain('prefers-reduced-motion');
    expect(scriptBody).toContain('IntersectionObserver');
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
    // Jump: book a talk → the /speaking Mirror route (protects SM-C1).
    expect(rail).toMatch(/<a\b[^>]*\shref="\/speaking"[^>]*>[\s\S]*?book a talk[\s\S]*?<\/a>/);
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
    // Each teaser scene carries a real link to its Mirror route. (These 404
    // until Story 1.5 — correct hrefs now, not a defect.)
    expect(indexHtml).toMatch(/<a\b[^>]*\shref="\/timeline"[^>]*>/);
    expect(indexHtml).toMatch(/<a\b[^>]*\shref="\/work\/loandemo"[^>]*>/);
    expect(indexHtml).toMatch(/<a\b[^>]*\shref="\/glass-box"[^>]*>/);
    // The Close shell links to /invite (the CTAs themselves are Epic 3).
    expect(indexHtml).toMatch(/<a\b[^>]*\shref="\/invite"[^>]*>/);
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
    expect(builtCss).not.toMatch(/box-shadow:/);
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
// (default build.format 'directory') emits <route>/index.html for each.
const MIRROR_ROUTES = [
  '/timeline',
  '/speaking',
  '/speaking/reel',
  '/work/loandemo',
  '/glass-box',
  '/faq',
  '/invite',
  '/about',
] as const;

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

  it.each(MIRROR_ROUTES)('is self-canonical to its own absolute URL on %s', (route) => {
    const html = readFileSync(routeHtmlPath(route), 'utf8');
    const canonicalMatch = html.match(/<link\b[^>]*\brel="canonical"[^>]*>/);
    expect(canonicalMatch).not.toBeNull();
    const hrefMatch = canonicalMatch![0].match(/\bhref="([^"]+)"/);
    expect(hrefMatch).not.toBeNull();
    // Astro builds the canonical from Astro.site + pathname. Normalize a trailing
    // slash before comparing so the assertion is independent of trailingSlash.
    const got = hrefMatch![1]!.replace(/\/$/, '');
    expect(got).toBe(`${SITE_ORIGIN}${route}`);
  });

  it.each(MIRROR_ROUTES)('renders exactly one <h1> on %s (clean hierarchy)', (route) => {
    const html = readFileSync(routeHtmlPath(route), 'utf8');
    const h1s = html.match(/<h1\b[^>]*>/g) ?? [];
    expect(h1s).toHaveLength(1);
  });

  it.each(MIRROR_ROUTES)('provides the global footer slot region on %s', (route) => {
    const html = readFileSync(routeHtmlPath(route), 'utf8');
    expect(html).toMatch(/<footer[^>]*class="[^"]*site-footer[^"]*"/);
  });

  it.each(MIRROR_ROUTES)(
    'ships 0 JS — no <script>, no island, no JS bundle on %s (NFR-1)',
    (route) => {
      const html = readFileSync(routeHtmlPath(route), 'utf8');
      expect(html.match(/<script\b/g) ?? []).toHaveLength(0);
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

describe('Story 1.5 — 1.3 hero fork + 1.4 teaser forward-refs now resolve (IAC-2)', () => {
  // Every Mirror route the home links to (hero fork + scene teasers). Each MUST
  // now map to an existing built page (no 404). The home index.html is built in
  // the same run (beforeAll above already read it into indexHtml).
  const HOME_FORWARD_REFS = [
    '/speaking', // hero fork "book a talk" + scene-rail jump + Speaker teaser
    '/faq', // hero quiet Guide entry
    '/timeline', // Timeline teaser
    '/work/loandemo', // Flagship teaser
    '/glass-box', // Glass Box teaser
    '/invite', // Close scene
  ] as const;

  it.each(HOME_FORWARD_REFS)('the home links to %s and that route is now built', (route) => {
    // The home markup still carries the exact href (regression-guards 1.3/1.4)…
    const hrefPattern = new RegExp(`<a\\b[^>]*\\shref="${route.replace('/', '\\/')}"[^>]*>`);
    expect(indexHtml).toMatch(hrefPattern);
    // …and the href now resolves to a real built directory-index (no 404).
    expect(existsSync(routeHtmlPath(route))).toBe(true);
  });
});
