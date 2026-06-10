import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { WINGS, findWing } from '../../content/wings';

/**
 * Wings content-credibility regression suite (Story 7.1, AC2 / Rule 9).
 *
 * The BROAD credibility audit, pinned at the SOURCE boundary so a manifest or KB
 * drift that fabricates a project, links a Stage-2 playable as built work, or
 * mis-describes a real surface REDS here — the line-scoped guardrails the Epic-4
 * retro (Rule 9) mandates for LLM-authored visitor-facing content.
 *
 * Rule 8: exercises the REAL exported WINGS manifest (not an inline copy) and the
 * REAL content/kb/wings.md on disk (the file the KB indexer feeds the Guide), and
 * scopes each assertion to the specific claim it guards. Mutation-verified: adding
 * a fabricated entry to content/wings.ts or re-introducing the "ADRs" fabrication
 * to content/kb/wings.md reds the matching test.
 *
 * The e2e companion (web/e2e/wings.spec.ts) proves the SAME credibility floor on
 * the RENDERED/SERVED pages; this suite locks it at the data + KB source so a
 * fabrication is caught even before a build.
 */

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const kbDir = join(repoRoot, 'content', 'kb');
const wingsKbPath = join(kbDir, 'wings.md');
const wingsKb = readFileSync(wingsKbPath, 'utf8');

// Every curated KB markdown doc the Guide grounds on (the same default-deny set
// scripts/build-kb-index.ts feeds the Guide; README.md excluded). Read from disk
// (Rule 8: the REAL files the indexer reads), so a fabrication re-introduced into
// ANY KB doc — not just wings.md — reds the broad guard below.
const KB_DOCS: Array<{ filename: string; content: string }> = readdirSync(kbDir)
  .filter((f) => f.endsWith('.md') && f !== 'README.md')
  .sort()
  .map((filename) => ({ filename, content: readFileSync(join(kbDir, filename), 'utf8') }));

// The closed allow-list of real, grounded LIVE targets (updated Story 7.3: the
// three playables are now live: vector-wars, christmas-elves, and voyager
// (voyager is now a live external embed at https://voyager.abacusai.cloud/).
// Any 'live' Wing item href OUTSIDE this set is a fabrication.
const ALLOWED_LIVE_HREFS = new Set([
  '/work/loandemo/',
  '/glass-box/',
  '/faq/',
  // Story 7.3: two self-contained playable project pages are now live
  '/work/vector-wars/',
  '/work/christmas-elves/',
  // voyager is now LIVE as an external embed at https://voyager.abacusai.cloud/
  '/work/voyager/',
]);

// All three playables are now live.
const PLAYABLES = ['vector-wars', 'christmas-elves', 'voyager'];

// Fabricated artifact-type claims for the Glass Box. The Glass Box index actually
// publishes brainstorm / research / brief / UX / PRD artifacts — NOT ADRs, and the
// epics/stories/retrospectives live in _bmad-output, not the published index. The
// Epic-4 retro (Rule 9) enumerated "no portfolio 'recorded in ADRs' — there is no
// docs/adr/" as a known fabrication class; guard it here for the Wings KB too.
const ADR_FABRICATION = /\bADRs?\b/;

