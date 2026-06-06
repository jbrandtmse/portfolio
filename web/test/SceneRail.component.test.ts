import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, it } from 'vitest';

import SceneRail from '../src/components/scene/SceneRail.astro';

/**
 * Isolated component-render assertions for SceneRail (Story 1.4, AC2 / AC3 / AC4;
 * IAC-1 / IAC-2). Real-runtime evidence for a user-facing component (skill-rules
 * Rule 3 — rendered via Astro's Container API, the Button/HeroStatic pattern),
 * discoverable under the default suite (Rule 8: `*.test.ts`, included by
 * vitest.config.ts).
 *
 * The build-output suite (build-output.test.ts) already proves the rail's
 * contract on the ASSEMBLED page from a real `astro build`: 7 rail anchors
 * matching the section ids, skip → #close, jump → /speaking, the "Scene N of 7"
 * meter, exactly one aria-current on #hero, and the mobile <details> exists. This
 * file does NOT re-assert those page-level facts. It closes what the page suite
 * leaves uncovered, pinned at the COMPONENT boundary (independent of index.astro):
 *
 *   1. The decorative tick glyph is aria-hidden (AC2 — status/navigation is in
 *      the scene-NAME + aria-current + weight, NEVER the glyph or color alone).
 *      The page suite never checks the tick is hidden.
 *   2. The mobile "Jump to section" <details> menu carries the SAME 7 scene
 *      anchors PLUS skip → #close and jump → /speaking (AC3 — "the same anchors
 *      and skip/jump affordances"). The page suite only checks the <details>
 *      exists and reads "Jump to section"; it never asserts the menu's anchors.
 *   3. The 7 anchors → 7 locked ids mapping, exactly one aria-current (on #hero),
 *      skip → #close, and jump → /speaking, proven on the component in isolation.
 */

// The locked Stage-1 scene order (EXPERIENCE §"Scene order (Stage 1, locked)") —
// the section ids in exact DOM order. Mirrors the SCENES array in SceneRail.astro.
const SCENE_IDS = ['hero', 'thesis', 'timeline', 'speaker', 'flagship', 'glass-box', 'close'];

let container: Awaited<ReturnType<typeof AstroContainer.create>>;
let html = '';

beforeAll(async () => {
  container = await AstroContainer.create();
  html = await container.renderToString(SceneRail);
});

describe('SceneRail.astro — desktop rail anchors map to the locked scene ids (IAC-1, AC2)', () => {
  it('renders the 7 desktop scene entries as real <a> whose fragments are exactly the 7 locked ids in order', () => {
    // The desktop rail entries are the real jump-to-scene anchors; each carries a
    // data-scene-link hook the enhancement uses. Scoping to that hook isolates the
    // 7 scene entries from the skip/jump controls (which have no data-scene-link),
    // and proves both the id set AND the locked DOM order at the component boundary.
    const sceneFragments = [...html.matchAll(/<a\b[^>]*\sdata-scene-link="[^"]*"[^>]*>/g)].map(
      (m) => {
        const href = m[0].match(/\shref="([^"]*)"/);
        return href ? href[1] : null;
      },
    );
    expect(sceneFragments).toEqual(SCENE_IDS.map((id) => `#${id}`));
  });

  it('provides Skip-to-end → #close and Jump → /speaking (the FR-2 skip/jump affordances)', () => {
    expect(html).toMatch(/<a\b[^>]*\shref="#close"[^>]*>[\s\S]*?Skip[\s\S]*?<\/a>/);
    expect(html).toMatch(/<a\b[^>]*\shref="\/speaking"[^>]*>[\s\S]*?book a talk[\s\S]*?<\/a>/);
  });

  it('marks exactly one entry current via aria-current, and it is the Hero (#hero) (AC2/AC4 static baseline)', () => {
    // Exactly one rail entry carries aria-current in the static baseline, and it
    // is #hero. (Weight is applied in CSS via [aria-current] — color is never the
    // sole signal; aria-current is the assistive-tech-observable carrier.)
    const currentAnchors = [...html.matchAll(/<a\b[^>]*\saria-current="true"[^>]*>/g)];
    expect(currentAnchors).toHaveLength(1);
    expect(currentAnchors[0]![0]).toMatch(/\shref="#hero"/);
  });
});

describe('SceneRail.astro — the tick glyph is decorative, never the sole signal (AC2)', () => {
  it('renders every decorative tick as aria-hidden so meaning rides the scene name', () => {
    // AC2 / Task 2: "the decorative tick glyph is aria-hidden; the scene-NAME link
    // text carries the meaning." Assert at least one tick exists and EVERY tick is
    // aria-hidden (no tick leaks into the accessibility tree as content).
    const ticks = [...html.matchAll(/<span\b[^>]*\bclass="[^"]*\brail-d__tick\b[^"]*"[^>]*>/g)].map(
      (m) => m[0],
    );
    expect(ticks.length).toBeGreaterThan(0);
    for (const tick of ticks) {
      expect(tick).toMatch(/aria-hidden="true"/);
    }
  });
});

describe('SceneRail.astro — mobile "Jump to section" menu carries the same affordances (AC3)', () => {
  it('renders a native <details> disclosure whose summary reads "Jump to section" (JS-off-operable)', () => {
    // The mobile reflow is a native <details>/<summary> — works with 0 JS and is
    // keyboard-operable (presentation-only reflow; the page reading order is intact).
    expect(html).toMatch(/<details\b[^>]*\bclass="[^"]*rail-m__menu[^"]*"[^>]*>/);
    expect(html).toMatch(/<summary\b[^>]*>[\s\S]*?Jump to section[\s\S]*?<\/summary>/);
  });

  it('the mobile menu carries the same 7 scene anchors PLUS skip → #close and jump → /speaking', () => {
    // AC3: the mobile menu carries "the same anchors and skip/jump affordances".
    // Scope to the <details> menu and assert all 7 fragment anchors + skip + jump
    // are present inside it — not just the summary text.
    const menuMatch = html.match(
      /<details\b[^>]*\bclass="[^"]*rail-m__menu[^"]*"[^>]*>[\s\S]*?<\/details>/,
    );
    expect(menuMatch).not.toBeNull();
    const menu = menuMatch![0];
    for (const id of SCENE_IDS) {
      expect(menu).toMatch(new RegExp(`<a\\b[^>]*\\shref="#${id}"[^>]*>`));
    }
    // Skip → #close and jump → /speaking live in the menu too.
    expect(menu).toMatch(/<a\b[^>]*\shref="#close"[^>]*>[\s\S]*?Skip[\s\S]*?<\/a>/);
    expect(menu).toMatch(/<a\b[^>]*\shref="\/speaking"[^>]*>[\s\S]*?book a talk[\s\S]*?<\/a>/);
  });
});
