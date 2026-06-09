import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  SCHEMA_CONTEXT,
  creativeWorkJsonLd,
  eventJsonLd,
  faqPageJsonLd,
  personJsonLd,
  profilePageJsonLd,
  serializeJsonLd,
  videoObjectJsonLd,
} from '../src/lib/jsonld';
import { FAQ_ITEMS, STARTER_PROMPTS } from '../src/data/faq';

/**
 * Unit tests for the JSON-LD builder module (Story 1.6, Task 1 / AC1). These
 * exercise the typed builders and the safe serializer in isolation (pure
 * functions — no build needed). The build-output suite separately asserts the
 * rendered ld+json appears in the produced HTML per route (IAC-1).
 */

const PERSON = {
  name: 'Joshua R. Brandt, MSE',
  jobTitle: 'Software Engineer',
  description: 'A software engineer building at the frontier of agentic engineering.',
  url: 'https://joshuabrandt.abacusai.cloud/',
  image: 'https://joshuabrandt.abacusai.cloud/headshot.jpg',
  sameAs: ['https://youtube.com/@example', 'https://github.com/example'],
  knowsAbout: ['agentic engineering', 'software architecture'],
};

describe('personJsonLd', () => {
  it('carries the schema.org context and Person type with the required fields', () => {
    const p = personJsonLd(PERSON);
    expect(p['@context']).toBe(SCHEMA_CONTEXT);
    expect(p['@context']).toBe('https://schema.org');
    expect(p['@type']).toBe('Person');
    expect(p.name).toBe('Joshua R. Brandt, MSE');
    expect(p.jobTitle).toBe('Software Engineer');
    expect(p.description).toBe(PERSON.description);
    expect(p.url).toBe(PERSON.url);
    expect(p.image).toBe(PERSON.image);
    expect(p.sameAs).toEqual(PERSON.sameAs);
    expect(p.knowsAbout).toEqual(PERSON.knowsAbout);
  });

  it('omits optional fields when not supplied (no empty arrays)', () => {
    const p = personJsonLd({
      name: 'Joshua R. Brandt, MSE',
      jobTitle: 'Software Engineer',
      description: 'desc',
      url: 'https://example.com/',
    });
    expect('image' in p).toBe(false);
    expect('sameAs' in p).toBe(false);
    expect('knowsAbout' in p).toBe(false);
  });

  it('drops empty sameAs/knowsAbout arrays', () => {
    const p = personJsonLd({
      name: 'Joshua R. Brandt, MSE',
      jobTitle: 'Software Engineer',
      description: 'desc',
      url: 'https://example.com/',
      sameAs: [],
      knowsAbout: [],
    });
    expect('sameAs' in p).toBe(false);
    expect('knowsAbout' in p).toBe(false);
  });
});

describe('profilePageJsonLd', () => {
  it('wraps the Person as mainEntity, and the embedded Person has no own @context', () => {
    const pp = profilePageJsonLd({ mainEntity: PERSON, url: 'https://example.com/about' });
    expect(pp['@context']).toBe('https://schema.org');
    expect(pp['@type']).toBe('ProfilePage');
    expect(pp.url).toBe('https://example.com/about');
    expect(pp.mainEntity['@type']).toBe('Person');
    expect(pp.mainEntity.name).toBe('Joshua R. Brandt, MSE');
    // Embedded node must NOT re-declare @context (it inherits the page's).
    expect('@context' in pp.mainEntity).toBe(false);
  });
});

describe('eventJsonLd', () => {
  it('builds an Event with the required fields and embeds the performer Person', () => {
    const e = eventJsonLd({
      name: 'Placeholder Talk',
      startDate: '2026-01-01',
      eventAttendanceMode: 'https://schema.org/MixedEventAttendanceMode',
      location: { '@type': 'VirtualLocation', url: 'https://example.com/' },
      performer: PERSON,
      organizer: { '@type': 'Organization', name: 'Placeholder Org' },
      description: 'placeholder',
    });
    expect(e['@context']).toBe('https://schema.org');
    expect(e['@type']).toBe('Event');
    expect(e.name).toBe('Placeholder Talk');
    expect(e.startDate).toBe('2026-01-01');
    expect(e.eventAttendanceMode).toBe('https://schema.org/MixedEventAttendanceMode');
    expect(e.location['@type']).toBe('VirtualLocation');
    expect(e.performer['@type']).toBe('Person');
    expect('@context' in e.performer).toBe(false);
    expect(e.organizer['@type']).toBe('Organization');
  });
});