describe('content/wings.ts — the curated manifest is grounded (AC2 / Rule 9)', () => {
  it('defines exactly the three Wings in the locked order: technical, creative, agentic', () => {
    expect(WINGS.map((w) => w.id)).toEqual(['technical', 'creative', 'agentic']);
  });

  it('every Wing lede first sentence names "Joshua R. Brandt, MSE" (GEO floor)', () => {
    for (const wing of WINGS) {
      expect(wing.lede.startsWith('Joshua R. Brandt, MSE'), `${wing.id} lede entity-first`).toBe(
        true,
      );
    }
  });

  it('every LIVE item links to a known real shipped surface — no fabricated target', () => {
    for (const wing of WINGS) {
      for (const item of wing.items.filter((i) => i.status === 'live')) {
        expect(
          ALLOWED_LIVE_HREFS.has(item.href),
          `${wing.id}: live item "${item.title}" href "${item.href}" must be a known real surface`,
        ).toBe(true);
      }
    }
  });

  it('all three playables (vector-wars / christmas-elves / voyager) are LIVE items', () => {
    // vector-wars (Technical) + christmas-elves (Creative) shipped in Story 7.3.
    // voyager (Technical) is now a live external embed at https://voyager.abacusai.cloud/.
    // Mutation-verified: reds if a shipped playable is removed/demoted.
    const technical = findWing('technical')!;
    const vw = technical.items.find((i) => i.href === '/work/vector-wars/');
    expect(vw, 'technical Wing has a vector-wars live item').toBeDefined();
    expect(vw!.status, 'vector-wars item is status:live').toBe('live');
    // voyager IS now a live item (external embed — not a vendored bundle).
    const voy = technical.items.find((i) => i.href === '/work/voyager/');
    expect(voy, 'technical Wing has a voyager live item (external embed)').toBeDefined();
    expect(voy!.status, 'voyager item is status:live').toBe('live');
    const creative = findWing('creative')!;
    const elves = creative.items.find((i) => i.href === '/work/christmas-elves/');
    expect(elves, 'creative Wing has a christmas-elves live item').toBeDefined();
    expect(elves!.status, 'christmas-elves item is status:live').toBe('live');
  });

  it('technical moreComing is false (voyager now live); creative moreComing is false', () => {
    // voyager is now a live external embed → technical is complete → moreComing: false.
    // Creative is complete (christmas-elves live, Suno [OPEN]) → moreComing false.
    const technical = findWing('technical')!;
    expect(
      technical.moreComing,
      'technical moreComing is false (voyager is now live as an external embed)',
    ).toBe(false);
    const creative = findWing('creative')!;
    expect(creative.moreComing, 'creative moreComing is false (christmas-elves now live)').toBe(
      false,
    );
  });

  it('the Suno music uses the deliberate [OPEN: Suno profile URL] honest flag — no invented URL or live link', () => {
    const creative = findWing('creative')!;
    const music = creative.items.find((i) => /suno/i.test(i.title));
    expect(music, 'creative Wing has a Suno music item').toBeDefined();
    // It is an OPEN item (not live) and its href is the honest flag.
    expect(music!.status, 'Suno item is status:open (honest flag, not a live link)').toBe('open');
    expect(music!.href, 'Suno item href is the [OPEN: Suno profile URL] flag').toBe(
      '[OPEN: Suno profile URL]',
    );
    // No invented Suno domain URL anywhere in the creative Wing items.
    for (const item of creative.items) {
      expect(
        /suno\.(com|ai)\/\S/i.test(`${item.href} ${item.blurb}`),
        `no invented Suno URL in creative item "${item.title}"`,
      ).toBe(false);
    }
  });

  it('agentic carries an honest "more coming" affordance; technical + creative are complete', () => {
    // voyager is now live → technical is complete → moreComing: false.
    // Creative (christmas-elves live + Suno [OPEN]) is complete → moreComing false.
    // Agentic (2 live) still carries a coming note — calm, no exclamation.
    const agentic = findWing('agentic')!;
    expect(
      typeof agentic.moreComing === 'string' && agentic.moreComing.length > 0,
      'agentic carries an honest moreComing affordance',
    ).toBe(true);
    expect(String(agentic.moreComing), 'agentic moreComing has no exclamation').not.toContain('!');
    const technical = findWing('technical')!;
    expect(technical.moreComing, 'technical moreComing is false (voyager now live)').toBe(false);
    const creative = findWing('creative')!;
    expect(creative.moreComing, 'creative moreComing is false (Wing complete)').toBe(false);
  });

  it('no Wing copy (lede / domain / item blurbs / moreComing) contains an exclamation mark', () => {
    for (const wing of WINGS) {
      const copy = [
        wing.lede,
        wing.domain,
        String(wing.moreComing),
        ...wing.items.flatMap((i) => [i.title, i.blurb]),
      ].join(' ');
      expect(copy, `${wing.id} copy has no exclamation`).not.toContain('!');
    }
  });
});

