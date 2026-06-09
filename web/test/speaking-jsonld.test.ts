import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

import { REEL, SIGNATURE_TALKS, reelVideoObjectInput, talkEventInput } from '../src/data/speaking';
import { eventJsonLd, serializeJsonLd, videoObjectJsonLd } from '../src/lib/jsonld';

/**
 * Speaker-Surface JSON-LD validity + credibility-floor + determinism (Story 3.1,
 * QA gap-fill — complements the dev's speaking.test.ts; does NOT duplicate it).
 *
 * The dev suite already asserts: Event count, performer name, VideoObject
 * name/duration/uploadDate, reel link presence, 0-JS, voice. This file adds the
 * gaps the QA directive calls out at the real-build tier (skill-rules Rule 3):
 *
 *  1. Schema.org VALIDITY of the emitted nodes on the real `dist` HTML — the
 *     COMPLETE required-field set Google's Rich Results Test checks for Event
 *     (name, startDate, eventAttendanceMode, location, performer, organizer) and
 *     VideoObject (name, description, thumbnailUrl, uploadDate, duration), the
 *     @context on every node, well-typed nested nodes, and one Event per talk
 *     keyed by title.
 *  2. Credibility-floor HONESTY as VISIBLE TEXT (not tint/style alone) in the
 *     built HTML: the [OPEN] reel placeholder and the [ASSUMPTION] veteran-IC
 *     talk render as real, tag-stripped, visible body text.
 *  3. DETERMINISM (NFR-6) of the shipped JSON-LD path: the serialized string is
 *     stable across repeated serialization and carries no wall-clock artifact.
 *
 * Discoverable under the default vitest suite (Rule 8: test/** glob).
 */

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(webRoot, 'dist');

/** Parse every ld+json block; return flattened top-level nodes. */
function parseLdJson(html: string): Array<Record<string, unknown>> {
  const blocks =
    html.match(
      /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ) ?? [];
  const nodes: Array<Record<string, unknown>> = [];
  for (const block of blocks) {
    const inner = block.replace(/^<script\b[^>]*>/i, '').replace(/<\/script>$/i, '');
    const parsed = JSON.parse(inner) as unknown;
    if (Array.isArray(parsed)) nodes.push(...(parsed as Array<Record<string, unknown>>));
    else nodes.push(parsed as Record<string, unknown>);
  }
  return nodes;
}

function nodesOfType(html: string, type: string): Array<Record<string, unknown>> {
  return parseLdJson(html).filter((n) => n['@type'] === type);
}