describe('videoObjectJsonLd', () => {
  it('builds a VideoObject with the required fields incl. a ~90s duration', () => {
    const v = videoObjectJsonLd({
      name: 'Speaker reel',
      description: 'A preview of the talk.',
      thumbnailUrl: 'https://example.com/thumb.jpg',
      uploadDate: '2026-01-01',
      duration: 'PT1M30S',
      contentUrl: 'https://example.com/reel.mp4',
      embedUrl: 'https://example.com/embed',
    });
    expect(v['@context']).toBe('https://schema.org');
    expect(v['@type']).toBe('VideoObject');
    expect(v.name).toBe('Speaker reel');
    expect(v.description).toBe('A preview of the talk.');
    expect(v.thumbnailUrl).toBe('https://example.com/thumb.jpg');
    expect(v.uploadDate).toBe('2026-01-01');
    expect(v.duration).toBe('PT1M30S');
    expect(v.contentUrl).toBe('https://example.com/reel.mp4');
    expect(v.embedUrl).toBe('https://example.com/embed');
  });

  it('omits contentUrl/embedUrl when not supplied', () => {
    const v = videoObjectJsonLd({
      name: 'Speaker reel',
      description: 'desc',
      thumbnailUrl: 'https://example.com/thumb.jpg',
      uploadDate: '2026-01-01',
      duration: 'PT1M30S',
    });
    expect('contentUrl' in v).toBe(false);
    expect('embedUrl' in v).toBe(false);
  });
});

describe('creativeWorkJsonLd', () => {
  it('builds a CreativeWork with the required fields and embeds the author Person', () => {
    const c = creativeWorkJsonLd({
      name: 'loandemo',
      author: PERSON,
      description: 'A flagship case study.',
      url: 'https://example.com/work/loandemo',
      dateCreated: '2026-01-01',
    });
    expect(c['@context']).toBe('https://schema.org');
    expect(c['@type']).toBe('CreativeWork');
    expect(c.name).toBe('loandemo');
    expect(c.author['@type']).toBe('Person');
    expect('@context' in c.author).toBe(false);
    expect(c.description).toBe('A flagship case study.');
    expect(c.url).toBe('https://example.com/work/loandemo');
    expect(c.dateCreated).toBe('2026-01-01');
  });
});

describe('faqPageJsonLd', () => {
  it('builds a FAQPage whose mainEntity is an array of Question/Answer pairs', () => {
    const f = faqPageJsonLd([
      { question: 'Q1?', answer: 'A1.' },
      { question: 'Q2?', answer: 'A2.' },
    ]);
    expect(f['@context']).toBe('https://schema.org');
    expect(f['@type']).toBe('FAQPage');
    expect(f.mainEntity).toHaveLength(2);
    const first = f.mainEntity[0]!;
    expect(first['@type']).toBe('Question');
    expect(first.name).toBe('Q1?');
    const answer = first.acceptedAnswer as { '@type': string; text: string };
    expect(answer['@type']).toBe('Answer');
    expect(answer.text).toBe('A1.');
  });
});

describe('serializeJsonLd', () => {
  it('produces valid, re-parseable JSON for a single node', () => {
    const out = serializeJsonLd(personJsonLd(PERSON));
    const parsed = JSON.parse(out);
    expect(parsed['@type']).toBe('Person');
    expect(parsed.name).toBe('Joshua R. Brandt, MSE');
  });

  it('produces valid JSON for an array of nodes', () => {
    const out = serializeJsonLd([personJsonLd(PERSON), profilePageJsonLd({ mainEntity: PERSON })]);
    const parsed = JSON.parse(out);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]['@type']).toBe('Person');
    expect(parsed[1]['@type']).toBe('ProfilePage');
  });

  it('escapes < > & so the block can never break out of the <script> tag', () => {
    // A hostile value containing a </script> sequence and an HTML entity.
    const out = serializeJsonLd(
      personJsonLd({
        ...PERSON,
        description: 'pwn </script><script>alert(1)</script> & friends',
      }),
    );
    // No raw angle brackets or ampersands survive in the serialized text.
    expect(out).not.toContain('<');
    expect(out).not.toContain('>');
    expect(out).not.toContain('&');
    // They are present as the inert \uXXXX escapes instead.
    expect(out).toContain('\\u003c');
    expect(out).toContain('\\u003e');
    expect(out).toContain('\\u0026');
    // …and it is STILL valid JSON that round-trips to the original string.
    const parsed = JSON.parse(out);
    expect(parsed.description).toBe('pwn </script><script>alert(1)</script> & friends');
  });

  it('is deterministic — same input yields byte-identical output', () => {
    const a = serializeJsonLd(personJsonLd(PERSON));
    const b = serializeJsonLd(personJsonLd(PERSON));
    expect(a).toBe(b);
  });
});

