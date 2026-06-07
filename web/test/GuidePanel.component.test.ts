import { getContainerRenderer } from '@astrojs/react';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { loadRenderers } from 'astro:container';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { STARTER_PROMPTS } from '../src/data/faq';
import { GuidePanel } from '../src/islands/GuidePanel';
import { $guideOpen } from '../src/lib/store';

/**
 * Component-tier a11y + single-source contract for the GuidePanel island
 * (Story 4.4, AC2 / Decision 4). Closes the dev-stage coverage gap noted in the
 * Dev Agent Record: the panel/pill had NO dedicated component-tier test (only the
 * `guide-panel` e2e). This pins the STATIC accessibility contract + the
 * chips===STARTER_PROMPTS single-source binding at the unit tier — fast,
 * deterministic, and mutation-verifiable — COMPLEMENTING (not duplicating) the
 * e2e, which proves the interactive focus/Tab/SSE behavior in a real browser.
 *
 * WHY the Container API (not jsdom/RTL): the web vitest env is `node` (no DOM),
 * and every existing component test renders via Astro's Container API to an HTML
 * string (BaseLayout/MirrorLayout/Button.component.test.ts). React SSR through the
 * container serializes the panel's open-state markup faithfully (greeting, the
 * three chips, every role/aria attribute, the real <button>/<input> controls), so
 * the static a11y contract is fully assertable here. Interactive behaviors (focus
 * moves in / not trapped / Esc returns focus / per-message aria-live updates /
 * citation routing) live in the e2e, where a real browser exists.
 *
 * Rule 8 compliance:
 *   - Imports + renders the REAL GuidePanel module (not an inline copy) and the
 *     REAL STARTER_PROMPTS export (not a re-listed array) — a drift in either reds.
 *   - Assertions are SCOPED to the specific element/text they check (the greeting
 *     <p>, the chip <button>s, the dialog attributes) — not a whole-document match
 *     a different surface could satisfy.
 *
 * The panel renders `null` when `$guideOpen` is false (its default), so the store
 * is forced open for the render and reset afterward (store is module-global).
 *
 * Discoverable under the default suite (Rule 8): co-located test/*.test.ts matched
 * by the vitest.config.ts include glob.
 */

let html = '';

/** Decode the minimal HTML entities React/Astro emit + collapse whitespace. */
function decode(s: string): string {
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&middot;/g, '·')
    .replace(/&#xB7;/g, '·')
    .replace(/\s+/g, ' ')
    .trim();
}

beforeAll(async () => {
  // The panel only renders when open; force the store open for the SSR snapshot.
  $guideOpen.set(true);
  const renderers = await loadRenderers([getContainerRenderer()]);
  const container = await AstroContainer.create({ renderers });
  // Render the REAL island (no pillRef needed for the static markup contract).
  html = await container.renderToString(
    GuidePanel as unknown as Parameters<typeof container.renderToString>[0],
    {},
  );
});

afterAll(() => {
  // Reset module-global store so other suites see the default closed state.
  $guideOpen.set(false);
});

