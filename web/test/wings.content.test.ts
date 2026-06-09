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

// The closed allow-list of real, grounded LIVE targets from the story allocation
// table. Any 'live' Wing item href OUTSIDE this set is a fabrication.
const ALLOWED_LIVE_HREFS = new Set(['/work/loandemo/', '/glass-box/', '/faq/']);

// The Stage-2 playables (Story 7.3) — must NEVER be a built/live item here.
const PLAYABLES = ['vector-wars', 'voyager', 'christmas-elves'];

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

  it('no Stage-2 playable (vector-wars / voyager / christmas-elves) is a LIVE/OPEN item — they are 7.3 "more coming"', () => {
    for (const wing of WINGS) {
      for (const item of wing.items) {
        const haystack = `${item.title} ${item.href} ${item.blurb}`.toLowerCase();
        for (const playable of PLAYABLES) {
          expect(
            haystack.includes(playable),
            `${wing.id}: item "${item.title}" must not name the 7.3 playable "${playable}"`,
          ).toBe(false);
        }
      }
    }
  });

  it('the playables appear (if at all) ONLY in the honest moreComing copy', () => {
    // technical → vector-wars + voyager; creative → christmas-elves. Where named,
    // they MUST be framed as coming (in moreComing), proving they are not shipped.
    const technical = findWing('technical')!;
    expect(String(technical.moreComing).toLowerCase()).toContain('vector-wars');
    expect(String(technical.moreComing).toLowerCase()).toContain('voyager');
    const creative = findWing('creative')!;
    expect(String(creative.moreComing).toLowerCase()).toContain('christmas-elves');
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

  it('every Wing thin on built work carries an honest "more coming" affordance — no fabricated filler', () => {
    // technical (1 live) + creative (0 live, 1 open) + agentic (2 live) are all
    // thin → each must carry a moreComing note (no invented placeholder project).
    for (const wing of WINGS) {
      expect(
        typeof wing.moreComing === 'string' && wing.moreComing.length > 0,
        `${wing.id} carries an honest moreComing affordance`,
      ).toBe(true);
      // No hype: positive-assertion voice, no exclamation.
      expect(String(wing.moreComing), `${wing.id} moreComing has no exclamation`).not.toContain(
        '!',
      );
    }
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

  it('does not name any Stage-2 playable as built/live work in a live-work bullet', () => {
    // The playables may appear ONLY in a "more ... is coming" sentence. Assert no
    // playable name sits on a "Live work" bullet line.
    const lines = wingsKb.split('\n');
    for (const line of lines) {
      const lower = line.toLowerCase();
      const isComingLine = /is coming|next stage|lands in/.test(lower);
      if (isComingLine) continue; // honest "coming" framing is allowed
      for (const playable of PLAYABLES) {
        expect(
          lower.includes(playable),
          `wings.md line names playable "${playable}" outside a "coming" sentence: "${line.trim()}"`,
        ).toBe(false);
      }
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