/* ──────────────────────────────────────────────────────────────────────────
 * Story 4.2 — real FAQ_ITEMS data + FAQPage JSON-LD single-source assertions.
 *
 * Rule 8: test the REAL exported module (`FAQ_ITEMS` from `../src/data/faq`),
 * not an inline copy. A copy would pass even if the real module drifted.
 * Mutation-verified: breaking FAQ_ITEMS (e.g. setting it to []) reds these.
 * ────────────────────────────────────────────────────────────────────────── */

describe('Story 4.2 — FAQ_ITEMS: real module, shape, and count (Rule 8)', () => {
  it('exports exactly 6 FAQ items (the six canonical questions)', () => {
    // Mutation check: changing FAQ_ITEMS to [] or fewer entries reds this.
    expect(FAQ_ITEMS).toHaveLength(6);
  });

  it('every item has a non-empty question and answer string', () => {
    for (const item of FAQ_ITEMS) {
      expect(typeof item.question).toBe('string');
      expect(item.question.length).toBeGreaterThan(10);
      expect(typeof item.answer).toBe('string');
      expect(item.answer.length).toBeGreaterThan(20);
    }
  });

  it('the first item is the "What does Joshua speak about" starter prompt', () => {
    // Mutation check: reordering FAQ_ITEMS so starter prompts are not first reds this.
    expect(FAQ_ITEMS[0]!.question).toBe('What does Joshua R. Brandt, MSE speak about?');
  });

  it('the second item is the "How do I invite Joshua" starter prompt', () => {
    expect(FAQ_ITEMS[1]!.question).toBe('How do I invite Joshua to speak?');
  });

  it('the third item is the "What is loandemo" starter prompt', () => {
    expect(FAQ_ITEMS[2]!.question).toBe('What is loandemo?');
  });

  it('all answers are answer-first (lead with the answer, not throat-clearing)', () => {
    // Answer-first means the answer substance is in the first sentence.
    // A proxy: none of the answers begin with "To find out" / "In order to" /
    // "Please visit" style openers — they open with the subject matter directly.
    for (const item of FAQ_ITEMS) {
      // No answer starts with a filler phrase (would break the GEO answer-first floor).
      expect(item.answer).not.toMatch(/^(To find out|In order to|Please visit|For more info)/);
    }
  });

  it('no answer contains an exclamation mark (positive-assertion voice rule)', () => {
    for (const item of FAQ_ITEMS) {
      expect(item.answer, `exclamation in "${item.question}"`).not.toContain('!');
    }
    for (const item of FAQ_ITEMS) {
      expect(item.question, `exclamation in question: "${item.question}"`).not.toContain('!');
    }
  });
});

describe('Story 4.2 — STARTER_PROMPTS: three guide chip seeds (Decision 3, AC4)', () => {
  it('exports exactly 3 starter prompts', () => {
    expect(STARTER_PROMPTS).toHaveLength(3);
  });

  it('STARTER_PROMPTS are the FIRST three FAQ_ITEMS (same reference, no copy)', () => {
    // Single source: STARTER_PROMPTS must equal the first three FAQ_ITEMS exactly.
    // If the order of FAQ_ITEMS changes, this reds — enforcing no drift.
    expect(STARTER_PROMPTS[0]).toBe(FAQ_ITEMS[0]);
    expect(STARTER_PROMPTS[1]).toBe(FAQ_ITEMS[1]);
    expect(STARTER_PROMPTS[2]).toBe(FAQ_ITEMS[2]);
  });

  it('each starter prompt matches its expected Guide chip question text', () => {
    expect(STARTER_PROMPTS[0]!.question).toBe('What does Joshua R. Brandt, MSE speak about?');
    expect(STARTER_PROMPTS[1]!.question).toBe('How do I invite Joshua to speak?');
    expect(STARTER_PROMPTS[2]!.question).toBe('What is loandemo?');
  });
});