describe('GuidePanel — NON-modal dialog a11y contract (AC2, Decision 4)', () => {
  it('renders a role="dialog" with aria-modal="false" (NON-modal — the a11y heart)', () => {
    // Scope to the panel element specifically (data-testid), then assert BOTH
    // attributes are on that same element — a modal (aria-modal="true") is WRONG.
    const dialogTag = html.match(/<div\b[^>]*data-testid="guide-panel"[^>]*>/);
    expect(dialogTag, 'the guide-panel dialog element').not.toBeNull();
    expect(dialogTag![0]).toMatch(/role="dialog"/);
    expect(dialogTag![0]).toMatch(/aria-modal="false"/);
    // It must NOT be a modal dialog.
    expect(dialogTag![0]).not.toMatch(/aria-modal="true"/);
  });

  it('emits NO scrim/backdrop/overlay element (non-modal: page stays interactive)', () => {
    // The non-modal panel ships no dimming layer. Assert no element carries a
    // scrim/backdrop/overlay class (the same surface the e2e checks at runtime).
    expect(html).not.toMatch(/class="[^"]*\b(scrim|backdrop|overlay)\b[^"]*"/);
  });

  it('carries the head: monogram + "Grounded · cites its sources" status + real minimize/close <button>s', () => {
    expect(html).toMatch(/class="guide-panel__monogram"[^>]*>JRB</);
    const badge = html.match(/<span class="guide-panel__status-badge">([\s\S]*?)<\/span>/);
    expect(badge, 'status badge element').not.toBeNull();
    expect(decode(badge![1]!)).toBe('Grounded · cites its sources');
    // Real <button> controls (keyboard-operable), labeled.
    expect(html).toMatch(/<button\b[^>]*aria-label="Minimize Guide"/);
    expect(html).toMatch(/<button\b[^>]*aria-label="Close Guide"/);
  });

  it('renders the transcript as role="log" aria-live="polite" with aria-busy wired (per-message announce — NFR-2)', () => {
    // The transcript is a polite live region (batches per completed message — NEVER
    // per token). aria-live="polite" on role="log" is the markup half of NFR-2.
    // aria-busy is wired (false in the idle SSR snapshot) so AT holds polite
    // announcements WHILE a guide turn streams and announces the settled message
    // once on completion — the structural guarantee against per-token announcing
    // (AT coalescing alone is not a stable contract). The e2e proves the
    // per-message (not per-token) batching at runtime.
    const log = html.match(/<div\b[^>]*data-testid="guide-transcript"[^>]*>/);
    expect(log, 'the transcript log element').not.toBeNull();
    expect(log![0]).toMatch(/role="log"/);
    expect(log![0]).toMatch(/aria-live="polite"/);
    // aria-busy present (idle = "false") — the per-message gate is wired, not absent.
    expect(log![0], 'transcript log must wire aria-busy (NFR-2 per-message gate)').toMatch(
      /aria-busy="false"/,
    );
  });

  it('renders a role="status" thinking region (announced ONCE — NFR-2)', () => {
    // The per-message thinking state ("Reading the record" → "Reading: <sources>")
    // is a single role="status" region — announced once on transition, never per
    // token. Assert the status region exists in the panel markup.
    expect(html).toMatch(/id="[^"]*-status"[^>]*role="status"[^>]*aria-live="polite"/);
  });
});

describe('GuidePanel — in-voice greeting + starter chips single-source (AC2, Decision 4)', () => {
  it('shows the exact in-voice greeting, exclamation-free (positive-assertion voice)', () => {
    const greeting = html.match(/<p class="guide-panel__text">([\s\S]*?)<\/p>/);
    expect(greeting, 'the greeting paragraph').not.toBeNull();
    const text = decode(greeting![1]!);
    expect(text).toBe("I'm your guide to Joshua's work. I only say what it can back up.");
    // Voice: no exclamation marks anywhere in the rendered panel copy.
    expect(decode(html.replace(/<style>[\s\S]*?<\/style>/g, ''))).not.toContain('!');
  });

  it('renders EXACTLY the three STARTER_PROMPTS as <button> chips, in order (Rule 8 single-source, no drift)', () => {
    // Extract the chip button text in DOM order, scoped to the chip buttons.
    const chipTexts = [
      ...html.matchAll(/<button\b[^>]*data-testid="guide-chip"[^>]*>([\s\S]*?)<\/button>/g),
    ].map((m) => decode(m[1]!));
    // EXACTLY three chips (no more, no fewer).
    expect(chipTexts).toHaveLength(3);
    // Each chip is the corresponding STARTER_PROMPTS question, IN ORDER. Binds to
    // the REAL imported export — a drift in faq.ts STARTER_PROMPTS reds this
    // (Rule 8: real module, not a re-listed copy).
    expect(chipTexts).toEqual(STARTER_PROMPTS.map((p) => decode(p.question)));
  });
});

describe('GuidePanel — composer: real, labeled controls (AC2)', () => {
  it('renders a labeled text input + a real send <button> (keyboard-operable)', () => {
    // The input is a real <input type="text"> with an associated <label> (the
    // sr-only "Ask a question" label references it by id).
    const inputTag = html.match(/<input\b[^>]*data-testid="guide-input"[^>]*>/);
    expect(inputTag, 'the composer input').not.toBeNull();
    expect(inputTag![0]).toMatch(/type="text"/);
    const inputId = inputTag![0].match(/\bid="([^"]+)"/)?.[1];
    expect(inputId, 'input has an id').toBeTruthy();
    // A <label for="<inputId>"> exists (programmatic association — a11y).
    expect(html).toMatch(new RegExp(`<label\\b[^>]*for="${inputId}"`));
    // The send control is a real submit <button>, labeled.
    expect(html).toMatch(
      /<button\b[^>]*type="submit"[^>]*aria-label="Send question"|<button\b[^>]*aria-label="Send question"[^>]*type="submit"/,
    );
  });
});