describe('content/kb/wings.md — the Guide-grounding KB entry is grounded (AC2 / AC3 / Rule 9)', () => {
  it('does NOT claim the Glass Box holds ADRs (no docs/adr/; the index publishes brainstorm/research/brief/UX/PRD)', () => {
    // Epic-4 Rule 9 fabrication class: "recorded in ADRs" when no docs/adr/ exists.
    expect(
      ADR_FABRICATION.test(wingsKb),
      'wings.md must not claim the Glass Box holds ADRs (fabricated artifact type)',
    ).toBe(false);
  });

  it('names all three playables as live work items; voyager is on a live bullet with /work/voyager/', () => {
    // All three playables are now live: vector-wars, christmas-elves, and voyager.
    // voyager is a live external embed at https://voyager.abacusai.cloud/ and is
    // referenced by its portfolio page /work/voyager/.
    expect(wingsKb, 'wings.md references /work/vector-wars/').toContain('/work/vector-wars/');
    expect(wingsKb, 'wings.md references /work/christmas-elves/').toContain(
      '/work/christmas-elves/',
    );
    expect(
      wingsKb.includes('/work/voyager/'),
      'wings.md must reference /work/voyager/ (voyager is now live)',
    ).toBe(true);
    // Confirm all three playables appear on live-work bullet lines (start "- **")
    const lines = wingsKb.split('\n');
    const liveBullets = lines.filter((l) => l.trim().startsWith('- **'));
    const bulletText = liveBullets.join('\n').toLowerCase();
    for (const playable of PLAYABLES) {
      expect(
        bulletText.includes(playable),
        `wings.md has a live-work bullet for "${playable}"`,
      ).toBe(true);
    }
  });

  it('references each real Wing route and the grounded live surfaces (Guide can cite them — AC3)', () => {
    for (const route of ['/technical/', '/creative/', '/agentic/']) {
      expect(wingsKb, `wings.md references ${route}`).toContain(route);
    }
    // The grounded live surfaces the Guide should be able to cite.
    expect(wingsKb).toContain('/work/loandemo/');
    expect(wingsKb).toContain('/glass-box/');
    expect(wingsKb).toContain('/timeline/');
  });

  it('uses the deliberate [OPEN: Suno profile URL] honest flag and no invented Suno URL', () => {
    expect(wingsKb, 'wings.md carries the honest Suno [OPEN] flag').toContain(
      '[OPEN: Suno profile URL]',
    );
    expect(/suno\.(com|ai)\/\S/i.test(wingsKb), 'wings.md must not invent a Suno profile URL').toBe(
      false,
    );
  });
});

describe('content/kb/*.md — the Guide-grounding KB corpus carries no "recorded in ADRs" fabrication (Rule 9, Epic-4 class)', () => {
  // The Epic-4 retro enumerated "no portfolio 'recorded in ADRs' — there is no
  // docs/adr/" as a known fabrication class. The existing FAQ guard
  // (web/test/jsonld.test.ts) covers the FAQ_ITEMS TS data array, but the GUIDE
  // grounds on the entire content/kb/*.md MARKDOWN corpus — and Story 7.1's
  // code-review found exactly this class live in content/kb/loandemo.md
  // ("The architectural decisions were recorded in ADRs."), which the FAQ-scoped
  // guard never saw. This broad, corpus-wide guard closes that gap: no KB doc the
  // Guide grounds on may mention ADRs / architecture decision records / docs/adr/.
  //
  // This project has NO docs/adr/ directory, so a legit KB doc never mentions ADRs
  // — a plain presence check is correct (mirrors the jsonld.ts FAQ guard rationale).
  // Mutation-verified: re-introducing "recorded in ADRs" to ANY content/kb/*.md
  // reds this; reverting greens it.
  const ADR_CLASS = /\bADRs?\b|architecture decision records?|\bdocs\/adr\//i;

  it('reads at least the known KB docs (loandemo + wings among them)', () => {
    const names = KB_DOCS.map((d) => d.filename);
    expect(names, 'loandemo.md is in the KB corpus').toContain('loandemo.md');
    expect(names, 'wings.md is in the KB corpus').toContain('wings.md');
  });

  for (const doc of KB_DOCS) {
    it(`${doc.filename} makes no ADR / architecture-decision-record claim (no docs/adr/)`, () => {
      expect(
        ADR_CLASS.test(doc.content),
        `${doc.filename} must not claim decisions are recorded in ADRs (there is no docs/adr/)`,
      ).toBe(false);
    });
  }
});
