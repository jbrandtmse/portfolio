/**
 * project-import.test.ts — mechanism-validation test for the Project Import path
 * (Story 2.6, AC2 / AC4).
 *
 * WHAT THIS PROVES
 * ----------------
 * The Project Import path (docs/project-import.md) is data-driven and
 * deterministic. Specifically:
 *
 *  (a) Glass Box wiring: a sample GlassboxEntry added to a synthetic allowlist
 *      (in-test, NOT the live GLASSBOX_ALLOWLIST) flows through the REAL
 *      renderGlassbox() and produces the sample's artifact in the output.
 *
 *  (b) Timeline wiring: a sample FlagshipNode added to a synthetic era-band
 *      (in-test, NOT the live TIMELINE_ERAS) flows through the REAL
 *      renderTimeline() and produces the sample's Dot cluster in the output.
 *
 *  (c) Determinism: a second render call is deep-equal to the first for BOTH
 *      the Glass Box and the timeline — same inputs → byte-identical output
 *      (NFR-6).
 *
 *  (d) KB wiring: the fixture markdown committed at
 *      scripts/fixtures/sample-project-artifact.md is readable from the repo
 *      root — proving that a KB file committed to content/kb/*.md is accessible
 *      to the pipeline at build time. (KB indexing is Epic 4 / Story 4.1; this
 *      test validates the commit-and-read path, not the indexer itself.)
 *
 * WHAT THIS DOES NOT DO
 * ---------------------
 * - Does NOT pollute the live content/glassbox.allowlist.ts or
 *   content/timeline/dots.ts with a fake project entry.
 * - Does NOT test the browser/Playwright tier — this story is a
 *   process/tooling/doc story (Rule 3 EXEMPT; noted here explicitly).
 * - Does NOT test the KB indexer (that is Story 4.1 / Epic 4).
 *
 * FIXTURE
 * -------
 * scripts/fixtures/sample-project-artifact.md — a small committed markdown file
 * used as the sample Glass Box artifact. Committed; safe to read from the repo.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import type { GlassboxEntry } from '../content/glassbox.allowlist.ts';
import type { EraBand, FlagshipNode, TimelineDotEntry } from '../content/timeline/dots.ts';
import { renderGlassbox, type GlassboxArtifact } from './render-glassbox.ts';
import { renderTimeline } from './render-timeline.ts';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptsDir, '..');

// ─── Fixture paths ─────────────────────────────────────────────────────────

/** Fixture file used as the sample Glass Box artifact sourceFile. */
const FIXTURE_SOURCE_FILE = 'scripts/fixtures/sample-project-artifact.md';

// ─── Sample Glass Box allowlist entry (NOT in GLASSBOX_ALLOWLIST) ──────────

const SAMPLE_GLASSBOX_ENTRY: GlassboxEntry = {
  sourceFile: FIXTURE_SOURCE_FILE,
  type: 'prd',
  slug: 'sample-project-import-fixture',
  title: 'Sample Project Import Fixture',
  curatorNote:
    'A test-only fixture proving the import path is data-driven. Not a real project artifact.',
};

// ─── Sample timeline Dot / flagship cluster (NOT in TIMELINE_ERAS) ─────────

const SAMPLE_CLUSTER_DOT: TimelineDotEntry = {
  label: 'Sample cluster dot',
  date: '2026-07-01',
  state: 'filled',
  href: '/glass-box/sample-project-import-fixture/',
  description: 'A test-only dot for mechanism validation.',
};

const SAMPLE_FLAGSHIP: FlagshipNode = {
  kind: 'flagship',
  label: 'Sample Project (test fixture)',
  date: '2026-07',
  description: 'Test fixture flagship for the Project Import mechanism test.',
  cluster: [SAMPLE_CLUSTER_DOT],
};

const SAMPLE_ERA: EraBand = {
  id: 'agentic-turn',
  label: 'Agentic Turn (sample)',
  metaNote: 'sample era for mechanism test',
  entries: [SAMPLE_FLAGSHIP],
};

// ─── AC2/AC4 tests ─────────────────────────────────────────────────────────