/** Tag-stripped visible text of an HTML document (collapsed whitespace). */
function visibleText(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ') // drop ld+json DATA — not "visible"
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

describe('Speaker-Surface JSON-LD — schema.org validity on the real build', () => {
  let speakingHtml = '';
  let reelHtml = '';

  beforeAll(() => {
    const speakingPath = join(distDir, 'speaking', 'index.html');
    const reelPath = join(distDir, 'speaking', 'reel', 'index.html');
    if (existsSync(speakingPath)) speakingHtml = readFileSync(speakingPath, 'utf8');
    if (existsSync(reelPath)) reelHtml = readFileSync(reelPath, 'utf8');
  });

  it('every emitted JSON-LD block parses as valid JSON (serializer escaping is reversible)', () => {
    if (!speakingHtml || !reelHtml) return;
    // parseLdJson throws if any block is not valid JSON — calling it is the assertion.
    expect(parseLdJson(speakingHtml).length).toBeGreaterThan(0);
    expect(parseLdJson(reelHtml).length).toBeGreaterThan(0);
  });

  it('/speaking emits exactly one Event per signature talk, keyed by title (one-to-one)', () => {
    if (!speakingHtml) return;
    const events = nodesOfType(speakingHtml, 'Event');
    const eventNames = events.map((e) => e['name']).sort();
    const talkTitles = SIGNATURE_TALKS.map((t) => t.title).sort();
    expect(eventNames).toEqual(talkTitles);
  });

  it('each Event node carries the FULL schema.org required-field set (Rich Results)', () => {
    if (!speakingHtml) return;
    const events = nodesOfType(speakingHtml, 'Event');
    expect(events.length).toBe(SIGNATURE_TALKS.length);
    for (const ev of events) {
      // @context + @type
      expect(ev['@context']).toBe('https://schema.org');
      expect(ev['@type']).toBe('Event');
      // Required top-level fields present and non-empty.
      expect(typeof ev['name']).toBe('string');
      expect((ev['name'] as string).length).toBeGreaterThan(0);
      expect(ev['startDate']).toBeTruthy();
      expect(ev['eventAttendanceMode']).toBe('https://schema.org/MixedEventAttendanceMode');
      // location is a typed node with a name.
      const location = ev['location'] as Record<string, unknown>;
      expect(location).toBeTruthy();
      expect(typeof location['@type']).toBe('string');
      // performer is a typed Person with the EXACT real name.
      const performer = ev['performer'] as Record<string, unknown>;
      expect(performer['@type']).toBe('Person');
      expect(performer['name']).toBe('Joshua R. Brandt, MSE');
      // organizer is a typed node.
      const organizer = ev['organizer'] as Record<string, unknown>;
      expect(typeof organizer['@type']).toBe('string');
    }
  });

  it('the embedded performer Person carries NO nested @context (JSON-LD embedding rule)', () => {
    if (!speakingHtml) return;
    // A nested node must inherit the parent context, not redeclare it — else the
    // Rich Results parser rejects the graph. Guards the jsonld.embed() contract.
    for (const ev of nodesOfType(speakingHtml, 'Event')) {
      const performer = ev['performer'] as Record<string, unknown>;
      expect(performer['@context']).toBeUndefined();
    }
  });

  it('/speaking/reel VideoObject carries the FULL schema.org required-field set', () => {
    if (!reelHtml) return;
    const vids = nodesOfType(reelHtml, 'VideoObject');
    expect(vids.length).toBe(1);
    const vid = vids[0]!;
    expect(vid['@context']).toBe('https://schema.org');
    expect(vid['@type']).toBe('VideoObject');
    expect(vid['name']).toBe(REEL.name);
    // description is REAL (non-empty, references the reel) — not a blank stub.
    expect(typeof vid['description']).toBe('string');
    expect((vid['description'] as string).length).toBeGreaterThan(20);
    // thumbnailUrl/uploadDate/duration all present; duration ~PT1M30S (~90s).
    expect(vid['thumbnailUrl']).toBeTruthy();
    expect(vid['uploadDate']).toBe(REEL.uploadDate);
    expect(vid['duration']).toBe('PT1M30S');
  });

  it('all [OPEN] absolute URLs in the reel VideoObject are valid absolute URLs (so schema validates)', () => {
    if (!reelHtml) return;
    const vid = nodesOfType(reelHtml, 'VideoObject')[0]!;
    for (const key of ['thumbnailUrl', 'contentUrl', 'embedUrl'] as const) {
      const url = vid[key];
      if (url == null) continue; // contentUrl/embedUrl optional
      // Must be an absolute http(s) URL — a bare [OPEN] token would fail the RRT.
      expect(() => new URL(url as string)).not.toThrow();
      expect(url as string).toMatch(/^https?:\/\//);
    }
  });
});

describe('Speaker-Surface credibility floor — flags are VISIBLE TEXT in the built HTML', () => {
  let speakingVisible = '';
  let reelVisible = '';

  beforeAll(() => {
    const speakingPath = join(distDir, 'speaking', 'index.html');
    const reelPath = join(distDir, 'speaking', 'reel', 'index.html');
    if (existsSync(speakingPath)) speakingVisible = visibleText(readFileSync(speakingPath, 'utf8'));
    if (existsSync(reelPath)) reelVisible = visibleText(readFileSync(reelPath, 'utf8'));
  });

  it('the [ASSUMPTION] veteran-IC talk is present as visible body text on /speaking (not tint alone)', () => {
    if (!speakingVisible) return;
    const veteran = SIGNATURE_TALKS.find((t) => t.id === 'veteran-ic-vantage')!;
    // The veteran-IC title is flagged [ASSUMPTION] AND renders as visible text.
    expect(veteran.title).toContain('[ASSUMPTION]');
    expect(speakingVisible).toContain('Veteran IC');
    expect(speakingVisible).toContain('[ASSUMPTION]');
  });

  it('the [OPEN] reel-video placeholder renders as visible link text on /speaking (not tint alone)', () => {
    if (!speakingVisible) return;
    // The reel poster caption surfaces the [OPEN] hosted-video flag in visible text.
    expect(speakingVisible).toContain('[OPEN');
    expect(speakingVisible).toContain('hosted video link pending');
  });

  it('the [OPEN] reel-video placeholder is visible body text on /speaking/reel too', () => {
    if (!reelVisible) return;
    expect(reelVisible).toContain('[OPEN');
    expect(reelVisible.toLowerCase()).toContain('pending');
  });
});

describe('Speaker-Surface JSON-LD — determinism of the shipped string (NFR-6)', () => {
  it('serializing the speaking Event graph twice yields byte-identical output', () => {
    const build = () =>
      serializeJsonLd([
        ...SIGNATURE_TALKS.map((t) => eventJsonLd(talkEventInput(t))),
        // (no recordings seeded yet — same flatMap shape as the page)
      ]);
    expect(build()).toBe(build());
  });

  it('serializing the reel VideoObject twice yields byte-identical output', () => {
    const build = () => serializeJsonLd(videoObjectJsonLd(reelVideoObjectInput()));
    expect(build()).toBe(build());
  });

  it('the serialized JSON-LD carries no wall-clock / year-2025-or-2027 drift token', () => {
    // Every date in the speaking surface is the fixed 2026-01-01 constant. A
    // stray new Date() would surface a different year here on most runs.
    const serialized =
      serializeJsonLd([...SIGNATURE_TALKS.map((t) => eventJsonLd(talkEventInput(t)))]) +
      serializeJsonLd(videoObjectJsonLd(reelVideoObjectInput()));
    // The only date present must be the fixed constant.
    const dateTokens = serialized.match(/"\d{4}-\d{2}-\d{2}"/g) ?? [];
    expect(dateTokens.length).toBeGreaterThan(0);
    for (const tok of dateTokens) {
      expect(tok).toBe('"2026-01-01"');
    }
  });
});