describe('Story 4.2 — FAQPage JSON-LD built from real FAQ_ITEMS (AC2, single-source)', () => {
  it('builds a FAQPage from the real FAQ_ITEMS with 6 mainEntity entries', () => {
    const faq = faqPageJsonLd(FAQ_ITEMS);
    expect(faq['@context']).toBe('https://schema.org');
    expect(faq['@type']).toBe('FAQPage');
    // Mutation check: changing FAQ_ITEMS length reds this.
    expect(faq.mainEntity).toHaveLength(6);
  });

  it('each mainEntity entry is a Question with name matching FAQ_ITEMS[i].question', () => {
    const faq = faqPageJsonLd(FAQ_ITEMS);
    for (let i = 0; i < FAQ_ITEMS.length; i++) {
      const q = faq.mainEntity[i]!;
      expect(q['@type']).toBe('Question');
      // The Question.name matches the visible question (same source — cannot drift).
      expect(q.name).toBe(FAQ_ITEMS[i]!.question);
      const answer = q.acceptedAnswer as { '@type': string; text: string };
      expect(answer['@type']).toBe('Answer');
      expect(answer.text).toBe(FAQ_ITEMS[i]!.answer);
    }
  });

  it('the serialized FAQPage is valid JSON and deterministic (NFR-6)', () => {
    const out = serializeJsonLd(faqPageJsonLd(FAQ_ITEMS));
    const parsed = JSON.parse(out) as Record<string, unknown>;
    expect(parsed['@type']).toBe('FAQPage');
    // Determinism: two serializations of the same data are byte-identical.
    const out2 = serializeJsonLd(faqPageJsonLd(FAQ_ITEMS));
    expect(out).toBe(out2);
  });
});

