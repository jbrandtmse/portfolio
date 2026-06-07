import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

import ReelPoster from '../src/components/speaker/ReelPoster.astro';
import TalkCard from '../src/components/speaker/TalkCard.astro';
import {
  REEL,
  SIGNATURE_TALKS,
  METRICS,
  talkEventInput,
  reelVideoObjectInput,
} from '../src/data/speaking';

/**
 * Speaker Surface build-output + component assertions (Story 3.1, Task 6).
 *
 * Tests:
 *  1. ReelPoster component — correct aria-label, links to /speaking/reel/, no
 *     <script>/autoplay, decorative gradient/grid aria-hidden.
 *  2. TalkCard component — chips, takeaways, pills, expanded vs <details>.
 *  3. /speaking built HTML — Event nodes with real performer, reel poster present.
 *  4. /speaking/reel built HTML — VideoObject emitted, 0 executable JS.
 *  5. speaking.ts data module — typed exports validate, builder outputs.
 *
 * Real-runtime evidence (skill-rules Rule 3): component tests use Astro
 * Container API; build-output tests read from web/dist.
 * Discoverable under default vitest suite (Rule 8: test/** glob).
 */

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(webRoot, 'dist');

/** All <script ...> opening tags in the document. */
function allScriptTags(html: string): string[] {
  return html.match(/<script\b[^>]*>/gi) ?? [];
}