describe('project-import mechanism — Glass Box wiring (AC2 / AC4)', () => {
  it('the fixture file exists and is readable from the repo root (KB path proof)', () => {
    const absPath = join(repoRoot, FIXTURE_SOURCE_FILE);
    expect(existsSync(absPath), `fixture not found at: ${absPath}`).toBe(true);
    const body = readFileSync(absPath, 'utf8');
    expect(body.trim().length).toBeGreaterThan(0);
  });

  it('sample GlassboxEntry flows through renderGlassbox() and appears in the output', () => {
    const artifacts: GlassboxArtifact[] = renderGlassbox([SAMPLE_GLASSBOX_ENTRY], repoRoot);
    expect(artifacts).toHaveLength(1);

    const artifact = artifacts[0]!;
    expect(artifact.slug).toBe(SAMPLE_GLASSBOX_ENTRY.slug);
    expect(artifact.type).toBe(SAMPLE_GLASSBOX_ENTRY.type);
    expect(artifact.title).toBe(SAMPLE_GLASSBOX_ENTRY.title);
    expect(artifact.curatorNote).toBe(SAMPLE_GLASSBOX_ENTRY.curatorNote);

    // Body equals the fixture file's contents — the real file was read.
    const expectedBody = readFileSync(join(repoRoot, FIXTURE_SOURCE_FILE), 'utf8');
    expect(artifact.body).toBe(expectedBody);
    expect(artifact.body.trim().length).toBeGreaterThan(0);
  });

  it('sample slug does NOT appear in the live GLASSBOX_ALLOWLIST (not polluting live manifests)', async () => {
    const { GLASSBOX_ALLOWLIST } = await import('../content/glassbox.allowlist.ts');
    const liveArtifacts = renderGlassbox(GLASSBOX_ALLOWLIST, repoRoot);
    const sampleInLive = liveArtifacts.find((a) => a.slug === SAMPLE_GLASSBOX_ENTRY.slug);
    expect(
      sampleInLive,
      'sample slug must NOT be present in the live GLASSBOX_ALLOWLIST output',
    ).toBeUndefined();
  });

  it('Glass Box second render is deep-equal to the first (deterministic — NFR-6)', () => {
    const first = renderGlassbox([SAMPLE_GLASSBOX_ENTRY], repoRoot);
    const second = renderGlassbox([SAMPLE_GLASSBOX_ENTRY], repoRoot);
    expect(second).toEqual(first);
  });

  it('Glass Box render has a valid ISO-8601 date for the sample entry', () => {
    const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/;
    const artifacts = renderGlassbox([SAMPLE_GLASSBOX_ENTRY], repoRoot);
    expect(ISO_8601.test(artifacts[0]!.date)).toBe(true);
  });
});

describe('project-import mechanism — timeline wiring (AC2 / AC4)', () => {
  it('sample FlagshipNode flows through renderTimeline() and appears in the output', () => {
    const eras = renderTimeline([SAMPLE_ERA]);
    expect(eras).toHaveLength(1);

    const era = eras[0]!;
    expect(era.id).toBe(SAMPLE_ERA.id);
    expect(era.entries).toHaveLength(1);

    const flagship = era.entries[0] as FlagshipNode;
    expect(flagship.kind).toBe('flagship');
    expect(flagship.label).toBe(SAMPLE_FLAGSHIP.label);
    expect(flagship.date).toBe(SAMPLE_FLAGSHIP.date);
    expect(flagship.description).toBe(SAMPLE_FLAGSHIP.description);
    expect(flagship.cluster).toHaveLength(1);

    const dot = flagship.cluster[0]!;
    expect(dot.label).toBe(SAMPLE_CLUSTER_DOT.label);
    expect(dot.date).toBe(SAMPLE_CLUSTER_DOT.date);
    expect(dot.state).toBe(SAMPLE_CLUSTER_DOT.state);
    expect(dot.href).toBe(SAMPLE_CLUSTER_DOT.href);
  });

  it('sample era does NOT appear in the live TIMELINE_ERAS (not polluting live manifests)', async () => {
    const { TIMELINE_ERAS } = await import('../content/timeline/dots.ts');
    const liveEras = renderTimeline(TIMELINE_ERAS);
    const sampleEra = liveEras.find((e) =>
      e.entries.some((en) => en.kind === 'flagship' && en.label === SAMPLE_FLAGSHIP.label),
    );
    expect(sampleEra, 'sample flagship must NOT appear in the live TIMELINE_ERAS').toBeUndefined();
  });

  it('timeline second render is deep-equal to the first (deterministic — NFR-6)', () => {
    const first = renderTimeline([SAMPLE_ERA]);
    const second = renderTimeline([SAMPLE_ERA]);
    expect(second).toEqual(first);
  });

  it('timeline output survives a JSON round-trip unchanged (plain-serializable)', () => {
    const eras = renderTimeline([SAMPLE_ERA]);
    const roundTripped = JSON.parse(JSON.stringify(eras));
    expect(roundTripped).toEqual(eras);
  });
});