describe('Story 4.2 — credibility regression: FAQ_ITEMS fabrication guard (AC3, Rule 8)', () => {
  // These tests are mutation-verified: changing FAQ_ITEMS to include a fabricated
  // claim reds the relevant assertion. They scope to the REAL FAQ_ITEMS module.

  it('no item claims "every" or "all" artifacts are published/readable in the Glass Box', () => {
    // Specifically FORBIDDEN unflagged claim (AC3, Decision 2):
    // "every/all (planning) artifacts are published/readable in the Glass Box" is
    // FALSE — only the six allowlisted artifacts are published
    // (content/glassbox.allowlist.ts); epics, story files, retrospectives, and the
    // architecture doc are ghost "as it accrues" nodes, NOT published.
    //
    // QA HARDENING (Story 4.2 QA stage): the dev's original guard matched only the
    // LITERAL substrings "every planning artifact"/"all planning artifacts". That
    // missed the BROADER class the Story 4.1 retro flagged as the one that slipped
    // through narrow patterns — e.g. "all of the artifacts ... are published" (no
    // "planning"). This is the SAME pattern shape as the locked KB-index guard
    // (scripts/build-kb-index.test.ts): `(every|all) … artifact(s) … publish/readable`,
    // broadened to drop the "planning" requirement so the variant cannot escape.
    // The honest line ("the CURATED planning artifacts … are published") does NOT
    // match — it carries no "every"/"all" quantifier. Mutation-verified: injecting
    // "all of the artifacts … are published" into FAQ_ITEMS reds this.
    for (const item of FAQ_ITEMS) {
      // Scope to each LINE so a flag on a neighboring line cannot excuse a false
      // claim on this one (the KB-index per-line precedent; Rule 8 non-vacuity).
      for (const line of `${item.question} ${item.answer}`.split(/(?<=[.])\s+/)) {
        const offends =
          /\b(every|all)\b[^.]*\bartifacts?\b/i.test(line) &&
          /\b(publish(?:es|ed)?|readable)\b/i.test(line) &&
          !/\[OPEN|\[ASSUMPTION\]/.test(line);
        expect(offends, `unflagged "every/all artifacts published" claim: "${line}"`).toBe(false);
      }
    }
  });

  it('no item claims portfolio decisions live in ADRs / architecture decision records (no docs/adr/)', () => {
    // FORBIDDEN unflagged claim: this portfolio has NO docs/adr/ directory, so any
    // claim that decisions are "recorded in ADRs" / "captured as architecture
    // decision records" is a fabrication (AC3, Decision 2).
    //
    // QA HARDENING (Story 4.2 QA stage): the dev's guard matched only "recorded in
    // ADR" and "docs/adr/". A realistic LLM fabrication spells the acronym out —
    // "captured as architecture decision records as they are made" — which escaped.
    // (The KB source content/kb/faq.md line 35 even carries the borderline
    // "Architectural decisions are recorded as they are made"; the dev correctly
    // DROPPED it from FAQ_ITEMS, but a future KB re-sync could reintroduce exactly
    // this class.) Broaden to the abbreviation AND the spelled-out forms. No legit
    // FAQ answer mentions ADRs, so a plain presence check is correct here.
    // Mutation-verified: injecting "architecture decision records" reds this.
    for (const item of FAQ_ITEMS) {
      const combined = `${item.question} ${item.answer}`;
      expect(combined, `ADR fabrication in "${item.question}"`).not.toMatch(
        /\bADRs?\b|architecture decision records?|\bdocs\/adr\//i,
      );
    }
  });

  it('no item invents an acronym expansion for "BMAD" beyond "BMAD Method"', () => {
    // FORBIDDEN: inventing what BMAD stands for. The usage is "BMAD Method" only;
    // the Mirror never expands the acronym (Story 4.1 credibility floor).
    //
    // QA HARDENING (Story 4.2 QA stage): the dev's guard required the word "BMAD"
    // ADJACENT to "stands for"/"is an acronym"/"is short for". But the EXACT
    // fabrication the Story 4.1 retro caught phrases the subject as "The name" —
    // "The name stands for Brainstorm, Mindmap, Architecture, Design" — which
    // escaped the dev guard entirely. Port the locked KB-index patterns
    // (scripts/build-kb-index.test.ts): (a) any "stands for"/"acronym"/"short for"
    // tied to BMAD OR "the name", and (b) the fabricated-expansion fingerprints
    // ("stands for" + "brainstorm"; the word "mindmap", which only ever appeared
    // inside the invented expansion). Mutation-verified: injecting "The name stands
    // for Brainstorm, Mindmap, Architecture, Design" reds this.
    for (const item of FAQ_ITEMS) {
      const combined = `${item.question} ${item.answer}`;
      // (a) acronym-claim verbs tied to BMAD or "the name".
      const claimsExpansion =
        /\b(stands for|is an acronym|short for|abbreviation for)\b/i.test(combined) &&
        /\bBMAD\b|the name/i.test(combined);
      expect(claimsExpansion, `invented BMAD acronym claim in "${item.question}"`).toBe(false);
      // (b) fabricated-expansion fingerprints (the Story 4.1 invented expansion).
      expect(combined, `fabricated BMAD expansion in "${item.question}"`).not.toMatch(
        /\bmindmap\b/i,
      );
      expect(
        /stands for/i.test(combined) && /\bbrainstorm\b/i.test(combined),
        `"stands for … Brainstorm" expansion in "${item.question}"`,
      ).toBe(false);
      // Specific wrong expansions that have circulated.
      expect(combined).not.toMatch(/Business Model Agile Design/i);
      expect(combined).not.toMatch(/Business Method Agile Development/i);
    }
  });

  it('the bio item carries the [ASSUMPTION] flag (same as content/kb/faq.md)', () => {
    // The background question answer must carry [ASSUMPTION] since bio is unconfirmed.
    const bgItem = FAQ_ITEMS.find((item) => item.question.includes("Joshua's background"));
    expect(bgItem, 'background item must exist').toBeDefined();
    expect(bgItem!.answer).toContain('[ASSUMPTION]');
  });

  it('channel URLs carry [OPEN] flags (same as person.ts)', () => {
    // The "Where can I follow" question must flag the channel URLs as [OPEN].
    const channelItem = FAQ_ITEMS.find((item) => item.question.includes('follow'));
    expect(channelItem, 'follow/channel item must exist').toBeDefined();
    expect(channelItem!.answer).toContain('[OPEN:');
  });

  it('travel availability carries the [OPEN] flag from content/kb/faq.md', () => {
    // The invite item must flag travel availability as [OPEN] — not assert it.
    const inviteItem = FAQ_ITEMS.find((item) => item.question.includes('invite'));
    expect(inviteItem, 'invite item must exist').toBeDefined();
    expect(inviteItem!.answer).toContain('[OPEN:');
  });

  it('the Glass Box description is scoped — says "curated planning artifacts" not "every artifact"', () => {
    // The BMAD Method item references the Glass Box for curated artifacts. It must
    // NOT claim everything is published — only the curated (allowlisted) artifacts.
    const bmadItem = FAQ_ITEMS.find((item) => item.question.includes('BMAD'));
    expect(bmadItem, 'BMAD Method item must exist').toBeDefined();
    // Must say "curated" (honest scope), not "every" or "all"
    const answer = bmadItem!.answer.toLowerCase();
    expect(answer).toContain('curated');
    expect(answer).not.toMatch(/\bevery\s+(planning\s+)?artifact/);
    expect(answer).not.toMatch(/\ball\s+(planning\s+)?artifacts/);
  });
});

/* ──────────────────────────────────────────────────────────────────────────
 * Story 4.2 — QA gap-fill: /faq question set is consistent with the KB source
 * (content/kb/faq.md) — the two-layer model (Decision 2 / AC3).
 *
 * The LEDE promises "These answers are the same ones his Guide cites," and the
 * Guide (4.3/4.4) retrieves from the KB. So the crawlable /faq question set MUST
 * stay consistent with content/kb/faq.md's six canonical questions. The dev
 * suite checked the [ASSUMPTION]/[OPEN] FLAGS against the KB but never asserted
 * the QUESTION SET itself matches — so the two layers could silently diverge
 * (a /faq question renamed, or a KB question added, with no test reding). This
 * binds them. The KB markdown is NOT imported at runtime (/faq is static); this
 * test reads it from disk purely to assert the invariant (Rule 8 — real source).
 * ────────────────────────────────────────────────────────────────────────── */

describe('Story 4.2 — /faq question set is consistent with content/kb/faq.md (Decision 2, AC3)', () => {
  // content/kb/faq.md lives at the repo root (web/ is a workspace package).
  const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const kbFaqPath = join(repoRoot, 'content', 'kb', 'faq.md');

  /** The `## ` section headings of the KB FAQ, in document order (the questions). */
  function kbQuestions(): string[] {
    const md = readFileSync(kbFaqPath, 'utf8');
    return [...md.matchAll(/^##\s+(.+?)\s*$/gm)].map((m) => m[1]!.trim());
  }

  it('the KB source declares exactly six "## " questions', () => {
    // Sanity on the ground-truth side (mutation: dropping a KB question reds this).
    expect(kbQuestions()).toHaveLength(6);
  });

  it('FAQ_ITEMS questions are the SAME SET as the KB six questions (order-independent)', () => {
    // Two-layer consistency (Decision 2 / AC3): the crawlable /faq Q-set is exactly
    // the KB Q-set the Guide cites — same questions, no additions, no omissions.
    // ORDER is intentionally NOT asserted here: Decision 3 reorders /faq so the
    // three starter prompts lead (loandemo is pulled to position 3), which differs
    // from the KB's authoring order. The DECISION-3 ordering is asserted separately
    // below. Set-equality (sorted) reds if either layer renames/adds/drops a
    // question. (Mutation-verified: editing a FAQ_ITEMS question OR a
    // content/kb/faq.md `## ` heading so the sets disagree reds this.)
    const sortedFaq = [...FAQ_ITEMS.map((i) => i.question)].sort();
    const sortedKb = [...kbQuestions()].sort();
    expect(sortedFaq).toEqual(sortedKb);
  });

  it('/faq orders the three starter prompts first (Decision 3 — the divergence from KB order)', () => {
    // The deliberate reason the order differs from the KB: the KB-answerable Guide
    // starter prompts (speak-about, invite, loandemo) lead the /faq list so Story
    // 4.4 reuses them as the first three panel chips. Lock that ordering so a future
    // re-sort back to KB order (which would break the 4.4 chip seed) reds.
    expect(FAQ_ITEMS.slice(0, 3).map((i) => i.question)).toEqual([
      'What does Joshua R. Brandt, MSE speak about?',
      'How do I invite Joshua to speak?',
      'What is loandemo?',
    ]);
  });
});
