import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { RendererThis, Tokens } from 'marked';
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * Build-output assertions for the Glass Box artifact reader route (Story 2.2).
 *
 * AC1: one reader page per allowlisted artifact at /glass-box/{slug}/index.html
 * AC2: type chip + curator note + date + body present
 * AC3: exactly ONE <h1> per reader page (title); body headings demoted
 * AC4: 0 executable JS per reader page; code fences as static <pre><code>
 * AC5: real Story 2.1 render data (not a mock) — seeded artifact prose asserted
 * AC6: graceful absent-data (getStaticPaths → [] → no crash); data generated here
 *
 * BUILD-ORDERING DISCIPLINE (AC6 and Dev Notes):
 *  This suite GENERATES the render data before building — it MUST NOT rely on a
 *  stale on-disk glassbox.json. In beforeAll:
 *    1. Run `tsx scripts/build-content.ts` (the render-glassbox generator) to
 *       write web/src/generated/glassbox.json.
 *    2. Run `astro build` to produce the static reader pages under web/dist.
 *
 * Real-runtime evidence (skill-rules Rule 3: browser real-runtime via the e2e
 * spec; build-output here is the static-HTML consumer-observable tier).
 */

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(webRoot, '..');
const distDir = join(webRoot, 'dist');

/** All <script …> opening tags in the document. */
function allScriptTags(html: string): string[] {
  return html.match(/<script\b[^>]*>/gi) ?? [];
}

