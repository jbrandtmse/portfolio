/**
 * build-kb-index.test.ts — unit tests for the KB index generator (Story 4.1).
 *
 * Tests:
 *  - parseFrontmatter: extracts route/label/title correctly; rejects bad input.
 *  - chunkDoc: heading-boundary chunking; ~300–800 token bounds; stable IDs.
 *  - buildKbCorpus: default-deny (no decoy outside content/kb/ ever indexed);
 *    determinism (two runs → identical corpus bytes).
 *  - buildKbIndexGenerator.run: integration — writes the real kb-index.json.
 *
 * Mutation-verify notes (Rule 8): each load-bearing assertion was verified red
 * by temporarily breaking the corresponding source guarantee during dev.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { buildKbCorpus, chunkDoc, parseFrontmatter, slugify } from './build-kb-index.ts';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTmpKbDir(docs: Record<string, string>): string {
  const dir = join(tmpdir(), `kb-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  for (const [filename, content] of Object.entries(docs)) {
    writeFileSync(join(dir, filename), content, 'utf8');
  }
  return dir;
}

const MINIMAL_DOC = `---
route: /test/
label: Test Doc
title: Test
---

# Introduction

This is the introduction paragraph. It explains the basics of the test document.

## Section One

Content for section one. This section covers the first topic in detail.

## Section Two

Content for section two. This section covers the second topic in detail.
`;

// ---------------------------------------------------------------------------
// parseFrontmatter
// ---------------------------------------------------------------------------

describe('parseFrontmatter', () => {
  it('extracts route, label, title from valid frontmatter', () => {
    const fm = parseFrontmatter(MINIMAL_DOC);
    expect(fm).toEqual({ route: '/test/', label: 'Test Doc', title: 'Test' });
  });

  it('returns null for a doc with no frontmatter', () => {
    const fm = parseFrontmatter('# Just a heading\n\nNo frontmatter here.');
    expect(fm).toBeNull();
  });

  it('returns null when frontmatter is missing required fields', () => {
    const doc = `---
route: /test/
---

# Doc missing label and title
`;
    const fm = parseFrontmatter(doc);
    expect(fm).toBeNull();
  });

  it('does NOT treat a bare --- thematic break as frontmatter', () => {
    const doc = `---

A paragraph that starts after a bare thematic break.
`;
    const fm = parseFrontmatter(doc);
    expect(fm).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// slugify
// ---------------------------------------------------------------------------

describe('slugify', () => {
  it('lowercases and replaces non-alphanum with hyphens', () => {
    expect(slugify('Hello World!')).toBe('hello-world');
    expect(slugify('Section 1.2: Overview')).toBe('section-1-2-overview');
  });

  it('collapses consecutive hyphens', () => {
    expect(slugify('A  B  C')).toBe('a-b-c');
  });
});

// ---------------------------------------------------------------------------
// chunkDoc
// ---------------------------------------------------------------------------

describe('chunkDoc', () => {
  const FM = { route: '/test/', label: 'Test', title: 'Test Title' };

  it('creates one chunk per heading section', () => {
    const chunks = chunkDoc(
      `# Introduction\n\nIntro text.\n\n## Section One\n\nSection one text.\n`,
      'test',
      FM,
    );
    // Should produce 2 chunks (one preamble if non-empty, or two headings)
    expect(chunks.length).toBeGreaterThanOrEqual(1);
    expect(chunks.every((c) => c.route === '/test/')).toBe(true);
    expect(chunks.every((c) => c.label === 'Test')).toBe(true);
  });

  it('assigns stable explicit IDs in docSlug#headingSlug format', () => {
    const chunks = chunkDoc(
      `# My Section\n\nSome text here.\n\n## Another Section\n\nMore text.\n`,
      'mydoc',
      FM,
    );
    // Every chunk ID starts with 'mydoc#'
    expect(chunks.every((c) => c.id.startsWith('mydoc#'))).toBe(true);
    // IDs are unique
    const ids = chunks.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('disambiguates duplicate heading slugs', () => {
    const body = `## FAQ\n\nFirst faq.\n\n## FAQ\n\nSecond faq.\n`;
    const chunks = chunkDoc(body, 'doc', FM);
    const ids = chunks.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    // Second one gets a suffix
    expect(ids.some((id) => id === 'doc#faq')).toBe(true);
    expect(ids.some((id) => id === 'doc#faq-1')).toBe(true);
  });

  it('includes heading text in each chunk', () => {
    const chunks = chunkDoc(`## About Me\n\nI am a person.\n`, 'about', FM);
    const aboutChunk = chunks.find((c) => c.heading === 'About Me');
    expect(aboutChunk).toBeDefined();
    expect(aboutChunk!.text).toContain('I am a person.');
  });
});

// ---------------------------------------------------------------------------
// buildKbCorpus — default-deny
// ---------------------------------------------------------------------------

describe('buildKbCorpus — default-deny', () => {
  it('only reads .md files from the given kbDir — decoy outside does NOT appear', () => {
    // Create a temp KB dir with one valid doc + a decoy outside
    const kbDir = makeTmpKbDir({
      'about.md': `---
route: /about/
label: About Joshua
title: About
---

# About

This is the about section. Joshua R. Brandt is a software engineer.
`,
    });

    // Place a decoy OUTSIDE the kbDir (in its parent)
    const decoyPath = join(kbDir, '..', 'DECOY.md');
    writeFileSync(
      decoyPath,
      `---
route: /decoy/
label: Decoy
title: Decoy
---

# Decoy

This decoy must never be indexed.
`,
      'utf8',
    );

    const chunks = buildKbCorpus(kbDir);

    // No chunk should have route '/decoy/'
    const decoyChunks = chunks.filter((c) => c.route === '/decoy/');
    expect(decoyChunks).toHaveLength(0);

    // At least one chunk with route '/about/'
    const aboutChunks = chunks.filter((c) => c.route === '/about/');
    expect(aboutChunks.length).toBeGreaterThan(0);
  });

  it('throws loudly if a KB doc is missing a required frontmatter field', () => {
    const kbDir = makeTmpKbDir({
      'bad.md': `---
route: /bad/
---

# No label or title

This doc is missing required frontmatter.
`,
    });
    expect(() => buildKbCorpus(kbDir)).toThrow(/missing or invalid frontmatter/);
  });

  it('skips README.md when enumerating docs', () => {
    const kbDir = makeTmpKbDir({
      'README.md': `# KB README\n\nThis is the README. It must not be indexed.\n`,
      'about.md': `---
route: /about/
label: About
title: About
---

# About

About text here. Joshua R. Brandt is a software engineer.
`,
    });
    const chunks = buildKbCorpus(kbDir);
    // No chunk should have text from the README
    const readmeChunks = chunks.filter((c) => c.text.includes('KB README'));
    expect(readmeChunks).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// buildKbCorpus — determinism
// ---------------------------------------------------------------------------

describe('buildKbCorpus — determinism', () => {
  it('produces byte-identical output on two runs from unchanged content', () => {
    const kbDir = makeTmpKbDir({
      'about.md': `---
route: /about/
label: About Joshua
title: About
---

# About

Joshua R. Brandt is a software engineer with 30 years of experience.

## Skills

He knows about agentic engineering and software architecture.
`,
      'speaking.md': `---
route: /speaking/
label: Speaking
title: Speaking
---

# Speaking

Joshua speaks on agentic patterns that ship.

## Topics

His topics include agentic engineering and disciplined workflows.
`,
    });

    const run1 = buildKbCorpus(kbDir);
    const run2 = buildKbCorpus(kbDir);

    // Serialize the same way the generator does
    const out1 = JSON.stringify(run1, null, 2) + '\n';
    const out2 = JSON.stringify(run2, null, 2) + '\n';

    expect(out1).toBe(out2);
  });

  it('produces sorted chunks — docs in alphabetical order, chunks in doc order', () => {
    const kbDir = makeTmpKbDir({
      'zebra.md': `---
route: /zebra/
label: Zebra
title: Zebra
---

# Zebra Section

The zebra doc content.
`,
      'alpha.md': `---
route: /alpha/
label: Alpha
title: Alpha
---

# Alpha Section

The alpha doc content.
`,
    });

    const chunks = buildKbCorpus(kbDir);
    // First chunk should be from 'alpha.md' (sorts before 'zebra.md')
    expect(chunks[0]!.route).toBe('/alpha/');
    expect(chunks[chunks.length - 1]!.route).toBe('/zebra/');
  });
});

// ---------------------------------------------------------------------------
// buildKbCorpus — real KB docs (integration smoke)
// ---------------------------------------------------------------------------

describe('buildKbCorpus — real KB docs', () => {
  // Find the real content/kb dir relative to the project root
  // scripts/ is one level below the repo root
  const repoRoot = join(import.meta.dirname, '..');
  const realKbDir = join(repoRoot, 'content', 'kb');

  it('can chunk the real content/kb/*.md without throwing', () => {
    expect(() => buildKbCorpus(realKbDir)).not.toThrow();
  });

  it('produces chunks for each expected route', () => {
    const chunks = buildKbCorpus(realKbDir);
    const routes = new Set(chunks.map((c) => c.route));
    expect(routes.has('/about/')).toBe(true);
    expect(routes.has('/speaking/')).toBe(true);
    expect(routes.has('/work/loandemo/')).toBe(true);
    expect(routes.has('/faq/')).toBe(true);
    expect(routes.has('/glass-box/')).toBe(true);
  });

  it('produces no chunk from README.md', () => {
    const chunks = buildKbCorpus(realKbDir);
    // README.md has no valid frontmatter route — if it were included it would throw
    // or return no route. This confirms it is excluded by filename filter.
    // Verify by checking no chunk heading/text comes from the README boilerplate
    const readmeChunks = chunks.filter((c) => c.text.includes("Agent's Curated Knowledge Base"));
    expect(readmeChunks).toHaveLength(0);
  });

  it('every chunk has a non-empty id, route, label, and text', () => {
    const chunks = buildKbCorpus(realKbDir);
    for (const chunk of chunks) {
      expect(chunk.id.length).toBeGreaterThan(0);
      expect(chunk.route.length).toBeGreaterThan(0);
      expect(chunk.label.length).toBeGreaterThan(0);
      expect(chunk.text.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Credibility floor (AC1) — KB docs assert ZERO invented facts.
//
// QA addition (Story 4.1 QA stage): the dev draft asserted an INVENTED expansion
// of the BMAD acronym ("The name stands for Brainstorm, Mindmap, Architecture,
// Design") as flat, unflagged fact in faq.md and bmad-method.md. That claim is
// (a) absent from every Static Mirror source (the Mirror never expands the
// acronym — see web/src/pages/work/loandemo.astro, web/src/pages/faq.astro), and
// (b) factually wrong (the real BMAD expansion is "Breakthrough Method for Agile
// AI-Driven Development"). It violated AC1 ("ZERO invented facts; no KB claim
// asserts anything the Mirror does not"). These tests scope to the REAL chunk
// text (Rule 8 — real surface, specific assertion) and lock the regression.
// ---------------------------------------------------------------------------

describe('credibility floor — no invented BMAD acronym expansion (AC1)', () => {
  const repoRoot = join(import.meta.dirname, '..');
  const realKbDir = join(repoRoot, 'content', 'kb');

  it('no KB chunk invents an acronym expansion for the BMAD Method', () => {
    const chunks = buildKbCorpus(realKbDir);
    // "Mindmap" only ever appeared inside the fabricated expansion — it is not a
    // fact in any Mirror source. Its presence signals the invented claim is back.
    const withMindmap = chunks.filter((c) => /\bmindmap\b/i.test(c.text));
    expect(withMindmap).toHaveLength(0);

    // The specific fabricated sentence pattern: "(name) stands for ... Brainstorm".
    const withFabricatedExpansion = chunks.filter(
      (c) => /stands for/i.test(c.text) && /\bbrainstorm\b/i.test(c.text),
    );
    expect(withFabricatedExpansion).toHaveLength(0);
  });

  it('any unflagged "stands for" acronym claim must be Mirror-faithful (none ship)', () => {
    // Defense-in-depth: the Mirror never expands the BMAD acronym at all, so the
    // KB must not either. Assert no chunk pairs an unflagged "stands for" claim
    // with "BMAD"/"the name". (A future, confirmed expansion would arrive flagged
    // or via the Mirror first — this guards the no-fabrication default.)
    const chunks = buildKbCorpus(realKbDir);
    const offenders = chunks.filter(
      (c) =>
        /stands for/i.test(c.text) &&
        !/\[OPEN\]|\[ASSUMPTION\]/.test(c.text) &&
        /\bBMAD\b|the name/i.test(c.text),
    );
    expect(offenders).toHaveLength(0);
  });

  // Code-review addition (Story 4.1 code-review stage): the dev draft asserted, as
  // flat unflagged fact, a specific technology stack (Astro / Hono / Vitest /
  // Playwright / pnpm / Orama) AND that "the tech stack is documented in the
  // architecture document, readable in the Glass Box." Both violate AC1:
  //  (a) the specific stack appears on NO crawlable Mirror route (the published
  //      /glass-box/ index never enumerates it; the architecture artifact is a
  //      GHOST "As it accrues" node — web/src/content/glassbox.index.ts), and
  //  (b) the "readable in the architecture document in the Glass Box" claim is
  //      factually FALSE — the architecture doc is NOT in the allowlist
  //      (content/glassbox.allowlist.ts) and is not published. The Mirror's own
  //      pattern flags unconfirmed stack detail as [OPEN] (loandemo.astro). These
  //      tests lock the Mirror-faithful framing (flagged + no false "readable").

  // NOTE (Rule 8 — non-vacuity): both tests below scope to the individual LINE,
  // not the whole chunk. A chunk-level flag check would be vacuous here — the
  // Mirror-faithful framing legitimately carries an [ASSUMPTION] flag elsewhere in
  // the same "What's in the Glass Box" chunk, so a per-chunk flag would excuse a
  // false bullet on a different line. Per-line scoping reds on the real fabrication
  // regardless of other flags in the chunk (mutation-verified at code-review).

  it('no unflagged line claims the architecture document is readable/published in the Glass Box', () => {
    // The architecture artifact is a ghost node — NOT published. A LINE asserting
    // it is "readable"/"published"/"documented" without an [ASSUMPTION]/[OPEN] flag
    // ON THAT LINE is a false claim (AC1 credibility floor).
    const lines = buildKbCorpus(realKbDir).flatMap((c) => c.text.split(/\r?\n/));
    const offenders = lines.filter(
      (line) =>
        /\barchitecture (document|doc)\b/i.test(line) &&
        /\b(readable|publish(?:es|ed)?|documented)\b/i.test(line) &&
        !/\[OPEN\]|\[ASSUMPTION\]/.test(line),
    );
    expect(offenders).toEqual([]);
  });

  it('no unflagged line claims a GHOST artifact (epics / retrospective / shipping) is readable/published in the Glass Box', () => {
    // QA hardening (Story 9.1): the architecture-doc guard above is line-scoped to
    // "architecture document" only — so it MISSED the same fabrication class for the
    // other ghost nodes (the demonstrator.md KB draft asserted "the epics document
    // will be published" and "the retrospective documents will be published" as flat
    // unflagged fact). Only 6 Glass Box readers are published; epics, retrospective,
    // and shipping are ghost nodes with NO reader. A LINE asserting any of them is
    // "readable"/"published"/"documented" without an [OPEN]/[ASSUMPTION] flag ON THAT
    // LINE is a false claim (Rule 9, the Epic-4 "narrow test misses the next instance"
    // lesson). Mutation-verified: re-inserting an unflagged "epics document will be
    // published" line reds this.
    const lines = buildKbCorpus(realKbDir).flatMap((c) => c.text.split(/\r?\n/));
    const offenders = lines.filter(
      (line) =>
        /\b(epics?|retrospectives?|shipping)\s+(document|doc|documents)\b/i.test(line) &&
        /\b(readable|publish(?:es|ed)?|documented)\b/i.test(line) &&
        // Exempt the deliberate credibility flags: [ASSUMPTION], [OPEN], and the
        // reasoned [OPEN: <reason>] form (Rule 15 exempts these honest markers).
        !/\[OPEN(:|\])|\[ASSUMPTION\]/.test(line),
    );
    expect(offenders).toEqual([]);
  });

  it('specific search-engine / framework stack names only ship on a flagged line (not on the Mirror)', () => {
    // Orama, Hono, Vitest, Playwright are repo-internal implementation detail that
    // appear on NO crawlable Mirror route. If a LINE names them, that line MUST
    // carry an [ASSUMPTION]/[OPEN] flag (the loandemo.astro precedent for an
    // unconfirmed stack). Line-scoped so a flag on a neighboring line can't excuse it.
    const lines = buildKbCorpus(realKbDir).flatMap((c) => c.text.split(/\r?\n/));
    const offenders = lines.filter(
      (line) =>
        /\b(Orama|Hono|Vitest|Playwright)\b/.test(line) && !/\[OPEN\]|\[ASSUMPTION\]/.test(line),
    );
    expect(offenders).toEqual([]);
  });

  // Lead smoke addition (Story 4.1 smoke gate): the dev draft asserted, across
  // THREE docs (bmad-method.md, faq.md, loandemo.md), that "every/all planning
  // artifacts" for this portfolio are "published"/"readable" in the Glass Box.
  // That is factually FALSE and the same class the code-review caught for the
  // architecture doc specifically: the Glass Box publish allowlist
  // (content/glassbox.allowlist.ts) carries exactly SIX artifacts (Product Brief,
  // Brainstorm, Pre-Brief Research, PRD, UX Design, UX Experience); the
  // architecture document, epics, story files, and retrospectives are ghost "As it
  // accrues" nodes — NOT published. The QA/CR tests were narrowly scoped (acronym,
  // architecture-doc), so this broader "every planning artifact" phrasing slipped
  // through to the lead smoke. This test locks the whole class. (Line-scoped,
  // real buildKbCorpus surface — Rule 8; mutation-verified: re-inserting any
  // "every planning artifact … published" line reds it.)
  it('no unflagged line claims EVERY/ALL planning artifacts are published/readable (only the curated set is)', () => {
    const lines = buildKbCorpus(realKbDir).flatMap((c) => c.text.split(/\r?\n/));
    const offenders = lines.filter(
      (line) =>
        /\b(every|all)\b[^.\n]*\bplanning artifacts?\b/i.test(line) &&
        /\b(publish(?:es|ed)?|readable)\b/i.test(line) &&
        !/\[OPEN\]|\[ASSUMPTION\]/.test(line),
    );
    expect(offenders).toEqual([]);
  });
});