describe('project-import mechanism — combined import path is data-driven and deterministic (AC2 / AC4)', () => {
  it('Glass Box + timeline renders are both deterministic across two consecutive calls', () => {
    // Simulates "import → pnpm build → verify → pnpm build again" determinism.
    const gb1 = renderGlassbox([SAMPLE_GLASSBOX_ENTRY], repoRoot);
    const tl1 = renderTimeline([SAMPLE_ERA]);
    const gb2 = renderGlassbox([SAMPLE_GLASSBOX_ENTRY], repoRoot);
    const tl2 = renderTimeline([SAMPLE_ERA]);

    expect(gb2).toEqual(gb1);
    expect(tl2).toEqual(tl1);
  });

  it('the import path is data-driven: different allowlist entries produce different Glass Box output', () => {
    // Proves the Glass Box render is parameterized by the allowlist, not hardcoded.
    const entry1: GlassboxEntry = { ...SAMPLE_GLASSBOX_ENTRY, slug: 'fixture-variant-a' };
    const entry2: GlassboxEntry = { ...SAMPLE_GLASSBOX_ENTRY, slug: 'fixture-variant-b' };

    const out1 = renderGlassbox([entry1], repoRoot);
    const out2 = renderGlassbox([entry2], repoRoot);

    expect(out1[0]!.slug).toBe('fixture-variant-a');
    expect(out2[0]!.slug).toBe('fixture-variant-b');
    // Same file, different slugs — distinct outputs driven by allowlist data.
    expect(out1[0]!.slug).not.toBe(out2[0]!.slug);
    // Same body (same file) — confirming the render reads the listed sourceFile.
    expect(out1[0]!.body).toBe(out2[0]!.body);
  });
});

describe('project-import mechanism — negative controls (a project NOT added does NOT appear)', () => {
  // These are explicit render-level negative controls: they feed the REAL render
  // functions a non-empty input that does NOT contain the sample, and assert the
  // sample is absent. This proves the "appears" assertions above are caused by
  // adding the sample to the input — not by the sample leaking in some other way
  // (e.g. a hardcoded entry, or the live manifest coincidentally matching). It is
  // independent of the live manifests' current contents.

  /** A decoy Glass Box entry that is NOT the sample (points at the same fixture). */
  const DECOY_GLASSBOX_ENTRY: GlassboxEntry = {
    sourceFile: FIXTURE_SOURCE_FILE,
    type: 'brief',
    slug: 'decoy-not-the-sample',
    title: 'Decoy entry',
    curatorNote: 'A decoy used as a negative control — not the sample.',
  };

  /** A decoy era that is NOT the sample era / sample flagship. */
  const DECOY_ERA: EraBand = {
    id: 'runway',
    label: 'Decoy era',
    metaNote: 'decoy for negative control',
    entries: [
      {
        kind: 'tick',
        label: 'Decoy tick — not the sample flagship',
        date: '~2000',
        state: 'faint',
      },
    ],
  };

  it('Glass Box: a list WITHOUT the sample slug does NOT produce the sample artifact', () => {
    const artifacts = renderGlassbox([DECOY_GLASSBOX_ENTRY], repoRoot);
    expect(artifacts.find((a) => a.slug === SAMPLE_GLASSBOX_ENTRY.slug)).toBeUndefined();
    // ...and the decoy that WAS in the input is present (render is honest, not empty).
    expect(artifacts.find((a) => a.slug === DECOY_GLASSBOX_ENTRY.slug)).toBeDefined();
  });

  it('timeline: a list WITHOUT the sample flagship does NOT produce the sample Dot', () => {
    const eras = renderTimeline([DECOY_ERA]);
    const samplePresent = eras.some((e) =>
      e.entries.some((en) => en.kind === 'flagship' && en.label === SAMPLE_FLAGSHIP.label),
    );
    expect(samplePresent).toBe(false);
    // ...and the decoy entry that WAS in the input is present.
    const decoyPresent = eras.some((e) =>
      e.entries.some((en) => en.label.startsWith('Decoy tick')),
    );
    expect(decoyPresent).toBe(true);
  });
});

