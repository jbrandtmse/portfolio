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