/** Count executable scripts (NOT ld+json). */
function countExecutableScripts(html: string): number {
  return allScriptTags(html).filter((tag) => !/type\s*=\s*["']application\/ld\+json["']/i.test(tag))
    .length;
}

/**
 * Parse every ld+json block and return flattened top-level nodes.
 */
function parseLdJson(html: string): Array<Record<string, unknown>> {
  const blocks =
    html.match(
      /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ) ?? [];
  const nodes: Array<Record<string, unknown>> = [];
  for (const block of blocks) {
    const inner = block.replace(/^<script\b[^>]*>/i, '').replace(/<\/script>$/i, '');
    const parsed = JSON.parse(inner) as unknown;
    if (Array.isArray(parsed)) {
      nodes.push(...(parsed as Array<Record<string, unknown>>));
    } else {
      nodes.push(parsed as Record<string, unknown>);
    }
  }
  return nodes;
}

function findNodeByType(html: string, type: string): Record<string, unknown> | undefined {
  return parseLdJson(html).find((n) => n['@type'] === type);
}

function findAllNodesByType(html: string, type: string): Array<Record<string, unknown>> {
  return parseLdJson(html).filter((n) => n['@type'] === type);
}

/* ──────────────────────────────────────────────────────────────────────────
 * Container API setup
 * ────────────────────────────────────────────────────────────────────────── */

let container: Awaited<ReturnType<typeof AstroContainer.create>>;

beforeAll(async () => {
  container = await AstroContainer.create();
});

/* ──────────────────────────────────────────────────────────────────────────
 * 1. ReelPoster component
 * ────────────────────────────────────────────────────────────────────────── */

describe('ReelPoster.astro — AC1 reel-poster component', () => {
  it('renders a static <a> to /speaking/reel/ (trailing-slash; works JS-off)', async () => {
    const html = await container.renderToString(ReelPoster, {
      props: { hostedVideoUrl: '/reel.mp4' },
    });
    expect(html).toMatch(/<a\b[^>]*\shref="\/speaking\/reel\/"[^>]*>/);
  });

  it('carries an aria-label naming the reel and its ~90s duration', async () => {
    const html = await container.renderToString(ReelPoster, {
      props: { hostedVideoUrl: '/reel.mp4' },
    });
    // The default aria-label mentions the reel + "90 seconds" (or similar).
    expect(html).toMatch(/aria-label="[^"]*reel[^"]*"/i);
    expect(html).toMatch(/aria-label="[^"]*90[^"]*"/i);
  });

  it('custom ariaLabel override is respected', async () => {
    const html = await container.renderToString(ReelPoster, {
      props: {
        hostedVideoUrl: '/reel.mp4',
        ariaLabel: 'Custom reel label for test',
      },
    });
    expect(html).toContain('Custom reel label for test');
  });

  it('emits NO <script> tags (0 executable JS, no autoplay — NFR-1)', async () => {
    const html = await container.renderToString(ReelPoster, {
      props: { hostedVideoUrl: '/reel.mp4' },
    });
    expect(html).not.toMatch(/<script\b/i);
    expect(html).not.toMatch(/autoplay/i);
  });

  it('decorative gradient/grid backgrounds are aria-hidden', async () => {
    const html = await container.renderToString(ReelPoster, {
      props: { hostedVideoUrl: '/reel.mp4' },
    });
    // The reel-poster__bg and grid spans carry aria-hidden="true".
    const ariaHiddenSpans = html.match(/<span\b[^>]*aria-hidden="true"[^>]*>/gi) ?? [];
    expect(ariaHiddenSpans.length).toBeGreaterThanOrEqual(2);
  });

  it('the play ring is aria-hidden (decorative)', async () => {
    const html = await container.renderToString(ReelPoster, {
      props: { hostedVideoUrl: '/reel.mp4' },
    });
    // The play ring span and triangle are aria-hidden.
    expect(html).toContain('reel-poster__play');
    const playSpan = html.match(/<span\b[^>]*reel-poster__play[^>]*>/i);
    expect(playSpan).not.toBeNull();
    // The play element carries aria-hidden.
    expect(html).toMatch(/<span[^>]*reel-poster__play[^>]*aria-hidden="true"/i);
  });

  it('the static hosted-video link renders with the passed URL', async () => {
    const html = await container.renderToString(ReelPoster, {
      props: { hostedVideoUrl: 'https://example.com/reel.mp4' },
    });
    expect(html).toContain('href="https://example.com/reel.mp4"');
  });

  it('posterHref overrides the primary <a> target (reel page links to the video, not a self-link)', async () => {
    const html = await container.renderToString(ReelPoster, {
      props: {
        hostedVideoUrl: 'https://example.com/reel.mp4',
        posterHref: 'https://example.com/reel.mp4',
      },
    });
    // The primary poster <a> uses the override, not the default /speaking/reel/.
    expect(html).toMatch(
      /<a\b[^>]*class="reel-poster__link"[^>]*href="https:\/\/example\.com\/reel\.mp4"/,
    );
    expect(html).not.toMatch(/class="reel-poster__link"[^>]*href="\/speaking\/reel\/"/);
  });
});

/* ──────────────────────────────────────────────────────────────────────────
 * 2. TalkCard component
 * ────────────────────────────────────────────────────────────────────────── */

describe('TalkCard.astro — AC3 talk card component', () => {
  const firstTalk = SIGNATURE_TALKS[0]!;
  const secondTalk = SIGNATURE_TALKS[1]!;

  it('renders the talk title in an <h3>', async () => {
    const html = await container.renderToString(TalkCard, {
      props: { talk: firstTalk },
    });
    expect(html).toMatch(/<h3\b[^>]*>/);
    expect(html).toContain(firstTalk.title);
  });

  it('renders audience-level chips for each level', async () => {
    const html = await container.renderToString(TalkCard, {
      props: { talk: firstTalk },
    });
    for (const level of firstTalk.audienceLevels) {
      expect(html).toContain(level);
    }
    // Count individual chip spans (aria-label="Audience: <level>").
    const chips = html.match(/aria-label="Audience:[^"]+"/g) ?? [];
    expect(chips.length).toBe(firstTalk.audienceLevels.length);
  });

  it('expanded=true renders the abstract inline (not in <details>)', async () => {
    const html = await container.renderToString(TalkCard, {
      props: { talk: firstTalk, expanded: true },
    });
    // Abstract text is present in the DOM.
    expect(html).toContain(firstTalk.abstract.slice(0, 50));
    // No <details> when expanded.
    expect(html).not.toMatch(/<details\b/i);
  });

  it('expanded=false renders the abstract inside a native <details>/<summary>', async () => {
    const html = await container.renderToString(TalkCard, {
      props: { talk: secondTalk, expanded: false },
    });
    // Wrapped in <details>.
    expect(html).toMatch(/<details\b/i);
    // Summary text is "Read the abstract".
    expect(html).toContain('Read the abstract');
    // Abstract text is in the DOM — use a safe snippet that has no quote chars
    // (Astro HTML-encodes " as &quot; so we match a non-quoted substring).
    expect(html).toContain('agentic and are now confronting');
  });

  it('uses the talk.expanded property as the default expanded value', async () => {
    // first talk has expanded: true
    const htmlFirst = await container.renderToString(TalkCard, {
      props: { talk: firstTalk },
    });
    expect(htmlFirst).not.toMatch(/<details\b/i);

    // second talk has expanded: false
    const htmlSecond = await container.renderToString(TalkCard, {
      props: { talk: secondTalk },
    });
    expect(htmlSecond).toMatch(/<details\b/i);
  });

  it('full abstract text is in the DOM whether expanded or collapsed (crawler-accessible)', async () => {
    // Use safe substrings that do not contain " chars (Astro encodes " as &quot;).
    const safeSnippets = [
      'thirty years of shipping software', // first abstract (no quotes in this part)
      'agentic and are now confronting', // second abstract
      'practitioner who shipped software', // third abstract
    ];
    for (let i = 0; i < SIGNATURE_TALKS.length; i++) {
      const talk = SIGNATURE_TALKS[i]!;
      const html = await container.renderToString(TalkCard, { props: { talk } });
      expect(html).toContain(safeSnippets[i]);
    }
  });

  it('renders 3–5 takeaways in a list', async () => {
    const html = await container.renderToString(TalkCard, {
      props: { talk: firstTalk },
    });
    // Each takeaway text present.
    for (const takeaway of firstTalk.takeaways) {
      expect(html).toContain(takeaway.slice(0, 30));
    }
    // Rendered as list items.
    const lis = html.match(/<li\b[^>]*>/gi) ?? [];
    expect(lis.length).toBeGreaterThanOrEqual(3);
  });

  it('renders format pill tags', async () => {
    const html = await container.renderToString(TalkCard, {
      props: { talk: firstTalk },
    });
    for (const fmt of firstTalk.formats) {
      expect(html).toContain(fmt.label);
      expect(html).toContain(fmt.duration);
    }
    const pills = html.match(/class="[^"]*talk-card__pill[^"]*"/g) ?? [];
    expect(pills.length).toBe(firstTalk.formats.length);
  });

  it('renders logistics travel and A/V fields', async () => {
    const html = await container.renderToString(TalkCard, {
      props: { talk: firstTalk },
    });
    expect(html).toContain('Travel');
    expect(html).toContain('A/V');
    expect(html).toContain(firstTalk.logistics.travel.slice(0, 20));
    expect(html).toContain(firstTalk.logistics.av.slice(0, 20));
  });

  it('emits NO executable <script> tags (NFR-1)', async () => {
    const html = await container.renderToString(TalkCard, {
      props: { talk: firstTalk },
    });
    const execScripts = (html.match(/<script\b[^>]*>/gi) ?? []).filter(
      (tag) => !/type\s*=\s*["']application\/ld\+json["']/i.test(tag),
    );
    expect(execScripts).toHaveLength(0);
  });
});

/* ──────────────────────────────────────────────────────────────────────────
 * 3. speaking.ts data module
 * ────────────────────────────────────────────────────────────────────────── */

describe('speaking.ts data module', () => {
  it('SIGNATURE_TALKS exports a non-empty array', () => {
    expect(SIGNATURE_TALKS.length).toBeGreaterThan(0);
  });

  it('exactly one talk is expanded (the first)', () => {
    const expandedTalks = SIGNATURE_TALKS.filter((t) => t.expanded);
    expect(expandedTalks).toHaveLength(1);
    expect(SIGNATURE_TALKS[0]!.expanded).toBe(true);
    for (const talk of SIGNATURE_TALKS.slice(1)) {
      expect(talk.expanded).toBe(false);
    }
  });

  it('every talk has 3–5 takeaways', () => {
    for (const talk of SIGNATURE_TALKS) {
      expect(talk.takeaways.length).toBeGreaterThanOrEqual(3);
      expect(talk.takeaways.length).toBeLessThanOrEqual(5);
    }
  });

  it('every talk has at least one format', () => {
    for (const talk of SIGNATURE_TALKS) {
      expect(talk.formats.length).toBeGreaterThan(0);
    }
  });

  it('the veteran-IC-vantage talk is present (required by AC3)', () => {
    const veteran = SIGNATURE_TALKS.find((t) => t.id === 'veteran-ic-vantage');
    expect(veteran).toBeDefined();
    // Title is flagged [ASSUMPTION].
    expect(veteran!.title).toContain('[ASSUMPTION]');
  });

  it('REEL metadata has fixed uploadDate (not new Date() — NFR-6)', () => {
    // Must be a fixed ISO-8601 string, not a dynamic date.
    expect(REEL.uploadDate).toBe('2026-01-01');
    expect(REEL.duration).toBe('PT1M30S');
  });

  it('talkEventInput produces a valid EventInput shape', () => {
    const input = talkEventInput(SIGNATURE_TALKS[0]!);
    expect(input.name).toBe(SIGNATURE_TALKS[0]!.title);
    expect(input.startDate).toBe('2026-01-01');
    expect(input.performer.name).toBe('Joshua R. Brandt, MSE');
    expect(input.eventAttendanceMode).toBe('https://schema.org/MixedEventAttendanceMode');
    expect(input.organizer).toBeDefined();
  });

  it('reelVideoObjectInput produces a valid VideoObjectInput shape', () => {
    const input = reelVideoObjectInput();
    expect(input.name).toBe(REEL.name);
    expect(input.duration).toBe('PT1M30S');
    expect(input.uploadDate).toBe('2026-01-01');
    expect(input.thumbnailUrl).toBeTruthy();
    expect(input.contentUrl).toBeTruthy();
  });
});

/* ──────────────────────────────────────────────────────────────────────────
 * 4. Build-output assertions (dist HTML)
 * ────────────────────────────────────────────────────────────────────────── */

describe('Build output — /speaking/ and /speaking/reel/', () => {
  let speakingHtml = '';
  let reelHtml = '';

  beforeAll(() => {
    const speakingPath = join(distDir, 'speaking', 'index.html');
    const reelPath = join(distDir, 'speaking', 'reel', 'index.html');
    // Skip if dist doesn't exist (build hasn't run in this test invocation).
    if (existsSync(speakingPath)) {
      speakingHtml = readFileSync(speakingPath, 'utf8');
    }
    if (existsSync(reelPath)) {
      reelHtml = readFileSync(reelPath, 'utf8');
    }
  });

  it('/speaking/index.html exists in dist', () => {
    const path = join(distDir, 'speaking', 'index.html');
    expect(existsSync(path)).toBe(true);
  });

  it('/speaking/reel/index.html exists in dist', () => {
    const path = join(distDir, 'speaking', 'reel', 'index.html');
    expect(existsSync(path)).toBe(true);
  });

  it('/speaking ships exactly ONE executable script — the vanilla copy-button enhancement (NFR-1 carve-out, Story 3.2 AC3)', () => {
    if (!speakingHtml) return;
    // Story 3.2 Decision 2: /speaking is the SECOND sanctioned progressive-enhancement
    // route. It ships ONE minimal vanilla script (BioBlock copy enhancement) —
    // NOT zero and NOT more than one. No external <script src>, no .js bundle.
    expect(countExecutableScripts(speakingHtml)).toBe(1);
    expect(speakingHtml).not.toMatch(/<script\b[^>]*\bsrc=/);
    expect(speakingHtml).not.toMatch(/client\.[a-zA-Z0-9]+\.js/);
  });

  it('/speaking/reel ships 0 executable JS (NFR-1)', () => {
    if (!reelHtml) return;
    expect(countExecutableScripts(reelHtml)).toBe(0);
    expect(reelHtml).not.toMatch(/<script\b[^>]*\bsrc=/);
  });

  // ── QA gap-fill (Story 3.2 AC2): credibility floor — placeholders are VISIBLE
  // text, and NO fabricated audience number ships as fact. ─────────────────────
  //
  // The existing checks assert "[ph]"/"[OPEN:" appear somewhere in the whole
  // document. This scopes to the social-proof SECTION and to the actual
  // metric__figure elements: every unconfirmed figure must be a visible-text
  // placeholder; the ONLY non-placeholder figure allowed is the "30 years
  // shipping" datum (consistent with PERSON.description's "30 years of shipping
  // experience" — not invented). A regression that swaps a "[ph]" for an invented
  // audience number (e.g. "12,000 subscribers") reds here.

  it('/speaking social-proof figures are all [ph] placeholders except the allowlisted "30 years" (no invented numbers, AC2)', () => {
    if (!speakingHtml) return;
    const sectionMatch = speakingHtml.match(
      /<section class="speaking__social-proof"[^>]*>([\s\S]*?)<\/section>/,
    );
    expect(sectionMatch, 'speaking__social-proof section present').not.toBeNull();
    const section = sectionMatch![1]!;

    // The figures actually rendered in the metric cells.
    const figures = [
      ...section.matchAll(/<div class="metric__figure"[^>]*>([\s\S]*?)<\/div>/g),
    ].map((m) =>
      m[1]!
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim(),
    );
    // One figure per METRICS entry (binds the rendered count to the data).
    expect(figures.length).toBe(METRICS.length);

    // The allowlisted real figure: "30" (Years shipping software) — derived from
    // PERSON.description, the credibility floor's one confirmed number.
    const ALLOWLISTED_REAL_FIGURES = new Set(['30']);
    for (const fig of figures) {
      const isPlaceholder = /\[(ph|OPEN|ASSUMPTION)/i.test(fig);
      const isAllowlisted = ALLOWLISTED_REAL_FIGURES.has(fig);
      expect(
        isPlaceholder || isAllowlisted,
        `metric figure "${fig}" is neither a visible-text placeholder nor the allowlisted "30 years" — possible fabricated number`,
      ).toBe(true);
    }

    // And cross-check: the only bare numeric token in the section's VISIBLE text
    // is "30" — i.e. no other number leaked as fact next to the placeholders.
    const visibleText = section
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z#0-9]+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const numericTokens = visibleText.match(/\b\d[\d,.]*\b/g) ?? [];
    const nonAllowlistedNumbers = numericTokens.filter((n) => !ALLOWLISTED_REAL_FIGURES.has(n));
    expect(
      nonAllowlistedNumbers,
      `unexpected number(s) in the social-proof strip (only "30" is allowed): ${nonAllowlistedNumbers.join(', ')}`,
    ).toEqual([]);
  });

  it('/speaking social-proof placeholders ([ph]/[OPEN]) are inside the rendered section as visible text, not color alone (AC2)', () => {
    if (!speakingHtml) return;
    const sectionMatch = speakingHtml.match(
      /<section class="speaking__social-proof"[^>]*>([\s\S]*?)<\/section>/,
    );
    expect(sectionMatch).not.toBeNull();
    const visibleText = sectionMatch![1]!
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z#0-9]+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    // The flags live in the visible body text of the section (the credibility-
    // floor commitment: a reader SEES that figures/quotes/logos are placeholders).
    expect(visibleText).toContain('[ph]');
    expect(visibleText).toContain('[OPEN:');
    expect(visibleText).toContain('Conf logo [ph]'); // logo wall placeholders are text
  });

  it('/speaking emits N Event nodes = SIGNATURE_TALKS.length', () => {
    if (!speakingHtml) return;
    const events = findAllNodesByType(speakingHtml, 'Event');
    expect(events.length).toBe(SIGNATURE_TALKS.length);
  });

  it('/speaking Event nodes carry the real performer name (AC4)', () => {
    if (!speakingHtml) return;
    const events = findAllNodesByType(speakingHtml, 'Event');
    for (const event of events) {
      const performer = event['performer'] as Record<string, unknown>;
      expect(performer['name']).toBe('Joshua R. Brandt, MSE');
    }
  });

  it('/speaking Event nodes have real talk titles (not the 1.6 placeholder)', () => {
    if (!speakingHtml) return;
    const events = findAllNodesByType(speakingHtml, 'Event');
    for (const event of events) {
      const name = event['name'] as string;
      // Must not be the old placeholder text.
      expect(name).not.toContain('[PLACEHOLDER]');
      // Must be one of the real (seeded) titles.
      const matchedTalk = SIGNATURE_TALKS.find((t) => t.title === name);
      expect(matchedTalk).toBeDefined();
    }
  });

  it('/speaking/reel emits a VideoObject JSON-LD (AC2, AC4)', () => {
    if (!reelHtml) return;
    const vidObj = findNodeByType(reelHtml, 'VideoObject');
    expect(vidObj).toBeDefined();
    expect(vidObj!['name']).toBe(REEL.name);
    expect(vidObj!['duration']).toBe('PT1M30S');
    expect(vidObj!['uploadDate']).toBe('2026-01-01');
    // thumbnailUrl + contentUrl are present (even if [OPEN]).
    expect(vidObj!['thumbnailUrl']).toBeTruthy();
    expect(vidObj!['contentUrl']).toBeTruthy();
  });

  it('/speaking contains the reel poster link to /speaking/reel/', () => {
    if (!speakingHtml) return;
    expect(speakingHtml).toMatch(/<a\b[^>]*\shref="\/speaking\/reel\/"[^>]*>/);
  });

  it('/speaking contains the ReelPoster anchor with aria-label (AC1)', () => {
    if (!speakingHtml) return;
    expect(speakingHtml).toMatch(/aria-label="[^"]*reel[^"]*"/i);
  });

  it('/speaking renders all talk titles in the HTML (AC3 — in real crawlable HTML)', () => {
    if (!speakingHtml) return;
    for (const talk of SIGNATURE_TALKS) {
      // First 40 chars of each title should appear in the DOM.
      expect(speakingHtml).toContain(talk.title.slice(0, 40));
    }
  });

  it('/speaking has the first talk abstract inline (not in <details>)', () => {
    if (!speakingHtml) return;
    // The first talk is expanded: its abstract is not wrapped in <details>.
    // Check that the abstract text appears before any <details> open tag for it.
    const firstAbstractSnippet = SIGNATURE_TALKS[0]!.abstract.slice(0, 60);
    expect(speakingHtml).toContain(firstAbstractSnippet);
  });

  it('/speaking has subsequent talk abstracts inside <details> (AC3 — JS-off)', () => {
    if (!speakingHtml) return;
    // At least one <details> element exists (for non-expanded talks).
    expect(speakingHtml).toMatch(/<details\b/i);
    // The <summary> reads "Read the abstract".
    expect(speakingHtml).toContain('Read the abstract');
    // The second talk abstract is present in the DOM (full text for crawlers).
    // Use a safe snippet without " chars (Astro encodes " as &quot; in HTML).
    expect(speakingHtml).toContain('agentic and are now confronting');
  });

  it('/speaking opens answer-first with "Joshua R. Brandt, MSE" (NFR-3 GEO floor)', () => {
    if (!speakingHtml) return;
    const firstP = speakingHtml.match(/<p\b[^>]*>([\s\S]*?)<\/p>/);
    const text = firstP
      ? firstP[1]!
          .replace(/<[^>]+>/g, '')
          .replace(/\s+/g, ' ')
          .trim()
      : '';
    expect(text.startsWith('Joshua R. Brandt, MSE')).toBe(true);
  });

  it('/speaking contains no exclamation marks in copy (positive-assertion voice)', () => {
    if (!speakingHtml) return;
    // Strip the inline copy-button script (JS legitimately uses ! for
    // negation / !== etc.) — same pattern as build-output.test.ts home check.
    const copyOnly = speakingHtml
      .replace(/<!doctype html>/i, '')
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
    expect(copyOnly).not.toContain('!');
  });

  it('/speaking/reel opens answer-first with "Joshua R. Brandt, MSE"', () => {
    if (!reelHtml) return;
    const firstP = reelHtml.match(/<p\b[^>]*>([\s\S]*?)<\/p>/);
    const text = firstP
      ? firstP[1]!
          .replace(/<[^>]+>/g, '')
          .replace(/\s+/g, ' ')
          .trim()
      : '';
    expect(text.startsWith('Joshua R. Brandt, MSE')).toBe(true);
  });

  it('/speaking/reel contains no exclamation marks', () => {
    if (!reelHtml) return;
    const copyOnly = reelHtml.replace(/<!doctype html>/i, '');
    expect(copyOnly).not.toContain('!');
  });
});