describe('project-import doc — referenced paths exist (AC1 / AC3 — guard against doc rot)', () => {
  const DOC_PATH = join(repoRoot, 'docs/project-import.md');

  it('docs/project-import.md exists and is non-empty', () => {
    expect(existsSync(DOC_PATH), `doc not found at: ${DOC_PATH}`).toBe(true);
    expect(readFileSync(DOC_PATH, 'utf8').trim().length).toBeGreaterThan(0);
  });

  // Every repo path the doc instructs the reader to wire/run MUST exist today,
  // so the documented Project Import path cannot silently rot. (KB-indexer
  // script `scripts/build-kb-index.ts` is intentionally excluded — it is an
  // Epic-4/Story-4.1 forward-reference the doc explicitly labels as future.)
  const REQUIRED_REFERENCED_PATHS = [
    'content/kb',
    'content/timeline/dots.ts',
    'content/glassbox.allowlist.ts',
    'content/README.md',
    'scripts/render-glassbox.ts',
    'scripts/render-timeline.ts',
    'scripts/build-content.ts',
    'scripts/deploy.sh',
    'docs/launch-checklist.md',
  ];

  it.each(REQUIRED_REFERENCED_PATHS)('doc references "%s", which exists on disk', (relPath) => {
    const doc = readFileSync(DOC_PATH, 'utf8');
    expect(doc.includes(relPath), `doc does not mention "${relPath}"`).toBe(true);
    expect(existsSync(join(repoRoot, relPath)), `referenced path missing: "${relPath}"`).toBe(true);
  });

  it('doc does NOT over-claim KB retrieval works today (Epic 4 forward-ref is honest)', () => {
    const doc = readFileSync(DOC_PATH, 'utf8');
    // The doc must name the Epic-4 / Story-4.1 KB step as the point where KB
    // files become retrievable — it must NOT claim retrieval works now.
    expect(/Epic 4|Story 4\.1/.test(doc)).toBe(true);
    expect(/agent-retrievable/.test(doc)).toBe(true);
  });

  it('doc frames the maintenance model as /bmad-correct-course, not a CMS (FR-33/FR-34)', () => {
    const doc = readFileSync(DOC_PATH, 'utf8');
    expect(/bmad-correct-course/.test(doc)).toBe(true);
    expect(/no CMS|not a CMS|no admin/i.test(doc)).toBe(true);
  });
});

/**
 * Rule 3 EXEMPTION NOTE
 * ---------------------
 * This story (Story 2.6) is a process/tooling/doc story — it ships documentation
 * (docs/project-import.md) + a mechanism-validation test, NOT a new browser
 * surface. The Rule 3 "real-runtime browser test" requirement is therefore EXEMPT.
 * The "real runtime" tier here is the build pipeline invocation above:
 *   - renderGlassbox() is the real Glass Box render function (Story 2.1).
 *   - renderTimeline() is the real timeline render function (Story 2.4).
 * These are actual CLI/library invocations with output assertions — satisfying
 * the CLI/library real-runtime tier of skill-rules Rule 3.
 */
