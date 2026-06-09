import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, it } from 'vitest';

import HeroStatic from '../src/components/hero/HeroStatic.astro';

/**
 * Isolated component-render assertions for HeroStatic (Story 1.3, AC1 / AC2 /
 * IAC-2).
 *
 * The build-output suite (build-output.test.ts) already covers the *page*
 * contract from a real `astro build`: exactly one <h1> = the canonical
 * positioning line, the framing string, the three fork hrefs, 0 <script>, no
 * exclamation marks. This file does NOT re-assert those page-level facts.
 *
 * It closes the two things the page suite leaves uncovered, by rendering
 * HeroStatic directly via Astro's Container API (the Button.component.test.ts
 * pattern) — real-runtime evidence for a user-facing component (skill-rules
 * Rule 3), discoverable under the default suite (Rule 8: `*.test.ts`, included
 * by vitest.config.ts):
 *
 *   1. The [OPEN] headshot PLACEHOLDER (AC1 / IAC-2) — AC1 requires "a
 *      headshot/portrait (styled placeholder until the real asset, flagged
 *      [OPEN])". The page suite never checks the portrait exists or is flagged
 *      as a placeholder. The `[OPEN]` source marker is a build-stripped comment
 *      (correctly absent from rendered HTML), so the runtime-observable proof of
 *      "this is a placeholder, not the real asset" is the accessible label on
 *      the portrait region.
 *   2. The fork at the COMPONENT boundary (AC2 / IAC-2) — that the three fork
 *      controls are real <a> elements (JS-off-followable) with the exact hrefs,
 *      and that the quiet Guide entry is a real link that is NOT a .btn (the
 *      understated third option, distinct from the two fork buttons), proven on
 *      the component in isolation rather than only inside the assembled page.
 */
let container: Awaited<ReturnType<typeof AstroContainer.create>>;
let html = '';

beforeAll(async () => {
  container = await AstroContainer.create();
  html = await container.renderToString(HeroStatic);
});

describe('HeroStatic.astro — [OPEN] headshot placeholder (AC1 / IAC-2)', () => {
  it('renders a portrait region flagged as a placeholder via its accessible label', () => {
    // The styled placeholder is an accessible image region (role="img") whose
    // accessible name marks it a PLACEHOLDER (not the real headshot). Match the
    // opening tag attribute-order-agnostically, then assert the label both names
    // the subject and flags the placeholder state.
    const matRegion = html.match(/<div\b[^>]*\brole="img"[^>]*>/);
    expect(matRegion).not.toBeNull();
    const label = matRegion![0].match(/aria-label="([^"]*)"/);
    expect(label).not.toBeNull();
    // The capture group is guaranteed by the matched literal pattern above; the
    // non-null assertion satisfies TS strict after the not-null guard (same
    // pattern used across this test suite).
    const labelText = label![1]!;
    expect(labelText).toContain('Joshua R. Brandt');
    expect(labelText.toLowerCase()).toContain('placeholder');
  });

  it('uses a CSS/markup placeholder, not a heavy/stock <img> (NFR-1)', () => {
    // The placeholder is a CSS mat + monogram mark — no <img> asset ships from
    // the hero (NFR-1: no heavy/stock/AI image).
    expect(html).not.toMatch(/<img\b/);
  });

  it('keeps the monogram mark decorative (not announced as content)', () => {
    // The "JRB" monogram is a placeholder mark, not the accessible name — it is
    // aria-hidden so the labeled region carries the single, meaningful name.
    const monogram = html.match(/<span\b[^>]*\bclass="[^"]*\bhero__monogram\b[^"]*"[^>]*>/);
    expect(monogram).not.toBeNull();
    expect(monogram![0]).toMatch(/aria-hidden="true"/);
  });

  it('renders the museum-style portrait caption with the subject name', () => {
    // The portrait carries a <figcaption> museum-style label naming the subject.
    expect(html).toMatch(/<figcaption\b[^>]*>[\s\S]*?Joshua R\. Brandt[\s\S]*?<\/figcaption>/);
  });
});

describe('HeroStatic.astro — the audience fork at the component boundary (AC2 / IAC-2)', () => {
  it('renders Explore and "book a talk" as real <a> controls (JS-off-followable)', () => {
    // Both primary ways in are real anchors with the exact hrefs — not <button>,
    // not <div> — so they are followable with JS off. Attribute order is
    // href-before-class in Astro's output, so match the opening tag and assert
    // it is an <a> (the regex anchors on `<a … href=…`).
    expect(html).toMatch(/<a\b[^>]*\shref="#thesis"[^>]*>[\s\S]*?Explore[\s\S]*?<\/a>/);
    // "book a talk" → /speaking/ (trailing-slash form; Story 2.0 AC2).
    expect(html).toMatch(/<a\b[^>]*\shref="\/speaking\/"[^>]*>[\s\S]*?book a talk[\s\S]*?<\/a>/);
  });

  it('renders the quiet Guide entry as a real <a> to /faq/ that is NOT a .btn', () => {
    // The third, understated option is a real inline link (followable JS-off),
    // deliberately distinct from the two fork buttons (it carries no .btn class).
    // /faq/ uses the trailing-slash form (Story 2.0 AC2).
    const guideLink = html.match(/<a\b[^>]*\shref="\/faq\/"[^>]*>/);
    expect(guideLink).not.toBeNull();
    expect(guideLink![0]).not.toMatch(/class="[^"]*\bbtn\b/);
    expect(html).toMatch(
      /<a\b[^>]*\shref="\/faq\/"[^>]*>[\s\S]*?ask my Guide about the work[\s\S]*?<\/a>/,
    );
  });

  it('exposes exactly the three fork hrefs from the component (no stray nav)', () => {
    // The component emits precisely the three canonical destinations — the two
    // fork buttons (#thesis, /speaking/) and the quiet Guide entry (/faq/) — and
    // no other anchors leak in from the hero. Trailing-slash form (Story 2.0 AC2).
    const hrefs = [...html.matchAll(/<a\b[^>]*\shref="([^"]*)"[^>]*>/g)].map((m) => m[1]);
    expect(hrefs).toEqual(['#thesis', '/speaking/', '/faq/']);
  });
});