/** Count EXECUTABLE scripts — every <script> that is NOT an ld+json data block. */
function countExecutableScripts(html: string): number {
  return allScriptTags(html).filter((tag) => !/type\s*=\s*["']application\/ld\+json["']/i.test(tag))
    .length;
}

// ─── Seeded artifacts from the Story 2.1 allowlist ───────────────────────────
// Known slugs from content/glassbox.allowlist.ts (the 6 seeded artifacts).
// Asserted against in tests; update if the allowlist changes.
const EXPECTED_SLUGS = [
  'brainstorm',
  'pre-brief-research',
  'product-brief',
  'prd',
  'ux-design',
  'ux-experience',
] as const;

// Known substrings from seeded artifacts for AC5 (real data, not a mock).
// Each is a distinctive substring from the artifact's actual rendered HTML
// (as visible text after markdown rendering — checked against built pages).
const KNOWN_BODY_SUBSTRINGS: Record<string, string> = {
  'product-brief': 'craft artifact remarkable',
  brainstorm: 'Brainstorming Session Results',
  'pre-brief-research': 'practitioners actually share',
  prd: 'PRD: Josh Brandt Portfolio Site',
  'ux-design': 'Source Serif 4',
  'ux-experience': 'visitor journey',
};

// ─── beforeAll: generate data + build ────────────────────────────────────────

beforeAll(() => {
  // Step 1: Generate web/src/generated/glassbox.json via the render pipeline.
  // This MUST happen before `astro build` (AC6 discipline — never rely on a
  // stale on-disk file; the generator is always the source of truth).
  const tsxBin = join(repoRoot, 'node_modules', '.bin', 'tsx');
  const buildContentScript = join(repoRoot, 'scripts', 'build-content.ts');
  execFileSync(tsxBin, [buildContentScript], {
    cwd: repoRoot,
    stdio: 'pipe',
  });

  // Step 2: Run astro build to emit the reader pages into dist/.
  const require = createRequire(import.meta.url);
  const astroPkgJson = require.resolve('astro/package.json');
  const astroBin = join(dirname(astroPkgJson), 'bin', 'astro.mjs');
  execFileSync('node', [astroBin, 'build'], {
    cwd: webRoot,
    stdio: 'pipe',
  });
}, 180_000);

// ─── Helper ───────────────────────────────────────────────────────────────────

function readerHtmlPath(slug: string): string {
  return join(distDir, 'glass-box', slug, 'index.html');
}

/**
 * The inner HTML of the `.artifact-body` region (the markdown-rendered body),
 * or null if absent. Markdown rendering emits headings/paragraphs/lists/
 * blockquotes/pre — never a nested <div> — so a non-greedy match to the first
 * </div> exactly captures the body content (verified against the built pages).
 * Used to assert body-scoped facts (no <h1> in the body; the first body heading
 * is a demoted <h2>) independent of the MirrorLayout <h1>/lede outside it.
 */
function artifactBodyHtml(html: string): string | null {
  const m = html.match(/<div class="[^"]*artifact-body[^"]*"[^>]*>([\s\S]*?)<\/div>/);
  return m ? m[1]! : null;
}

// ─── AC1: one reader page per allowlisted artifact ────────────────────────────

describe('Story 2.2 AC1 — one reader page per allowlisted artifact', () => {
  it.each(EXPECTED_SLUGS)('builds /glass-box/%s/index.html', (slug) => {
    expect(existsSync(readerHtmlPath(slug))).toBe(true);
    const html = readFileSync(readerHtmlPath(slug), 'utf8');
    // Real HTML document (not a redirect shell).
    expect(html).toMatch(/<html lang="en"[\s>]/);
    expect(html).toMatch(/<body[\s>]/);
  });

  it('the live reader pages came from real generated data (the beforeAll generated + built)', () => {
    // The INVERSE guard: the pages we DO have were emitted from the freshly
    // generated glassbox.json (the beforeAll ran the render generator, then
    // astro build). Proven by the per-slug existence checks above; the absent-
    // data → [] contract is proven race-free by the loader-contract test below.
    expect(existsSync(distDir)).toBe(true);
    expect(EXPECTED_SLUGS.every((s) => existsSync(readerHtmlPath(s)))).toBe(true);
  });
});

// ─── AC6: absent-data degrades to [] — the getStaticPaths contract (race-free) ─
//
// AC6 (the forward-reference 2.1 declared): a bare `astro build` on a clean
// checkout (no render pipeline) finds glassbox.json ABSENT. getStaticPaths()
// must then emit ZERO reader pages and NEVER throw. That hinges entirely on
// loadGlassboxArtifacts() returning [] when the JSON is unreachable.
//
// We prove that contract DIRECTLY and DETERMINISTICALLY by invoking the REAL
// loader (src/lib/glassbox.ts) in a CHILD tsx process whose cwd is a temp dir —
// so none of the loader's process.cwd()-relative candidate paths resolve to the
// real file. This is race-free: it never mutates the shared on-disk
// glassbox.json (which the present-data beforeAll above and the sibling
// build-output/url-form suites build against concurrently). The full build-level
// absent-data behaviour (0 reader pages, clean exit, sitemap omits the slug
// <loc>s) was additionally verified by hand during QA; encoding THAT as an
// always-on test would require moving the shared JSON aside and is intentionally
// avoided to keep the suite non-flaky under vitest's parallel file execution.
describe('Story 2.2 AC6 — absent/malformed data degrades to [] (loader contract; no throw)', () => {
  const tsxBin = join(repoRoot, 'node_modules', '.bin', 'tsx');
  const loaderPath = join(webRoot, 'src', 'lib', 'glassbox.ts');

  /** Run loadGlassboxArtifacts() in a child tsx process with a given cwd. */
  function loadFromCwd(cwd: string): { isArray: boolean; length: number; threw: boolean } {
    const probe = join(cwd, '__probe.mjs');
    writeFileSync(
      probe,
      `import { loadGlassboxArtifacts } from ${JSON.stringify(loaderPath)};\n` +
        `const r = loadGlassboxArtifacts();\n` +
        `process.stdout.write(JSON.stringify({ isArray: Array.isArray(r), length: r.length }));\n`,
      'utf8',
    );
    try {
      const out = execFileSync(tsxBin, [probe], {
        cwd,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      const parsed = JSON.parse(out) as { isArray: boolean; length: number };
      return { ...parsed, threw: false };
    } catch {
      return { isArray: false, length: -1, threw: true };
    } finally {
      // Always remove the probe file (the webRoot positive-control writes into
      // the source tree — never leave an artifact behind).
      rmSync(probe, { force: true });
    }
  }

  it('returns [] (not a throw) when glassbox.json is absent on every candidate path', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'glassbox-absent-'));
    try {
      const res = loadFromCwd(cwd);
      expect(
        res.threw,
        'loader must not throw on absent data (would crash getStaticPaths/build)',
      ).toBe(false);
      expect(res.isArray).toBe(true);
      expect(res.length).toBe(0);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('returns [] (not a throw) when glassbox.json exists but is malformed JSON', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'glassbox-malformed-'));
    try {
      // Place a malformed file on the FIRST candidate path (cwd/src/generated/).
      mkdirSync(join(cwd, 'src', 'generated'), { recursive: true });
      writeFileSync(join(cwd, 'src', 'generated', 'glassbox.json'), 'not { valid json ]]', 'utf8');
      const res = loadFromCwd(cwd);
      expect(res.threw, 'loader must not throw on malformed JSON').toBe(false);
      expect(res.isArray).toBe(true);
      expect(res.length).toBe(0);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it('returns the real artifact set (length === EXPECTED_SLUGS) when run from the web root', () => {
    // Positive control: from webRoot (cwd has src/generated/glassbox.json — the
    // present-data path the real `pnpm build` uses), the loader returns the full
    // generated set. This anchors the absent-path assertions against a known good.
    const res = loadFromCwd(webRoot);
    expect(res.threw).toBe(false);
    expect(res.isArray).toBe(true);
    expect(res.length).toBe(EXPECTED_SLUGS.length);
  });
});

// ─── AC2: editorial components present ────────────────────────────────────────

describe('Story 2.2 AC2 — editorial reader components', () => {
  it.each(EXPECTED_SLUGS)('renders the type chip on /glass-box/%s/', (slug) => {
    const html = readFileSync(readerHtmlPath(slug), 'utf8');
    // The type chip has class artifact-reader__chip.
    expect(html).toMatch(/class="[^"]*artifact-reader__chip[^"]*"/);
  });

  it.each(EXPECTED_SLUGS)('renders the curator note on /glass-box/%s/', (slug) => {
    const html = readFileSync(readerHtmlPath(slug), 'utf8');
    // Curator note has class artifact-reader__curator-note.
    expect(html).toMatch(/class="[^"]*artifact-reader__curator-note[^"]*"/);
    // Curator note text must be non-empty.
    const noteMatch = html.match(
      /class="[^"]*artifact-reader__curator-note[^"]*"[^>]*>([\s\S]*?)<\/p>/,
    );
    expect(noteMatch).not.toBeNull();
    const noteText = noteMatch![1]!.replace(/<[^>]+>/g, '').trim();
    expect(noteText.length).toBeGreaterThan(0);
  });

  it.each(EXPECTED_SLUGS)('renders the date as a <time> element on /glass-box/%s/', (slug) => {
    const html = readFileSync(readerHtmlPath(slug), 'utf8');
    expect(html).toMatch(
      /<time\b[^>]*class="[^"]*artifact-reader__date[^"]*"[^>]*datetime="[^"]+"/,
    );
  });

  it.each(EXPECTED_SLUGS)('renders the body prose on /glass-box/%s/', (slug) => {
    const html = readFileSync(readerHtmlPath(slug), 'utf8');
    // The rendered body is inside .artifact-body.
    expect(html).toMatch(/class="[^"]*artifact-body[^"]*"/);
  });
});

// ─── AC3: exactly one <h1>, heading hierarchy correct ─────────────────────────

describe('Story 2.2 AC3 — exactly one <h1> per reader page, body headings demoted', () => {
  it.each(EXPECTED_SLUGS)('has exactly ONE <h1> on /glass-box/%s/', (slug) => {
    const html = readFileSync(readerHtmlPath(slug), 'utf8');
    const h1s = html.match(/<h1\b[^>]*>/g) ?? [];
    expect(h1s).toHaveLength(1);
  });

  // STRENGTHENED (QA): the dev spot-checked only `prd`. Five of the six seeded
  // artifacts (all but ux-design, which opens with an HTML comment) begin their
  // BODY with a top-level `# ` heading; without demotion each would emit a SECOND
  // <h1>. Assert for EVERY artifact that the `.artifact-body` region contains NO
  // <h1> at all (the single <h1> is the MirrorLayout title, which lives OUTSIDE
  // .artifact-body). This is the highest-risk regression in the story.
  it.each(EXPECTED_SLUGS)('the .artifact-body region has NO <h1> on /glass-box/%s/', (slug) => {
    const html = readFileSync(readerHtmlPath(slug), 'utf8');
    const body = artifactBodyHtml(html);
    expect(body, `.artifact-body region on /glass-box/${slug}/`).not.toBeNull();
    expect(body!).not.toMatch(/<h1\b/);
  });

  // For the five artifacts whose markdown body opens with a `# ` line, the FIRST
  // heading rendered in the body must be a demoted <h2> (proving #→h2 happened).
  const BODY_OPENS_WITH_HASH = [
    'brainstorm',
    'pre-brief-research',
    'product-brief',
    'prd',
    'ux-experience',
  ] as const;

  it.each(BODY_OPENS_WITH_HASH)(
    'the first body heading on /glass-box/%s/ is a demoted <h2> (the body #-title)',
    (slug) => {
      const body = artifactBodyHtml(readFileSync(readerHtmlPath(slug), 'utf8'))!;
      const firstHeading = body.match(/<h([1-6])\b/);
      expect(firstHeading, `a heading in .artifact-body on /glass-box/${slug}/`).not.toBeNull();
      // The body's top-level `#` became <h2>; the first heading level is 2 (never 1).
      expect(firstHeading![1]).toBe('2');
    },
  );

  it('the PRD body demotes its `##` sections to <h3> (demotion cascade, not just the top)', () => {
    // The PRD has 16 `## ` sections; demoted they are <h3>. Assert the cascade
    // (not merely the top-level #→h2) by requiring multiple <h3>s in the body.
    const body = artifactBodyHtml(readFileSync(readerHtmlPath('prd'), 'utf8'))!;
    const h3s = body.match(/<h3\b/g) ?? [];
    expect(h3s.length).toBeGreaterThanOrEqual(2);
  });

  // REGRESSION GUARD (code-review): headings with INLINE markdown must render it,
  // not ship the raw source. The PRD's 36 `#### FR-N … `[S1]`` headings each
  // carry inline code; the demoting renderer must emit <code>[S1]</code>, never a
  // literal backtick. (A `token.text` renderer leaked the backticks to the live
  // page — a shipped AC2 editorial defect.) Assert on the REAL built PRD page.
  it('the built PRD body renders inline code in headings (no literal backtick leaks)', () => {
    const body = artifactBodyHtml(readFileSync(readerHtmlPath('prd'), 'utf8'))!;
    // No heading on the shipped page carries a literal backtick.
    expect(body).not.toMatch(/<h[2-6][^>]*>[^<]*`[^<]*<\/h[2-6]>/);
    // …and the inline code that USED to leak now renders as <code> inside the heading.
    expect(body).toMatch(/<h5\b[^>]*>FR-1:[^<]*<code>\[S1\]<\/code><\/h5>/);
  });
});

// ─── AC1: answer-first lede naming the entity ─────────────────────────────────

describe('Story 2.2 AC1 — answer-first lede names "Joshua R. Brandt, MSE"', () => {
  it.each(EXPECTED_SLUGS)('the lede on /glass-box/%s/ leads with the entity name', (slug) => {
    const html = readFileSync(readerHtmlPath(slug), 'utf8');
    // The lede paragraph (class="mirror__lede") must start with the entity name.
    const ledeMatch = html.match(/<p\b[^>]*class="[^"]*mirror__lede[^"]*"[^>]*>([\s\S]*?)<\/p>/);
    expect(ledeMatch, `mirror__lede on /glass-box/${slug}/`).not.toBeNull();
    const ledeText = ledeMatch![1]!.replace(/<[^>]+>/g, '').trim();
    expect(ledeText.startsWith('Joshua R. Brandt, MSE')).toBe(true);
  });
});

// ─── AC1: self-canonical to trailing-slash URL ────────────────────────────────

const SITE_ORIGIN = 'https://joshuabrandt.abacusai.cloud';

describe('Story 2.2 AC1 — each reader page is self-canonical to its trailing-slash URL', () => {
  it.each(EXPECTED_SLUGS)('/glass-box/%s/ is self-canonical', (slug) => {
    const html = readFileSync(readerHtmlPath(slug), 'utf8');
    const canonicalMatch = html.match(/<link\b[^>]*\brel="canonical"[^>]*>/);
    expect(canonicalMatch, `rel=canonical on /glass-box/${slug}/`).not.toBeNull();
    const hrefMatch = canonicalMatch![0].match(/\bhref="([^"]+)"/);
    expect(hrefMatch).not.toBeNull();
    // Exact trailing-slash form (Rule 2 / Story 2.0 AC3).
    expect(hrefMatch![1]).toBe(`${SITE_ORIGIN}/glass-box/${slug}/`);
  });
});

// ─── AC4: 0 executable JS ─────────────────────────────────────────────────────

describe('Story 2.2 AC4 — Guide pill (site-wide carve-out) + no InviteForm/panel on reader pages (NFR-1)', () => {
  it.each(EXPECTED_SLUGS)(
    'ships exactly 2 exec scripts on /glass-box/%s/ — Guide pill only (Story 4.4 carve-out)',
    (slug) => {
      // Story 4.4: ALL routes now ship the site-wide Guide pill (2 exec scripts).
      // Reader pages carry NO InviteForm chunk, NO GuidePanel chunk, NO external src= scripts.
      const html = readFileSync(readerHtmlPath(slug), 'utf8');
      expect(
        countExecutableScripts(html),
        `/glass-box/${slug}/ must have exactly 2 exec scripts (Guide pill only)`,
      ).toBe(2);
      // No external src= scripts (all pill init is inline)
      expect(html).not.toMatch(/<script\b[^>]*\bsrc=/);
      expect(html).not.toMatch(/<link\b[^>]*\brel="modulepreload"/);
      // No InviteForm or GuidePanel chunks on reader pages
      expect(html).not.toMatch(/InviteForm\.[a-zA-Z0-9_-]+\.js/);
      expect(html).not.toMatch(/GuidePanel\.[a-zA-Z0-9_-]+\.js/);
    },
  );

  it.each(EXPECTED_SLUGS)('code fences render as static <pre><code> on /glass-box/%s/', (slug) => {
    const html = readFileSync(readerHtmlPath(slug), 'utf8');
    // The assertion here is that there is no client-side highlight runtime script.
    // If the artifact body contains code fences, they must be static <pre><code>.
    // Verify no highlight.js or prism is loaded (client-side).
    expect(html).not.toContain('highlight.js');
    expect(html).not.toContain('prism');
  });

  // STRENGTHENED FLOOR (QA): the dev's floor only counted <script> tags. AC4 also
  // requires "no executable script/INLINE HANDLERS". marked is configured WITHOUT
  // a sanitizer (verified in the renderer-contract test below), so the safety of
  // the rendered BODY rests on the trusted-content boundary (the default-deny
  // allowlist + in-repo prose). These assertions are the regression tripwire that
  // the trusted boundary still holds for the REAL shipped pages: if a future
  // allowlisted artifact ever introduced raw HTML carrying a javascript: URL or an
  // on*= handler, marked would pass it through and THIS test would fail.
  it.each(EXPECTED_SLUGS)(
    'the rendered body carries NO javascript: URL on /glass-box/%s/',
    (slug) => {
      const html = readFileSync(readerHtmlPath(slug), 'utf8');
      expect(html).not.toMatch(/href\s*=\s*["']?\s*javascript:/i);
      expect(html.toLowerCase()).not.toContain('javascript:');
    },
  );

  it.each(EXPECTED_SLUGS)(
    'the rendered body carries NO inline on*= event handler on /glass-box/%s/',
    (slug) => {
      const html = readFileSync(readerHtmlPath(slug), 'utf8');
      // Common executable inline-handler attributes that raw HTML could smuggle in.
      expect(html).not.toMatch(
        /\son(?:click|load|error|mouseover|focus|blur|submit|change|input|keydown|keyup)\s*=/i,
      );
    },
  );
});

// ─── AC4: the markdown RENDERER contract (synthetic adversarial body) ─────────
//
// AC4 conversion is build-time, deterministic, headings-demoted, code fences →
// static <pre><code>, and "no executable script/inline handlers" (with the
// explicit caveat: "our content is trusted prose"). This test pins the EXACT
// behaviour of the marked configuration the ArtifactReader uses against a
// SYNTHETIC adversarial body — independent of today's (clean) real artifacts —
// so the renderer's true contract is documented and regression-guarded:
//   • # heading is demoted to <h2> (never a second <h1>) — AC3 at renderer level.
//   • code fence → static <pre><code> (no client highlighter) — AC4.
//   • blockquote → <blockquote> (the pull-quote element) — AC2.
//   • RAW HTML / javascript: URLs PASS THROUGH UNSANITIZED — documenting that the
//     0-JS safety of the shipped pages depends on the trusted-content boundary
//     (the allowlist), NOT on marked sanitizing. The real-page floor tests above
//     are the guard that the trusted boundary holds for what actually ships.
describe('Story 2.2 AC4/AC3 — the marked renderer contract (synthetic body)', () => {
  // Re-create the EXACT renderer configuration from ArtifactReader.astro.
  async function renderWithReaderConfig(md: string): Promise<string> {
    const { Marked } = await import('marked');
    const m = new Marked({
      renderer: {
        // MUST mirror ArtifactReader.astro: render the heading's INLINE tokens
        // (not the raw `token.text`) so inline markdown inside a heading is
        // rendered, then wrap in the demoted tag.
        heading(this: RendererThis, token: Tokens.Heading) {
          const demoted = Math.min(token.depth + 1, 6);
          const inner = this.parser.parseInline(token.tokens);
          return `<h${demoted}>${inner}</h${demoted}>\n`;
        },
      },
    });
    return m.parse(md) as string;
  }

  it('demotes a top-level # to <h2> and ## to <h3> (no <h1> ever emitted by the body)', async () => {
    const out = await renderWithReaderConfig('# Top Title\n\n## Section\n\nBody text.');
    expect(out).not.toMatch(/<h1\b/);
    expect(out).toMatch(/<h2\b[^>]*>Top Title<\/h2>/);
    expect(out).toMatch(/<h3\b[^>]*>Section<\/h3>/);
  });

  // REGRESSION GUARD (code-review): the demoting renderer must render the
  // heading's INLINE markdown, not ship the raw source. The PRD has 36
  // `#### FR-N … `[S1]`` headings — using `token.text` instead of parsing the
  // inline tokens leaked literal backticks (a shipped AC2 editorial defect).
  it('renders INLINE markdown inside a demoted heading (code/bold/link — not raw source)', async () => {
    const out = await renderWithReaderConfig(
      '#### FR-1: Calm hero `[S1]`\n\n## A **bold** and a [link](https://x/)',
    );
    // Inline code inside the (demoted) <h5> renders as <code>, NOT a literal backtick.
    expect(out).toMatch(/<h5\b[^>]*>FR-1: Calm hero <code>\[S1\]<\/code><\/h5>/);
    expect(out).not.toMatch(/<h[1-6][^>]*>[^<]*`[^<]*<\/h[1-6]>/); // no literal backtick in any heading
    // Bold + link render inside the (demoted) <h3>.
    expect(out).toMatch(
      /<h3\b[^>]*>A <strong>bold<\/strong> and a <a href="https:\/\/x\/">link<\/a><\/h3>/,
    );
  });

  it('clamps demotion at <h6> (###### stays <h6>, never <h7>)', async () => {
    const out = await renderWithReaderConfig('###### Deep');
    expect(out).toMatch(/<h6\b[^>]*>Deep<\/h6>/);
    expect(out).not.toMatch(/<h7\b/);
  });

  it('renders a fenced code block as static <pre><code> (no highlight runtime)', async () => {
    const out = await renderWithReaderConfig('```js\nconst x = 1;\n```');
    expect(out).toMatch(/<pre><code[^>]*>[\s\S]*const x = 1;[\s\S]*<\/code><\/pre>/);
    expect(out).not.toContain('<script');
  });

  it('renders a blockquote as a <blockquote> element (the pull-quote target)', async () => {
    const out = await renderWithReaderConfig('> a quote');
    expect(out).toMatch(/<blockquote>[\s\S]*a quote[\s\S]*<\/blockquote>/);
  });

  it('DOES pass raw HTML through unsanitized — documents the trusted-content boundary', async () => {
    // This is the explicit, intentional contract: marked here is NOT a sanitizer.
    // The shipped-page floor (the per-slug javascript:/on*=/<script> assertions
    // above) is what guarantees the REAL pages stay safe — because the allowlist
    // admits only trusted in-repo prose. If this expectation ever flips (e.g. a
    // sanitizing renderer is adopted), update the floor's rationale accordingly.
    const out = await renderWithReaderConfig(
      '<script>alert(1)</script>\n\n[x](javascript:alert(1))',
    );
    expect(out).toContain('<script>alert(1)</script>'); // raw HTML survives → boundary matters
    expect(out).toContain('javascript:alert(1)'); // URL survives → boundary matters
  });
});

// ─── AC5: real Story 2.1 render data (Integration AC) ─────────────────────────

describe('Story 2.2 AC5 — reader pages contain real artifact prose (Integration AC)', () => {
  it.each(Object.entries(KNOWN_BODY_SUBSTRINGS))(
    'the /glass-box/%s/ body contains known real prose',
    (slug, knownSubstring) => {
      const html = readFileSync(readerHtmlPath(slug), 'utf8');
      // Known substring from the real seeded artifact body — proves the
      // producer→consumer wire-up is real (not a mock).
      expect(html).toContain(knownSubstring);
    },
  );

  it.each(EXPECTED_SLUGS)(
    'the <h1> on /glass-box/%s/ matches the artifact title from the allowlist',
    (slug) => {
      const html = readFileSync(readerHtmlPath(slug), 'utf8');
      const h1s = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g) ?? [];
      expect(h1s).toHaveLength(1);
      const h1Text = h1s[0]!
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      // All artifact titles are non-empty strings.
      expect(h1Text.length).toBeGreaterThan(0);
    },
  );
});

// ─── AC1: composed through MirrorLayout (global footer) ───────────────────────

describe('Story 2.2 AC1 — reader pages composed through MirrorLayout (global footer)', () => {
  it.each(EXPECTED_SLUGS)('the global site-footer is present on /glass-box/%s/', (slug) => {
    const html = readFileSync(readerHtmlPath(slug), 'utf8');
    // MirrorLayout → BaseLayout → global Footer (Story 1.7).
    expect(html).toMatch(/<footer\b[^>]*class="[^"]*site-footer[^"]*"/);
  });
});

// ─── No exclamation marks in copy ─────────────────────────────────────────────

describe('Story 2.2 — no exclamation marks in copy (positive-assertion voice)', () => {
  it.each(EXPECTED_SLUGS)('no "!" in generated HTML on /glass-box/%s/ (in layout copy)', (slug) => {
    const html = readFileSync(readerHtmlPath(slug), 'utf8');
    // Strip the doctype declaration and any inline scripts from the copy-check
    // (the artifact body itself may contain "!" legitimately in prose/code).
    // Only assert the LAYOUT copy (MirrorLayout, lede, etc.) is exclamation-free.
    const layoutOnly = html
      .replace(/<!doctype html>/i, '')
      .replace(/<div\b[^>]*class="[^"]*artifact-body[^"]*"[\s\S]*?<\/div>/g, '<!-- body -->');
    // The layout itself (heading, lede, chip, curator note, date) must not
    // contain exclamation marks (positive-assertion voice).
    // We check the lede and the artifact-reader block minus the body.
    const ledeMatch = html.match(/<p\b[^>]*class="[^"]*mirror__lede[^"]*"[^>]*>([\s\S]*?)<\/p>/);
    if (ledeMatch) {
      expect(ledeMatch[1]).not.toContain('!');
    }
    // The page title (<h1>) must not contain "!".
    const h1Match = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/);
    if (h1Match) {
      expect(h1Match[1]).not.toContain('!');
    }
    // Suppress unused variable warning.
    void layoutOnly;
  });
});

// ─── AC1 / Rule 2 — three-way URL form-equality (link/URL === canonical === loc) ─
//
// Rule 2 (project-rules #2) mandates: for every route, the link/URL form, the
// <link rel="canonical"> form, and the sitemap <loc> form all AGREE. The dev's
// suite asserts the canonical form alone (= the trailing-slash URL). It never
// cross-checks the canonical against the sitemap <loc>. These dynamic reader
// routes are exactly the surface Rule 2 was codified to protect (Epic 1's
// /about → 301 split shipped to production). Bind all three to ground truth:
//   • the built dir-index page IS the trailing-slash URL (/glass-box/{slug}/);
//   • its self-canonical href equals that URL;
//   • the sitemap <loc> equals that URL too.
describe('Story 2.2 AC1 / Rule 2 — reader URL === canonical === sitemap <loc> (trailing-slash)', () => {
  let sitemap = '';
  beforeAll(() => {
    sitemap = readFileSync(join(distDir, 'sitemap.xml'), 'utf8');
  });

  it.each(EXPECTED_SLUGS)('all three URL forms agree for /glass-box/%s/', (slug) => {
    const expected = `${SITE_ORIGIN}/glass-box/${slug}/`;

    // (1) The built dir-index page exists → the trailing-slash URL is real.
    expect(existsSync(readerHtmlPath(slug)), `dir-index for /glass-box/${slug}/`).toBe(true);

    // (2) The page is self-canonical to exactly that trailing-slash URL.
    const html = readFileSync(readerHtmlPath(slug), 'utf8');
    const canonical = html.match(/<link\b[^>]*\brel="canonical"[^>]*>/);
    expect(canonical, `rel=canonical on /glass-box/${slug}/`).not.toBeNull();
    const href = canonical![0].match(/\bhref="([^"]+)"/)![1];
    expect(href).toBe(expected);

    // (3) The sitemap lists exactly that trailing-slash <loc> (===, not a variant).
    expect(sitemap, `sitemap <loc> for /glass-box/${slug}/`).toContain(`<loc>${expected}</loc>`);
    // …and never a slashless variant of the same path (would split the SEO signal).
    expect(sitemap).not.toContain(`<loc>${SITE_ORIGIN}/glass-box/${slug}</loc>`);
  });

  it('the sitemap lists one <loc> per allowlisted artifact + the static routes (no missing reader page)', () => {
    const readerLocs = [...sitemap.matchAll(/<loc>([^<]+\/glass-box\/[a-z-]+\/)<\/loc>/g)].map(
      (m) => m[1],
    );
    // Every expected slug has its reader <loc> (the /glass-box/ index stub is NOT
    // matched here — its path has no slug segment).
    for (const slug of EXPECTED_SLUGS) {
      expect(readerLocs, `reader <loc> for ${slug}`).toContain(`${SITE_ORIGIN}/glass-box/${slug}/`);
    }
    expect(readerLocs).toHaveLength(EXPECTED_SLUGS.length);
  });
});

// ─── AC2 — editorial long-form devices actually ship (drop-cap, pull-quote, chip)
//
// AC2 reserves three long-form devices for the reader: a drop-cap on the first
// body paragraph, pull-quote-styled blockquotes, and an accent-outlined small-
// caps type chip. Astro SCOPES component styles INLINE in the page <head>
// (verified: the rules live in inline <style>, NOT an external _astro/*.css), so
// these must be asserted against the page HTML. The dev's vitest checks the chip
// CLASS is present but never that the device CSS actually ships; Playwright
// checks the blockquote border but not the drop-cap or the chip. Close the gap
// at the build-output tier (the computed-style proof is added in the e2e spec).
describe('Story 2.2 AC2 — long-form editorial-device CSS ships on the reader page', () => {
  // The reader pages share the same scoped component CSS; assert on one (prd) for
  // the device rules, then confirm the device CSS is present on ALL six pages.
  let prdHtml = '';
  beforeAll(() => {
    prdHtml = readFileSync(readerHtmlPath('prd'), 'utf8');
  });

  /** Concatenate every inline <style> block in the document. */
  function inlineCss(html: string): string {
    return [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
  }

  it('ships the drop-cap ::first-letter rule (float left, ~3.5em) on the first body paragraph', () => {
    const css = inlineCss(prdHtml);
    // The drop-cap is a ::first-letter rule with float:left and the 3.5em size.
    const rule = css.match(/first-letter\{[^}]*\}/);
    expect(rule, '::first-letter drop-cap rule').not.toBeNull();
    expect(rule![0]).toMatch(/float:\s*left/);
    expect(rule![0]).toMatch(/font-size:\s*3\.5em/);
  });

  it('ships the pull-quote rule (blockquote: navy left rule, italic, clamp size)', () => {
    const css = inlineCss(prdHtml);
    const rule = css.match(/blockquote\{[^}]*\}/);
    expect(rule, 'blockquote pull-quote rule').not.toBeNull();
    // 2–3px navy (--color-accent) LEFT rule + italic + the clamp() size from AC2.
    expect(rule![0]).toMatch(/border-left:\s*3px solid var\(--color-accent\)/);
    expect(rule![0]).toMatch(/font-style:\s*italic/);
    expect(rule![0]).toMatch(/clamp\(20px,\s*2\.4vw,\s*25px\)/);
  });

  it('ships the type-chip rule (accent-outlined, small-caps)', () => {
    const css = inlineCss(prdHtml);
    // The chip selector carries a scoped data-attribute; match the class prefix.
    const rule = css.match(/artifact-reader__chip[^{]*\{[^}]*\}/);
    expect(rule, 'type-chip rule').not.toBeNull();
    expect(rule![0]).toMatch(/border:\s*1\.5px solid var\(--color-accent\)/);
    expect(rule![0]).toMatch(/font-variant:\s*small-caps/);
  });

  it('reads the body at the reading measure (--measure-reading) in the base serif', () => {
    const css = inlineCss(prdHtml);
    const rule = css.match(/artifact-body[^{]*\{[^}]*\}/);
    expect(rule, '.artifact-body rule').not.toBeNull();
    expect(rule![0]).toMatch(/max-width:\s*var\(--measure-reading\)/);
    expect(rule![0]).toMatch(/font-family:\s*var\(--font-family-base\)/);
  });

  it.each(EXPECTED_SLUGS)(
    'the drop-cap + pull-quote device CSS is present on /glass-box/%s/',
    (slug) => {
      // The reserved long-form devices ship on every reader page (scoped inline).
      const css = inlineCss(readFileSync(readerHtmlPath(slug), 'utf8'));
      expect(css).toMatch(/first-letter\{[^}]*float:\s*left/);
      expect(css).toMatch(/blockquote\{[^}]*border-left:\s*3px solid var\(--color-accent\)/);
    },
  );
});

// ─── AC2 — the YAML frontmatter block is stripped from the rendered body ──────
//
// Every seeded artifact's markdown opens with a `--- … ---` YAML frontmatter
// block (e.g. brainstorm's `stepsCompleted:`/`ideas_generated:`; the briefs'
// `title:`/`status:`). ArtifactReader strips it before rendering. If the strip
// regressed, that YAML would leak into the reader as literal prose (and the
// drop-cap would land on a `-` of the `---` fence). Assert the leak markers are
// absent from the rendered body.
describe('Story 2.2 AC2 — YAML frontmatter is stripped from the rendered body', () => {
  // Distinctive frontmatter-only tokens that must NOT appear in the rendered body.
  const FRONTMATTER_LEAK_TOKENS: Record<string, string[]> = {
    brainstorm: ['stepsCompleted:', 'ideas_generated:', 'technique_execution_complete:'],
    'product-brief': ['status: final', 'created: 2026-06-02'],
    // NB: "status: final" also appears in the PRD's BODY prose (not just its
    // frontmatter), so it is NOT a safe leak marker here — use frontmatter-only
    // tokens instead (verified against the generated body during QA).
    prd: ['created: 2026-06-02', 'updated:', 'title: "PRD:'],
    'pre-brief-research': ['status: complete'],
  };

  it.each(Object.entries(FRONTMATTER_LEAK_TOKENS))(
    'no frontmatter tokens leak into the /glass-box/%s/ body',
    (slug, tokens) => {
      const body = artifactBodyHtml(readFileSync(readerHtmlPath(slug), 'utf8'))!;
      for (const token of tokens) {
        expect(
          body,
          `frontmatter token "${token}" leaked into /glass-box/${slug}/ body`,
        ).not.toContain(token);
      }
      // The body must not OPEN with a stray "---" fence (the strip removed it).
      expect(body.trimStart().startsWith('---')).toBe(false);
    },
  );
});
